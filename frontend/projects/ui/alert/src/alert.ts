import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { Icon, STATUS_ICONS, type StatusTone } from '@ems/icons';

export type AlertTone = StatusTone;
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
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="ui-alert__icon" aria-hidden="true">
      <ng-content select="[uiAlertIcon]">
        <ui-icon [name]="toneIcon()" />
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
        <ui-icon name="x" size="sm" />
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
  protected readonly toneIcon = computed(() => STATUS_ICONS[this.tone()]);

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
