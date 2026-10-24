import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { provideAppConfig } from '../config/app-config';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';
import { authInterceptor } from './auth.interceptor';

const API = 'https://api.example.com';
const GRAPHQL = `${API}/graphql`;

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let tokens: TokenService;
  let auth: { renewSession: ReturnType<typeof vi.fn>; endSession: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    auth = {
      renewSession: vi.fn(() => Promise.resolve('fresh-token')),
      endSession: vi.fn(() => Promise.resolve()),
    };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideAppConfig({ apiUrl: API }),
        { provide: AuthService, useValue: auth },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    tokens = TestBed.inject(TokenService);
  });

  afterEach(() => backend.verify());

  const tick = () => new Promise((resolve) => setTimeout(resolve));

  it('adds the bearer token to API requests', async () => {
    tokens.set('abc');
    const done = firstValueFrom(http.post(GRAPHQL, {}));
    const req = backend.expectOne(GRAPHQL);
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc');
    req.flush({ data: {} });
    await done;
  });

  it('leaves other origins and token-less requests alone', async () => {
    tokens.set('abc');
    const other = firstValueFrom(http.get('https://elsewhere.example/x'));
    const req = backend.expectOne('https://elsewhere.example/x');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
    await other;
  });

  it('on a 401 renews the session once and retries with the new token', async () => {
    tokens.set('expired');
    const done = firstValueFrom(http.post(GRAPHQL, {}));
    backend
      .expectOne(GRAPHQL)
      .flush({ code: 'TOKEN_EXPIRED' }, { status: 401, statusText: 'Unauthorized' });
    await tick();

    expect(auth.renewSession).toHaveBeenCalledTimes(1);
    const retry = backend.expectOne(GRAPHQL);
    expect(retry.request.headers.get('Authorization')).toBe('Bearer fresh-token');
    retry.flush({ data: { ok: true } });
    await expect(done).resolves.toEqual({ data: { ok: true } });
  });

  it('concurrent 401s each ask for a renewal, which the refresher makes single-flight', async () => {
    let resolve!: (t: string) => void;
    const shared = new Promise<string>((r) => (resolve = r));
    auth.renewSession.mockReturnValue(shared);
    tokens.set('expired');

    const a = firstValueFrom(http.post(GRAPHQL, { n: 1 }));
    const b = firstValueFrom(http.post(GRAPHQL, { n: 2 }));
    for (const req of backend.match(GRAPHQL)) {
      req.flush(null, { status: 401, statusText: 'Unauthorized' });
    }
    resolve('fresh-token');
    await tick();

    const retries = backend.match(GRAPHQL);
    expect(retries).toHaveLength(2);
    retries.forEach((r) => {
      expect(r.request.headers.get('Authorization')).toBe('Bearer fresh-token');
      r.flush({});
    });
    await Promise.all([a, b]);
  });

  it('ends the session when the renewal fails', async () => {
    auth.renewSession.mockReturnValue(Promise.reject(new Error('no session')));
    const done = firstValueFrom(http.post(GRAPHQL, {}));
    backend.expectOne(GRAPHQL).flush(null, { status: 401, statusText: 'Unauthorized' });
    await expect(done).rejects.toThrow('no session');
    expect(auth.endSession).toHaveBeenCalled();
  });

  it.each(['TOKEN_INVALID', 'ACCOUNT_INACTIVE', 'ACCOUNT_LOCKED'])(
    'ends the session without refreshing on %s',
    async (code) => {
      const done = firstValueFrom(http.post(GRAPHQL, {}));
      backend.expectOne(GRAPHQL).flush({ code }, { status: 401, statusText: 'Unauthorized' });
      await expect(done).rejects.toMatchObject({ status: 401 });
      expect(auth.renewSession).not.toHaveBeenCalled();
      expect(auth.endSession).toHaveBeenCalled();
    },
  );

  it.each(['login', 'refresh-token', 'logout', 'set-password'])(
    'passes a 401 from /auth/%s straight through',
    async (path) => {
      const url = `${API}/api/v1/auth/${path}`;
      const done = firstValueFrom(http.post(url, {}));
      backend.expectOne(url).flush(null, { status: 401, statusText: 'Unauthorized' });
      await expect(done).rejects.toMatchObject({ status: 401 });
      expect(auth.renewSession).not.toHaveBeenCalled();
    },
  );

  it('passes other errors through', async () => {
    const done = firstValueFrom(http.post(GRAPHQL, {}));
    backend.expectOne(GRAPHQL).flush(null, { status: 500, statusText: 'Error' });
    await expect(done).rejects.toMatchObject({ status: 500 });
    expect(auth.renewSession).not.toHaveBeenCalled();
  });
});
