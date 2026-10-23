import {
  computed,
  HostAttributeToken,
  inject,
  InjectionToken,
  type Signal,
  untracked,
} from '@angular/core';

/**
 * What `ui-form-field` shares with the control projected into it. Controls (`uiInput`,
 * `ui-select`, `select[uiSelect]`, `ui-password-input`, `ui-search-input`, …) inject it
 * optionally and bind `id`, `aria-describedby`, `aria-invalid` and `aria-required` from it.
 */
export interface FormFieldContext {
  /** Id the label points at (`for`). A control with its own `id` attribute registers it. */
  readonly controlId: Signal<string>;
  /** Id of the visible label, for controls named with `aria-labelledby` (e.g. a listbox trigger). */
  readonly labelId: string;
  /** Space-separated ids of the hint and error currently shown, or `null`. */
  readonly describedBy: Signal<string | null>;
  /** The field shows an error. */
  readonly invalid: Signal<boolean>;
  /** The field is marked required. */
  readonly required: Signal<boolean>;
  /** Called by a control that already has an `id` attribute so the label follows it. */
  registerControlId(id: string): void;
}

export const UI_FORM_FIELD = new InjectionToken<FormFieldContext>('UI_FORM_FIELD');

let nextId = 0;

/** A document-unique id with the given prefix (`ui-input-3`). */
export function uniqueId(prefix: string): string {
  nextId += 1;
  return `${prefix}-${nextId}`;
}

/** ARIA wiring a control derives from its enclosing `ui-form-field` (if any). */
export interface FormFieldControlBinding {
  /** The enclosing form field, or `null` when the control stands alone. */
  readonly field: FormFieldContext | null;
  /** Id for the control element: its own `id`, the field's id, or `null` (leave unset). */
  readonly id: Signal<string | null>;
  readonly describedBy: Signal<string | null>;
  /** Own invalid state OR the field's. */
  readonly invalid: Signal<boolean>;
  readonly required: Signal<boolean>;
}

/**
 * Call in a control's injection context (constructor / field initializer).
 *
 * @param ownInvalid the control's own invalid input (e.g. from `[invalid]`).
 * @param idPrefix prefix for a generated id when the control needs one without a field.
 */
export function injectFormFieldControl(
  ownInvalid: () => boolean = () => false,
  idPrefix?: string,
): FormFieldControlBinding {
  const field = inject(UI_FORM_FIELD, { optional: true });
  const ownId = inject(new HostAttributeToken('id'), { optional: true });
  const generated = idPrefix ? uniqueId(idPrefix) : null;
  if (field && ownId) {
    // untracked: this may run while a parent template is being created (a reactive context).
    untracked(() => field.registerControlId(ownId));
  }
  return {
    field,
    id: computed(() => ownId ?? (field ? field.controlId() : generated)),
    describedBy: computed(() => field?.describedBy() ?? null),
    invalid: computed(() => ownInvalid() || (field?.invalid() ?? false)),
    required: computed(() => field?.required() ?? false),
  };
}
