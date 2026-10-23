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

/**
 * A labelled form control: label, optional hint, error message and required marker, with the
 * ARIA wiring done for you. Project one control (`input[uiInput]`, `textarea[uiInput]`,
 * `ui-select`, `select[uiSelect]`, `ui-password-input`, `ui-search-input`); it receives the
 * `id` the label points at, `aria-describedby` (hint and error), `aria-invalid` while an error
 * is shown and `aria-required` when `required` is set.
 *
 * Pass `error` only once the user has touched the control or submitted the form. An error that
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
    @if (error(); as message) {
      <p class="ui-form-field__error" [id]="errorId" [attr.role]="announce() ? 'alert' : null">
        <!-- Lucide "circle-alert" (inline: @ems/ui cannot depend on @ems/icons yet). -->
        <svg
          class="ui-form-field__error-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
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

  readonly invalid = computed(() => !!this.error());
  readonly describedBy = computed(() => {
    if (this.error()) return this.errorId;
    return this.hint() ? this.hintId : null;
  });

  private rendered = false;
  /**
   * `role="alert"` only for an error that appears after the first render (touch/submit); one
   * already present on first render stays silent. Recomputed only when an error appears or goes.
   */
  protected readonly announce = linkedSignal<boolean, boolean>({
    source: () => !!this.error(),
    computation: (hasError) => hasError && this.rendered,
  });

  constructor() {
    afterNextRender(() => (this.rendered = true));
  }

  registerControlId(id: string): void {
    this.registeredId.set(id);
  }
}
