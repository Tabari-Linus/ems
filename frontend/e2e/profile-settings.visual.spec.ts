import { expect, test, type Page, type Route } from '@playwright/test';
import { ADMIN } from './pages/support';

/**
 * Visual snapshots of My profile and every Settings tab (B3), light and dark, desktop and phone.
 *
 * Fully mocked: `config.json` points the API at the page's own origin, the refresh endpoint
 * returns a session with every permission (so the guards pass), and `/graphql` answers from the
 * fixtures below by operation. No backend is needed; run against any `ng serve`:
 *
 *   E2E_BASE_URL=http://localhost:4310 npx playwright test e2e/profile-settings.visual.spec.ts
 *
 * Baselines are win32 and were taken inside the legacy shell, whose unlayered `* { margin: 0;
 * padding: 0 }` reset in `src/styles.scss` still overrides the @ems/ui component spacing. Regenerate
 * them (`--update-snapshots`) once the new app shell lands and that reset is removed.
 */

const PERMISSIONS = [
  'VIEW_ADMIN',
  'MANAGE_ADMIN',
  'VIEW_EMPLOYEE',
  'MANAGE_EMPLOYEE',
  'VIEW_COMPANY',
  'MANAGE_COMPANY',
  'VIEW_OFFICE',
  'MANAGE_OFFICE',
  'VIEW_DEPARTMENT',
  'MANAGE_DEPARTMENT',
  'VIEW_ACCESS_LEVEL',
  'MANAGE_ACCESS_LEVEL',
  'VIEW_POSITION',
  'MANAGE_POSITION',
  'VIEW_SELF',
  'MANAGE_SELF',
];

/** Unsigned test JWT; the app only decodes the payload (permissions, exp). */
function testToken(): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return [
    encode({ alg: 'none' }),
    encode({ sub: 'ama.mensah@akwaabalabs.example', permissions: PERMISSIONS, exp: 4_102_444_800 }),
    '',
  ].join('.');
}

function page<T>(data: T[]) {
  return {
    data,
    currentPage: 0,
    totalPages: 1,
    totalElements: data.length,
    pageSize: 20,
    hasNext: false,
    hasPrevious: false,
  };
}

const PROFILE = {
  id: 'e-0042',
  firstName: 'Ama',
  lastName: 'Mensah',
  workEmail: 'ama.mensah@akwaabalabs.example',
  status: 'ACTIVE',
  createdDate: '2023-03-14T09:00:00Z',
  lastModifiedDate: '2026-09-01T09:00:00Z',
  position: { id: 'p2', positionName: 'People Partner', level: 'SENIOR' },
  department: { id: 'd2', departmentName: 'People Operations', departmentCode: 'PPL' },
  accessLevel: { id: 'a1', accessLevelName: 'HR manager' },
  bio: {
    fullName: 'Ama Serwaa Mensah',
    otherName: null,
    gender: 'FEMALE',
    nationality: 'Ghanaian',
    maritalStatus: 'MARRIED',
    dateOfBirth: '1991-08-02',
    placeOfBirth: 'Kumasi, Ghana',
    dateHired: '2023-03-14',
    isExpert: null,
  },
  contact: {
    phoneNumbers: ['+233 24 555 0142', '+233 20 555 0199'],
    personalEmails: ['ama.serwaa@example.com'],
  },
  addresses: [
    {
      id: 'addr1',
      street: '14 Oxford St, Osu',
      city: 'Accra',
      state: 'Greater Accra',
      zipCode: null,
      country: 'Ghana',
      digitalAddress: 'GA-123-4567',
      isCurrentAddress: true,
    },
    {
      id: 'addr2',
      street: '7 Prempeh II St',
      city: 'Kumasi',
      state: 'Ashanti',
      zipCode: null,
      country: 'Ghana',
      digitalAddress: null,
      isCurrentAddress: false,
    },
  ],
  identifications: [
    { id: 'id1', identificationNumber: 'GHA-723456781-4', identificationType: 'NATIONAL_ID_CARD' },
    { id: 'id2', identificationNumber: 'G2847193', identificationType: 'PASSPORT' },
  ],
};

const COMPANIES = [
  {
    id: 'c1',
    companyName: 'Akwaaba Labs',
    companyCode: 'AKL',
    companyEmail: 'hello@akwaabalabs.example',
    companyPhoneNumber: '+233 30 255 0100',
    companyAddress: '14 Oxford St, Osu, Accra',
    companyStatus: 'ACTIVE',
  },
  {
    id: 'c2',
    companyName: 'Akwaaba Ventures',
    companyCode: 'AKV',
    companyEmail: 'ventures@akwaabalabs.example',
    companyPhoneNumber: null,
    companyAddress: null,
    companyStatus: 'PENDING',
  },
];

const OFFICES = [
  ['o1', 'Accra', 'ACC', 'accra@akwaabalabs.example', '+233 30 255 0101', 'ACTIVE'],
  ['o2', 'Kumasi', 'KSI', 'kumasi@akwaabalabs.example', '+233 32 255 0102', 'ACTIVE'],
  ['o3', 'Takoradi', 'TKD', 'takoradi@akwaabalabs.example', null, 'INACTIVE'],
].map(([id, officeName, officeCode, officeEmail, officePhoneNumber, officeStatus]) => ({
  id,
  officeName,
  officeCode,
  officeEmail,
  officePhoneNumber,
  officeAddress: null,
  officeStatus,
}));

const DEPARTMENTS = [
  ['d1', 'Platform Engineering', 'PLT', 'platform@akwaabalabs.example', 'ACTIVE'],
  ['d2', 'People Operations', 'PPL', 'people@akwaabalabs.example', 'ACTIVE'],
  ['d3', 'Design', 'DES', 'design@akwaabalabs.example', 'ACTIVE'],
  ['d4', 'Finance', 'FIN', 'finance@akwaabalabs.example', 'PENDING'],
].map(([id, departmentName, departmentCode, departmentEmail, departmentStatus]) => ({
  id,
  departmentName,
  departmentCode,
  departmentEmail,
  departmentPhoneNumber: null,
  departmentAddress: null,
  departmentStatus,
}));

const POSITIONS = [
  ['p1', 'Backend Engineer', 'SENIOR', 'Builds and runs the services behind EMS.', 'ACTIVE'],
  [
    'p2',
    'People Partner',
    'SENIOR',
    'Supports managers and teams through the employee lifecycle.',
    'ACTIVE',
  ],
  ['p3', 'Product Designer', 'MID', 'Designs the flows people use every day.', 'ACTIVE'],
  ['p4', 'Engineering Intern', 'INTERN', null, 'ARCHIVED'],
].map(([id, positionName, level, description, status]) => ({
  id,
  positionName,
  level,
  description,
  status,
}));

const ACCESS_LEVELS = [
  ['a1', 'HR manager', 'Manages people, requests and organisation settings', 'ACTIVE'],
  ['a2', 'Employee', 'Sees colleagues and manages their own profile', 'ACTIVE'],
  ['a3', 'Team lead', 'Sees their team and approves requests', 'ACTIVE'],
].map(([id, accessLevelName, description, status]) => ({
  id,
  accessLevelName,
  description,
  status,
}));

function graphqlData(query: string): Record<string, unknown> | null {
  // The shell loads the session from `me` (permissions come from it, not the token).
  if (/\bquery Me\b/.test(query)) return { ...ADMIN };
  if (query.includes('getMyProfile')) return { getMyProfile: PROFILE };
  if (query.includes('getCompanies')) return { getCompanies: page(COMPANIES) };
  if (query.includes('getOffices')) return { getOffices: page(OFFICES) };
  if (query.includes('getDepartments')) return { getDepartments: page(DEPARTMENTS) };
  if (query.includes('getPositions')) return { getPositions: page(POSITIONS) };
  if (query.includes('getAccessLevels')) return { getAccessLevels: page(ACCESS_LEVELS) };
  return null;
}

async function mockApi(target: Page): Promise<void> {
  const origin = new URL(test.info().project.use.baseURL ?? 'http://localhost:4200').origin;
  const json = (route: Route, body: unknown) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

  await target.route('**/config.json', (route) => json(route, { apiUrl: origin }));
  await target.route('**/api/v1/auth/refresh-token', (route) =>
    json(route, { accessToken: testToken(), expiresAt: '2100-01-01T00:00:00Z' }),
  );
  await target.route('**/graphql', (route) => {
    const body = route.request().postDataJSON() as { query?: string } | null;
    const data = graphqlData(body?.query ?? '');
    return data
      ? json(route, { data })
      : json(route, { data: null, errors: [{ message: 'Not mocked in this test' }] });
  });
}

const THEMES = ['light', 'dark'] as const;
const WIDTHS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 },
] as const;

const PAGES = [
  { name: 'my-profile', path: '/my-profile', ready: 'Ama Serwaa Mensah' },
  { name: 'settings-companies', path: '/settings/companies', ready: '2 companies' },
  { name: 'settings-offices', path: '/settings/offices', ready: '3 offices' },
  { name: 'settings-departments', path: '/settings/departments', ready: '4 departments' },
  { name: 'settings-positions', path: '/settings/positions', ready: '4 positions' },
  { name: 'settings-access-levels', path: '/settings/access-levels', ready: '3 access levels' },
] as const;

async function open(target: Page, theme: (typeof THEMES)[number], path: string, ready: string) {
  await target.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
  await target.addInitScript((t) => {
    try {
      localStorage.setItem('ems-theme', t);
    } catch {
      /* storage may be unavailable */
    }
  }, theme);
  await mockApi(target);
  await target.goto(path);
  // Generous: a cold dev server compiles each lazy chunk on first request.
  await expect(target.getByText(ready, { exact: true }).first()).toBeVisible({ timeout: 20_000 });
  // Fonts swap in when first used; load both faces so every snapshot uses the real type.
  await target.evaluate(async () => {
    await Promise.all([
      document.fonts.load('500 15px "Plus Jakarta Sans"'),
      document.fonts.load('800 28px "Plus Jakarta Sans"'),
      document.fonts.load('500 13px "Geist Mono"'),
    ]);
    await document.fonts.ready;
  });
}

/** No horizontal page scroll at any width (rule: responsive to 360px). */
async function expectNoHorizontalScroll(target: Page) {
  const overflow = await target.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

for (const theme of THEMES) {
  for (const size of WIDTHS) {
    test.describe(`${theme} ${size.name}`, () => {
      test.use({ viewport: { width: size.width, height: size.height } });

      for (const p of PAGES) {
        test(`${p.name}`, async ({ page: target }) => {
          await open(target, theme, p.path, p.ready);
          await expectNoHorizontalScroll(target);
          await expect(target).toHaveScreenshot(`${p.name}-${theme}-${size.name}.png`, {
            fullPage: true,
          });
        });
      }

      test('settings-access-level-editor', async ({ page: target }) => {
        await open(target, theme, '/settings/access-levels', '3 access levels');
        await target.getByRole('button', { name: 'Add access level' }).first().click();
        const drawer = target.getByRole('dialog', { name: 'Add access level' });
        await expect(drawer.getByRole('table', { name: 'Permissions by area' })).toBeVisible();
        await drawer.getByRole('checkbox', { name: 'View all areas' }).check();
        await drawer.getByRole('checkbox', { name: 'Manage own profile' }).check();
        await expectNoHorizontalScroll(target);
        await expect(target).toHaveScreenshot(
          `settings-access-level-editor-${theme}-${size.name}.png`,
        );
      });
    });
  }
}

test.describe('settings keyboard path', () => {
  test('tabs are links in order and the drawer traps and returns focus', async ({
    page: target,
  }) => {
    await open(target, 'light', '/settings', '2 companies');
    await expect(target).toHaveURL(/\/settings\/companies$/);
    const tabs = target.getByRole('navigation', { name: 'Settings sections' }).getByRole('link');
    await expect(tabs).toHaveText([
      'Companies',
      'Offices',
      'Departments',
      'Positions',
      'Access levels',
    ]);
    await expect(tabs.first()).toHaveAttribute('aria-current', 'page');

    await tabs.nth(1).focus();
    await target.keyboard.press('Enter');
    await expect(target).toHaveURL(/\/settings\/offices$/);
    await expect(target.getByText('3 offices', { exact: true })).toBeVisible();

    const add = target.getByRole('button', { name: 'Add office' }).first();
    await add.focus();
    await target.keyboard.press('Enter');
    const drawer = target.getByRole('dialog', { name: 'Add office' });
    await expect(drawer.getByLabel('Company')).toBeFocused();
    await target.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(add).toBeFocused();
  });
});
