import { HttpErrorResponse } from '@angular/common/http';
import { FieldViolation } from './app-error';

/** Error codes of the REST auth API (docs/api/auth.md §4), plus client-side fallbacks. */
export type AuthErrorCode =
  | 'VALIDATION_ERROR'
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_PENDING'
  | 'ACCOUNT_INACTIVE'
  | 'TOKEN_INVALID'
  | 'TOKEN_EXPIRED'
  | 'PASSWORD_POLICY'
  | 'RATE_LIMITED'
  | 'CSRF_REJECTED'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

const KNOWN_CODES: readonly AuthErrorCode[] = [
  'VALIDATION_ERROR',
  'INVALID_CREDENTIALS',
  'ACCOUNT_LOCKED',
  'ACCOUNT_PENDING',
  'ACCOUNT_INACTIVE',
  'TOKEN_INVALID',
  'TOKEN_EXPIRED',
  'PASSWORD_POLICY',
  'RATE_LIMITED',
  'CSRF_REJECTED',
  'UNAUTHENTICATED',
  'FORBIDDEN',
];

export interface AuthError {
  readonly code: AuthErrorCode;
  /** The server's message (safe to show), or a generic one. */
  readonly message: string;
  readonly violations: readonly FieldViolation[];
  /** Seconds from `Retry-After` on a 429, when present. */
  readonly retryAfterSeconds: number | null;
}

const GENERIC = 'Something went wrong. Try again in a moment.';

/** Reads the auth API's error body (`{status, code, message, violations}`) from any error. */
export function toAuthError(error: unknown): AuthError {
  if (!(error instanceof HttpErrorResponse)) {
    return { code: 'UNKNOWN', message: GENERIC, violations: [], retryAfterSeconds: null };
  }
  if (error.status === 0) {
    return {
      code: 'NETWORK_ERROR',
      message: 'We cannot reach EMS right now. Check your connection and try again.',
      violations: [],
      retryAfterSeconds: null,
    };
  }
  const body = (typeof error.error === 'object' && error.error !== null ? error.error : {}) as {
    code?: unknown;
    message?: unknown;
    violations?: unknown;
  };
  const code = KNOWN_CODES.find((c) => c === body.code) ?? 'UNKNOWN';
  const retryAfter = Number(error.headers?.get('Retry-After'));
  return {
    code,
    message: typeof body.message === 'string' && body.message ? body.message : GENERIC,
    violations: Array.isArray(body.violations)
      ? body.violations.filter(
          (v): v is FieldViolation =>
            typeof v === 'object' &&
            v !== null &&
            typeof (v as FieldViolation).field === 'string' &&
            typeof (v as FieldViolation).message === 'string',
        )
      : [],
    retryAfterSeconds: Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null,
  };
}

/** "30 seconds", "1 minute", "2 minutes". */
export function formatWait(seconds: number): string {
  if (seconds < 60) return `${seconds} second${seconds === 1 ? '' : 's'}`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
}

/** Password policy (docs/api/auth.md §5), mirrored for instant feedback; the server decides. */
export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;

/** First local policy problem with `password` for the account `email`, or null. */
export function passwordPolicyProblem(password: string, email?: string | null): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Use at most ${PASSWORD_MAX_LENGTH} characters.`;
  }
  const localPart = email?.split('@')[0]?.trim().toLowerCase();
  if (localPart && localPart.length >= 3 && password.toLowerCase().includes(localPart)) {
    return 'Leave your email name out of the password.';
  }
  return null;
}
