import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { injectFormFieldControl } from '@ems/ui/form-field';
import type { InputSize } from '@ems/ui/input';

/**
 * Daylight styling for a native `<select>`: the browser's own picker, keyboard behaviour and
 * form integration (`[formField]`, `formControl`, `ngModel` bind to it directly). Use it for
 * short static lists in plain forms; use `ui-select` when you need a styled list, a clear
 * button or object values.
 *
 * Inside `ui-form-field` it receives `id`, `aria-describedby`, `aria-invalid` and
 * `aria-required`.
 *
 * @example
 * <select uiSelect>
 *   <option value="">Choose a department</option>
 *   <option value="eng">Engineering</option>
 * </select>
 */
@Component({
  // Attribute selector on purpose: the host stays a native <select>.
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'select[uiSelect]',
  exportAs: 'uiNativeSelect',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: '<ng-content />',
  styleUrl: './native-select.css',
  host: {
    class: 'ui-native-select',
    '[attr.data-size]': 'size()',
    '[attr.id]': 'control.id()',
    '[attr.aria-describedby]': 'control.describedBy()',
    '[attr.aria-invalid]': 'control.invalid() ? "true" : null',
    '[attr.aria-required]': 'control.required() ? "true" : null',
  },
})
export class NativeSelect {
  readonly size = input<InputSize>('md');
  /** Marks the value invalid. Bound by `[formField]`; then it shows only once `touched` is true. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Bound by `[formField]` (true after blur or `submit()`). Leave unset without a form. */
  readonly touched = input<boolean | undefined>(undefined);

  protected readonly control = injectFormFieldControl(
    () => this.invalid(),
    undefined,
    () => this.touched(),
  );
}
