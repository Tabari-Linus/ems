import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ToastService } from '@ems/ui/toast';
import { AuthService } from '../../../core/services/auth.service';
import { SessionStore } from '../../../core/services/session.store';
import { ChangePassword } from './change-password';

describe('ChangePassword', () => {
  let changePassword: ReturnType<typeof vi.fn>;
  let success: ReturnType<typeof vi.fn>;

  async function render() {
    changePassword = vi.fn(() => Promise.resolve());
    success = vi.fn();
    TestBed.configureTestingModule({
      imports: [ChangePassword],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { changePassword } },
        { provide: ToastService, useValue: { success } },
        {
          provide: SessionStore,
          useValue: { account: () => ({ email: 'ama.mensah@akwaabalabs.example' }) },
        },
      ],
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(ChangePassword);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement, navigate };
  }

  const fill = (el: HTMLElement, values: [string, string, string]) => {
    el.querySelectorAll<HTMLInputElement>('ui-password-input input').forEach((input, i) => {
      input.value = values[i];
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  };
  const submit = async (fixture: { whenStable: () => Promise<unknown> }, el: HTMLElement) => {
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  };

  it('renders the page header and three password fields without errors', async () => {
    const { el } = await render();
    expect(el.querySelector('h1')?.textContent).toContain('Change password');
    expect(el.querySelectorAll('ui-password-input')).toHaveLength(3);
    expect(el.querySelector('[aria-invalid="true"]')).toBeNull();
  });

  it('validates locally: same password, email name, mismatch', async () => {
    const { fixture, el } = await render();
    fill(el, ['old-password-1', 'old-password-1', 'x']);
    await submit(fixture, el);
    expect(el.textContent).toContain('Choose a password different from the current one.');
    expect(el.textContent).toContain('The two passwords are different.');

    fill(el, ['old-password-1', 'ama.mensah-is-me', 'ama.mensah-is-me']);
    await fixture.whenStable();
    expect(el.textContent).toContain('Leave your email name out of the password.');
    expect(changePassword).not.toHaveBeenCalled();
  });

  it('changes the password, confirms with a toast and goes Home', async () => {
    const { fixture, el, navigate } = await render();
    fill(el, ['old-password-1', 'a calm river at dawn', 'a calm river at dawn']);
    await submit(fixture, el);
    expect(changePassword).toHaveBeenCalledWith('old-password-1', 'a calm river at dawn');
    expect(success).toHaveBeenCalledWith('Password changed. Your other devices are signed out.');
    expect(navigate).toHaveBeenCalledWith('/home');
  });

  it('marks a wrong current password on its field', async () => {
    const { fixture, el } = await render();
    changePassword.mockReturnValue(
      Promise.reject(
        new HttpErrorResponse({ status: 400, error: { code: 'INVALID_CREDENTIALS' } }),
      ),
    );
    fill(el, ['nope-nope-1', 'a calm river at dawn', 'a calm river at dawn']);
    await submit(fixture, el);
    expect(el.textContent).toContain('That is not your current password.');
  });

  it('shows policy violations on the new password and other errors in an alert', async () => {
    const { fixture, el } = await render();
    changePassword.mockReturnValue(
      Promise.reject(
        new HttpErrorResponse({
          status: 400,
          error: {
            code: 'PASSWORD_POLICY',
            violations: [{ field: 'newPassword', message: 'This password is too common.' }],
          },
        }),
      ),
    );
    fill(el, ['old-password-1', 'password1234', 'password1234']);
    await submit(fixture, el);
    expect(el.textContent).toContain('This password is too common.');

    changePassword.mockReturnValue(
      Promise.reject(new HttpErrorResponse({ status: 500, error: { message: 'Server down.' } })),
    );
    await submit(fixture, el);
    expect(el.querySelector('ui-alert')?.textContent).toContain('Server down.');
  });
});
