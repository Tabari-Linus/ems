import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Apollo } from 'apollo-angular';
import { firstValueFrom } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';
import { AuthResponse, LoginRequest } from '../models/auth.model';
import { Permission } from '../models/permission.model';
import { SessionStore } from './session.store';
import { CSRF_HEADERS, TokenRefreshService } from './token-refresh.service';
import { TokenService } from './token.service';

export { CSRF_HEADERS } from './token-refresh.service';

/** Upper bound on how long startup waits for the session refresh before showing the app. */
export const RESTORE_SESSION_TIMEOUT_MS = 5000;

/** Where a signed-in user lands by default. */
export const HOME_URL = '/home';

/**
 * Sign-in, sign-out and password flows against `/api/v1/auth` (docs/api/auth.md). The access
 * token is kept in memory (TokenService); who the user is and what they may do comes from the
 * `me` query (SessionStore).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokens = inject(TokenService);
  private readonly session = inject(SessionStore);
  private readonly refresher = inject(TokenRefreshService);
  private readonly apollo = inject(Apollo);
  private readonly router = inject(Router);
  private readonly authUrl = `${inject(APP_CONFIG).apiUrl}/api/v1/auth`;

  /** Signed in: an access token is held and `me` has been loaded. */
  readonly isAuthenticated = computed(() => this.tokens.hasToken() && this.session.loaded());
  readonly permissions = this.session.permissions;

  constructor() {
    // Another tab signed out (this device's session is gone): follow it.
    this.refresher.onSignedOutElsewhere(() => {
      if (this.tokens.hasToken()) void this.endSession();
    });
  }

  hasPermission(permission: Permission): boolean {
    return this.session.hasPermission(permission);
  }

  hasAnyPermission(permissions: Permission[]): boolean {
    return this.session.hasAnyPermission(permissions);
  }

  hasAllPermissions(permissions: Permission[]): boolean {
    return this.session.hasAllPermissions(permissions);
  }

  /**
   * Signs in, loads `me` and navigates to `returnUrl` (an in-app path) or Home. Rejects with the
   * HTTP error so the page can show the matching message (see `toAuthError`).
   */
  async login(credentials: LoginRequest, returnUrl?: string | null): Promise<void> {
    const response = await firstValueFrom(
      this.http.post<AuthResponse>(`${this.authUrl}/login`, credentials, {
        withCredentials: true,
      }),
    );
    this.tokens.set(response.accessToken);
    try {
      await this.session.load();
    } catch (error) {
      this.tokens.clear();
      throw error;
    }
    await this.router.navigateByUrl(safeReturnUrl(returnUrl));
  }

  /** Signs out of this device. The local session ends at once; the server call is best effort. */
  async logout(): Promise<void> {
    void firstValueFrom(
      this.http.post(`${this.authUrl}/logout`, null, {
        withCredentials: true,
        headers: CSRF_HEADERS,
      }),
    ).catch(() => undefined);
    this.refresher.broadcastSignedOut();
    await this.endSession();
  }

  /** Revokes every session of this user on every device, then signs out here. */
  async logoutAll(): Promise<void> {
    await firstValueFrom(
      this.http.post(`${this.authUrl}/logout-all`, null, {
        withCredentials: true,
        headers: CSRF_HEADERS,
      }),
    );
    this.refresher.broadcastSignedOut();
    await this.endSession();
  }

  /** Keeps this session and revokes the others (docs/api/auth.md §5). */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await firstValueFrom(
      this.http.post(
        `${this.authUrl}/change-password`,
        { currentPassword, newPassword },
        { withCredentials: true },
      ),
    );
  }

  /** Redeems the one-time link from the welcome email. All sessions end; sign in afterwards. */
  async setPassword(token: string, newPassword: string): Promise<void> {
    await firstValueFrom(
      this.http.post(
        `${this.authUrl}/set-password`,
        { token, newPassword },
        { withCredentials: true },
      ),
    );
    this.tokens.clear();
    this.session.clear();
  }

  /**
   * Restores the session after a page load: the access token lives only in memory, so the
   * HttpOnly refresh cookie is exchanged for a new one and `me` is loaded. Runs as an app
   * initializer, before the first navigation, so guards see the restored session. Never
   * rejects and never waits longer than RESTORE_SESSION_TIMEOUT_MS: no cookie, an expired
   * session or an unreachable API all mean "signed out".
   */
  async restoreSession(): Promise<void> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timedOut = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error('Session restore timed out')),
        RESTORE_SESSION_TIMEOUT_MS,
      );
    });
    try {
      await Promise.race([
        this.refresher.refresh().then(() => this.session.load()),
        timedOut,
      ]);
    } catch {
      this.tokens.clear();
      this.session.clear();
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Renews the access token (single-flight, coordinated across tabs) and re-reads `me`, since
   * permissions may have changed. Used by the HTTP interceptor on a 401.
   */
  async renewSession(): Promise<string> {
    const token = await this.refresher.refresh();
    void this.session.load().catch(() => undefined);
    return token;
  }

  /** Clears the local session and caches and shows the sign-in page. */
  async endSession(): Promise<void> {
    this.tokens.clear();
    this.session.clear();
    await this.apollo.client.clearStore().catch(() => undefined);
    await this.router.navigateByUrl('/login');
  }
}

/** Only in-app absolute paths are followed after sign-in (no open redirects). */
export function safeReturnUrl(returnUrl: string | null | undefined): string {
  if (!returnUrl || !returnUrl.startsWith('/') || returnUrl.startsWith('//')) return HOME_URL;
  if (returnUrl.startsWith('/login') || returnUrl.startsWith('/set-password')) return HOME_URL;
  return returnUrl;
}
