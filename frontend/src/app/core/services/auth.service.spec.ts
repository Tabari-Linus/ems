import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Apollo } from 'apollo-angular';
import { MeGQL } from '../../graphql/generated';
import { ME_FIXTURE } from '../../testing/session';
import { provideAppConfig } from '../config/app-config';
import { Permission } from '../models/permission.model';
import { AuthService, RESTORE_SESSION_TIMEOUT_MS, safeReturnUrl } from './auth.service';
import { SessionStore } from './session.store';
import { AUTH_CHANNEL_FACTORY, LOCK_MANAGER, TokenRefreshService } from './token-refresh.service';
import { TokenService } from './token.service';

const API = 'https://api.example.com';
const AUTH = `${API}/api/v1/auth`;
const OK = { accessToken: 'access-1', expiresAt: '2100-01-01T00:00:00Z' };

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  let tokens: TokenService;
  let session: SessionStore;
  let router: Router;
  let meFetch: ReturnType<typeof vi.fn>;
  let clearStore: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    meFetch = vi.fn(() => ({
      subscribe: (o: { next: (v: unknown) => void; complete: () => void }) => {
        o.next({ data: { me: ME_FIXTURE } });
        o.complete();
        return { unsubscribe: () => undefined };
      },
    }));
    clearStore = vi.fn(() => Promise.resolve([]));
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideAppConfig({ apiUrl: API }),
        { provide: MeGQL, useValue: { fetch: meFetch } },
        { provide: Apollo, useValue: { client: { clearStore } } },
        { provide: LOCK_MANAGER, useValue: null },
        { provide: AUTH_CHANNEL_FACTORY, useValue: () => null },
      ],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    tokens = TestBed.inject(TokenService);
    session = TestBed.inject(SessionStore);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  });

  afterEach(() => http.verify());

  describe('login', () => {
    it('posts credentials with cookies, loads me, then goes Home', async () => {
      const done = service.login({ email: 'a@b.c', password: 'secret' });
      const req = http.expectOne(`${AUTH}/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      expect(req.request.body).toEqual({ email: 'a@b.c', password: 'secret' });
      req.flush(OK);
      await done;

      expect(tokens.get()).toBe('access-1');
      expect(service.isAuthenticated()).toBe(true);
      expect(service.permissions()).toEqual(ME_FIXTURE.permissions);
      expect(router.navigateByUrl).toHaveBeenCalledWith('/home');
    });

    it('returns to an in-app returnUrl', async () => {
      const done = service.login({ email: 'a@b.c', password: 'x' }, '/people/7');
      http.expectOne(`${AUTH}/login`).flush(OK);
      await done;
      expect(router.navigateByUrl).toHaveBeenCalledWith('/people/7');
    });

    it('rejects with the HTTP error and stays signed out', async () => {
      const done = service.login({ email: 'a@b.c', password: 'x' });
      http
        .expectOne(`${AUTH}/login`)
        .flush({ code: 'ACCOUNT_LOCKED' }, { status: 423, statusText: 'Locked' });
      await expect(done).rejects.toMatchObject({ status: 423 });
      expect(service.isAuthenticated()).toBe(false);
    });

    it('drops the token when me cannot be loaded', async () => {
      meFetch.mockReturnValue({
        subscribe: (o: { error: (e: unknown) => void }) => {
          o.error(new Error('me failed'));
          return { unsubscribe: () => undefined };
        },
      });
      const done = service.login({ email: 'a@b.c', password: 'x' });
      http.expectOne(`${AUTH}/login`).flush(OK);
      await expect(done).rejects.toThrow('me failed');
      expect(tokens.get()).toBe('');
    });
  });

  describe('permissions come from me, not from the token', () => {
    it('answers from the session store', async () => {
      tokens.set('a.token.without-claims');
      await session.load();
      expect(service.hasPermission(Permission.VIEW_SELF)).toBe(true);
      expect(service.hasPermission(Permission.MANAGE_ADMIN)).toBe(false);
      expect(service.hasAnyPermission([Permission.MANAGE_ADMIN, Permission.VIEW_EMPLOYEE])).toBe(
        true,
      );
      expect(service.hasAllPermissions([Permission.VIEW_SELF, Permission.MANAGE_ADMIN])).toBe(
        false,
      );
    });

    it('is not authenticated with a token but no me', () => {
      tokens.set('t');
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('restoreSession', () => {
    it('refreshes from the cookie, then loads me', async () => {
      const restored = service.restoreSession();
      const req = http.expectOne(`${AUTH}/refresh-token`);
      expect(req.request.withCredentials).toBe(true);
      expect(req.request.headers.get('X-Requested-With')).toBe('ems-web');
      req.flush(OK);

      await expect(restored).resolves.toBeUndefined();
      expect(service.isAuthenticated()).toBe(true);
      expect(meFetch).toHaveBeenCalled();
    });

    it('resolves signed out without a valid cookie (401)', async () => {
      const restored = service.restoreSession();
      http
        .expectOne(`${AUTH}/refresh-token`)
        .flush({ code: 'TOKEN_INVALID' }, { status: 401, statusText: 'Unauthorized' });
      await expect(restored).resolves.toBeUndefined();
      expect(service.isAuthenticated()).toBe(false);
      expect(meFetch).not.toHaveBeenCalled();
    });

    it('resolves signed out when the API is unreachable', async () => {
      const restored = service.restoreSession();
      http
        .expectOne(`${AUTH}/refresh-token`)
        .error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
      await expect(restored).resolves.toBeUndefined();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('gives up after the timeout so startup is never blocked', async () => {
      vi.useFakeTimers();
      try {
        const restored = service.restoreSession();
        const req = http.expectOne(`${AUTH}/refresh-token`);
        await vi.advanceTimersByTimeAsync(RESTORE_SESSION_TIMEOUT_MS);
        await expect(restored).resolves.toBeUndefined();
        expect(service.isAuthenticated()).toBe(false);
        req.flush(OK); // a late answer does not matter any more
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('renewSession', () => {
    it('refreshes and re-reads me', async () => {
      const renewed = service.renewSession();
      http.expectOne(`${AUTH}/refresh-token`).flush({ ...OK, accessToken: 'access-2' });
      await expect(renewed).resolves.toBe('access-2');
      await vi.waitFor(() => expect(meFetch).toHaveBeenCalled());
    });
  });

  describe('sign out', () => {
    beforeEach(async () => {
      tokens.set('access-1');
      await session.load();
    });

    it('logout ends the local session at once and tells the server with the CSRF header', async () => {
      const broadcast = vi.spyOn(TestBed.inject(TokenRefreshService), 'broadcastSignedOut');
      await service.logout();

      const req = http.expectOne(`${AUTH}/logout`);
      expect(req.request.withCredentials).toBe(true);
      expect(req.request.headers.get('X-Requested-With')).toBe('ems-web');
      req.flush(null, { status: 500, statusText: 'Server error' }); // ignored

      expect(service.isAuthenticated()).toBe(false);
      expect(clearStore).toHaveBeenCalled();
      expect(broadcast).toHaveBeenCalled();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
    });

    it('logoutAll revokes every session, then signs out here', async () => {
      const done = service.logoutAll();
      const req = http.expectOne(`${AUTH}/logout-all`);
      expect(req.request.withCredentials).toBe(true);
      expect(req.request.headers.get('X-Requested-With')).toBe('ems-web');
      req.flush(null, { status: 204, statusText: 'No Content' });
      await done;
      expect(service.isAuthenticated()).toBe(false);
      expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
    });

    it('logoutAll keeps the session when the server call fails', async () => {
      const done = service.logoutAll();
      http.expectOne(`${AUTH}/logout-all`).flush(null, { status: 0, statusText: 'offline' });
      await expect(done).rejects.toBeTruthy();
      expect(service.isAuthenticated()).toBe(true);
    });

    it('follows a sign-out in another tab', async () => {
      const refresher = TestBed.inject(TokenRefreshService) as unknown as {
        signedOutListeners: Set<() => void>;
      };
      for (const listener of refresher.signedOutListeners) listener();
      expect(service.isAuthenticated()).toBe(false);
      await vi.waitFor(() => expect(router.navigateByUrl).toHaveBeenCalledWith('/login'));
    });
  });

  describe('passwords', () => {
    it('changePassword posts current and new password with credentials', async () => {
      const done = service.changePassword('old', 'new-password-1');
      const req = http.expectOne(`${AUTH}/change-password`);
      expect(req.request.body).toEqual({
        currentPassword: 'old',
        newPassword: 'new-password-1',
      });
      expect(req.request.withCredentials).toBe(true);
      req.flush(null, { status: 204, statusText: 'No Content' });
      await done;
    });

    it('setPassword posts the one-time token and clears any local session', async () => {
      tokens.set('stale');
      const done = service.setPassword('tok', 'new-password-1');
      const req = http.expectOne(`${AUTH}/set-password`);
      expect(req.request.body).toEqual({ token: 'tok', newPassword: 'new-password-1' });
      req.flush(null, { status: 204, statusText: 'No Content' });
      await done;
      expect(tokens.get()).toBe('');
    });
  });
});

describe('safeReturnUrl', () => {
  it.each([
    [undefined, '/home'],
    [null, '/home'],
    ['', '/home'],
    ['https://evil.example', '/home'],
    ['//evil.example', '/home'],
    ['/login?x=1', '/home'],
    ['/set-password', '/home'],
    ['/people/3', '/people/3'],
  ])('%s → %s', (input, expected) => {
    expect(safeReturnUrl(input)).toBe(expected);
  });
});
