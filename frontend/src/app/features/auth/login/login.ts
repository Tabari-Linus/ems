import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { email, form, FormField, minLength, required, submit } from '@angular/forms/signals';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormField],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly authService = inject(AuthService);

  protected readonly model = signal({ email: '', password: '' });

  protected readonly loginForm = form(this.model, s => {
    required(s.email, { message: 'Email is required' });
    email(s.email, { message: 'Please enter a valid email address' });
    required(s.password, { message: 'Password is required' });
    minLength(s.password, 6, { message: 'Password must be at least 6 characters' });
  });

  protected readonly apiError = signal('');
  protected readonly loading = signal(false);

  protected onSubmit(): void {
    submit(this.loginForm, async () => {
      this.apiError.set('');
      this.loading.set(true);
      try {
        await firstValueFrom(this.authService.login(this.model()));
      } catch (err: unknown) {
        const message = (err as { error?: { message?: string } })?.error?.message;
        this.apiError.set(message ?? 'Invalid email or password. Please try again.');
      } finally {
        this.loading.set(false);
      }
    });
  }
}
