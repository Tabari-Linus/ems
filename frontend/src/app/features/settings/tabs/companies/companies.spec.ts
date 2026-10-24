import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastService } from '@ems/ui/toast';
import { NEVER, of, throwError } from 'rxjs';
import {
  page,
  provideSettingsServiceMocks,
  settingsServiceMocks,
  type SettingsServiceMocks,
} from '../../testing/settings-mocks';
import { SettingsCompanies } from './companies';

describe('SettingsCompanies', () => {
  let mocks: SettingsServiceMocks;
  let fixture: ComponentFixture<SettingsCompanies>;

  async function render({ settle = true } = {}): Promise<HTMLElement> {
    TestBed.configureTestingModule({
      imports: [SettingsCompanies],
      providers: provideSettingsServiceMocks(mocks),
    });
    fixture = TestBed.createComponent(SettingsCompanies);
    if (settle) await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const drawer = () => document.querySelector<HTMLElement>('[role="dialog"]');
  const button = (root: ParentNode, name: string) =>
    [...root.querySelectorAll<HTMLButtonElement>('button')].find(
      (b) => b.textContent?.trim() === name,
    );

  beforeEach(() => {
    mocks = settingsServiceMocks();
  });

  afterEach(() => {
    fixture?.destroy();
    document.querySelectorAll('.cdk-overlay-container').forEach((el) => (el.innerHTML = ''));
  });

  it('lists companies with code, status and an edit action per row', async () => {
    const el = await render();
    const rows = el.querySelectorAll('tbody tr.ui-data-table__row');
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain('Akwaaba Labs');
    expect(rows[0].querySelector('.settings-mono')?.textContent?.trim()).toBe('AKL');
    expect(rows[0].querySelector('ui-status-pill')?.textContent).toContain('Active');
    expect(
      rows[0].querySelector('button[aria-label="Edit Akwaaba Labs"]')?.textContent?.trim(),
    ).toBe('Edit');
    expect(el.querySelector('.ui-page-header__count')?.textContent?.trim()).toBe('2 companies');
  });

  it('shows the loading skeleton while companies load', async () => {
    mocks.companies.getCompanies = vi.fn(() => NEVER);
    const el = await render({ settle: false });
    expect(el.querySelector('table')?.getAttribute('aria-busy')).toBe('true');
    expect(el.querySelector('[role="status"]')?.textContent).toContain('Loading companies');
  });

  it('invites the first company when there are none', async () => {
    mocks.companies.getCompanies = vi.fn(() => of(page([])));
    const el = await render();
    expect(el.querySelector('ui-empty-state h3')?.textContent?.trim()).toBe('No companies yet');
    expect(el.querySelector('ui-empty-state button')?.textContent?.trim()).toBe('Add company');
  });

  it('explains a load failure and retries', async () => {
    mocks.companies.getCompanies = vi.fn(() => throwError(() => new Error('offline')));
    const el = await render();
    expect(el.querySelector('ui-error-state [role="heading"]')?.textContent?.trim()).toBe(
      "We couldn't load companies",
    );
    mocks.companies.getCompanies = vi.fn(() => of(page([])));
    button(el, 'Try again')!.click();
    await fixture.whenStable();
    expect(mocks.companies.getCompanies).toHaveBeenCalled();
  });

  it('opens the create drawer, validates, creates and confirms with a toast', async () => {
    const el = await render();
    const success = vi.spyOn(TestBed.inject(ToastService), 'success');

    button(el.querySelector('ui-page-header')!, 'Add company')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const sheet = drawer()!;
    expect(sheet.getAttribute('aria-modal')).toBe('true');
    expect(sheet.querySelector('h2')?.textContent?.trim()).toBe('Add company');

    // Submitting empty shows the field errors and does not call the API.
    sheet.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    expect(sheet.textContent).toContain('Company name is required');
    expect(mocks.companies['createCompany']).not.toHaveBeenCalled();

    const type = (id: string, value: string) => {
      const input = sheet.querySelector<HTMLInputElement>(`#${id}`)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };
    type('companies-company-form-company-name', 'Akwaaba Health');
    type('companies-company-form-company-code', 'AKH');
    type('companies-company-form-company-email', 'health@akwaabalabs.example');
    fixture.detectChanges();
    sheet.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(mocks.companies['createCompany']).toHaveBeenCalledWith({
      companyName: 'Akwaaba Health',
      companyCode: 'AKH',
      companyEmail: 'health@akwaabalabs.example',
    });
    expect(success).toHaveBeenCalledWith('Company added');
    await vi.waitFor(() => expect(drawer()).toBeNull());
  });

  it('edits a company in the drawer with its values filled in', async () => {
    const el = await render();
    el.querySelector<HTMLButtonElement>('button[aria-label="Edit Akwaaba Labs"]')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const sheet = drawer()!;
    expect(sheet.querySelector('h2')?.textContent?.trim()).toBe('Edit company');
    expect(
      sheet.querySelector<HTMLInputElement>('#companies-company-form-company-code')!.value,
    ).toBe('AKL');
    expect(button(sheet, 'Save changes')).toBeTruthy();
  });

  it('shows the API error in the drawer with how to fix it', async () => {
    mocks.companies['createCompany'] = vi.fn(() =>
      throwError(() => new Error('Company code AKL is already in use.')),
    );
    const el = await render();
    button(el.querySelector('ui-page-header')!, 'Add company')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const sheet = drawer()!;
    for (const [id, value] of [
      ['companies-company-form-company-name', 'Dup'],
      ['companies-company-form-company-code', 'AKL'],
      ['companies-company-form-company-email', 'dup@akwaabalabs.example'],
    ]) {
      const input = sheet.querySelector<HTMLInputElement>(`#${id}`)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
    sheet.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();
    const alert = sheet.querySelector('ui-alert');
    expect(alert?.textContent).toContain("We couldn't save this company");
    expect(alert?.textContent).toContain('Company code AKL is already in use.');
    expect(alert?.textContent).toContain('Check the details and try again.');
  });

  it('closes the drawer with Cancel', async () => {
    const el = await render();
    button(el.querySelector('ui-page-header')!, 'Add company')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    button(drawer()!, 'Cancel')!.click();
    fixture.detectChanges();
    await vi.waitFor(() => expect(drawer()).toBeNull());
  });
});
