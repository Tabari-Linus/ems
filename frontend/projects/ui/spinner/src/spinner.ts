import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type SpinnerSize = 'sm' | 'md' | 'lg';

/**
 * An indeterminate loading indicator.
 *
 * With a `label` (default "Loading") the host is `role="status"` and the label is visually hidden
 * text, so screen readers announce it when the spinner appears. Pass `label=""` when the spinner
 * only decorates something that already conveys the busy state (e.g. a button with `aria-busy`);
 * it is then `aria-hidden`.
 *
 * @example
 * <ui-spinner label="Loading people" />
 */
@Component({
  selector: 'ui-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="ui-spinner__arc" aria-hidden="true"></span>
    @if (label()) {
      <span class="ui-visually-hidden">{{ label() }}</span>
    }
  `,
  styleUrl: './spinner.css',
  host: {
    class: 'ui-spinner',
    '[attr.data-size]': 'size()',
    '[attr.role]': 'label() ? "status" : null',
    '[attr.aria-hidden]': 'label() ? null : "true"',
  },
})
export class Spinner {
  /** Accessible label; empty makes the spinner decorative. */
  readonly label = input('Loading');
  /** 16, 24 or 40 px. */
  readonly size = input<SpinnerSize>('md');
}
