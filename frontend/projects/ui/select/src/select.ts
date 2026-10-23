import { CdkListbox, CdkOption, type ListboxValueChangeEvent } from '@angular/cdk/listbox';
import {
  CdkConnectedOverlay,
  CdkOverlayOrigin,
  type ConnectedPosition,
} from '@angular/cdk/overlay';
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
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { injectFormFieldControl, uniqueId } from '@ems/ui/form-field';
import type { InputSize } from '@ems/ui/input';
import { Icon } from '@ems/icons';

/** One choice in `ui-select` / `ui-filter-pill`. */
export interface SelectOption<T = unknown> {
  readonly value: T;
  /** Visible text; also used for type-ahead. */
  readonly label: string;
  readonly disabled?: boolean;
}

/** Below the trigger, aligned to its start edge; flips above when there is no room. */
export const SELECT_PANEL_POSITIONS: ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' },
  { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top' },
  { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom' },
];

/**
 * Single select: a trigger button that opens a listbox in an overlay (WAI-ARIA APG
 * *Listbox* in a popup, built on `@angular/cdk/listbox` and `@angular/cdk/overlay`).
 *
 * Keyboard: on the trigger, Enter/Space/ArrowDown/ArrowUp open the list; in the list,
 * ArrowUp/ArrowDown move, Home/End jump, typing jumps to the first matching label (type-ahead),
 * Enter/Space choose and close, Escape closes without choosing, Tab closes and moves on.
 * Focus returns to the trigger on close.
 *
 * - Inside `ui-form-field` the trigger is named "<label> <value>" via `aria-labelledby`.
 *   Standalone, give it `label`.
 * - `clearable` adds a separate "Clear" button while a value is set.
 * - Works with `[(value)]`, `[formField]`, `formControl` and `ngModel` (ControlValueAccessor).
 *
 * For a short, static list in a plain form, `select[uiSelect]` (native) is simpler.
 *
 * @example
 * <ui-form-field label="Office">
 *   <ui-select placeholder="Choose an office" [options]="offices" [(value)]="office" />
 * </ui-form-field>
 */
@Component({
  selector: 'ui-select',
  exportAs: 'uiSelect',
  imports: [CdkListbox, CdkOption, CdkConnectedOverlay, CdkOverlayOrigin, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Select), multi: true }],
  template: `
    <div
      class="ui-select__control"
      cdkOverlayOrigin
      #origin="cdkOverlayOrigin"
      [attr.data-size]="size()"
      [attr.data-invalid]="control.invalid() ? '' : null"
      [attr.data-disabled]="isDisabled() ? '' : null"
      [attr.data-open]="open() ? '' : null"
    >
      <button
        #trigger
        type="button"
        class="ui-select__trigger"
        aria-haspopup="listbox"
        [attr.id]="control.id()"
        [attr.aria-expanded]="open()"
        [attr.aria-controls]="open() ? listboxId : null"
        [attr.aria-labelledby]="control.field ? control.field.labelId + ' ' + valueId : null"
        [attr.aria-label]="control.field || !label() ? null : label() + ', ' + displayText()"
        [attr.aria-describedby]="control.describedBy()"
        [attr.aria-invalid]="control.invalid() ? 'true' : null"
        [attr.aria-required]="control.required() ? 'true' : null"
        [disabled]="isDisabled()"
        (click)="toggle()"
        (keydown)="onTriggerKeydown($event)"
        (blur)="open() ? null : onTouched()"
      >
        <span
          class="ui-select__value"
          [id]="valueId"
          [attr.data-placeholder]="selected() ? null : ''"
          >{{ displayText() }}</span
        >
        <ui-icon class="ui-select__chevron" name="chevron-down" size="sm" />
      </button>
      @if (clearable() && selected() && !isDisabled()) {
        <button
          type="button"
          class="ui-select__clear"
          [attr.aria-label]="clearLabel()"
          (click)="clear()"
        >
          <ui-icon name="x" size="sm" />
        </button>
      }
    </div>

    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="open()"
      [cdkConnectedOverlayPositions]="positions"
      [cdkConnectedOverlayMatchWidth]="true"
      cdkConnectedOverlayPanelClass="ui-select-pane"
      (overlayOutsideClick)="onOutsideClick($event)"
      (detach)="close(false)"
    >
      <div
        class="ui-select__panel"
        cdkListbox
        [id]="listboxId"
        [cdkListboxValue]="selectedValues()"
        [cdkListboxCompareWith]="compareWith()"
        [attr.aria-labelledby]="control.field ? control.field.labelId : null"
        [attr.aria-label]="control.field ? null : label()"
        (cdkListboxValueChange)="onListboxChange($event)"
        [tabindex]="0"
        (keydown)="onPanelKeydown($event)"
        (click)="onPanelClick($event)"
      >
        @for (option of options(); track $index) {
          <div
            class="ui-select__option"
            [cdkOption]="option.value"
            [cdkOptionDisabled]="!!option.disabled"
            [cdkOptionTypeaheadLabel]="option.label"
          >
            <span class="ui-select__option-label">{{ option.label }}</span>
            <ui-icon class="ui-select__check" name="check" size="sm" />
          </div>
        } @empty {
          <div class="ui-select__empty">{{ emptyText() }}</div>
        }
      </div>
    </ng-template>
  `,
  styleUrls: ['./select.css', './listbox-panel.css'],
  host: {
    class: 'ui-select',
  },
})
export class Select<T = unknown> implements ControlValueAccessor {
  /** The choices. */
  readonly options = input<readonly SelectOption<T>[]>([]);
  /** Selected value (`null` when nothing is chosen); two-way bindable. */
  readonly value = model<T | null>(null);
  /** Shown while nothing is chosen ("Choose an office"). */
  readonly placeholder = input('Select');
  /** Accessible name when not inside a `ui-form-field`. */
  readonly label = input('');
  /** Adds a clear button while a value is chosen. */
  readonly clearable = input(false, { transform: booleanAttribute });
  readonly clearLabel = input('Clear selection');
  /** Shown in the list when `options` is empty. */
  readonly emptyText = input('No options');
  readonly size = input<InputSize>('md');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Value equality (e.g. compare objects by id). */
  readonly compareWith = input<(a: T, b: T) => boolean>(Object.is);

  /** Whether the list is showing. */
  readonly open = signal(false);

  protected readonly control = injectFormFieldControl(() => this.invalid(), 'ui-select');
  protected readonly positions = SELECT_PANEL_POSITIONS;
  protected readonly listboxId = uniqueId('ui-select-listbox');
  protected readonly valueId = uniqueId('ui-select-value');

  protected readonly selected = computed(() => {
    const value = this.value();
    if (value === null || value === undefined) return undefined;
    const equals = this.compareWith();
    return this.options().find((option) => equals(option.value, value));
  });
  protected readonly selectedValues = computed<readonly T[]>(() => {
    const selected = this.selected();
    return selected ? [selected.value] : [];
  });
  protected readonly displayText = computed(() => this.selected()?.label ?? this.placeholder());

  private readonly formDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly listbox = viewChild(CdkListbox);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);

  private onChange: (value: T | null) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  /** Moves focus to the trigger. */
  focus(options?: FocusOptions): void {
    this.trigger().nativeElement.focus(options);
  }

  /** Opens the list and moves focus to the selected (or first) option. */
  openPanel(): void {
    if (this.isDisabled() || this.open()) return;
    this.open.set(true);
    afterNextRender(() => this.listbox()?.focus(), { injector: this.injector });
  }

  /** Closes the list; by default focus returns to the trigger. */
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

  /** Clears the value and returns focus to the trigger. */
  clear(): void {
    this.setValue(null);
    this.focus();
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      this.openPanel();
    }
  }

  protected onPanelKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        this.close();
        break;
      case 'Tab':
        // Return focus to the trigger; the browser then moves on from there.
        this.close();
        break;
      case 'Enter':
      case ' ':
        // The listbox selects first (its own keydown handler), then we close.
        this.scheduleClose();
        break;
    }
  }

  protected onOutsideClick(event: MouseEvent): void {
    // A click on our own trigger toggles; let that handler close the list.
    if (!this.host.contains(event.target as Node)) this.close(false);
  }

  protected onListboxChange(event: ListboxValueChangeEvent<T>): void {
    // Single selection: the listbox only reports a change for a newly chosen option.
    this.setValue(event.value[0] ?? null);
  }

  protected onPanelClick(event: MouseEvent): void {
    const option = (event.target as Element).closest('[role="option"]');
    if (option && option.getAttribute('aria-disabled') !== 'true') this.scheduleClose();
  }

  protected scheduleClose(): void {
    queueMicrotask(() => this.close());
  }

  private setValue(value: T | null): void {
    this.value.set(value);
    this.onChange(value);
  }

  writeValue(value: unknown): void {
    this.value.set((value as T | null | undefined) ?? null);
  }

  registerOnChange(fn: (value: T | null) => void): void {
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
