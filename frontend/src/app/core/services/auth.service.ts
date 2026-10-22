import { Injectable, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { TokenService } from './token.service';
import { AuthResponse, LoginRequest } from '../models/auth.model';
import { Permission } from '../models/permission.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly router = inject(Router);

  readonly isAuthenticated = computed(() => this.tokenService.isValid());
  readonly permissions = computed(() => this.tokenService.permissions());

  hasPermission(permission: Permission): boolean {
    return this.tokenService.permissions().includes(permission);
  }

  hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some(p => this.hasPermission(p));
  }

  hasAllPermissions(permissions: Permission[]): boolean {
    return permissions.every(p => this.hasPermission(p));
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/api/v1/auth/login`, credentials, {
        withCredentials: true,
      })
      .pipe(
        tap(response => {
          this.tokenService.set(response.accessToken);
          this.redirectAfterLogin();
        }),
      );
  }

  logout(): void {
    this.tokenService.clear();
    this.http
      .post(`${environment.apiUrl}/api/v1/auth/logout`, {}, { withCredentials: true })
      .subscribe({ error: () => {} });
    void this.router.navigate(['/login']);
  }

  refreshToken(): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/api/v1/auth/refresh-token`, {}, {
        withCredentials: true,
      })
      .pipe(tap(response => this.tokenService.set(response.accessToken)));
  }

  redirectAfterLogin(): void {
    if (this.hasAnyPermission([Permission.VIEW_ADMIN, Permission.VIEW_MANAGER])) {
      void this.router.navigate(['/dashboard']);
    } else {
      void this.router.navigate(['/staff']);
    }
  }
}
