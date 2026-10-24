import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  inject,
  InjectionToken,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { injectFormFieldControl } from '@ems/ui/form-field';

export type InputSize = 'sm' | 'md';
export type InputGroupShape = 'rounded' | 'pill';

/** Provided by `ui-input-group` so a grouped `uiInput` drops its own frame. */
export const UI_INPUT_GROUP = new InjectionToken<InputGroup>('UI_INPUT_GROUP');

/**
 * Daylight text field on a native `<input>` or `<textarea>`: the native element keeps its
 * semantics, keyboard behaviour, autofill and form integration (`[formField]`, `formControl`,
 * `ngModel` all bind to it directly).
 *
 * Inside `ui-form-field` it receives `id`, `aria-describedby`, `aria-invalid` and
 * `aria-required`. Disabled and read-only use the native attributes.
 *
 * @example
 * <input uiInput type="email" autocomplete="email" placeholder="name@akwaabalabs.example" />
 * <textarea uiInput rows="4"></textarea>
 */
@Component({
  // Attribute selector on purpose: the host stays a native <input>/<textarea>.
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'input[uiInput], textarea[uiInput]',
  exportAs: 'uiInput',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: '',
  styleUrl: './input.css',
  host: {
    class: 'ui-input',
    '[attr.data-size]': 'size()',
    '[attr.data-grouped]': 'grouped ? "" : null',
    '[attr.id]': 'control.id()',
    '[attr.aria-describedby]': 'control.describedBy()',
    '[attr.aria-invalid]': 'control.invalid() ? "true" : null',
    '[attr.aria-required]': 'control.required() ? "true" : null',
  },
})
export class Input {
  /** Height and padding (ignored inside `ui-input-group`, which sets its own). */
  readonly size = input<InputSize>('md');
  /**
   * Marks the value invalid (also set automatically by an erroring `ui-form-field`). Bound by
   * `[formField]`; then it shows only once `touched` is true.
   */
  readonly invalid = input(false, { transform: booleanAttribute });
  /**
   * Bound by `[formField]` (true after blur or `submit()`). Leave unset without a form: an
   * `invalid` set by hand then shows at once.
   */
  readonly touched = input<boolean | undefined>(undefined);

  protected readonly grouped = inject(UI_INPUT_GROUP, { optional: true }) !== null;
  protected readonly control = injectFormFieldControl(
    () => this.invalid(),
    undefined,
    () => this.touched(),
  );
}

/**
 * Frames a `uiInput` with leading and/or trailing content: an icon, a unit, or a small
 * button (clear, reveal). Mark slot content with `uiInputLeading` / `uiInputTrailing`.
 * Decorative icons should be `aria-hidden` (`ui-icon` is by default); buttons need a name.
 * Inside the group, `.ui-input-group__icon` sizes an icon and `.ui-input-group__button` styles a
 * small round icon button.
 *
 * @example
 * <ui-input-group>
 *   <ui-icon uiInputLeading class="ui-input-group__icon" name="mail" />
 *   <input uiInput type="email" />
 * </ui-input-group>
 */
@Component({
  selector: 'ui-input-group',
  exportAs: 'uiInputGroup',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [{ provide: UI_INPUT_GROUP, useExisting: InputGroup }],
  template: `
    <ng-content select="[uiInputLeading]" />
    <ng-content />
    <ng-content select="[uiInputTrailing]" />
  `,
  styleUrl: './input-group.css',
  host: {
    class: 'ui-input-group',
    '[attr.data-size]': 'size()',
    '[attr.data-shape]': 'shape()',
  },
})
export class InputGroup {
  /** Height and padding of the frame. */
  readonly size = input<InputSize>('md');
  /** `pill` is used for search fields; `rounded` (10px) for everything else. */
  readonly shape = input<InputGroupShape>('rounded');
}
