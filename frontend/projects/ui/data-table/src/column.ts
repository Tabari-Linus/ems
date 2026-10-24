import {
  booleanAttribute,
  contentChild,
  Directive,
  inject,
  input,
  TemplateRef,
} from '@angular/core';

/** Template context of a cell: the row as `$implicit` (`let-row`), plus its index. */
export interface DataTableCellContext<T = unknown> {
  $implicit: T;
  row: T;
  index: number;
}

/**
 * Body cell template of a column: `<ng-template uiCell let-person>{{ person.name }}</ng-template>`.
 */
@Directive({ selector: 'ng-template[uiCell]' })
export class DataTableCell {
  readonly template = inject<TemplateRef<DataTableCellContext>>(TemplateRef);

  static ngTemplateContextGuard(
    _dir: DataTableCell,
    _ctx: unknown,
    // Rows are whatever the consumer passes; the cell template decides their shape.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): _ctx is DataTableCellContext<any> {
    return true;
  }
}

/** Custom header content: `<ng-template uiHeaderCell>Name</ng-template>` (else `header` text). */
@Directive({ selector: 'ng-template[uiHeaderCell]' })
export class DataTableHeaderCell {
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}

/**
 * Row actions, rendered in a last "Actions" column (and at the end of each card in card mode):
 * `<ng-template uiRowActions let-person><button uiButton …>Edit</button></ng-template>`.
 */
@Directive({ selector: 'ng-template[uiRowActions]' })
export class DataTableRowActions {
  readonly template = inject<TemplateRef<DataTableCellContext>>(TemplateRef);

  static ngTemplateContextGuard(
    _dir: DataTableRowActions,
    _ctx: unknown,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): _ctx is DataTableCellContext<any> {
    return true;
  }
}

/** Content shown instead of rows when there are none: `<div uiTableEmpty>No people yet</div>`. */
@Directive({ selector: '[uiTableEmpty]' })
export class DataTableEmpty {}

/**
 * Column definition, on an `<ng-container>` inside `ui-data-table`:
 *
 * <ng-container uiColumn="name" header="Name" sortable primary>
 *   <ng-template uiCell let-person>{{ person.name }}</ng-template>
 * </ng-container>
 */
@Directive({ selector: '[uiColumn]' })
export class DataTableColumn {
  /** Column id; the value emitted in sort changes. */
  readonly id = input.required<string>({ alias: 'uiColumn' });
  /** Header text (also the label of the value in card mode). */
  readonly header = input('');
  /** Shows the sort button in the header. Sorting itself is up to the consumer. */
  readonly sortable = input(false, { transform: booleanAttribute });
  readonly align = input<'start' | 'end'>('start');
  /** Title of each card in card mode (usually the name column). */
  readonly primary = input(false, { transform: booleanAttribute });
  /** Leave this column out of card mode (e.g. a value already in the card title). */
  readonly hideInCards = input(false, { transform: booleanAttribute });
  /** Visually hide the header text (it stays the column's accessible name). */
  readonly headerHidden = input(false, { transform: booleanAttribute });
  /** CSS width of the column, e.g. '30%' or '12rem'. */
  readonly width = input<string | null>(null);

  readonly cell = contentChild(DataTableCell);
  readonly headerCell = contentChild(DataTableHeaderCell);
}
