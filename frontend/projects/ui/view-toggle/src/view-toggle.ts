import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  model,
  viewChildren,
} from '@angular/core';
import { Icon } from '@ems/icons';

export type ViewToggleValue = 'grid' | 'list';

export interface ViewToggleOption {
  value: ViewToggleValue;
  label: string;
}

const DEFAULT_OPTIONS: readonly ViewToggleOption[] = [
  { value: 'grid', label: 'Grid' },
  { value: 'list', label: 'List' },
];

/**
 * Segmented grid/list switch with radio-group semantics (WAI-ARIA APG *Radio Group*):
 * one tab stop; Arrow keys move the selection (wrapping), Space selects the focused option.
 * The chosen view is two-way bindable: `[(view)]` (also emitted as `viewChange`).
 *
 * `iconOnly` hides the labels visually; they stay as the options' accessible names.
 *
 * @example
 * <ui-view-toggle [(view)]="view" />
 */
@Component({
  selector: 'ui-view-toggle',
  imports: [Icon],
  exportAs: 'uiViewToggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (option of options(); track option.value; let i = $index) {
      <button
        #option
        type="button"
        role="radio"
        class="ui-view-toggle__option"
        [attr.aria-checked]="option.value === view()"
        [attr.tabindex]="i === focusIndex() ? 0 : -1"
        (click)="choose(option.value)"
        (keydown)="onKeydown($event, i)"
      >
        <ui-icon [name]="option.value === 'grid' ? 'layout-grid' : 'list'" size="sm" />
        <span [class.ui-visually-hidden]="iconOnly()">{{ option.label }}</span>
      </button>
    }
  `,
  styleUrl: './view-toggle.css',
  host: {
    class: 'ui-view-toggle',
    role: 'radiogroup',
    '[attr.aria-label]': 'label()',
    '[attr.data-icon-only]': 'iconOnly() ? "" : null',
  },
})
export class ViewToggle {
  /** Selected view (two-way: `[(view)]`). */
  readonly view = model<ViewToggleValue>('grid');
  /** Accessible name of the group. */
  readonly label = input('View');
  readonly options = input<readonly ViewToggleOption[]>(DEFAULT_OPTIONS);
  readonly iconOnly = input(false, { transform: booleanAttribute });

  private readonly buttons = viewChildren('option', { read: ElementRef<HTMLButtonElement> });

  /** The checked option is the tab stop (the first one if none is checked). */
  protected readonly focusIndex = computed(() =>
    Math.max(
      0,
      this.options().findIndex((o) => o.value === this.view()),
    ),
  );

  choose(value: ViewToggleValue): void {
    this.view.set(value);
  }

  protected onKeydown(event: KeyboardEvent, index: number): void {
    const count = this.options().length;
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = (index + 1) % count;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = (index - 1 + count) % count;
        break;
      default:
        return;
    }
    event.preventDefault();
    this.choose(this.options()[next].value);
    this.buttons()[next]?.nativeElement.focus();
  }
}
