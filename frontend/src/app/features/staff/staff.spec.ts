import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { vi, type Mock } from 'vitest';
import { Staff } from './staff';
import { AuthService } from '../../core/services/auth.service';
import { EmployeeService } from '../../core/services/employee.service';
import { PositionService } from '../../core/services/position.service';
import { DepartmentService } from '../../core/services/department.service';
import { AccessLevelService } from '../../core/services/access-level.service';
import { Permission } from '../../core/models/permission.model';
import { EmployeeListItem, EmployeePageResult } from '../../core/models/employee.model';

const PEOPLE: EmployeeListItem[] = [
  {
    id: '7',
    firstName: 'Ama',
    lastName: 'Mensah',
    jobTitle: 'Engineering Manager',
    department: 'Platform Engineering',
    status: 'ACTIVE',
  },
  {
    id: '42',
    firstName: 'Kwame',
    lastName: 'Asante',
    jobTitle: 'Backend Engineer',
    department: 'Platform Engineering',
    status: 'PENDING',
  },
];

function page(
  data: EmployeeListItem[],
  overrides: Partial<EmployeePageResult> = {},
): EmployeePageResult {
  return {
    data,
    currentPage: 0,
    totalPages: 1,
    totalElements: data.length,
    pageSize: 12,
    hasNext: false,
    hasPrevious: false,
    ...overrides,
  };
}

const list = <T>(data: T[]) =>
  of({
    data,
    currentPage: 0,
    totalPages: 1,
    totalElements: data.length,
    pageSize: 20,
    hasNext: false,
    hasPrevious: false,
  });

describe('Staff (People directory)', () => {
  let getEmployees: Mock;
  let createEmployee: Mock;
  let permissions: Permission[];

  async function render(url = '/people') {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url, Staff);
    // Let the getEmployees promise settle and re-render.
    await new Promise((resolve) => setTimeout(resolve));
    harness.detectChanges();
    await harness.fixture.whenStable();
    return { harness, host: harness.routeNativeElement as HTMLElement };
  }

  beforeEach(() => {
    permissions = [Permission.VIEW_EMPLOYEE];
    getEmployees = vi.fn(() => of(page(PEOPLE)));
    createEmployee = vi.fn(() => of({ id: '99', name: 'Esi Quaye' }));

    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'people', component: Staff },
          { path: 'people/:id', children: [] },
        ]),
        {
          provide: AuthService,
          useValue: { hasPermission: (p: Permission) => permissions.includes(p) },
        },
        { provide: EmployeeService, useValue: { getEmployees, createEmployee } },
        {
          provide: PositionService,
          useValue: {
            getPositions: () => list([{ id: 'p1', positionName: 'Designer', level: 'Senior' }]),
          },
        },
        {
          provide: DepartmentService,
          useValue: {
            getDepartments: () =>
              list([{ id: 'd1', departmentName: 'Design', departmentCode: 'DES' }]),
          },
        },
        {
          provide: AccessLevelService,
          useValue: { getAccessLevels: () => list([{ id: 'a1', accessLevelName: 'Employee' }]) },
        },
      ],
    });
  });

  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach((el) => (el.innerHTML = ''));
  });

  it('shows the People title, a live count and one card link per person', async () => {
    const { host } = await render();

    expect(host.querySelector('h1')?.textContent?.trim()).toBe('People');
    expect(host.querySelector('.ui-page-header__count')?.textContent?.trim()).toBe('2 people');
    const links = [...host.querySelectorAll<HTMLAnchorElement>('a.ui-person-card')];
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/people/7', '/people/42']);
    expect(links[0].textContent).toContain('Ama Mensah');
    expect(links[1].textContent).toContain('Pending');
    expect(getEmployees).toHaveBeenCalledWith(
      { search: undefined, status: undefined, departmentId: undefined },
      0,
    );
  });

  it('searches with the q query parameter from the top bar', async () => {
    const { host } = await render('/people?q=kwame');

    expect(getEmployees).toHaveBeenCalledTimes(1);
    expect(getEmployees.mock.calls[0][0].search).toBe('kwame');
    expect(host.querySelector<HTMLInputElement>('input[type="search"]')?.value).toBe('kwame');
  });

  it('reloads and keeps ?q= in the address bar when the search changes', async () => {
    vi.useFakeTimers();
    try {
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl('/people', Staff);
      const input = (harness.routeNativeElement as HTMLElement).querySelector<HTMLInputElement>(
        'input[type="search"]',
      )!;
      input.value = 'ama';
      input.dispatchEvent(new Event('input'));
      await vi.advanceTimersByTimeAsync(500);

      expect(getEmployees).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'ama' }), 0);
      expect(TestBed.inject(Router).url).toBe('/people?q=ama');
      expect(getEmployees).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('filters by status through the existing query', async () => {
    const { harness, host } = await render();
    const pill = host.querySelector<HTMLButtonElement>('button[aria-label="Status: All"]')!;
    pill.click();
    harness.detectChanges();
    const option = [...document.querySelectorAll<HTMLElement>('[role="option"]')].find(
      (o) => o.textContent?.trim() === 'Inactive',
    )!;
    option.click();
    harness.detectChanges();

    expect(getEmployees).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'INACTIVE' }),
      0,
    );
  });

  it('offers a department filter from the departments that exist', async () => {
    const { host } = await render();
    expect(host.querySelector('button[aria-label="Department: All"]')).not.toBeNull();
  });

  it('switches to a list with a data table linking to each profile', async () => {
    const { harness, host } = await render();
    const listRadio = [
      ...host.querySelectorAll<HTMLButtonElement>('ui-view-toggle [role="radio"]'),
    ].find((b) => b.textContent?.includes('List'))!;
    listRadio.click();
    harness.detectChanges();
    await harness.fixture.whenStable();

    const table = host.querySelector('table');
    expect(table).not.toBeNull();
    expect(host.querySelector('a.people-name')?.getAttribute('href')).toBe('/people/7');
  });

  it('invites a first person when the directory is empty and the user can add people', async () => {
    permissions = [Permission.MANAGE_EMPLOYEE];
    getEmployees.mockReturnValue(of(page([])));
    const { host } = await render();

    expect(host.querySelector('.ui-empty-state__heading')?.textContent?.trim()).toBe(
      'No people yet',
    );
    expect(host.querySelector('ui-empty-state button')?.textContent).toContain('Add person');
  });

  it('offers to clear filters when a search matches no one', async () => {
    getEmployees.mockReturnValue(of(page([])));
    const { host } = await render('/people?q=zzz');

    expect(host.querySelector('.ui-empty-state__heading')?.textContent?.trim()).toBe(
      'No one matches',
    );
    expect(host.querySelector('ui-empty-state button')?.textContent).toContain('Clear filters');
  });

  it('shows an error state with a retry when the list fails', async () => {
    getEmployees.mockReturnValueOnce(throwError(() => new Error('Network down.')));
    const { harness, host } = await render();

    expect(host.querySelector('ui-error-state')?.textContent).toContain('Network down.');
    host.querySelector<HTMLButtonElement>('ui-error-state button')!.click();
    await new Promise((resolve) => setTimeout(resolve));
    harness.detectChanges();
    expect(host.querySelectorAll('a.ui-person-card')).toHaveLength(2);
  });

  it('loads the next page with "Load more"', async () => {
    getEmployees
      .mockReturnValueOnce(of(page(PEOPLE.slice(0, 1), { totalElements: 13, hasNext: true })))
      .mockReturnValueOnce(of(page(PEOPLE.slice(1), { currentPage: 1, totalElements: 13 })));
    const { harness, host } = await render();
    expect(host.querySelector('.ui-pagination__summary')?.textContent).toContain(
      'Showing 12 of 13 people',
    );

    host.querySelector<HTMLButtonElement>('ui-pagination button')!.click();
    await new Promise((resolve) => setTimeout(resolve));
    harness.detectChanges();

    expect(getEmployees).toHaveBeenLastCalledWith(expect.anything(), 1);
    expect(host.querySelectorAll('a.ui-person-card')).toHaveLength(2);
  });

  it('hides "Add person" from people without MANAGE_EMPLOYEE', async () => {
    const { host } = await render();
    expect(
      [...host.querySelectorAll('button')].some((b) => b.textContent?.includes('Add person')),
    ).toBe(false);
  });

  it('adds a person from the drawer form', async () => {
    permissions = [Permission.MANAGE_EMPLOYEE];
    const { harness, host } = await render();
    const add = [...host.querySelectorAll<HTMLButtonElement>('ui-page-header button')].find((b) =>
      b.textContent?.includes('Add person'),
    )!;
    add.click();
    harness.detectChanges();
    await harness.fixture.whenStable();

    const drawer = document.querySelector<HTMLElement>('.ui-drawer')!;
    expect(drawer.textContent).toContain('Add person');

    // Submitting empty shows the field errors and does not call the API.
    drawer
      .querySelector<HTMLFormElement>('form')!
      .dispatchEvent(new Event('submit', { cancelable: true }));
    harness.detectChanges();
    expect(createEmployee).not.toHaveBeenCalled();
    expect(drawer.textContent).toContain('Enter their first name');

    const type = (id: string, value: string) => {
      const el = drawer.querySelector<HTMLInputElement>(`#${id}`)!;
      el.value = value;
      el.dispatchEvent(new Event('input'));
    };
    type('staff-add-form-first-name', 'Esi');
    type('staff-add-form-last-name', 'Quaye');
    type('staff-add-form-work-email', 'esi.quaye@akwaabalabs.example');
    harness.detectChanges();
    drawer
      .querySelector<HTMLFormElement>('form')!
      .dispatchEvent(new Event('submit', { cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve));
    harness.detectChanges();

    expect(createEmployee).toHaveBeenCalledWith({
      firstName: 'Esi',
      lastName: 'Quaye',
      workEmail: 'esi.quaye@akwaabalabs.example',
    });
    expect(getEmployees).toHaveBeenCalledTimes(2);
  });

  it('keeps the drawer open with the server message when adding fails', async () => {
    permissions = [Permission.MANAGE_EMPLOYEE];
    createEmployee.mockReturnValue(throwError(() => new Error('Work email is already in use.')));
    const { harness, host } = await render();
    [...host.querySelectorAll<HTMLButtonElement>('ui-page-header button')]
      .find((b) => b.textContent?.includes('Add person'))!
      .click();
    harness.detectChanges();
    const drawer = document.querySelector<HTMLElement>('.ui-drawer')!;
    for (const [id, value] of [
      ['staff-add-form-first-name', 'Esi'],
      ['staff-add-form-last-name', 'Quaye'],
      ['staff-add-form-work-email', 'esi@akwaabalabs.example'],
    ]) {
      const el = drawer.querySelector<HTMLInputElement>(`#${id}`)!;
      el.value = value;
      el.dispatchEvent(new Event('input'));
    }
    drawer
      .querySelector<HTMLFormElement>('form')!
      .dispatchEvent(new Event('submit', { cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve));
    harness.detectChanges();

    expect(document.querySelector('.ui-drawer')?.textContent).toContain(
      'Work email is already in use.',
    );
  });
});
