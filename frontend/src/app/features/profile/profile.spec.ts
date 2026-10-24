import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { vi, type Mock } from 'vitest';
import { DialogService } from '@ems/ui/dialog';
import { Profile } from './profile';
import { AuthService } from '../../core/services/auth.service';
import { EmployeeService } from '../../core/services/employee.service';
import { PositionService } from '../../core/services/position.service';
import { DepartmentService } from '../../core/services/department.service';
import { AccessLevelService } from '../../core/services/access-level.service';
import { Permission } from '../../core/models/permission.model';
import { EmployeeDetail } from '../../core/models/employee.model';

const KWAME: EmployeeDetail = {
  id: '42',
  firstName: 'Kwame',
  lastName: 'Asante',
  workEmail: 'kwame.asante@akwaabalabs.example',
  status: 'ACTIVE',
  createdDate: '2023-03-14T09:00:00Z',
  lastModifiedDate: '2026-10-01T09:00:00Z',
  position: { id: 'p1', positionName: 'Backend Engineer', level: 'Senior' },
  department: { id: 'd1', departmentName: 'Platform Engineering', departmentCode: 'PLT' },
  accessLevel: { id: 'a1', accessLevelName: 'Employee' },
  bio: { fullName: 'Kwame Asante', nationality: 'Ghanaian', dateOfBirth: '1994-08-02' },
  contact: { phoneNumbers: ['+233 24 555 0142'], personalEmails: [] },
  addresses: [{ id: 'ad1', street: '14 Oxford St', city: 'Accra', isCurrentAddress: true }],
  identifications: [
    { id: 'i1', identificationNumber: 'GHA-123456789-0', identificationType: 'GHANA_CARD' },
  ],
};

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

const settle = () => new Promise((resolve) => setTimeout(resolve));

describe('Profile', () => {
  let getEmployee: Mock;
  let updateEmployee: Mock;
  let activateEmployee: Mock;
  let deactivateEmployee: Mock;
  let archiveEmployee: Mock;
  let confirm: Mock;
  let permissions: Permission[];

  async function render() {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/people/42', Profile);
    await settle();
    harness.detectChanges();
    await harness.fixture.whenStable();
    return { harness, host: harness.routeNativeElement as HTMLElement };
  }

  const buttonByText = (root: ParentNode, text: string) =>
    [...root.querySelectorAll<HTMLButtonElement>('button')].find((b) =>
      b.textContent?.trim().startsWith(text),
    );

  beforeEach(() => {
    permissions = [Permission.VIEW_EMPLOYEE];
    getEmployee = vi.fn(() => of(KWAME));
    updateEmployee = vi.fn(() => of({ id: '42', name: 'Kwame Asante' }));
    activateEmployee = vi.fn(() => of({ id: '42', name: 'Kwame Asante' }));
    deactivateEmployee = vi.fn(() => of({ id: '42', name: 'Kwame Asante' }));
    archiveEmployee = vi.fn(() => of({ id: '42', name: 'Kwame Asante' }));
    confirm = vi.fn(() => Promise.resolve(true));

    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'people/:id', component: Profile },
          { path: 'people', children: [] },
        ]),
        {
          provide: AuthService,
          useValue: { hasPermission: (p: Permission) => permissions.includes(p) },
        },
        {
          provide: EmployeeService,
          useValue: {
            getEmployee,
            updateEmployee,
            activateEmployee,
            deactivateEmployee,
            archiveEmployee,
          },
        },
        {
          provide: PositionService,
          useValue: {
            getPositions: () => list([{ id: 'p2', positionName: 'Staff Engineer', level: 'Lead' }]),
          },
        },
        {
          provide: DepartmentService,
          useValue: {
            getDepartments: () =>
              list([{ id: 'd2', departmentName: 'Design', departmentCode: 'DES' }]),
          },
        },
        {
          provide: AccessLevelService,
          useValue: { getAccessLevels: () => list([{ id: 'a2', accessLevelName: 'HR admin' }]) },
        },
        { provide: DialogService, useValue: { confirm } },
      ],
    });
  });

  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach((el) => (el.innerHTML = ''));
  });

  it('shows the header card: name, status, position, id and a link back to People', async () => {
    const { host } = await render();

    expect(getEmployee).toHaveBeenCalledWith('42');
    expect(host.querySelector('h1')?.textContent?.trim()).toBe('Kwame Asante');
    expect(host.querySelector('ui-status-pill')?.textContent).toContain('Active');
    expect(host.querySelector('.profile-head__position')?.textContent).toContain(
      'Backend Engineer',
    );
    // The database id is never shown; the employee number takes its place once the API returns it.
    expect(host.querySelector('.profile-header')?.textContent).not.toContain('42');
    expect(host.querySelector('.profile-crumbs a')?.getAttribute('href')).toBe('/people');
  });

  it('opens on Overview with work details, and lists only tabs that have data', async () => {
    const { host } = await render();
    const tabs = [...host.querySelectorAll('[role="tab"]')].map((t) => t.textContent?.trim());
    expect(tabs).toEqual(['Overview', 'Personal', 'Documents']);
    expect(host.querySelector('[role="tab"][aria-selected="true"]')?.textContent?.trim()).toBe(
      'Overview',
    );
    expect(host.textContent).toContain('Platform Engineering');
    expect(host.textContent).toContain('+233 24 555 0142');
  });

  it('drops the Documents tab when there are no ID documents', async () => {
    getEmployee.mockReturnValue(of({ ...KWAME, identifications: [] }));
    const { host } = await render();
    const tabs = [...host.querySelectorAll('[role="tab"]')].map((t) => t.textContent?.trim());
    expect(tabs).toEqual(['Overview', 'Personal']);
  });

  it('is read-only for colleagues: no Manage menu, no Change buttons', async () => {
    const { host } = await render();
    expect(buttonByText(host, 'Manage')).toBeUndefined();
    expect(buttonByText(host, 'Change')).toBeUndefined();
  });

  it('lets a manager change the department inline with Save changes', async () => {
    permissions = [Permission.MANAGE_EMPLOYEE];
    const { harness, host } = await render();

    host.querySelector<HTMLButtonElement>('button[aria-label="Change department"]')!.click();
    await settle();
    harness.detectChanges();
    expect(host.querySelector('ui-select')).not.toBeNull();

    // Choose "Design" in the listbox.
    host.querySelector<HTMLElement>('ui-select .ui-select__trigger')!.click();
    harness.detectChanges();
    await harness.fixture.whenStable();
    const options = [...document.querySelectorAll<HTMLElement>('[role="option"]')];
    expect(options.map((o) => o.textContent?.trim())).toEqual(['No department', 'Design']);
    const option = options[1];
    option.click();
    harness.detectChanges();

    buttonByText(host, 'Save changes')!.click();
    await settle();
    harness.detectChanges();

    expect(updateEmployee).toHaveBeenCalledWith('42', { departmentId: 'd2' });
    expect(getEmployee).toHaveBeenCalledTimes(2);
    expect(host.querySelector('ui-select')).toBeNull();
  });

  it('cancels an inline edit without saving', async () => {
    permissions = [Permission.MANAGE_EMPLOYEE];
    const { harness, host } = await render();
    host.querySelector<HTMLButtonElement>('button[aria-label="Change position"]')!.click();
    await settle();
    harness.detectChanges();
    buttonByText(host, 'Cancel')!.click();
    harness.detectChanges();

    expect(updateEmployee).not.toHaveBeenCalled();
    expect(host.querySelector('ui-select')).toBeNull();
  });

  it('shows the server message when an inline save fails', async () => {
    permissions = [Permission.MANAGE_EMPLOYEE];
    updateEmployee.mockReturnValue(throwError(() => new Error('Access level is locked.')));
    const { harness, host } = await render();
    host.querySelector<HTMLButtonElement>('button[aria-label="Change access level"]')!.click();
    await settle();
    harness.detectChanges();
    buttonByText(host, 'Save changes')!.click();
    await settle();
    harness.detectChanges();

    expect(updateEmployee).toHaveBeenCalledWith('42', { accessLevelId: 'a1' });
    expect(host.querySelector('[role="alert"]')?.textContent).toContain('Access level is locked.');
  });

  it('puts lifecycle actions in a Manage menu, confirmed before they run', async () => {
    permissions = [Permission.MANAGE_EMPLOYEE];
    const { harness, host } = await render();

    buttonByText(host, 'Manage')!.click();
    harness.detectChanges();
    const items = [...document.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')];
    expect(items.map((i) => i.textContent?.trim())).toEqual(['Deactivate', 'Archive']);

    items[0].click();
    await settle();
    harness.detectChanges();
    expect(confirm).toHaveBeenCalledWith(
      expect.objectContaining({ heading: 'Deactivate Kwame Asante?', destructive: true }),
    );
    expect(deactivateEmployee).toHaveBeenCalledWith('42');
  });

  it('does nothing when the confirmation is cancelled', async () => {
    permissions = [Permission.MANAGE_EMPLOYEE];
    confirm.mockResolvedValue(false);
    const { harness, host } = await render();
    buttonByText(host, 'Manage')!.click();
    harness.detectChanges();
    [...document.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')]
      .find((i) => i.textContent?.includes('Archive'))!
      .click();
    await settle();

    expect(confirm).toHaveBeenCalled();
    expect(archiveEmployee).not.toHaveBeenCalled();
  });

  it('offers Activate for someone who is not active, and reports a failure', async () => {
    permissions = [Permission.MANAGE_EMPLOYEE];
    getEmployee.mockReturnValue(of({ ...KWAME, status: 'INACTIVE' }));
    activateEmployee.mockReturnValue(throwError(() => new Error('Activation is not allowed.')));
    const { harness, host } = await render();
    buttonByText(host, 'Manage')!.click();
    harness.detectChanges();
    [...document.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')]
      .find((i) => i.textContent?.includes('Activate'))!
      .click();
    await settle();
    harness.detectChanges();

    expect(activateEmployee).toHaveBeenCalledWith('42');
    expect(host.querySelector('ui-alert')?.textContent).toContain('Activation is not allowed.');
  });

  it('shows a not-found state with a way back when there is no such person', async () => {
    getEmployee.mockReturnValue(of(null));
    const { host } = await render();
    expect(host.querySelector('ui-error-state')?.textContent).toContain(
      "We can't find this person",
    );
    expect(host.querySelector('ui-error-state a')?.getAttribute('href')).toBe('/people');
  });

  it('shows the error with a retry when loading fails', async () => {
    getEmployee.mockReturnValueOnce(
      throwError(() => new Error('Employee not found or access denied.')),
    );
    const { harness, host } = await render();
    expect(host.querySelector('ui-error-state')?.textContent).toContain(
      'Employee not found or access denied.',
    );

    buttonByText(host, 'Try again')!.click();
    await settle();
    harness.detectChanges();
    expect(host.querySelector('h1')?.textContent?.trim()).toBe('Kwame Asante');
  });
});
