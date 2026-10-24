import { DialogRef } from '@angular/cdk/dialog';
import {
  DestroyRef,
  effect,
  inject,
  type Signal,
  type TemplateRef,
  untracked,
  ViewContainerRef,
  type WritableSignal,
} from '@angular/core';
import { DrawerService } from '@ems/ui/drawer';
import { EMPLOYEE_STATUS_PRESENTATION, type EmployeeStatus } from '@ems/ui/status-pill';

/** The slice of a signal-forms field state the error helper reads. */
interface FieldStateLike {
  touched(): boolean;
  errors(): readonly { message?: string }[];
}

/**
 * The first validation message of a field, once the user has touched it or submitted the form;
 * `null` otherwise. Pass straight to `ui-form-field [error]`.
 */
export function fieldError(field: () => FieldStateLike): string | null {
  const state = field();
  if (!state.touched()) return null;
  return state.errors()[0]?.message ?? null;
}

/** A backend status as an employee-status pill value, or `null` when it is not one. */
export function statusPillValue(status: string | null | undefined): EmployeeStatus | null {
  const key = (status ?? '').toUpperCase();
  return key in EMPLOYEE_STATUS_PRESENTATION ? (key as EmployeeStatus) : null;
}

/** "3 companies" / "1 company". */
export function countLabel(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** Turns an UPPER_SNAKE enum value into sentence case: `NATIONAL_ID_CARD` → "National id card". */
export function sentenceCase(raw: string | null | undefined): string {
  const words = (raw ?? '').toLowerCase().replace(/_/g, ' ').trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : '';
}

export interface FormDrawerOptions {
  /** Where focus starts when the drawer opens (a selector such as `'#company-name'`). */
  autoFocus?: string;
  size?: 'md' | 'lg';
}

/**
 * Mirrors an existing `showForm` signal onto a side drawer: `true` opens the drawer with the given
 * template, `false` closes it, and closing the drawer (Escape, scrim, close button) sets it back to
 * `false`. The tab components keep their original form logic; only the container changes.
 *
 * Call in an injection context (a field initializer or the constructor).
 */
export function bindFormDrawer(
  showForm: WritableSignal<boolean>,
  template: Signal<TemplateRef<unknown> | undefined>,
  options: FormDrawerOptions = {},
): void {
  const drawers = inject(DrawerService);
  const viewContainerRef = inject(ViewContainerRef);
  let ref: DialogRef<unknown, unknown> | null = null;

  effect(() => {
    const open = showForm();
    const tpl = template();
    untracked(() => {
      if (open && tpl && !ref) {
        const opened = drawers.open(tpl, {
          viewContainerRef,
          autoFocus: options.autoFocus ?? 'first-tabbable',
          size: options.size ?? 'md',
        });
        ref = opened;
        opened.closed.subscribe(() => {
          if (ref === opened) ref = null;
          showForm.set(false);
        });
      } else if (!open && ref) {
        const closing = ref;
        ref = null;
        closing.close();
      }
    });
  });

  inject(DestroyRef).onDestroy(() => ref?.close());
}
