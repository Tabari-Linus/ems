import { CdkListbox, CdkOption, type ListboxValueChangeEvent } from '@angular/cdk/listbox';
import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  forwardRef,
  inject,
  Injector,
  input,
  model,
  output,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { uniqueId } from '@ems/ui/form-field';
import { SELECT_PANEL_POSITIONS, type SelectOption } from '@ems/ui/select';
import { Icon } from '@ems/icons';

/** Value of the "All" row in the list (never emitted). */
const ALL = Symbol('ui-filter-pill-all');
type Row<T> = T | typeof ALL;

/**
 * Filter pill for list pages ("Office · All"): a pill button that opens a listbox of options
 * in an overlay (`@angular/cdk/listbox` + `@angular/cdk/overlay`). The first row, "All", clears
 * the filter.
 *
 * - Single (default): `[(value)]`, choosing closes the list.
 * - `multiple`: `[(values)]`, choosing toggles and keeps the list open; the pill shows
 *   "2 selected" for more than one.
 * - The pill switches to the soft indigo tint while a filter is applied.
 * - Keyboard: Enter/Space/ArrowDown open; ArrowUp/ArrowDown/Home/End and type-ahead move;
 *   Enter/Space choose; Escape or Tab close; focus returns to the pill.
 * - The accessible name is "Office: All" (`aria-label`; the dot is decorative).
 *
 * @example
 * <ui-filter-pill label="Office" [options]="offices" [(value)]="office" />
 * <ui-filter-pill label="Department" multiple [options]="departments" [(values)]="departments" />
 */
@Component({
  selector: 'ui-filter-pill',
  exportAs: 'uiFilterPill',
  imports: [CdkListbox, CdkOption, CdkConnectedOverlay, CdkOverlayOrigin, NgTemplateOutlet, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <button
      #trigger
      type="button"
      class="ui-filter-pill__trigger"
      cdkOverlayOrigin
      #origin="cdkOverlayOrigin"
      aria-haspopup="listbox"
      [attr.aria-label]="label() + ': ' + summary()"
      [attr.aria-expanded]="open()"
      [attr.aria-controls]="open() ? listboxId : null"
      [attr.data-active]="active() ? '' : null"
      [disabled]="isDisabled()"
      (click)="toggle()"
      (keydown)="onTriggerKeydown($event)"
    >
      <span class="ui-filter-pill__label">{{ label() }}</span>
      <span class="ui-filter-pill__dot" aria-hidden="true">·</span>
      <span class="ui-filter-pill__summary">{{ summary() }}</span>
      <ui-icon class="ui-filter-pill__chevron" name="chevron-down" size="sm" />
    </button>

    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="open()"
      [cdkConnectedOverlayPositions]="positions"
      cdkConnectedOverlayPanelClass="ui-filter-pill-pane"
      (overlayOutsideClick)="onOutsideClick($event)"
      (detach)="close(false)"
    >
      <div
        class="ui-select__panel ui-filter-pill__panel"
        cdkListbox
        [id]="listboxId"
        [cdkListboxMultiple]="multiple()"
        [cdkListboxValue]="listboxValue()"
        [attr.aria-label]="label()"
        (cdkListboxValueChange)="onListboxChange($event)"
        [tabindex]="0"
        (keydown)="onPanelKeydown($event)"
        (click)="onPanelClick($event)"
      >
        <div class="ui-select__option" [cdkOption]="all" [cdkOptionTypeaheadLabel]="allLabel()">
          <span class="ui-select__option-label">{{ allLabel() }}</span>
          <ng-container [ngTemplateOutlet]="check" />
        </div>
        @for (option of options(); track $index) {
          <div
            class="ui-select__option"
            [cdkOption]="option.value"
            [cdkOptionDisabled]="!!option.disabled"
            [cdkOptionTypeaheadLabel]="option.label"
          >
            <span class="ui-select__option-label">{{ option.label }}</span>
            <ng-container [ngTemplateOutlet]="check" />
          </div>
        }
      </div>
    </ng-template>

    <ng-template #check>
      <ui-icon class="ui-select__check" name="check" size="sm" />
    </ng-template>
  `,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => FilterPill), multi: true },
  ],
  styleUrls: ['../../select/src/listbox-panel.css', './filter-pill.css'],
  host: { class: 'ui-filter-pill' },
})
export class FilterPill<T = unknown> implements ControlValueAccessor {
  /** What is filtered ("Office"). */
  readonly label = input.required<string>();
  readonly options = input<readonly SelectOption<T>[]>([]);
  /** Allow several values (`values`) instead of one (`value`). */
  readonly multiple = input(false, { transform: booleanAttribute });
  /** Single mode: the chosen value, `null` for all; two-way bindable. */
  readonly value = model<T | null>(null);
  /** Multiple mode: the chosen values, empty for all; two-way bindable. */
  readonly values = model<readonly T[]>([]);
  /** Text of the reset row and of the pill when nothing is chosen. */
  readonly allLabel = input('All');
  /** Pill text for several values; `{count}` is replaced. */
  readonly countLabel = input('{count} selected');
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Emits after every change, with the new single value or values. */
  readonly changed = output<T | null | readonly T[]>();

  readonly open = signal(false);

  protected readonly all = ALL;
  protected readonly positions = SELECT_PANEL_POSITIONS;
  protected readonly listboxId = uniqueId('ui-filter-pill-listbox');

  private readonly chosen = computed<readonly T[]>(() => {
    if (this.multiple()) return this.values();
    const value = this.value();
    return value === null || value === undefined ? [] : [value];
  });
  protected readonly active = computed(() => this.chosen().length > 0);
  protected readonly listboxValue = computed<readonly Row<T>[]>(() =>
    this.chosen().length ? this.chosen() : [ALL],
  );
  protected readonly summary = computed(() => {
    const chosen = this.chosen();
    if (chosen.length === 0) return this.allLabel();
    if (chosen.length > 1) return this.countLabel().replace('{count}', String(chosen.length));
    return this.options().find((option) => Object.is(option.value, chosen[0]))?.label ?? '';
  });

  private readonly formDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly listbox = viewChild(CdkListbox);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);

  private onChange: (value: T | null | readonly T[]) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  /** Moves focus to the pill. */
  focus(options?: FocusOptions): void {
    this.trigger().nativeElement.focus(options);
  }

  /** Opens the list and moves focus to the chosen (or first) row. */
  openPanel(): void {
    if (this.isDisabled() || this.open()) return;
    this.open.set(true);
    afterNextRender(() => this.listbox()?.focus(), { injector: this.injector });
  }

  /** Closes the list; by default focus returns to the pill. */
  close(restoreFocus = true): void {
    if (!this.open()) return;
    this.open.set(false);
    this.onTouched();
    if (restoreFocus) this.focus();
  }

  toggle(): void {
    if (this.open()) this.close();
    else this.openPanel();
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault();
      this.openPanel();
    }
  }

  protected onPanelKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.close();
    } else if (event.key === 'Tab') {
      this.close();
    } else if (event.key === 'Enter' || event.key === ' ') {
      this.afterChoice();
    }
  }

  protected onOutsideClick(event: MouseEvent): void {
    if (!this.host.contains(event.target as Node)) this.close(false);
  }

  protected onListboxChange(event: ListboxValueChangeEvent<Row<T>>): void {
    if (!event.option) return;
    const picked = event.option.value;
    if (this.multiple()) {
      const values =
        picked === ALL ? [] : (event.value.filter((value) => value !== ALL) as readonly T[]);
      this.values.set(values);
      this.notify(values);
    } else {
      const value = picked === ALL ? null : (picked as T);
      this.value.set(value);
      this.notify(value);
    }
  }

  protected onPanelClick(event: MouseEvent): void {
    const option = (event.target as Element).closest('[role="option"]');
    if (option && option.getAttribute('aria-disabled') !== 'true') this.afterChoice();
  }

  /** Single mode closes once the listbox has applied the choice. */
  protected afterChoice(): void {
    if (!this.multiple()) queueMicrotask(() => this.close());
  }

  private notify(value: T | null | readonly T[]): void {
    this.onChange(value);
    this.changed.emit(value);
  }

  /** Forms value: `T | null` in single mode, `T[]` with `multiple`. */
  writeValue(value: unknown): void {
    if (this.multiple()) {
      this.values.set(Array.isArray(value) ? (value as T[]) : []);
    } else {
      this.value.set((value as T | null | undefined) ?? null);
    }
  }

  registerOnChange(fn: (value: T | null | readonly T[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
    if (isDisabled) this.close(false);
  }
}
