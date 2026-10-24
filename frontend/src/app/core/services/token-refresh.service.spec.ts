import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideAppConfig } from '../config/app-config';
import {
  AUTH_CHANNEL_FACTORY,
  type AuthChannelMessage,
  LOCK_MANAGER,
  type LockManagerLike,
  REFRESH_LOCK_NAME,
  TokenRefreshService,
} from './token-refresh.service';
import { TokenService } from './token.service';

const API = 'https://api.example.com';
const REFRESH_URL = `${API}/api/v1/auth/refresh-token`;

/** In-memory stand-in for a BroadcastChannel; `deliver` simulates a message from another tab. */
class FakeChannel {
  onmessage: ((event: MessageEvent<AuthChannelMessage>) => void) | null = null;
  readonly sent: AuthChannelMessage[] = [];
  closed = false;
  postMessage(message: AuthChannelMessage): void {
    this.sent.push(message);
  }
  close(): void {
    this.closed = true;
  }
  deliver(message: AuthChannelMessage): void {
    this.onmessage?.({ data: message } as MessageEvent<AuthChannelMessage>);
  }
}

/** A Web Locks stand-in that grants one holder at a time, in request order. */
class FakeLocks implements LockManagerLike {
  readonly requested: string[] = [];
  private tail: Promise<unknown> = Promise.resolve();
  request<T>(name: string, callback: () => Promise<T>): Promise<T> {
    this.requested.push(name);
    const run = this.tail.then(callback, callback);
    this.tail = run.catch(() => undefined);
    return run;
  }
}

let current: HttpTestingController | null = null;

function setup(locks: LockManagerLike | null, channel: FakeChannel | null = new FakeChannel()) {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideAppConfig({ apiUrl: API }),
      { provide: LOCK_MANAGER, useValue: locks },
      { provide: AUTH_CHANNEL_FACTORY, useValue: () => channel },
    ],
  });
  current = TestBed.inject(HttpTestingController);
  return {
    service: TestBed.inject(TokenRefreshService),
    tokens: TestBed.inject(TokenService),
    http: TestBed.inject(HttpTestingController),
    channel,
  };
}

const flushMicrotasks = () => new Promise((resolve) => setTimeout(resolve));

describe('TokenRefreshService', () => {
  afterEach(() => current?.verify());

  it('posts to refresh-token with credentials and the CSRF header, and stores the token', async () => {
    const { service, tokens, http } = setup(null);
    const result = service.refresh();

    const req = http.expectOne(REFRESH_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.headers.get('X-Requested-With')).toBe('ems-web');
    req.flush({ accessToken: 'new-token', expiresAt: '2100-01-01T00:00:00Z' });

    await expect(result).resolves.toBe('new-token');
    expect(tokens.get()).toBe('new-token');
  });

  it('is single-flight: concurrent callers share one request', async () => {
    const { service, http } = setup(null);
    const a = service.refresh();
    const b = service.refresh();
    const c = service.refresh();
    expect(a).toBe(b);
    expect(b).toBe(c);

    http.expectOne(REFRESH_URL).flush({ accessToken: 't1', expiresAt: '' });
    await expect(Promise.all([a, b, c])).resolves.toEqual(['t1', 't1', 't1']);

    // A later refresh is a new request.
    const d = service.refresh();
    http.expectOne(REFRESH_URL).flush({ accessToken: 't2', expiresAt: '' });
    await expect(d).resolves.toBe('t2');
  });

  it('shares a failure with every waiting caller, then allows a retry', async () => {
    const { service, http } = setup(null);
    const a = service.refresh();
    const b = service.refresh();
    http.expectOne(REFRESH_URL).flush(null, { status: 401, statusText: 'Unauthorized' });
    await expect(a).rejects.toBeTruthy();
    await expect(b).rejects.toBeTruthy();

    const c = service.refresh();
    http.expectOne(REFRESH_URL).flush({ accessToken: 'ok', expiresAt: '' });
    await expect(c).resolves.toBe('ok');
  });

  it('runs the refresh inside the cross-tab lock', async () => {
    const locks = new FakeLocks();
    const { service, http } = setup(locks);
    const result = service.refresh();
    await flushMicrotasks();

    expect(locks.requested).toEqual([REFRESH_LOCK_NAME]);
    http.expectOne(REFRESH_URL).flush({ accessToken: 'locked', expiresAt: '' });
    await expect(result).resolves.toBe('locked');
  });

  it('broadcasts the new token to the other tabs', async () => {
    const { service, http, channel } = setup(null);
    const result = service.refresh();
    http.expectOne(REFRESH_URL).flush({ accessToken: 'shared', expiresAt: '' });
    await result;
    expect(channel!.sent).toEqual([{ type: 'refreshed', accessToken: 'shared' }]);
  });

  it('skips its own call when another tab refreshed while it waited for the lock', async () => {
    // Another tab holds the lock; this tab queues behind it.
    let releaseOtherTab!: () => void;
    const locks = new FakeLocks();
    void locks.request(REFRESH_LOCK_NAME, () => new Promise<void>((r) => (releaseOtherTab = r)));
    await flushMicrotasks();

    const { service, tokens, http, channel } = setup(locks);
    tokens.set('expired-token');
    const result = service.refresh();

    // The other tab finishes and broadcasts its token before releasing the lock.
    channel!.deliver({ type: 'refreshed', accessToken: 'from-other-tab' });
    releaseOtherTab();

    await expect(result).resolves.toBe('from-other-tab');
    http.expectNone(REFRESH_URL);
  });

  it('refreshes after waiting when no newer token arrived (sends the rotated cookie)', async () => {
    let releaseOtherTab!: () => void;
    const locks = new FakeLocks();
    void locks.request(REFRESH_LOCK_NAME, () => new Promise<void>((r) => (releaseOtherTab = r)));
    await flushMicrotasks();

    const { service, tokens, http } = setup(locks);
    tokens.set('expired-token');
    const result = service.refresh();
    releaseOtherTab();
    await flushMicrotasks();

    http.expectOne(REFRESH_URL).flush({ accessToken: 'mine', expiresAt: '' });
    await expect(result).resolves.toBe('mine');
  });

  it('ignores broadcast tokens while signed out in this tab', () => {
    const { tokens, channel } = setup(null);
    channel!.deliver({ type: 'refreshed', accessToken: 'stranger' });
    expect(tokens.get()).toBe('');
  });

  it('tells listeners when another tab signs out, and broadcasts its own sign-out', () => {
    const { service, channel } = setup(null);
    const listener = vi.fn();
    const unsubscribe = service.onSignedOutElsewhere(listener);

    channel!.deliver({ type: 'signed-out' });
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    channel!.deliver({ type: 'signed-out' });
    expect(listener).toHaveBeenCalledTimes(1);

    service.broadcastSignedOut();
    expect(channel!.sent).toEqual([{ type: 'signed-out' }]);
  });

  it('works without BroadcastChannel and closes the channel on destroy', async () => {
    const { service, http } = setup(null, null);
    const result = service.refresh();
    http.expectOne(REFRESH_URL).flush({ accessToken: 'solo', expiresAt: '' });
    await expect(result).resolves.toBe('solo');
    expect(() => service.broadcastSignedOut()).not.toThrow();
  });

  it('closes its channel when the app is destroyed', () => {
    const { channel } = setup(null);
    current = null;
    TestBed.resetTestingModule();
    expect(channel!.closed).toBe(true);
  });
});
