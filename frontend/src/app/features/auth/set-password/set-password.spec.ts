import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SetPassword } from './set-password';

const fail = (code: string, extra: Record<string, unknown> = {}) =>
  new HttpErrorResponse({ status: 400, error: { code, message: 'Server says no.', ...extra } });

describe('SetPassword', () => {
  let setPassword: ReturnType<typeof vi.fn>;
  let replaceState: ReturnType<typeof vi.spyOn>;

  async function render(token: string | null) {
    setPassword = vi.fn(() => Promise.resolve());
    replaceState = vi.spyOn(window.history, 'replaceState');
    TestBed.configureTestingModule({
      imports: [SetPassword],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { setPassword } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap(token ? { token } : {}) },
          },
        },
      ],
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(SetPassword);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement, navigate };
  }

  afterEach(() => replaceState.mockRestore());

  const fill = (el: HTMLElement, password: string, confirm = password) => {
    const [a, b] = Array.from(el.querySelectorAll<HTMLInputElement>('ui-password-input input'));
    a.value = password;
    a.dispatchEvent(new Event('input', { bubbles: true }));
    b.value = confirm;
    b.dispatchEvent(new Event('input', { bubbles: true }));
  };
  const submit = async (fixture: { whenStable: () => Promise<unknown> }, el: HTMLElement) => {
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  };

  it('asks for the email link when there is no token', async () => {
    const { el } = await render(null);
    expect(el.querySelector('h1')?.textContent).toContain('Open the link from your email');
    expect(el.querySelector('form')).toBeNull();
    expect(replaceState).not.toHaveBeenCalled();
  });

  it('removes the token from the address bar', async () => {
    const { el } = await render('secret-token');
    expect(el.querySelector('h1')?.textContent).toContain('Choose your password');
    expect(replaceState).toHaveBeenCalled();
    expect(replaceState.mock.calls[0].slice(1)).toEqual(['', '/set-password']);
    expect(el.querySelector('.ui-password-input__strength')).not.toBeNull();
  });

  it('checks the policy and the confirmation locally', async () => {
    const { fixture, el } = await render('t');
    fill(el, 'short', 'other');
    await submit(fixture, el);
    expect(el.textContent).toContain('Use at least 10 characters.');
    expect(el.textContent).toContain('The two passwords are different.');
    expect(setPassword).not.toHaveBeenCalled();
  });

  it('sets the password and sends the user to sign in', async () => {
    const { fixture, el, navigate } = await render('t');
    fill(el, 'a calm river at dawn');
    await submit(fixture, el);
    expect(setPassword).toHaveBeenCalledWith('t', 'a calm river at dawn');
    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { passwordSet: 1 } });
  });

  it.each([
    ['TOKEN_EXPIRED', 'This link has expired'],
    ['TOKEN_INVALID', 'This link no longer works'],
  ])('explains a %s link', async (code, heading) => {
    const { fixture, el } = await render('t');
    setPassword.mockReturnValue(Promise.reject(fail(code)));
    fill(el, 'a calm river at dawn');
    await submit(fixture, el);
    expect(el.querySelector('h1')?.textContent).toContain(heading);
  });

  it('shows the server policy violation on the field', async () => {
    const { fixture, el } = await render('t');
    setPassword.mockReturnValue(
      Promise.reject(
        fail('PASSWORD_POLICY', {
          violations: [{ field: 'newPassword', message: 'This password is too common.' }],
        }),
      ),
    );
    fill(el, 'password1234');
    await submit(fixture, el);
    expect(el.textContent).toContain('This password is too common.');
  });

  it('shows other errors in an alert, with the wait for rate limits', async () => {
    const { fixture, el } = await render('t');
    setPassword.mockReturnValue(
      Promise.reject(
        new HttpErrorResponse({ status: 429, error: { code: 'RATE_LIMITED', message: 'x' } }),
      ),
    );
    fill(el, 'a calm river at dawn');
    await submit(fixture, el);
    expect(el.querySelector('ui-alert')?.textContent).toContain('Too many attempts');
  });
});
