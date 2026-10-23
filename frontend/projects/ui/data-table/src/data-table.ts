import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  contentChildren,
  DestroyRef,
  ElementRef,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import {
  DataTableColumn,
  DataTableEmpty,
  DataTableRowActions,
  type DataTableCellContext,
} from './column';

export type SortDirection = 'asc' | 'desc';

export interface DataTableSort {
  column: string;
  direction: SortDirection;
}

export interface DataTableRowEvent<T = unknown> {
  row: T;
  index: number;
}

export type DataTableMode = 'auto' | 'table' | 'cards';

/** Elements inside a row that handle their own clicks/keys (row activation ignores them). */
const INTERACTIVE =
  'a, button, input, select, textarea, label, summary, [role="button"], [tabindex]';

let nextId = 0;

/**
 * Data table on a native `<table>` with column templates, sortable headers, row activation,
 * row actions, loading skeleton, empty state, sticky header and a card layout for narrow widths.
 *
 * Columns are declared with `uiColumn` on `<ng-container>`s holding a `uiCell` template
 * (and optionally `uiHeaderCell`). The table never sorts data itself: clicking a sortable
 * header updates `sort` (two-way) and emits `sortChange`; apply it in your query.
 *
 * Accessibility:
 * - `caption` names the table (visually hidden unless `showCaption`); in card mode it names the list.
 * - Sorted header: `aria-sort="ascending|descending"`; the sort control is a real `<button>`.
 * - `activatable` rows are focusable (Tab), activate with Enter/Space or click, and emit
 *   `rowActivate`. Clicks on links/buttons inside the row (e.g. row actions) are left alone.
 *   Also give each row a real link to the detail page where one exists.
 * - While `loading`, the table is `aria-busy` and a polite status says `loadingLabel`.
 *
 * Put it in `<ui-card flush>` for the surface; the table itself is transparent.
 */
@Component({
  selector: 'ui-data-table',
  exportAs: 'uiDataTable',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './data-table.html',
  styleUrl: './data-table.css',
  host: {
    class: 'ui-data-table',
    '[attr.data-mode]': 'resolvedMode()',
    '[attr.data-sticky]': 'stickyHeader() ? "" : null',
  },
})
export class DataTable<T = unknown> {
  readonly rows = input<readonly T[] | null | undefined>([]);
  /** Accessible name of the table (and of the list in card mode). */
  readonly caption = input.required<string>();
  /** Show the caption visually (it is always available to screen readers). */
  readonly showCaption = input(false, { transform: booleanAttribute });
  /** Row identity for re-rendering. Defaults to the row object itself. */
  readonly trackBy = input<(index: number, row: T) => unknown>((_index, row) => row);
  /** Current sort (two-way: `[(sort)]`). */
  readonly sort = model<DataTableSort | null>(null);
  readonly loading = input(false, { transform: booleanAttribute });
  readonly loadingLabel = input('Loading');
  /** Placeholder rows while loading. */
  readonly skeletonRows = input(5, { transform: numberAttribute });
  /** Rows are focusable and emit `rowActivate` on click, Enter or Space. */
  readonly activatable = input(false, { transform: booleanAttribute });
  /** `auto` switches to cards below `cardBreakpoint` (px of the table's own width). */
  readonly mode = input<DataTableMode>('auto');
  readonly cardBreakpoint = input(640, { transform: numberAttribute });
  /** Keep the header row visible while the table's scroll area scrolls. */
  readonly stickyHeader = input(true, { transform: booleanAttribute });
  /** Max height of the scroll area (CSS length); set it to scroll rows under a sticky header.
   * The scroll area then becomes a focusable, named region so keyboard users can scroll it. */
  readonly maxHeight = input<string | null>(null);
  /** Header text of the row actions column (visually hidden). */
  readonly actionsLabel = input('Actions');
  /** Shown when there are no rows and no `[uiTableEmpty]` content. */
  readonly emptyText = input('Nothing to show yet.');

  readonly rowActivate = output<DataTableRowEvent<T>>();

  protected readonly columns = contentChildren(DataTableColumn);
  protected readonly rowActions = contentChild(DataTableRowActions);
  protected readonly emptySlot = contentChild(DataTableEmpty);

  protected readonly captionId = `ui-data-table-caption-${nextId++}`;
  private readonly narrow = signal(false);

  readonly resolvedMode = computed<'table' | 'cards'>(() => {
    const mode = this.mode();
    if (mode !== 'auto') {
      return mode;
    }
    return this.narrow() ? 'cards' : 'table';
  });

  protected readonly rowList = computed(() => this.rows() ?? []);
  protected readonly isEmpty = computed(() => !this.loading() && this.rowList().length === 0);
  protected readonly columnCount = computed(
    () => this.columns().length + (this.rowActions() ? 1 : 0),
  );
  protected readonly skeleton = computed(() =>
    Array.from({ length: Math.max(1, this.skeletonRows()) }, (_, i) => i),
  );
  protected readonly primaryColumn = computed(
    () => this.columns().find((c) => c.primary()) ?? this.columns()[0],
  );
  protected readonly cardColumns = computed(() => {
    const primary = this.primaryColumn();
    return this.columns().filter((c) => c !== primary && !c.hideInCards());
  });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const view = this.host.ownerDocument.defaultView;
      if (!view || typeof view.ResizeObserver !== 'function') {
        return;
      }
      const observer = new view.ResizeObserver((entries) => {
        const width = entries[entries.length - 1]?.contentRect.width ?? 0;
        this.narrow.set(width > 0 && width < this.cardBreakpoint());
      });
      observer.observe(this.host);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  protected cellContext(row: T, index: number): DataTableCellContext<T> {
    return { $implicit: row, row, index };
  }

  protected ariaSort(column: DataTableColumn): 'ascending' | 'descending' | null {
    const sort = this.sort();
    if (!column.sortable() || !sort || sort.column !== column.id()) {
      return null;
    }
    return sort.direction === 'asc' ? 'ascending' : 'descending';
  }

  /** Sort by a column: a new column starts ascending, the current one toggles direction. */
  toggleSort(columnId: string): void {
    const current = this.sort();
    const direction: SortDirection =
      current?.column === columnId && current.direction === 'asc' ? 'desc' : 'asc';
    this.sort.set({ column: columnId, direction });
  }

  protected onRowClick(event: MouseEvent, row: T, index: number): void {
    if (!this.activatable() || this.fromInteractiveChild(event)) {
      return;
    }
    this.rowActivate.emit({ row, index });
  }

  protected onRowKeydown(event: KeyboardEvent, row: T, index: number): void {
    if (!this.activatable() || event.target !== event.currentTarget) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.rowActivate.emit({ row, index });
    }
  }

  private fromInteractiveChild(event: Event): boolean {
    const target = event.target as Element | null;
    const row = event.currentTarget as Element | null;
    const interactive = target?.closest(INTERACTIVE);
    return !!interactive && interactive !== row && !!row?.contains(interactive);
  }
}
