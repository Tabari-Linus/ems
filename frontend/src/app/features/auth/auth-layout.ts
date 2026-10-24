import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Icon } from '@ems/icons';
import { ThemeService } from '@ems/ui/theme';
import { Brand } from '../shell/brand';

/**
 * The signed-out frame (direction-d, screen 1): brand and theme switch on top, one calm card in
 * the middle, a quiet footer. Pages project the card content.
 */
@Component({
  selector: 'app-auth-layout',
  imports: [Brand, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="auth-top">
      <app-brand />
      <div class="auth-theme" role="group" aria-label="Theme">
        <button
          type="button"
          aria-label="Light theme"
          [attr.aria-pressed]="theme.resolved() === 'light'"
          (click)="theme.setTheme('light')"
        >
          <ui-icon name="sun" size="sm" />
        </button>
        <button
          type="button"
          aria-label="Dark theme"
          [attr.aria-pressed]="theme.resolved() === 'dark'"
          (click)="theme.setTheme('dark')"
        >
          <ui-icon name="moon" size="sm" />
        </button>
      </div>
    </header>
    <main class="auth-main" id="main-content">
      <section class="auth-card" [attr.aria-labelledby]="headingId() || null">
        <ng-content />
      </section>
    </main>
    <footer class="auth-foot">
      <span>Employee management</span>
      <span>New here? Ask People Operations for access.</span>
    </footer>
  `,
  styles: `
    :host {
      display: grid;
      grid-template-rows: auto 1fr auto;
      min-block-size: 100dvh;
      background: var(--ems-color-bg-canvas);
      color: var(--ems-color-text-primary);
    }

    .auth-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ems-space-4);
      padding: var(--ems-space-5) var(--ems-space-10);
    }

    .auth-theme {
      display: inline-flex;
      gap: var(--ems-space-1);
      padding: var(--ems-space-1);
      border-radius: var(--ems-radius-pill);
      background: var(--ems-color-bg-sunken);
    }

    .auth-theme button {
      display: inline-grid;
      place-items: center;
      inline-size: var(--ems-control-sm-height);
      block-size: var(--ems-control-sm-height);
      padding: 0;
      border: 0;
      border-radius: var(--ems-radius-pill);
      background: transparent;
      color: var(--ems-color-text-secondary);
      cursor: pointer;
      transition:
        background-color var(--ems-duration-fast) var(--ems-easing-standard),
        color var(--ems-duration-fast) var(--ems-easing-standard);
    }

    .auth-theme button:hover {
      color: var(--ems-color-text-primary);
    }

    .auth-theme button[aria-pressed='true'] {
      background: var(--ems-color-bg-surface);
      box-shadow: var(--ems-elevation-card);
      color: var(--ems-color-text-primary);
    }

    .auth-main {
      display: grid;
      place-items: center;
      padding: var(--ems-space-6) var(--ems-space-4);
      outline: none;
    }

    .auth-card {
      display: grid;
      gap: var(--ems-space-5);
      box-sizing: border-box;
      inline-size: min(100%, var(--ems-size-dialog-sm));
      padding: var(--ems-space-8) var(--ems-space-8) var(--ems-space-6);
      border-radius: var(--ems-radius-xl);
      background: var(--ems-color-bg-surface);
      box-shadow: var(--ems-elevation-raised);
    }

    .auth-foot {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--ems-space-2) var(--ems-space-6);
      padding: var(--ems-space-4) var(--ems-space-10) var(--ems-space-5);
      color: var(--ems-color-text-muted);
      font-size: var(--ems-type-caption-size);
    }

    /* breakpoint.narrow */
    @media (max-width: 639.98px) {
      .auth-top,
      .auth-foot {
        padding-inline: var(--ems-space-4);
      }

      .auth-card {
        padding: var(--ems-space-6) var(--ems-space-5) var(--ems-space-5);
      }

      .auth-foot {
        justify-content: center;
        text-align: center;
      }
    }

    @media (forced-colors: active) {
      .auth-card {
        border: var(--ems-border-width-hairline) solid CanvasText;
      }

      .auth-theme button[aria-pressed='true'] {
        outline: var(--ems-border-width-hairline) solid Highlight;
      }
    }
  `,
})
export class AuthLayout {
  protected readonly theme = inject(ThemeService);
  /** Id of the card's heading, which names the card region. */
  readonly headingId = input<string | null>(null);
}
