import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  DataTableCell,
  DataTableColumn,
  DataTableEmpty,
  DataTableHeaderCell,
  DataTableRowActions,
} from './column';
import {
  DataTable,
  type DataTableMode,
  type DataTableRowEvent,
  type DataTableSort,
} from './data-table';
import { press } from '../../testing/keyboard';

interface Person {
  name: string;
  office: string;
}

const PEOPLE: Person[] = [
  { name: 'Ama Mensah', office: 'Accra' },
  { name: 'Kofi Owusu', office: 'Kumasi' },
];

@Component({
  imports: [
    DataTable,
    DataTableColumn,
    DataTableCell,
    DataTableHeaderCell,
    DataTableRowActions,
    DataTableEmpty,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-data-table
      caption="People"
      [rows]="rows()"
      [loading]="loading()"
      [activatable]="activatable()"
      [mode]="mode()"
      [maxHeight]="maxHeight()"
      [showCaption]="showCaption()"
      [skeletonRows]="2"
      [(sort)]="sort"
      (rowActivate)="activated.set($event)"
    >
      <ng-container uiColumn="name" header="Name" sortable primary width="40%">
        <ng-template uiCell let-p>{{ p.name }}</ng-template>
      </ng-container>
      <ng-container uiColumn="office" header="Office" align="end">
        <ng-template uiHeaderCell><em>Office</em></ng-template>
        <ng-template uiCell let-p let-i="index">{{ p.office }} #{{ i }}</ng-template>
      </ng-container>
      <ng-container uiColumn="secret" header="Hidden" headerHidden hideInCards>
        <ng-template uiCell>x</ng-template>
      </ng-container>
      <ng-container uiColumn="nocell" header="No cell" />
      @if (withActions()) {
        <ng-template uiRowActions let-p>
          <button type="button" (click)="edited.set(p.name)">Edit</button>
        </ng-template>
      }
      @if (withEmpty()) {
        <p uiTableEmpty>No people match these filters</p>
      }
    </ui-data-table>
  `,
})
class Host {
  readonly rows = signal<Person[] | null>(PEOPLE);
  readonly loading = signal(false);
  readonly activatable = signal(true);
  readonly mode = signal<DataTableMode>('table');
  readonly maxHeight = signal<string | null>(null);
  readonly showCaption = signal(false);
  readonly withActions = signal(true);
  readonly withEmpty = signal(true);
  readonly sort = signal<DataTableSort | null>(null);
  readonly activated = signal<DataTableRowEvent<unknown> | null>(null);
  readonly edited = signal<string | null>(null);
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const root = fixture.nativeElement as HTMLElement;
  const el = root.querySelector('ui-data-table') as HTMLElement;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const update = async (change: (h: Host) => void) => {
    change(fixture.componentInstance);
    await settle();
  };
  const key = (target: Element, k: string) => press(k, target);
  return { fixture, el, settle, update, key, host: fixture.componentInstance };
}

describe('DataTable (table mode)', () => {
  it('renders caption, headers and cells from templates', async () => {
    const { el } = await setup();
    const caption = el.querySelector('caption') as HTMLElement;
    expect(caption.textContent?.trim()).toBe('People');
    expect(caption.classList).toContain('ui-visually-hidden');
    const headers = Array.from(el.querySelectorAll('th'));
    expect(headers.map((h) => h.getAttribute('scope'))).toEqual([
      'col',
      'col',
      'col',
      'col',
      'col',
    ]);
    expect(headers[0].querySelector('button')?.textContent?.trim()).toBe('Name');
    expect(headers[0].style.inlineSize).toBe('40%');
    expect(headers[1].querySelector('em')).not.toBeNull();
    expect(headers[1].dataset['align']).toBe('end');
    expect(headers[2].querySelector('.ui-visually-hidden')?.textContent?.trim()).toBe('Hidden');
    expect(headers[4].textContent?.trim()).toBe('Actions');
    const cells = Array.from(el.querySelectorAll('tbody tr:first-child td'));
    expect(cells[0].textContent?.trim()).toBe('Ama Mensah');
    expect(cells[1].textContent?.trim()).toBe('Accra #0');
    expect(cells[3].textContent?.trim()).toBe('');
    expect(el.querySelector('.ui-data-table__scroll')?.hasAttribute('tabindex')).toBe(false);
  });

  it('sorts: new column ascending, same column toggles, aria-sort follows', async () => {
    const { el, settle, host } = await setup();
    const sortButton = () => el.querySelector('th button') as HTMLButtonElement;
    const nameHeader = () => el.querySelector('th') as HTMLElement;
    expect(nameHeader().hasAttribute('aria-sort')).toBe(false);
    expect(sortButton().dataset['sort']).toBe('none');

    sortButton().click();
    await settle();
    expect(host.sort()).toEqual({ column: 'name', direction: 'asc' });
    expect(nameHeader().getAttribute('aria-sort')).toBe('ascending');

    sortButton().click();
    await settle();
    expect(host.sort()).toEqual({ column: 'name', direction: 'desc' });
    expect(nameHeader().getAttribute('aria-sort')).toBe('descending');

    host.sort.set({ column: 'office', direction: 'asc' });
    await settle();
    expect(nameHeader().hasAttribute('aria-sort')).toBe(false);
    sortButton().click();
    await settle();
    expect(host.sort()).toEqual({ column: 'name', direction: 'asc' });
  });

  it('activates rows by click, Enter and Space, but not from inner controls', async () => {
    const { el, key, host, update } = await setup();
    const row = el.querySelectorAll('tbody tr')[1] as HTMLElement;
    expect(row.getAttribute('tabindex')).toBe('0');

    (row.querySelector('td') as HTMLElement).click();
    expect(host.activated()).toEqual({ row: PEOPLE[1], index: 1 });

    host.activated.set(null);
    expect(key(row, 'Enter').defaultPrevented).toBe(true);
    expect(host.activated()?.index).toBe(1);
    host.activated.set(null);
    key(row, ' ');
    expect(host.activated()?.index).toBe(1);

    host.activated.set(null);
    expect(key(row, 'a').defaultPrevented).toBe(false);
    (row.querySelector('button') as HTMLButtonElement).click();
    key(row.querySelector('button') as HTMLButtonElement, 'Enter');
    expect(host.activated()).toBeNull();
    expect(host.edited()).toBe('Kofi Owusu');

    await update((h) => h.activatable.set(false));
    expect(row.hasAttribute('tabindex')).toBe(false);
    (row.querySelector('td') as HTMLElement).click();
    key(row, 'Enter');
    expect(host.activated()).toBeNull();
  });

  it('shows skeleton rows and a status while loading', async () => {
    const { el, update } = await setup();
    await update((h) => h.loading.set(true));
    expect(el.querySelector('table')?.getAttribute('aria-busy')).toBe('true');
    expect(el.querySelectorAll('.ui-data-table__skeleton-row')).toHaveLength(2);
    expect(el.querySelector('[role="status"]')?.textContent).toBe('Loading');
  });

  it('shows projected empty content, or the default text', async () => {
    const { el, update } = await setup();
    await update((h) => h.rows.set([]));
    const cell = el.querySelector('.ui-data-table__empty-row td') as HTMLElement;
    expect(cell.getAttribute('colspan')).toBe('5');
    expect(cell.textContent).toContain('No people match these filters');

    await update((h) => {
      h.withEmpty.set(false);
      h.withActions.set(false);
      h.rows.set(null);
    });
    expect(el.querySelector('.ui-data-table__empty-text')?.textContent).toBe(
      'Nothing to show yet.',
    );
    expect(el.querySelector('.ui-data-table__empty-row td')?.getAttribute('colspan')).toBe('4');
  });

  it('makes a height-limited scroll area a focusable named region and can show the caption', async () => {
    const { el, update } = await setup();
    await update((h) => {
      h.maxHeight.set('240px');
      h.showCaption.set(true);
    });
    const scroll = el.querySelector('.ui-data-table__scroll') as HTMLElement;
    expect(scroll.getAttribute('tabindex')).toBe('0');
    expect(scroll.getAttribute('role')).toBe('region');
    expect(scroll.getAttribute('aria-label')).toBe('People');
    expect(scroll.style.maxBlockSize).toBe('240px');
    expect(el.querySelector('caption')?.classList).not.toContain('ui-visually-hidden');
  });
});

describe('DataTable (card mode)', () => {
  it('renders a labelled list of cards titled by the primary column', async () => {
    const { el, update, key, host } = await setup();
    await update((h) => {
      h.mode.set('cards');
      h.showCaption.set(true);
    });
    expect(el.dataset['mode']).toBe('cards');
    expect(el.querySelector('table')).toBeNull();
    expect(el.querySelector('p.ui-data-table__caption')?.textContent).toBe('People');
    const list = el.querySelector('ul') as HTMLElement;
    expect(list.getAttribute('aria-label')).toBe('People');
    const cards = el.querySelectorAll('li');
    expect(cards).toHaveLength(2);
    expect(cards[0].querySelector('.ui-data-table__card-title')?.textContent?.trim()).toBe(
      'Ama Mensah',
    );
    const labels = Array.from(cards[0].querySelectorAll('dt')).map((d) => d.textContent);
    expect(labels).toEqual(['Office', 'No cell']);
    expect(cards[0].querySelector('.ui-data-table__card-actions button')).not.toBeNull();

    key(cards[1], 'Enter');
    expect(host.activated()?.index).toBe(1);
  });

  it('shows skeleton cards and the empty state', async () => {
    const { el, update } = await setup();
    await update((h) => {
      h.mode.set('cards');
      h.loading.set(true);
    });
    expect(el.querySelector('ul')?.getAttribute('aria-busy')).toBe('true');
    await update((h) => {
      h.loading.set(false);
      h.rows.set([]);
    });
    expect(el.querySelector('.ui-data-table__cards-empty')?.textContent).toContain(
      'No people match',
    );
  });

  it('switches automatically below the breakpoint (ResizeObserver)', async () => {
    let callback: ((entries: { contentRect: { width: number } }[]) => void) | undefined;
    const disconnect = vi.fn();
    class FakeObserver {
      constructor(cb: typeof callback) {
        callback = cb;
      }
      observe = vi.fn();
      disconnect = disconnect;
    }
    vi.stubGlobal('ResizeObserver', FakeObserver);
    const { el, update, settle, fixture } = await setup();
    await update((h) => h.mode.set('auto'));
    expect(el.dataset['mode']).toBe('table');
    callback?.([{ contentRect: { width: 400 } }]);
    await settle();
    expect(el.dataset['mode']).toBe('cards');
    callback?.([{ contentRect: { width: 900 } }]);
    await settle();
    expect(el.dataset['mode']).toBe('table');
    callback?.([]);
    await settle();
    expect(el.dataset['mode']).toBe('table');
    fixture.destroy();
    expect(disconnect).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
