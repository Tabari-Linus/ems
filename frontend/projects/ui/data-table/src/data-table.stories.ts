import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fn, waitFor } from 'storybook/test';
import { Avatar } from '@ems/ui/avatar';
import { Button } from '@ems/ui/button';
import { Card } from '@ems/ui/card';
import {
  DataTable,
  type DataTableMode,
  type DataTableRowEvent,
  type DataTableSort,
} from './data-table';
import {
  DataTableCell,
  DataTableColumn,
  DataTableEmpty,
  DataTableHeaderCell,
  DataTableRowActions,
} from './column';

interface Person {
  name: string;
  position: string;
  department: string;
  office: string;
  employeeNo: string;
  hired: string;
}

const PEOPLE: Person[] = [
  {
    name: 'Ama Mensah',
    position: 'Engineering Manager',
    department: 'Platform Engineering',
    office: 'Accra',
    employeeNo: 'GH-ACC-0007',
    hired: '2019-08-01',
  },
  {
    name: 'Kwame Asante',
    position: 'Senior Backend Engineer',
    department: 'Platform Engineering',
    office: 'Accra',
    employeeNo: 'GH-ACC-0042',
    hired: '2023-03-14',
  },
  {
    name: 'Efua Boateng',
    position: 'Product Designer',
    department: 'Design',
    office: 'Accra',
    employeeNo: 'GH-ACC-0051',
    hired: '2023-09-04',
  },
  {
    name: 'Kofi Owusu',
    position: 'Data Analyst',
    department: 'Analytics',
    office: 'Kumasi',
    employeeNo: 'GH-KSI-0013',
    hired: '2026-10-19',
  },
  {
    name: 'Abena Darko',
    position: 'HR Business Partner',
    department: 'People Operations',
    office: 'Accra',
    employeeNo: 'GH-ACC-0019',
    hired: '2021-02-15',
  },
];

interface DataTableArgs {
  rows: Person[];
  loading: boolean;
  activatable: boolean;
  mode: DataTableMode;
  sort: DataTableSort | null;
  sortChange: (sort: DataTableSort | null) => void;
  rowActivate: (event: DataTableRowEvent<Person>) => void;
  edit: (person: Person) => void;
}

const TABLE = (extra = '') => `
  <ui-card title="People" [count]="rows.length" flush>
    <ui-data-table caption="People" [rows]="rows" [loading]="loading" [activatable]="activatable"
      [mode]="mode" [(sort)]="sort" (sortChange)="sortChange($event)" (rowActivate)="rowActivate($event)" ${extra}>
      <ng-container uiColumn="name" header="Name" sortable primary>
        <ng-template uiCell let-person>
          <span style="display:inline-flex;align-items:center;gap:10px;font-weight:600">
            <ui-avatar [name]="person.name" [tintKey]="person.department" size="sm" decorative />
            {{ person.name }}
          </span>
        </ng-template>
      </ng-container>
      <ng-container uiColumn="position" header="Position">
        <ng-template uiCell let-person>{{ person.position }}</ng-template>
      </ng-container>
      <ng-container uiColumn="department" header="Department" sortable>
        <ng-template uiCell let-person>{{ person.department }} · {{ person.office }}</ng-template>
      </ng-container>
      <ng-container uiColumn="employeeNo" header="Employee no.">
        <ng-template uiHeaderCell><abbr title="Employee number">Employee no.</abbr></ng-template>
        <ng-template uiCell let-person><span style="font-family:var(--ems-font-family-mono)">{{ person.employeeNo }}</span></ng-template>
      </ng-container>
      <ng-container uiColumn="hired" header="Date hired" sortable align="end">
        <ng-template uiCell let-person><span style="font-family:var(--ems-font-family-mono)">{{ person.hired }}</span></ng-template>
      </ng-container>
      <ng-template uiRowActions let-person>
        <button uiButton variant="ghost" size="sm" type="button" (click)="edit(person)">Edit<span class="ui-visually-hidden"> {{ person.name }}</span></button>
      </ng-template>
      <div uiTableEmpty>
        <p style="margin:0 0 4px;font-weight:600">No people match these filters</p>
        <p style="margin:0;color:var(--ems-color-text-muted)">Clear a filter or add a person.</p>
      </div>
    </ui-data-table>
  </ui-card>`;

const meta: Meta<DataTableArgs> = {
  title: 'Data display/Data table',
  component: DataTable,
  decorators: [
    moduleMetadata({
      imports: [
        DataTable,
        DataTableColumn,
        DataTableCell,
        DataTableHeaderCell,
        DataTableRowActions,
        DataTableEmpty,
        Card,
        Avatar,
        Button,
      ],
    }),
  ],
  args: {
    rows: PEOPLE,
    loading: false,
    activatable: true,
    mode: 'auto',
    sort: { column: 'name', direction: 'asc' },
    sortChange: fn(),
    rowActivate: fn(),
    edit: fn(),
  },
  argTypes: {
    mode: { control: 'inline-radio', options: ['auto', 'table', 'cards'] },
    sortChange: { action: 'sortChange', table: { disable: true } },
    rowActivate: { action: 'rowActivate', table: { disable: true } },
    edit: { action: 'edit', table: { disable: true } },
  },
  render: (args) => ({ props: args, template: TABLE() }),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Native \`<table>\` with column templates. Declare columns with \`<ng-container uiColumn="id" header="…">\`
holding an \`<ng-template uiCell let-row>\`; optional \`uiHeaderCell\`, \`uiRowActions\` and \`[uiTableEmpty]\`.
Import \`DATA_TABLE\` for all of them.

- **Sorting UI only**: sortable headers are buttons; the sorted one has \`aria-sort\`. Clicking updates
  \`[(sort)]\` / \`sortChange\` (new column ascending, same column toggles). Sort the data yourself.
- **Rows**: \`activatable\` rows take focus and emit \`rowActivate\` on click, Enter or Space; clicks on
  buttons/links inside the row (row actions) don't activate it.
- **Loading** shows skeleton rows, \`aria-busy\`, and announces "Loading".
- **Card mode** below \`cardBreakpoint\` (640px of the table's own width) or with \`mode="cards"\`: a list
  of cards titled by the \`primary\` column.
- **Sticky header** within the table's scroll area; set \`maxHeight\` to scroll rows under it.
- Put it in \`<ui-card flush>\`.
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<DataTableArgs>;

export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const table = canvas.getByRole('table', { name: 'People' });
    await expect(table).toBeVisible();
    const nameHeader = canvas.getByRole('columnheader', { name: 'Name' });
    await expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');

    // Keyboard: the first sort button, then toggle direction.
    const sortName = canvas.getByRole('button', { name: 'Name' });
    await userEvent.tab();
    await expect(sortName).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
    await expect(args.sortChange).toHaveBeenLastCalledWith({ column: 'name', direction: 'desc' });

    // Another column starts ascending and takes over aria-sort.
    await userEvent.click(canvas.getByRole('button', { name: 'Department' }));
    await expect(canvas.getByRole('columnheader', { name: 'Department' })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
    await expect(nameHeader).not.toHaveAttribute('aria-sort');

    // Rows: Tab to the first row and activate it with Enter, then Space.
    await userEvent.tab();
    await userEvent.tab();
    const firstRow = canvas.getAllByRole('row')[1];
    await expect(firstRow).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(args.rowActivate).toHaveBeenLastCalledWith({ row: PEOPLE[0], index: 0 });
    await userEvent.keyboard(' ');
    await expect(args.rowActivate).toHaveBeenCalledTimes(2);

    // Row actions do not activate the row.
    await userEvent.click(canvas.getByRole('button', { name: 'Edit Kwame Asante' }));
    await expect(args.edit).toHaveBeenCalledWith(PEOPLE[1]);
    await expect(args.rowActivate).toHaveBeenCalledTimes(2);
  },
};

export const Loading: Story = {
  args: { loading: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('table', { name: 'People' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    await expect(canvas.getByRole('status')).toHaveTextContent('Loading');
  },
};

export const Empty: Story = {
  args: { rows: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('No people match these filters')).toBeVisible();
  },
};

export const CardMode: Story = {
  name: 'Card mode',
  args: { mode: 'cards' },
  play: async ({ canvas, userEvent, args }) => {
    await expect(canvas.queryByRole('table')).toBeNull();
    const list = canvas.getByRole('list', { name: 'People' });
    await expect(list).toBeVisible();
    await expect(canvas.getAllByRole('listitem')).toHaveLength(PEOPLE.length);

    await userEvent.tab();
    await expect(canvas.getAllByRole('listitem')[0]).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(args.rowActivate).toHaveBeenLastCalledWith({ row: PEOPLE[0], index: 0 });
  },
};

export const ResponsiveAuto: Story = {
  name: 'Auto card mode (narrow container)',
  render: (args) => ({
    props: args,
    template: `<div style="inline-size:360px">${TABLE()}</div>`,
  }),
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByRole('list', { name: 'People' })).toBeVisible());
    await expect(canvas.queryByRole('table')).toBeNull();
  },
};

export const StickyHeader: Story = {
  name: 'Sticky header (scroll area)',
  args: {
    rows: [...PEOPLE, ...PEOPLE.map((p) => ({ ...p, employeeNo: p.employeeNo + '-B' }))],
    activatable: false,
  },
  render: (args) => ({ props: args, template: TABLE('maxHeight="240px"') }),
};
