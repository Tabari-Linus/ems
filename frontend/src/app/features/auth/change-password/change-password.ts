import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { form, required, submit, validate } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { Alert } from '@ems/ui/alert';
import { Button } from '@ems/ui/button';
import { Card } from '@ems/ui/card';
import { FormField as UiFormField } from '@ems/ui/form-field';
import { PageHeader } from '@ems/ui/page-header';
import { PasswordInput } from '@ems/ui/password-input';
import { ToastService } from '@ems/ui/toast';
import { passwordPolicyProblem, toAuthError } from '../../../core/errors/auth-error';
import { AuthService } from '../../../core/services/auth.service';
import { SessionStore } from '../../../core/services/session.store';

/**
 * Change password while signed in. The server keeps this session and signs out every other
 * device (docs/api/auth.md §5).
 */
@Component({
  selector: 'app-change-password',
  imports: [UiFormField, PasswordInput, Button, Alert, Card, PageHeader, RouterLink],
  templateUrl: './change-password.html',
  styleUrl: './change-password.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePassword {
  private readonly auth = inject(AuthService);
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);

  protected readonly model = signal({ current: '', password: '', confirm: '' });
  protected readonly passwordForm = form(this.model, (s) => {
    required(s.current, { message: 'Enter your current password.' });
    required(s.password, { message: 'Choose a new password.' });
    validate(s.password, ({ value, valueOf }) => {
      const password = value();
      if (!password) return null;
      if (password === valueOf(s.current)) {
        return { kind: 'same', message: 'Choose a password different from the current one.' };
      }
      const problem = passwordPolicyProblem(password, this.session.account()?.email);
      return problem ? { kind: 'policy', message: problem } : null;
    });
    required(s.confirm, { message: 'Type the new password again.' });
    validate(s.confirm, ({ value, valueOf }) =>
      value() && value() !== valueOf(s.password)
        ? { kind: 'mismatch', message: 'The two passwords are different. Type them again.' }
        : null,
    );
  });

  protected readonly currentError = signal<string | null>(null);
  protected readonly newError = signal<string | null>(null);
  protected readonly formError = signal<string | null>(null);
  protected readonly loading = signal(false);

  protected fieldError(field: 'current' | 'password' | 'confirm'): string | null {
    if (field === 'current' && this.currentError()) return this.currentError();
    if (field === 'password' && this.newError()) return this.newError();
    const state = this.passwordForm[field]();
    return state.touched() && state.errors().length ? (state.errors()[0].message ?? null) : null;
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    void submit(this.passwordForm, async () => {
      this.currentError.set(null);
      this.newError.set(null);
      this.formError.set(null);
      this.loading.set(true);
      try {
        await this.auth.changePassword(this.model().current, this.model().password);
        this.toasts.success('Password changed. Your other devices are signed out.');
        await this.router.navigateByUrl('/home');
      } catch (err: unknown) {
        const error = toAuthError(err);
        if (error.code === 'INVALID_CREDENTIALS') {
          this.currentError.set('That is not your current password. Check it and try again.');
        } else if (error.code === 'PASSWORD_POLICY' || error.code === 'VALIDATION_ERROR') {
          this.newError.set(error.violations[0]?.message ?? error.message);
        } else {
          this.formError.set(error.message);
        }
      } finally {
        this.loading.set(false);
      }
    });
  }
}
