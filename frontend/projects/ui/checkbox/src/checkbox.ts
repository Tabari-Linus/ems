import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  forwardRef,
  input,
  model,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { uniqueId } from '@ems/ui/form-field';
import { Icon } from '@ems/icons';

/**
 * Checkbox on a native `<input type="checkbox">` (WAI-ARIA APG *Checkbox*: Space toggles,
 * the label toggles on click). The projected content is the label.
 *
 * - `indeterminate` shows a dash and exposes `aria-checked="mixed"` (native property); the next
 *   user toggle clears it.
 * - Works with `[(checked)]`, `[formField]` (signal forms), `formControl` and `ngModel`
 *   (ControlValueAccessor, boolean value).
 *
 * @example
 * <ui-checkbox [(checked)]="remember">Keep me signed in on this device</ui-checkbox>
 */
@Component({
  selector: 'ui-checkbox',
  imports: [Icon],
  exportAs: 'uiCheckbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Checkbox), multi: true }],
  template: `
    <label class="ui-checkbox__row" [attr.for]="inputId">
      <span class="ui-checkbox__box">
        <input
          #native
          class="ui-checkbox__input"
          type="checkbox"
          [id]="inputId"
          [checked]="checked()"
          [indeterminate]="indeterminate()"
          [disabled]="isDisabled()"
          [required]="required()"
          [attr.name]="name() || null"
          [attr.value]="value() || null"
          [attr.aria-describedby]="describedBy() || null"
          [attr.aria-invalid]="invalid() ? 'true' : null"
          (change)="onNativeChange($event)"
          (blur)="onTouched()"
        />
        <ui-icon class="ui-checkbox__mark" [name]="indeterminate() ? 'minus' : 'check'" />
      </span>
      <span class="ui-checkbox__label"><ng-content /></span>
    </label>
  `,
  styleUrl: './checkbox.css',
  host: {
    class: 'ui-checkbox',
    '[attr.data-disabled]': 'isDisabled() ? "" : null',
  },
})
export class Checkbox implements ControlValueAccessor {
  /** Checked state; two-way bindable. */
  readonly checked = model(false);
  /** Mixed state (e.g. "Select all" when some rows are selected); two-way bindable. */
  readonly indeterminate = model(false);
  /** Disables the checkbox (forms set this through `setDisabledState`). */
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  /** Marks the checkbox invalid (`aria-invalid`). */
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly name = input<string>();
  readonly value = input<string>();
  /** Id(s) of help or error text describing the checkbox. */
  readonly describedBy = input<string | null>();

  protected readonly inputId = uniqueId('ui-checkbox');
  private readonly formDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  private readonly native = viewChild.required<ElementRef<HTMLInputElement>>('native');

  private onChange: (value: boolean) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  /** Moves focus to the native checkbox. */
  focus(options?: FocusOptions): void {
    this.native().nativeElement.focus(options);
  }

  protected onNativeChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.indeterminate.set(false);
    this.checked.set(checked);
    this.onChange(checked);
  }

  writeValue(value: unknown): void {
    this.checked.set(!!value);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }
}
