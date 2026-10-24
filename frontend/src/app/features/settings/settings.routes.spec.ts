import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { SETTINGS_ROUTES } from './settings.routes';
import { provideSettingsServiceMocks, settingsServiceMocks } from './testing/settings-mocks';

describe('SETTINGS_ROUTES (routed pill tabs)', () => {
  let harness: RouterTestingHarness;

  // The tabs are lazy chunks; load them once up front so the first navigation is not the one
  // that pays for transforming them (that alone can exceed the per-test timeout on a cold run).
  beforeAll(async () => {
    await Promise.all([
      import('./tabs/companies/companies'),
      import('./tabs/offices/offices'),
      import('./tabs/departments/departments'),
      import('./tabs/positions/positions'),
      import('./tabs/access-levels/access-levels'),
    ]);
  }, 120_000);

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'settings', children: SETTINGS_ROUTES }]),
        ...provideSettingsServiceMocks(settingsServiceMocks()),
      ],
    });
    harness = await RouterTestingHarness.create();
  });

  const host = () => harness.routeNativeElement as HTMLElement;
  const currentTab = () => host().querySelector('a[uiTab][aria-current="page"]');

  it('redirects /settings to the companies tab', async () => {
    await harness.navigateByUrl('/settings');
    expect(TestBed.inject(Router).url).toBe('/settings/companies');
    expect(host().querySelector('h1')?.textContent?.trim()).toBe('Settings');
    expect(currentTab()?.textContent?.trim()).toBe('Companies');
  });

  it('labels the tab navigation and links every section', async () => {
    await harness.navigateByUrl('/settings');
    const nav = host().querySelector('nav[uiTabNav]');
    expect(nav?.getAttribute('aria-label')).toBe('Settings sections');
    const links = [...host().querySelectorAll<HTMLAnchorElement>('a[uiTab]')];
    expect(links.map((a) => a.textContent?.trim())).toEqual([
      'Companies',
      'Offices',
      'Departments',
      'Positions',
      'Access levels',
    ]);
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/settings/companies',
      '/settings/offices',
      '/settings/departments',
      '/settings/positions',
      '/settings/access-levels',
    ]);
  });

  it.each([
    ['companies', 'Companies', '2 companies'],
    ['offices', 'Offices', '1 office'],
    ['departments', 'Departments', '1 department'],
    ['positions', 'Positions', '1 position'],
    ['access-levels', 'Access levels', '1 access level'],
  ])('renders the %s tab with its header, count and table', async (path, title, count) => {
    await harness.navigateByUrl(`/settings/${path}`);
    await harness.fixture.whenStable();
    harness.detectChanges();

    expect(currentTab()?.textContent?.trim()).toBe(title);
    const heading = host().querySelector('h2.ui-page-header__title');
    expect(heading?.textContent?.trim()).toBe(title);
    expect(host().querySelector('.ui-page-header__count')?.textContent?.trim()).toBe(count);
    expect(host().querySelector('table caption')?.textContent?.trim()).toBe(title);
    expect(host().querySelectorAll('tbody tr.ui-data-table__row').length).toBeGreaterThan(0);
  });
});
