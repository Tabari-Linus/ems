import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { type FormFieldContext, UI_FORM_FIELD, uniqueId } from './form-field-control';
import { Icon } from '@ems/icons';

/**
 * A labelled form control: label, optional hint, error message and required marker, with the
 * ARIA wiring done for you. Project one control (`input[uiInput]`, `textarea[uiInput]`,
 * `ui-select`, `select[uiSelect]`, `ui-password-input`, `ui-search-input`); it receives the
 * `id` the label points at, `aria-describedby` (hint and error), `aria-invalid` while an error
 * is shown and `aria-required` when `required` is set.
 *
 * When the projected control is bound with signal forms (`[formField]`), the error is held back
 * until that field is touched (blur, or `submit()` / `markAsTouched()`), so `error` can be the
 * field's first message straight away. Without a form, pass `error` only once the user has
 * touched the control or submitted the form; it is shown as given. An error that
 * appears after the first render is announced (`role="alert"`); one that is present on first
 * render (e.g. server-side validation on load) is not, so screen readers are not interrupted.
 *
 * Put extra content next to the label (e.g. a "Forgot password?" link) with `uiFormFieldAside`.
 *
 * @example
 * <ui-form-field label="Work email" hint="We send sign-in links here." [error]="emailError()" required>
 *   <input uiInput type="email" autocomplete="email" [formField]="form.email" />
 * </ui-form-field>
 */
@Component({
  selector: 'ui-form-field',
  imports: [Icon],
  exportAs: 'uiFormField',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [{ provide: UI_FORM_FIELD, useExisting: FormField }],
  template: `
    <div class="ui-form-field__label-row">
      <label class="ui-form-field__label" [id]="labelId" [attr.for]="controlId()">
        {{ label() }}
        @if (required()) {
          <span class="ui-form-field__required" aria-hidden="true">*</span>
        }
      </label>
      <ng-content select="[uiFormFieldAside]" />
    </div>
    <ng-content />
    @if (shownError(); as message) {
      <p class="ui-form-field__error" [id]="errorId" [attr.role]="announce() ? 'alert' : null">
        <ui-icon class="ui-form-field__error-icon" name="circle-alert" size="sm" />
        <span>{{ message }}</span>
      </p>
    } @else if (hint(); as text) {
      <p class="ui-form-field__hint" [id]="hintId">{{ text }}</p>
    }
  `,
  styleUrl: './form-field.css',
  host: {
    class: 'ui-form-field',
    '[attr.data-invalid]': 'invalid() ? "" : null',
  },
})
export class FormField implements FormFieldContext {
  /** Visible label, sentence case ("Work email"). */
  readonly label = input.required<string>();
  /** Help text under the control; hidden while an error is shown. */
  readonly hint = input<string | null | undefined>();
  /** Error message ("Enter a work email like name@akwaabalabs.example"). Shown when set. */
  readonly error = input<string | null | undefined>();
  /** Shows a required marker and sets `aria-required` on the control. */
  readonly required = input(false, { transform: booleanAttribute });

  readonly labelId = uniqueId('ui-form-field-label');
  protected readonly hintId = uniqueId('ui-form-field-hint');
  protected readonly errorId = uniqueId('ui-form-field-error');

  private readonly registeredId = signal<string | null>(null);
  private readonly generatedId = uniqueId('ui-form-field-control');
  readonly controlId = computed(() => this.registeredId() ?? this.generatedId);

  /** The projected control's `touched` state; `undefined` while it is not bound to a form. */
  private readonly controlTouched = signal<() => boolean | undefined>(() => undefined);

  /**
   * The error as shown: held back while the projected control is bound to a signal form
   * (`[formField]`) and not yet touched, so an empty required field is not red on load. The form
   * touches it on blur and every field on `submit()`. Without a form it is shown as given.
   */
  protected readonly shownError = computed(() => {
    const error = this.error();
    return error && this.controlTouched()() !== false ? error : null;
  });

  readonly invalid = computed(() => !!this.shownError());
  readonly describedBy = computed(() => {
    if (this.shownError()) return this.errorId;
    return this.hint() ? this.hintId : null;
  });

  private rendered = false;
  /**
   * `role="alert"` only for an error that appears after the first render (touch/submit); one
   * already present on first render stays silent. Recomputed only when an error appears or goes.
   */
  protected readonly announce = linkedSignal<boolean, boolean>({
    source: () => !!this.shownError(),
    computation: (hasError) => hasError && this.rendered,
  });

  constructor() {
    afterNextRender(() => (this.rendered = true));
  }

  registerControlId(id: string): void {
    this.registeredId.set(id);
  }

  registerControlTouched(touched: () => boolean | undefined): void {
    this.controlTouched.set(touched);
  }
}
