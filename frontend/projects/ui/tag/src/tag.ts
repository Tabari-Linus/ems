import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

export type TagVariant = 'neutral' | 'accent';

/**
 * A small pill tag for short metadata (a skill, a contact channel, an office code).
 *
 * With `removable` it renders a real `<button>` whose accessible name is "Remove {label}"
 * (overridable with `removeLabel`) and emits `remove`. The tag itself is not interactive.
 *
 * @example
 * <ui-tag label="Accra" />
 * <ui-tag label="Angular" removable (remove)="drop('Angular')" />
 */
@Component({
  selector: 'ui-tag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="ui-tag__label">{{ label() }}<ng-content /></span>
    @if (removable()) {
      <button
        type="button"
        class="ui-tag__remove"
        [attr.aria-label]="removeName()"
        (click)="remove.emit()"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    }
  `,
  styleUrl: './tag.css',
  host: {
    class: 'ui-tag',
    '[attr.data-variant]': 'variant()',
    '[attr.data-removable]': 'removable() ? "" : null',
  },
})
export class Tag {
  /** Visible text; also used in the remove button's accessible name. */
  readonly label = input<string>('');
  /** Neutral (sunken) or accent (soft indigo) tag. */
  readonly variant = input<TagVariant>('neutral');
  /** Shows a remove button. */
  readonly removable = input(false, { transform: booleanAttribute });
  /** Accessible name of the remove button. Defaults to "Remove {label}". */
  readonly removeLabel = input<string>();
  /** The remove button was activated. */
  readonly remove = output<void>();

  protected readonly removeName = computed(
    () => this.removeLabel() ?? `Remove ${this.label()}`.trim(),
  );
}
