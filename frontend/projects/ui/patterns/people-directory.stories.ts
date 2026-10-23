import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { Card } from '@ems/ui/card';
import { DATA_TABLE, type DataTableSort } from '@ems/ui/data-table';
import { FilterPill } from '@ems/ui/filter-pill';
import { PageHeader } from '@ems/ui/page-header';
import { Pagination } from '@ems/ui/pagination';
import { PersonCard } from '@ems/ui/person-card';
import { StatusPill } from '@ems/ui/status-pill';
import { ViewToggle, type ViewToggleValue } from '@ems/ui/view-toggle';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, waitFor, within } from 'storybook/test';
import { press } from '../testing/keyboard';
import { CHROME_IMPORTS, DEMO_PEOPLE, DEPARTMENTS, OFFICES, STATUSES, shell } from './chrome';

const DIRECTORY = `
  <ui-page-header title="People" [count]="countLabel()">
    <ui-view-toggle uiPageHeaderActions [(view)]="view" />
    <button uiPageHeaderActions uiButton type="button"><ui-icon name="plus" /> Add person</button>
  </ui-page-header>

  <div role="search" aria-label="Filter people" style="display:flex;flex-wrap:wrap;align-items:center;gap:var(--ems-space-3);margin-block-end:var(--ems-space-5)">
    <ui-search-input label="Search people" placeholder="Search by name or employee no." [debounce]="0" [(value)]="query"
      style="flex:1 1 16rem;max-inline-size:20rem" />
    <ui-filter-pill label="Office" [options]="offices" [(value)]="office" />
    <ui-filter-pill label="Department" [options]="departments" [(value)]="department" />
    <ui-filter-pill label="Status" [options]="statuses" [(value)]="status" />
  </div>

  @if (view() === 'grid') {
    <ul aria-label="People" style="list-style:none;margin:0;padding:0;display:grid;gap:var(--ems-space-4);grid-template-columns:repeat(auto-fill,minmax(min(100%,17rem),1fr))">
      @for (p of visible(); track p.employeeNo) {
        <li style="display:grid">
          <a uiPersonCard [href]="'#people/' + p.employeeNo" [name]="p.name" [position]="p.position"
            [department]="p.department" [office]="p.office" [employeeNo]="p.employeeNo" [avatarTint]="p.tint">
            <ui-status-pill uiPersonCardStatus [status]="p.status" />
          </a>
        </li>
      } @empty {
        <li style="padding:var(--ems-space-8) 0;color:var(--ems-color-text-muted);text-align:center">
          No one matches these filters. Clear a filter or search for someone else.
        </li>
      }
    </ul>
  } @else {
    <ui-card flush>
      <ui-data-table caption="People" [rows]="visible()" activatable [(sort)]="sort">
        <ng-container uiColumn="name" header="Name" sortable primary>
          <ng-template uiCell let-p>
            <span style="display:inline-flex;align-items:center;gap:var(--ems-space-3);font-weight:var(--ems-type-body-strong-weight)">
              <ui-avatar [name]="p.name" [tint]="p.tint" size="sm" decorative />{{ p.name }}
            </span>
          </ng-template>
        </ng-container>
        <ng-container uiColumn="position" header="Position">
          <ng-template uiCell let-p>{{ p.position }}</ng-template>
        </ng-container>
        <ng-container uiColumn="department" header="Department" sortable>
          <ng-template uiCell let-p>{{ p.department }} · {{ p.office }}</ng-template>
        </ng-container>
        <ng-container uiColumn="employeeNo" header="Employee no.">
          <ng-template uiCell let-p>
            <span style="color:var(--ems-color-text-secondary);font-family:var(--ems-font-family-mono);font-size:var(--ems-type-mono-size);font-variant-numeric:tabular-nums">{{ p.employeeNo }}</span>
          </ng-template>
        </ng-container>
        <ng-container uiColumn="status" header="Status">
          <ng-template uiCell let-p><ui-status-pill [status]="p.status" /></ng-template>
        </ng-container>
      </ui-data-table>
      <ui-pagination uiCardFooter [page]="1" [pageSize]="20" [total]="visible().length" itemLabel="people" />
    </ui-card>
  }`;

/** The People directory (direction-d screen 3), composed from @ems/ui with demo data. */
@Component({
  selector: 'ui-demo-people-page',
  imports: [
    ...CHROME_IMPORTS,
    Card,
    ...DATA_TABLE,
    FilterPill,
    PageHeader,
    Pagination,
    PersonCard,
    StatusPill,
    ViewToggle,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: shell('people', DIRECTORY, { collapsible: false }),
})
class PeoplePage {
  readonly initialView = input<ViewToggleValue>('grid');

  protected readonly offices = OFFICES;
  protected readonly departments = DEPARTMENTS;
  protected readonly statuses = STATUSES;

  protected readonly view = linkedSignal(() => this.initialView());
  protected readonly query = signal('');
  protected readonly office = signal<string | null>(null);
  protected readonly department = signal<string | null>(null);
  protected readonly status = signal<string | null>(null);
  protected readonly sort = signal<DataTableSort | null>({ column: 'name', direction: 'asc' });

  protected readonly visible = computed(() => {
    const q = this.query().trim().toLocaleLowerCase();
    const rows = DEMO_PEOPLE.filter(
      (p) =>
        (!q || p.name.toLocaleLowerCase().includes(q) || p.employeeNo.toLowerCase().includes(q)) &&
        (!this.office() || p.office === this.office()) &&
        (!this.department() || p.department === this.department()) &&
        (!this.status() || p.status === this.status()),
    );
    const sort = this.sort();
    if (this.view() === 'list' && sort) {
      const key = sort.column as 'name' | 'department';
      const dir = sort.direction === 'asc' ? 1 : -1;
      return [...rows].sort((a, b) => a[key].localeCompare(b[key]) * dir);
    }
    return rows;
  });
  protected readonly countLabel = computed(() => {
    const n = this.visible().length;
    return `${n} ${n === 1 ? 'person' : 'people'}`;
  });
}

const meta: Meta<{ view: ViewToggleValue }> = {
  title: 'Patterns/People directory',
  decorators: [moduleMetadata({ imports: [PeoplePage] })],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The **People directory** (direction-d, screen 3): faces first, then role, department, office,
employee number and status. Grid by default, list (\`ui-data-table\`) on demand.

Built only from @ems/ui: \`ui-app-shell\`, \`ui-page-header\` (title + live count) with
\`ui-view-toggle\` and the one primary action, \`ui-search-input\` and three \`ui-filter-pill\`s (they
really filter the demo data), \`a[uiPersonCard]\` with \`ui-status-pill\`, and in list view
\`ui-card flush\` + \`ui-data-table\` + \`ui-pagination\`.
`,
      },
    },
  },
  render: (args) => ({
    props: args,
    template: '<ui-demo-people-page [initialView]="view" />',
  }),
};

export default meta;
type Story = StoryObj<{ view: ViewToggleValue }>;

export const Grid: Story = {
  args: { view: 'grid' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 1, name: 'People' })).toBeVisible();
    await expect(canvas.getByText('9 people')).toBeVisible();
    await expect(canvas.getByRole('link', { name: /^Kwame Asante/ })).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'People' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  },
};

export const List: Story = {
  args: { view: 'list' },
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByRole('table', { name: 'People' })).toBeVisible());
    await expect(canvas.getAllByRole('row')).toHaveLength(10);
  },
};

export const Filtered: Story = {
  name: 'Filter by office (keyboard)',
  args: { view: 'grid' },
  play: async ({ canvas, userEvent }) => {
    const body = within(document.body);
    const pill = canvas.getByRole('button', { name: 'Office: All' });
    pill.focus();
    await userEvent.keyboard('{Enter}');
    await body.findByRole('listbox', { name: 'Office' });
    await waitFor(() => expect(body.getByRole('option', { name: 'All' })).toHaveFocus());
    press('ArrowDown');
    press('ArrowDown');
    await waitFor(() => expect(body.getByRole('option', { name: 'Kumasi' })).toHaveFocus());
    press('Enter');
    await waitFor(() => expect(canvas.getByText('2 people')).toBeVisible());
    await expect(canvas.getByRole('button', { name: 'Office: Kumasi' })).toHaveFocus();
  },
};
