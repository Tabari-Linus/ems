import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { provideAppConfig } from '../config/app-config';
import { AuthService } from './auth.service';

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

  it('logs out against {apiUrl}/api/v1/auth/logout with credentials', () => {
    service.logout();

    const req = http.expectOne(`${API}/api/v1/auth/logout`);
    expect(req.request.withCredentials).toBe(true);
    req.flush(null);
  });
});
