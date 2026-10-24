import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';

/**
 * Auth endpoints that never trigger a refresh on 401: their 401 means "wrong credentials" or
 * "no session", not "access token expired".
 */
const NO_REFRESH_PATHS = [
  '/api/v1/auth/login',
  '/api/v1/auth/refresh-token',
  '/api/v1/auth/logout',
  '/api/v1/auth/set-password',
];

/** 401 codes that end the session at once instead of refreshing (docs/api/auth.md §4). */
const SESSION_ENDING_CODES = new Set(['TOKEN_INVALID', 'ACCOUNT_INACTIVE', 'ACCOUNT_LOCKED']);

/**
 * Adds the bearer token to API requests, and on a 401 renews the session once (single-flight,
 * shared across tabs: see TokenRefreshService) and retries the request with the new token. When
 * the session cannot be renewed, the user is signed out.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const { apiUrl } = inject(APP_CONFIG);
  if (!req.url.startsWith(apiUrl)) return next(req);

  const tokens = inject(TokenService);
  const auth = inject(AuthService);
  const withToken = (request: HttpRequest<unknown>, token: string) =>
    token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;

  return next(withToken(req, tokens.get())).pipe(
    catchError((error: unknown) => {
      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        NO_REFRESH_PATHS.some((path) => req.url === `${apiUrl}${path}`)
      ) {
        return throwError(() => error);
      }
      const code = (error.error as { code?: unknown } | null)?.code;
      if (typeof code === 'string' && SESSION_ENDING_CODES.has(code)) {
        void auth.endSession();
        return throwError(() => error);
      }
      return from(auth.renewSession()).pipe(
        catchError((refreshError: unknown) => {
          void auth.endSession();
          return throwError(() => refreshError);
        }),
        switchMap((token) => next(withToken(req, token))),
      );
    }),
  );
};
