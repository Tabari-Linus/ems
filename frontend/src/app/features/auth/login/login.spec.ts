import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { toAuthError } from '../../../core/errors/auth-error';
import { AuthService } from '../../../core/services/auth.service';
import { Login, loginErrorCopy } from './login';

const fail = (status: number, code: string, message = 'x', headers: Record<string, string> = {}) =>
  new HttpErrorResponse({ status, error: { code, message }, headers: new HttpHeaders(headers) });

describe('Login', () => {
  let login: ReturnType<typeof vi.fn>;

  async function render(query: Record<string, string> = {}) {
    login = vi.fn(() => Promise.resolve());
    TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { login } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(query) } },
        },
      ],
    });
    const fixture = TestBed.createComponent(Login);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  const type = (input: HTMLInputElement, value: string) => {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  };

  it('renders the calm sign-in form', async () => {
    const { el } = await render();
    expect(el.querySelector('h1')?.textContent).toBe('Sign in');
    expect(el.querySelector('label')?.textContent).toContain('Work email');
    expect(el.querySelector('button[type=submit]')?.textContent).toContain('Sign in');
    // No error styling before the user has done anything.
    expect(el.querySelector('[aria-invalid="true"]')).toBeNull();
  });

  it('shows field errors on an empty submit and does not call the API', async () => {
    const { fixture, el } = await render();
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    expect(el.textContent).toContain('Enter your work email.');
    expect(el.textContent).toContain('Enter your password.');
    expect(login).not.toHaveBeenCalled();
  });

  it('signs in with the trimmed email and the returnUrl', async () => {
    const { fixture, el } = await render({ returnUrl: '/people' });
    type(el.querySelector('input[type=email]')!, ' ama@akwaabalabs.example ');
    type(el.querySelector('ui-password-input input')!, 'correct horse');
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    expect(login).toHaveBeenCalledWith(
      { email: 'ama@akwaabalabs.example', password: 'correct horse' },
      '/people',
    );
  });

  it('shows the guidance for the server error', async () => {
    const { fixture, el } = await render();
    login.mockReturnValue(Promise.reject(fail(423, 'ACCOUNT_LOCKED')));
    type(el.querySelector('input[type=email]')!, 'ama@akwaabalabs.example');
    type(el.querySelector('ui-password-input input')!, 'wrong');
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    expect(el.querySelector('ui-alert')?.textContent).toContain('Account locked for 15 minutes');
  });

  it('confirms a password set from the welcome link', async () => {
    const { el } = await render({ passwordSet: '1' });
    expect(el.querySelector('ui-alert')?.textContent).toContain('Password set');
  });
});

describe('loginErrorCopy', () => {
  it.each([
    ['INVALID_CREDENTIALS', 401, 'Email or password is wrong'],
    ['ACCOUNT_LOCKED', 423, 'Account locked for 15 minutes'],
    ['ACCOUNT_PENDING', 403, 'Your account is not set up yet'],
    ['ACCOUNT_INACTIVE', 403, 'This account is not active'],
    ['RATE_LIMITED', 429, 'Too many attempts'],
    ['SOMETHING_ELSE', 500, 'We could not sign you in'],
  ])('%s', (code, status, heading) => {
    expect(loginErrorCopy(toAuthError(fail(status, code))).heading).toBe(heading);
  });

  it('includes the wait from Retry-After', () => {
    const copy = loginErrorCopy(
      toAuthError(fail(429, 'RATE_LIMITED', 'x', { 'Retry-After': '90' })),
    );
    expect(copy.text).toBe('Wait 2 minutes, then try again.');
    expect(loginErrorCopy(toAuthError(fail(429, 'RATE_LIMITED'))).text).toContain('a minute');
  });

  it('keeps the server message for an inactive account', () => {
    const copy = loginErrorCopy(
      toAuthError(fail(403, 'ACCOUNT_INACTIVE', 'Your account is deactivated.')),
    );
    expect(copy.text).toContain('Your account is deactivated.');
  });

  it('explains being offline', () => {
    expect(loginErrorCopy(toAuthError(new HttpErrorResponse({ status: 0 }))).heading).toBe(
      'You are offline',
    );
  });
});
