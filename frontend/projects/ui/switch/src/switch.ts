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

export type SwitchLabelPosition = 'before' | 'after';

/**
 * On/off switch on a native `<input type="checkbox" role="switch">` (WAI-ARIA APG *Switch*:
 * Space toggles, the label toggles on click, state is exposed as on/off). Use it for settings
 * that take effect immediately; use a checkbox for choices submitted with a form.
 *
 * Works with `[(checked)]`, `[formField]` (signal forms), `formControl` and `ngModel`
 * (ControlValueAccessor, boolean value).
 *
 * @example
 * <ui-switch [(checked)]="emailDigest">Email me a weekly summary</ui-switch>
 */
@Component({
  selector: 'ui-switch',
  exportAs: 'uiSwitch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Switch), multi: true }],
  template: `
    <label class="ui-switch__row" [attr.for]="inputId">
      <input
        #native
        class="ui-switch__input"
        type="checkbox"
        role="switch"
        [id]="inputId"
        [checked]="checked()"
        [disabled]="isDisabled()"
        [attr.name]="name() || null"
        [attr.aria-describedby]="describedBy() || null"
        (change)="onNativeChange($event)"
        (blur)="onTouched()"
      />
      <span class="ui-switch__label"><ng-content /></span>
    </label>
  `,
  styleUrl: './switch.css',
  host: {
    class: 'ui-switch',
    '[attr.data-label-position]': 'labelPosition()',
    '[attr.data-disabled]': 'isDisabled() ? "" : null',
  },
})
export class Switch implements ControlValueAccessor {
  /** On (true) or off; two-way bindable. */
  readonly checked = model(false);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly name = input<string>();
  /** Id(s) of help text describing the switch. */
  readonly describedBy = input<string | null>();
  /** Label before the track (settings rows) or after it (default). */
  readonly labelPosition = input<SwitchLabelPosition>('after');

  protected readonly inputId = uniqueId('ui-switch');
  private readonly formDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  private readonly native = viewChild.required<ElementRef<HTMLInputElement>>('native');

  private onChange: (value: boolean) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  /** Moves focus to the switch. */
  focus(options?: FocusOptions): void {
    this.native().nativeElement.focus(options);
  }

  protected onNativeChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
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
