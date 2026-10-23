import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';

export type AlertTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
/** `auto`: warning/danger interrupt (`role="alert"`), the rest wait (`role="status"`). */
export type AlertLive = 'auto' | 'polite' | 'assertive' | 'off';

/**
 * An inline notice inside the page flow: an icon, an optional heading with meta ("2h ago"), a body
 * and an actions slot, with an optional dismiss button.
 *
 * Live-region role follows severity (`live="auto"`): `danger` and `warning` get `role="alert"`
 * (announced immediately), `neutral`, `info` and `success` get `role="status"` (announced
 * politely). Use `live="off"` for notices that are part of the page when it loads, such as a pending
 * request card, so they are not announced as if they had just happened.
 *
 * Slots: `[uiAlertIcon]` replaces the tone icon (decorative); mark each action button
 * `uiAlertAction`.
 *
 * @example
 * <ui-alert tone="neutral" heading="Password reset requested" meta="2h ago" live="off">
 *   Approving sends Kwame a link to set a new password.
 *   <button uiAlertAction uiButton variant="secondary">Decline</button>
 *   <button uiAlertAction uiButton>Approve</button>
 * </ui-alert>
 */
@Component({
  selector: 'ui-alert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="ui-alert__icon" aria-hidden="true">
      <ng-content select="[uiAlertIcon]">
        @switch (tone()) {
          @case ('success') {
            <svg viewBox="0 0 24 24" focusable="false">
              <circle cx="12" cy="12" r="10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          }
          @case ('warning') {
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          }
          @case ('danger') {
            <svg viewBox="0 0 24 24" focusable="false">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
          }
          @default {
            <svg viewBox="0 0 24 24" focusable="false">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
          }
        }
      </ng-content>
    </span>
    <div class="ui-alert__content">
      @if (heading()) {
        <p class="ui-alert__heading">
          <span class="ui-alert__title">{{ heading() }}</span>
          @if (meta()) {
            <span class="ui-alert__meta"><span aria-hidden="true">·</span> {{ meta() }}</span>
          }
        </p>
      }
      <div class="ui-alert__body"><ng-content /></div>
      <div class="ui-alert__actions"><ng-content select="[uiAlertAction]" /></div>
    </div>
    @if (dismissible()) {
      <button
        type="button"
        class="ui-alert__dismiss"
        [attr.aria-label]="dismissLabel()"
        (click)="dismiss()"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    }
  `,
  styleUrl: './alert.css',
  host: {
    class: 'ui-alert',
    '[attr.data-tone]': 'tone()',
    '[attr.role]': 'role()',
    '[hidden]': 'isDismissed()',
  },
})
export class Alert {
  readonly tone = input<AlertTone>('info');
  /** Short summary in bold. */
  readonly heading = input<string>();
  /** Secondary detail after the heading, e.g. "2h ago". */
  readonly meta = input<string>();
  /** How the notice is announced; see the class docs. */
  readonly live = input<AlertLive>('auto');
  /** Shows a dismiss button that hides the alert and emits `dismissed`. */
  readonly dismissible = input(false, { transform: booleanAttribute });
  /** Accessible name of the dismiss button. */
  readonly dismissLabel = input('Dismiss');
  /** The user dismissed the alert. Move focus somewhere sensible if it was focused. */
  readonly dismissed = output<void>();

  protected readonly isDismissed = signal(false);

  protected readonly role = computed(() => {
    switch (this.live()) {
      case 'off':
        return null;
      case 'assertive':
        return 'alert';
      case 'polite':
        return 'status';
      default:
        return this.tone() === 'danger' || this.tone() === 'warning' ? 'alert' : 'status';
    }
  });

  /** Hides the alert and emits `dismissed`. */
  dismiss(): void {
    this.isDismissed.set(true);
    this.dismissed.emit();
  }
}
