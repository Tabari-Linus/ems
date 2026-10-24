import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Permission } from '../../../../core/models/permission.model';
import {
  provideSettingsServiceMocks,
  settingsServiceMocks,
  type SettingsServiceMocks,
} from '../../testing/settings-mocks';
import { SettingsAccessLevels } from './access-levels';

describe('SettingsAccessLevels permission matrix', () => {
  let mocks: SettingsServiceMocks;
  let fixture: ComponentFixture<SettingsAccessLevels>;

  async function openCreate(): Promise<HTMLElement> {
    TestBed.configureTestingModule({
      imports: [SettingsAccessLevels],
      providers: provideSettingsServiceMocks(mocks),
    });
    fixture = TestBed.createComponent(SettingsAccessLevels);
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    [...el.querySelectorAll<HTMLButtonElement>('ui-page-header button')]
      .find((b) => b.textContent?.includes('Add access level'))!
      .click();
    fixture.detectChanges();
    await fixture.whenStable();
    return document.querySelector<HTMLElement>('[role="dialog"]')!;
  }

  const checkbox = (root: ParentNode, name: string) =>
    [...root.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')].find(
      (input) => input.closest('label')?.textContent?.replace(/\s+/g, ' ').trim() === name,
    );

  beforeEach(() => {
    mocks = settingsServiceMocks();
  });

  afterEach(() => {
    fixture?.destroy();
    document.querySelectorAll('.cdk-overlay-container').forEach((el) => (el.innerHTML = ''));
  });

  it('renders one row per area, grouped, with named view and manage checkboxes', async () => {
    const sheet = await openCreate();
    const table = sheet.querySelector('table.al-matrix')!;
    expect(table.querySelector('caption')?.textContent?.trim()).toBe('Permissions by area');
    const groups = [...table.querySelectorAll('th[scope="rowgroup"]')].map((th) =>
      th.textContent?.trim(),
    );
    expect(groups).toEqual(['Organisation', 'People', 'Access', 'Role tiers', 'Reporting']);
    const areas = [...table.querySelectorAll('th[scope="row"]')].map((th) =>
      th.textContent?.trim(),
    );
    expect(areas).toContain('Company');
    expect(areas).toContain('Own profile');
    expect(checkbox(table, 'View company')).toBeTruthy();
    expect(checkbox(table, 'Manage access level')).toBeTruthy();
    // 12 areas x 2 + 2 column checkboxes.
    expect(table.querySelectorAll('input[type="checkbox"]')).toHaveLength(26);
  });

  it('selects a whole column from its header checkbox', async () => {
    const sheet = await openCreate();
    const viewAll = checkbox(sheet, 'View: all areas')!;
    viewAll.click();
    fixture.detectChanges();
    expect(checkbox(sheet, 'View company')!.checked).toBe(true);
    expect(checkbox(sheet, 'View dashboard')!.checked).toBe(true);
    expect(checkbox(sheet, 'Manage company')!.checked).toBe(false);

    // One view unticked: the header becomes indeterminate.
    checkbox(sheet, 'View company')!.click();
    fixture.detectChanges();
    expect(viewAll.indeterminate).toBe(true);
    expect(viewAll.checked).toBe(false);
  });

  it('asks for at least one permission before creating', async () => {
    const sheet = await openCreate();
    const name = sheet.querySelector<HTMLInputElement>(
      '#access-levels-access-level-form-access-level-name',
    )!;
    name.value = 'Office lead';
    name.dispatchEvent(new Event('input'));
    sheet.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(sheet.querySelector('ui-alert')?.textContent).toContain(
      'Select at least one permission.',
    );
    expect(mocks.accessLevels['createAccessLevel']).not.toHaveBeenCalled();

    checkbox(sheet, 'View own profile')!.click();
    fixture.detectChanges();
    sheet.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    expect(mocks.accessLevels['createAccessLevel']).toHaveBeenCalledWith({
      accessLevelName: 'Office lead',
      permissions: [Permission.VIEW_SELF],
    });
  });

  it('shows permissions read-only when editing', async () => {
    TestBed.configureTestingModule({
      imports: [SettingsAccessLevels],
      providers: provideSettingsServiceMocks(mocks),
    });
    fixture = TestBed.createComponent(SettingsAccessLevels);
    await fixture.whenStable();
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('button[aria-label="Edit HR manager"]')!
      .click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const sheet = document.querySelector<HTMLElement>('[role="dialog"]')!;
    expect(sheet.textContent).toContain(
      "Permissions can't be changed after an access level is created.",
    );
    const own = checkbox(sheet, 'View own profile')!;
    expect(own.checked).toBe(true);
    expect(own.disabled).toBe(true);
  });
});
