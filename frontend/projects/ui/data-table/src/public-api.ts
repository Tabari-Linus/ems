/*
 * Public API surface of @ems/ui/data-table.
 */
export {
  DataTableCell,
  DataTableColumn,
  DataTableEmpty,
  DataTableHeaderCell,
  DataTableRowActions,
  type DataTableCellContext,
} from './column';
export {
  DataTable,
  type DataTableMode,
  type DataTableRowEvent,
  type DataTableSort,
  type SortDirection,
} from './data-table';

import {
  DataTableCell,
  DataTableColumn,
  DataTableEmpty,
  DataTableHeaderCell,
  DataTableRowActions,
} from './column';
import { DataTable } from './data-table';

/** Everything a template needs: `imports: [DATA_TABLE]`. */
export const DATA_TABLE = [
  DataTable,
  DataTableColumn,
  DataTableCell,
  DataTableHeaderCell,
  DataTableRowActions,
  DataTableEmpty,
] as const;
