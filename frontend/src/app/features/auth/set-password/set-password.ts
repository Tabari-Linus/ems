import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { form, FormField, required, submit, validate } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Icon } from '@ems/icons';
import { Alert } from '@ems/ui/alert';
import { Button } from '@ems/ui/button';
import { FormField as UiFormField } from '@ems/ui/form-field';
import { PasswordInput } from '@ems/ui/password-input';
import {
  AuthError,
  formatWait,
  passwordPolicyProblem,
  toAuthError,
} from '../../../core/errors/auth-error';
import { AuthService } from '../../../core/services/auth.service';
import { AuthLayout } from '../auth-layout';

type LinkProblem = 'missing' | 'invalid' | 'expired' | null;

/**
 * Set a password from the one-time link in the welcome email (`/set-password?token=…`).
 * The token is read once, kept in memory only and removed from the address bar
 * (docs/api/auth.md §5); on success the user signs in with the new password.
 */
@Component({
  selector: 'app-set-password',
  imports: [AuthLayout, UiFormField, FormField, PasswordInput, Button, Alert, Icon, RouterLink],
  templateUrl: './set-password.html',
  styleUrl: './set-password.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetPassword {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly token: string | null;

  protected readonly model = signal({ password: '', confirm: '' });
  protected readonly passwordForm = form(this.model, (s) => {
    required(s.password, { message: 'Choose a password.' });
    validate(s.password, ({ value }) => {
      const problem = value() ? passwordPolicyProblem(value()) : null;
      return problem ? { kind: 'policy', message: problem } : null;
    });
    required(s.confirm, { message: 'Type the password again.' });
    validate(s.confirm, ({ value, valueOf }) =>
      value() && value() !== valueOf(s.password)
        ? { kind: 'mismatch', message: 'The two passwords are different. Type them again.' }
        : null,
    );
  });

  protected readonly linkProblem = signal<LinkProblem>(null);
  protected readonly serverError = signal<AuthError | null>(null);
  protected readonly serverViolation = signal<string | null>(null);
  protected readonly loading = signal(false);

  protected readonly errorText = computed(() => {
    const error = this.serverError();
    if (!error) return null;
    if (error.code === 'RATE_LIMITED') {
      return error.retryAfterSeconds
        ? `Too many attempts. Wait ${formatWait(error.retryAfterSeconds)}, then try again.`
        : 'Too many attempts. Wait a minute, then try again.';
    }
    if (error.code === 'ACCOUNT_INACTIVE') {
      return `${error.message} People Operations can tell you more.`;
    }
    return error.message;
  });

  constructor() {
    const route = inject(ActivatedRoute);
    this.token = route.snapshot.queryParamMap.get('token');
    if (!this.token) {
      this.linkProblem.set('missing');
    } else {
      // Keep the one-time token out of the history, bookmarks and screenshots.
      const doc = inject(DOCUMENT);
      doc.defaultView?.history.replaceState(doc.defaultView.history.state, '', '/set-password');
    }
  }

  protected fieldError(field: 'password' | 'confirm'): string | null {
    if (field === 'password' && this.serverViolation()) return this.serverViolation();
    const state = this.passwordForm[field]();
    return state.touched() && state.errors().length ? (state.errors()[0].message ?? null) : null;
  }

  protected onPasswordInput(): void {
    this.serverViolation.set(null);
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    const token = this.token;
    if (!token) return;
    void submit(this.passwordForm, async () => {
      this.serverError.set(null);
      this.serverViolation.set(null);
      this.loading.set(true);
      try {
        await this.auth.setPassword(token, this.model().password);
        await this.router.navigate(['/login'], { queryParams: { passwordSet: 1 } });
      } catch (err: unknown) {
        const error = toAuthError(err);
        if (error.code === 'TOKEN_EXPIRED') {
          this.linkProblem.set('expired');
        } else if (error.code === 'TOKEN_INVALID') {
          this.linkProblem.set('invalid');
        } else if (error.code === 'PASSWORD_POLICY' || error.code === 'VALIDATION_ERROR') {
          this.serverViolation.set(error.violations[0]?.message ?? error.message);
        } else {
          this.serverError.set(error);
        }
      } finally {
        this.loading.set(false);
      }
    });
  }
}
