import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { provideAppConfig } from '../config/app-config';
import { AuthService, RESTORE_SESSION_TIMEOUT_MS } from './auth.service';

const API = 'https://api.example.com';

describe('AuthService endpoints', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', children: [] }]),
        provideAppConfig({ apiUrl: API }),
      ],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('refreshes against {apiUrl}/api/v1/auth/refresh-token with credentials', () => {
    void firstValueFrom(service.refreshToken()).catch(() => undefined);

    const req = http.expectOne(`${API}/api/v1/auth/refresh-token`);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    req.flush({}, { status: 401, statusText: 'Unauthorized' });
  });

  describe('restoreSession', () => {
    // Unsigned test JWT: header {"alg":"none"}, payload { sub, permissions, exp far in the future }.
    const validToken = [
      btoa(JSON.stringify({ alg: 'none' })),
      btoa(JSON.stringify({ sub: 'u1', permissions: ['VIEW_SELF'], exp: 4_102_444_800 })),
      '',
    ].join('.');

    it('restores the session when the refresh cookie is valid', async () => {
      const restored = service.restoreSession();

      const req = http.expectOne(`${API}/api/v1/auth/refresh-token`);
      expect(req.request.withCredentials).toBe(true);
      req.flush({ accessToken: validToken, expiresAt: '2100-01-01T00:00:00Z' });

      await expect(restored).resolves.toBeUndefined();
      expect(service.isAuthenticated()).toBe(true);
      expect(service.permissions()).toEqual(['VIEW_SELF']);
    });

    it('resolves signed out when there is no valid refresh cookie (401)', async () => {
      const restored = service.restoreSession();

      http
        .expectOne(`${API}/api/v1/auth/refresh-token`)
        .flush(null, { status: 401, statusText: 'Unauthorized' });

      await expect(restored).resolves.toBeUndefined();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('resolves signed out when the API is unreachable', async () => {
      const restored = service.restoreSession();

      http
        .expectOne(`${API}/api/v1/auth/refresh-token`)
        .error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

      await expect(restored).resolves.toBeUndefined();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('gives up after the timeout so startup is never blocked', async () => {
      vi.useFakeTimers();
      try {
        const restored = service.restoreSession();
        const req = http.expectOne(`${API}/api/v1/auth/refresh-token`);

        await vi.advanceTimersByTimeAsync(RESTORE_SESSION_TIMEOUT_MS);

        await expect(restored).resolves.toBeUndefined();
        expect(req.cancelled).toBe(true);
        expect(service.isAuthenticated()).toBe(false);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  it('logs out against {apiUrl}/api/v1/auth/logout with credentials', () => {
    service.logout();

    const req = http.expectOne(`${API}/api/v1/auth/logout`);
    expect(req.request.withCredentials).toBe(true);
    req.flush(null);
  });
});
