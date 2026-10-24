import { type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ToastService } from '@ems/ui/toast';
import {
  provideSettingsServiceMocks,
  settingsServiceMocks,
  type SettingsServiceMocks,
} from '../testing/settings-mocks';
import { SettingsDepartments } from './departments/departments';
import { SettingsOffices } from './offices/offices';
import { SettingsPositions } from './positions/positions';

interface Case {
  name: string;
  component: Type<unknown>;
  add: string;
  service: keyof SettingsServiceMocks;
  create: string;
  editLabel: string;
  fields: Record<string, string>;
  expected: Record<string, unknown>;
  toast: string;
}

const CASES: Case[] = [
  {
    name: 'offices',
    component: SettingsOffices,
    add: 'Add office',
    service: 'offices',
    create: 'createOffice',
    editLabel: 'Edit Accra',
    fields: {
      'offices-office-form-company-id': 'c1',
      'offices-office-form-office-name': 'Tamale',
      'offices-office-form-office-email': 'tamale@akwaabalabs.example',
    },
    expected: {
      companyId: 'c1',
      officeName: 'Tamale',
      officeEmail: 'tamale@akwaabalabs.example',
    },
    toast: 'Office added',
  },
  {
    name: 'departments',
    component: SettingsDepartments,
    add: 'Add department',
    service: 'departments',
    create: 'createDepartment',
    editLabel: 'Edit Platform Engineering',
    fields: {
      'departments-dept-form-office-id': 'o1',
      'departments-dept-form-department-name': 'Design',
      'departments-dept-form-department-email': 'design@akwaabalabs.example',
    },
    expected: {
      officeId: 'o1',
      departmentName: 'Design',
      departmentEmail: 'design@akwaabalabs.example',
    },
    toast: 'Department added',
  },
  {
    name: 'positions',
    component: SettingsPositions,
    add: 'Add position',
    service: 'positions',
    create: 'createPosition',
    editLabel: 'Edit Backend Engineer',
    fields: {
      'positions-position-form-position-name': 'Product Designer',
      'positions-position-form-level': 'MID',
    },
    expected: { positionName: 'Product Designer', level: 'MID' },
    toast: 'Position added',
  },
];

describe.each(CASES)('settings $name tab', (c) => {
  let mocks: SettingsServiceMocks;

  beforeEach(() => {
    mocks = settingsServiceMocks();
    TestBed.configureTestingModule({
      imports: [c.component],
      providers: provideSettingsServiceMocks(mocks),
    });
  });

  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach((el) => (el.innerHTML = ''));
  });

  async function render() {
    const fixture = TestBed.createComponent(c.component);
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('creates from the drawer and confirms with a toast', async () => {
    const { fixture, el } = await render();
    const success = vi.spyOn(TestBed.inject(ToastService), 'success');
    [...el.querySelectorAll<HTMLButtonElement>('ui-page-header button')]
      .find((b) => b.textContent?.includes(c.add))!
      .click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const sheet = document.querySelector<HTMLElement>('[role="dialog"]')!;
    expect(sheet.querySelector('h2')?.textContent?.trim()).toBe(c.add);
    for (const [id, value] of Object.entries(c.fields)) {
      const control = sheet.querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`)!;
      control.value = value;
      control.dispatchEvent(new Event('input'));
      control.dispatchEvent(new Event('change'));
    }
    fixture.detectChanges();
    sheet.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect((mocks[c.service] as Record<string, unknown>)[c.create]).toHaveBeenCalledWith(
      c.expected,
    );
    expect(success).toHaveBeenCalledWith(c.toast);
    fixture.destroy();
  });

  it('opens the edit drawer from the row action', async () => {
    const { fixture, el } = await render();
    el.querySelector<HTMLButtonElement>(`button[aria-label="${c.editLabel}"]`)!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const sheet = document.querySelector<HTMLElement>('[role="dialog"]')!;
    expect(sheet.querySelector('h2')?.textContent?.trim()).toMatch(/^Edit /);
    fixture.destroy();
  });
});
