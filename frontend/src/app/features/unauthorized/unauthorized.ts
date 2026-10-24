import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  inject,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { ErrorState } from '@ems/ui/error-state';

/** 403 inside the shell: what happened, who can grant access, and the way back Home. */
@Component({
  selector: 'app-unauthorized',
  imports: [ErrorState],
  template: `<ui-error-state kind="forbidden" headingLevel="1" (action)="goHome()" />`,
  styles: `
    :host {
      display: grid;
      place-items: center;
      min-block-size: 60dvh;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Unauthorized {
  private readonly router = inject(Router);
  private readonly errorState = viewChild.required(ErrorState);

  constructor() {
    afterNextRender(() => this.errorState().focus());
  }

  protected goHome(): void {
    void this.router.navigateByUrl('/home');
  }
}
