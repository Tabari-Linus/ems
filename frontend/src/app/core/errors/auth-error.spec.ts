import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { formatWait, passwordPolicyProblem, toAuthError } from './auth-error';

const httpError = (status: number, body: unknown, headers?: Record<string, string>) =>
  new HttpErrorResponse({ status, error: body, headers: new HttpHeaders(headers ?? {}) });

describe('toAuthError', () => {
  it('reads code, message and violations from the auth error body', () => {
    const error = toAuthError(
      httpError(400, {
        status: 400,
        code: 'PASSWORD_POLICY',
        message: 'The password does not meet the password policy',
        violations: [
          { field: 'newPassword', message: 'Password must be at least 10 characters' },
          { field: 1, message: 'ignored' },
          'ignored',
        ],
      }),
    );
    expect(error).toEqual({
      code: 'PASSWORD_POLICY',
      message: 'The password does not meet the password policy',
      violations: [{ field: 'newPassword', message: 'Password must be at least 10 characters' }],
      retryAfterSeconds: null,
    });
  });

  it('reads Retry-After on a 429', () => {
    const error = toAuthError(
      httpError(
        429,
        { code: 'RATE_LIMITED', message: 'Too many attempts.' },
        { 'Retry-After': '42' },
      ),
    );
    expect(error.code).toBe('RATE_LIMITED');
    expect(error.retryAfterSeconds).toBe(42);
  });

  it('maps unknown codes and empty bodies to UNKNOWN with a generic message', () => {
    expect(toAuthError(httpError(500, 'boom'))).toMatchObject({
      code: 'UNKNOWN',
      message: 'Something went wrong. Try again in a moment.',
      violations: [],
    });
    expect(toAuthError(httpError(400, { code: 'NEW_CODE', message: '' })).code).toBe('UNKNOWN');
  });

  it('reports network failures', () => {
    expect(toAuthError(httpError(0, null)).code).toBe('NETWORK_ERROR');
  });

  it('handles non-HTTP errors', () => {
    expect(toAuthError(new Error('x')).code).toBe('UNKNOWN');
  });
});

describe('formatWait', () => {
  it.each([
    [1, '1 second'],
    [30, '30 seconds'],
    [60, '1 minute'],
    [61, '2 minutes'],
    [900, '15 minutes'],
  ])('%i → %s', (seconds, text) => expect(formatWait(seconds)).toBe(text));
});

describe('passwordPolicyProblem', () => {
  it('requires 10 to 128 characters', () => {
    expect(passwordPolicyProblem('short')).toBe('Use at least 10 characters.');
    expect(passwordPolicyProblem('x'.repeat(129))).toBe('Use at most 128 characters.');
    expect(passwordPolicyProblem('a calm river at dawn')).toBeNull();
  });

  it('rejects the email name inside the password', () => {
    expect(passwordPolicyProblem('ama.mensah-2026!', 'Ama.Mensah@example.com')).toBe(
      'Leave your email name out of the password.',
    );
    expect(passwordPolicyProblem('a calm river at dawn', 'ama.mensah@example.com')).toBeNull();
  });
});
