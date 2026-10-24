import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { email, form, FormField, required, submit } from '@angular/forms/signals';
import { ActivatedRoute } from '@angular/router';
import { Icon } from '@ems/icons';
import { Alert } from '@ems/ui/alert';
import { Button } from '@ems/ui/button';
import { FormField as UiFormField } from '@ems/ui/form-field';
import { Input } from '@ems/ui/input';
import { PasswordInput } from '@ems/ui/password-input';
import { AuthError, formatWait, toAuthError } from '../../../core/errors/auth-error';
import { AuthService } from '../../../core/services/auth.service';
import { AuthLayout } from '../auth-layout';

/** What the page says for each sign-in failure: what happened, then what to do. */
export function loginErrorCopy(error: AuthError): { heading: string; text: string } {
  switch (error.code) {
    case 'INVALID_CREDENTIALS':
      return {
        heading: 'Email or password is wrong',
        text: 'Check both and try again. After 5 wrong attempts in a row the account locks for 15 minutes.',
      };
    case 'ACCOUNT_LOCKED':
      return {
        heading: 'Account locked for 15 minutes',
        text: 'There were too many wrong passwords. Wait 15 minutes, then sign in again. If it was not you, tell People Operations.',
      };
    case 'ACCOUNT_PENDING':
      return {
        heading: 'Your account is not set up yet',
        text: 'Open the link in your welcome email to choose a password. If the link has expired, ask People Operations to send a new one.',
      };
    case 'ACCOUNT_INACTIVE':
      return {
        heading: 'This account is not active',
        text: `${error.message} People Operations can tell you more.`,
      };
    case 'RATE_LIMITED':
      return {
        heading: 'Too many attempts',
        text: error.retryAfterSeconds
          ? `Wait ${formatWait(error.retryAfterSeconds)}, then try again.`
          : 'Wait a minute, then try again.',
      };
    case 'NETWORK_ERROR':
      return { heading: 'You are offline', text: error.message };
    default:
      return {
        heading: 'We could not sign you in',
        text: 'Something went wrong on our side. Try again in a moment.',
      };
  }
}

/** Sign in (direction-d, screen 1): a calm, single-column form. */
@Component({
  selector: 'app-login',
  imports: [AuthLayout, FormField, UiFormField, Input, PasswordInput, Button, Alert, Icon],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  protected readonly model = signal({ email: '', password: '' });
  protected readonly loginForm = form(this.model, (s) => {
    required(s.email, { message: 'Enter your work email.' });
    email(s.email, { message: 'Enter an email like name@company.com.' });
    required(s.password, { message: 'Enter your password.' });
  });

  protected readonly error = signal<AuthError | null>(null);
  protected readonly errorCopy = computed(() => {
    const error = this.error();
    return error ? loginErrorCopy(error) : null;
  });
  protected readonly loading = signal(false);
  /** Shown after a successful set-password (`?passwordSet=1`). */
  protected readonly passwordSet = this.route.snapshot.queryParamMap.get('passwordSet') === '1';

  protected fieldError(field: 'email' | 'password'): string | null {
    const state = this.loginForm[field]();
    return state.touched() && state.errors().length ? state.errors()[0].message ?? null : null;
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    void submit(this.loginForm, async () => {
      this.error.set(null);
      this.loading.set(true);
      try {
        await this.auth.login(
          { email: this.model().email.trim(), password: this.model().password },
          this.route.snapshot.queryParamMap.get('returnUrl'),
        );
      } catch (err: unknown) {
        this.error.set(toAuthError(err));
      } finally {
        this.loading.set(false);
      }
    });
  }
}
