import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  inject,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { ErrorState } from '@ems/ui/error-state';
import { AuthService } from '../../core/services/auth.service';
import { AuthLayout } from '../auth/auth-layout';

/**
 * 404. Signed in, it renders inside the shell and leads Home; signed out, it stands alone in the
 * sign-in frame and leads to sign in.
 */
@Component({
  selector: 'app-not-found',
  imports: [ErrorState, AuthLayout],
  template: `
    @if (signedIn) {
      <ui-error-state kind="not-found" headingLevel="1" (action)="go('/home')" />
    } @else {
      <app-auth-layout>
        <ui-error-state
          kind="not-found"
          headingLevel="1"
          description="The link may be out of date. Check the address, or sign in to find what you need."
          actionLabel="Go to sign in"
          (action)="go('/login')"
        />
      </app-auth-layout>
    }
  `,
  styles: `
    :host {
      display: grid;
    }

    :host(.in-shell) {
      place-items: center;
      min-block-size: 60dvh;
    }
  `,
  host: { '[class.in-shell]': 'signedIn' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFound {
  private readonly router = inject(Router);
  private readonly errorState = viewChild.required(ErrorState);
  protected readonly signedIn = inject(AuthService).isAuthenticated();

  constructor() {
    afterNextRender(() => this.errorState().focus());
  }

  protected go(url: string): void {
    void this.router.navigateByUrl(url);
  }
}
