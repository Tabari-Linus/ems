import { Injectable, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, firstValueFrom, tap, timeout } from 'rxjs';
import { TokenService } from './token.service';
import { AuthResponse, LoginRequest } from '../models/auth.model';
import { Permission } from '../models/permission.model';
import { APP_CONFIG } from '../config/app-config';

/** Upper bound on how long startup waits for the session refresh before showing the app. */
export const RESTORE_SESSION_TIMEOUT_MS = 5000;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly router = inject(Router);
  private readonly authUrl = `${inject(APP_CONFIG).apiUrl}/api/v1/auth`;

  readonly isAuthenticated = computed(() => this.tokenService.isValid());
  readonly permissions = computed(() => this.tokenService.permissions());

  hasPermission(permission: Permission): boolean {
    return this.tokenService.permissions().includes(permission);
  }

  hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some((p) => this.hasPermission(p));
  }

  hasAllPermissions(permissions: Permission[]): boolean {
    return permissions.every((p) => this.hasPermission(p));
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.authUrl}/login`, credentials, {
        withCredentials: true,
      })
      .pipe(
        tap((response) => {
          this.tokenService.set(response.accessToken);
          this.redirectAfterLogin();
        }),
      );
  }

  logout(): void {
    this.tokenService.clear();
    this.http
      .post(`${this.authUrl}/logout`, {}, { withCredentials: true })
      // Best effort: the local session is already cleared; a failed server logout is ignored.
      .subscribe({ error: () => undefined });
    void this.router.navigate(['/login']);
  }

  refreshToken(): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(
        `${this.authUrl}/refresh-token`,
        {},
        {
          withCredentials: true,
        },
      )
      .pipe(tap((response) => this.tokenService.set(response.accessToken)));
  }

  /**
   * Restores the session after a page reload. The access token lives only in memory, so on
   * startup we exchange the HttpOnly refresh cookie for a new one. Runs as an app initializer,
   * i.e. before the first navigation, so guards see the restored session. Never rejects: no
   * cookie, an expired session, or an unreachable API all simply mean "signed out".
   */
  async restoreSession(): Promise<void> {
    try {
      await firstValueFrom(this.refreshToken().pipe(timeout(RESTORE_SESSION_TIMEOUT_MS)));
    } catch {
      this.tokenService.clear();
    }
  }

  redirectAfterLogin(): void {
    if (this.hasAnyPermission([Permission.VIEW_ADMIN, Permission.VIEW_MANAGER])) {
      void this.router.navigate(['/dashboard']);
    } else {
      void this.router.navigate(['/staff']);
    }
  }
}
