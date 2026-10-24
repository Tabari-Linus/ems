import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** WCAG 2.2 AA scan of this slice's page only (the shell belongs to another slice). */
async function expectAccessible(page: Page, selector: string): Promise<void> {
  const results = await new AxeBuilder({ page })
    .include(selector)
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`),
  ).toEqual([]);
}

/**
 * Visual snapshots of the People directory and a profile, light and dark, desktop and phone.
 * Every API call is mocked with `page.route`, so no backend is needed and screenshots are
 * deterministic: the refresh endpoint returns an unsigned test token (the guards only decode
 * it), and GraphQL answers by the root field each query asks for.
 *
 * Run against a dev server, e.g. `npx ng serve --port 4310` and
 * `E2E_BASE_URL=http://localhost:4310 npx playwright test e2e/people.visual.spec.ts`.
 * The routes are `/staff` until the shell slice adds `/people` (which redirects from `/staff`).
 */

const PERMISSIONS = ['VIEW_EMPLOYEE', 'MANAGE_EMPLOYEE', 'VIEW_SELF', 'VIEW_DEPARTMENT'];

function testToken(): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const header = encode({ alg: 'none', typ: 'JWT' });
  const payload = encode({
    sub: 'ama.mensah@akwaabalabs.example',
    permissions: PERMISSIONS,
    account_id: 7,
    exp: 4102444800, // 2100-01-01
    iss: 'ems-e2e',
  });
  return `${header}.${payload}.test`;
}

const PEOPLE = [
  ['7', 'Ama', 'Mensah', 'Engineering Manager', 'Platform Engineering', 'ACTIVE'],
  ['42', 'Kwame', 'Asante', 'Senior Backend Engineer', 'Platform Engineering', 'ACTIVE'],
  ['51', 'Efua', 'Boateng', 'Product Designer', 'Design', 'ACTIVE'],
  ['13', 'Kofi', 'Owusu', 'Data Analyst', 'Analytics', 'PENDING'],
  ['19', 'Abena', 'Darko', 'HR Business Partner', 'People Operations', 'ACTIVE'],
  ['4', 'Yaw', 'Appiah', 'QA Engineer', 'Quality Engineering', 'INACTIVE'],
  ['21', 'Akosua', 'Frimpong', 'Frontend Engineer', 'Platform Engineering', 'ACTIVE'],
  ['3', 'Nana', 'Agyeman', 'Finance Lead', 'Finance', 'ACTIVE'],
  ['11', 'Esi', 'Quaye', null, null, 'PENDING'],
].map(([id, firstName, lastName, jobTitle, department, status]) => ({
  id,
  firstName,
  lastName,
  email: `${firstName!.toLowerCase()}@akwaabalabs.example`,
  jobTitle,
  department,
  status,
}));

const KWAME = {
  id: '42',
  firstName: 'Kwame',
  lastName: 'Asante',
  workEmail: 'kwame.asante@akwaabalabs.example',
  status: 'ACTIVE',
  createdDate: '2023-03-14T09:00:00Z',
  lastModifiedDate: '2026-10-01T09:00:00Z',
  position: { id: 'p1', positionName: 'Senior Backend Engineer', level: 'Senior' },
  department: { id: 'd1', departmentName: 'Platform Engineering', departmentCode: 'PLT' },
  accessLevel: { id: 'a1', accessLevelName: 'Employee' },
  bio: {
    fullName: 'Kwame Asante',
    otherName: null,
    gender: 'Male',
    nationality: 'Ghanaian',
    maritalStatus: 'Single',
    dateOfBirth: '1994-08-02',
    placeOfBirth: 'Kumasi',
    dateHired: '2023-03-14',
    isExpert: null,
  },
  contact: { phoneNumbers: ['+233 24 555 0142'], personalEmails: ['kwame.a@mail.example'] },
  addresses: [
    {
      id: 'ad1',
      street: '14 Oxford St',
      city: 'Osu, Accra',
      state: 'Greater Accra',
      zipCode: null,
      country: 'Ghana',
      digitalAddress: 'GA-123-4567',
      isCurrentAddress: true,
    },
  ],
  identifications: [
    { id: 'i1', identificationNumber: 'GHA-723456789-0', identificationType: 'GHANA_CARD' },
  ],
};

const page1 = <T>(data: T[]) => ({
  data,
  currentPage: 0,
  totalPages: 1,
  totalElements: data.length,
  pageSize: 20,
  hasNext: false,
  hasPrevious: false,
});

function graphqlData(query: string): Record<string, unknown> {
  if (query.includes('getEmployees')) {
    return {
      getEmployees: {
        ...page1(PEOPLE),
        totalElements: 23,
        totalPages: 3,
        pageSize: 12,
        hasNext: true,
      },
    };
  }
  if (query.includes('getEmployee(')) return { getEmployee: KWAME };
  if (query.includes('getDepartments')) {
    return {
      getDepartments: page1([
        { id: 'd1', departmentName: 'Platform Engineering', departmentCode: 'PLT' },
        { id: 'd2', departmentName: 'Design', departmentCode: 'DES' },
      ]),
    };
  }
  if (query.includes('getPositions')) return { getPositions: page1([]) };
  if (query.includes('getAccessLevels')) return { getAccessLevels: page1([]) };
  if (query.includes('getMyProfile'))
    return { getMyProfile: { ...KWAME, id: '7', firstName: 'Ama', lastName: 'Mensah' } };
  return {};
}

async function mockApi(page: Page): Promise<void> {
  await page.route('**/api/v1/auth/refresh-token', (route) =>
    route.fulfill({ json: { accessToken: testToken(), expiresAt: '2100-01-01T00:00:00Z' } }),
  );
  await page.route('**/graphql', (route) => {
    const body = route.request().postDataJSON() as { query?: string } | null;
    return route.fulfill({ json: { data: graphqlData(body?.query ?? '') } });
  });
}

/** Waits for both families: `fonts.ready` alone can resolve before a face is first requested. */
async function fontsLoaded(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await Promise.all([
      document.fonts.load('400 15px "Plus Jakarta Sans"'),
      document.fonts.load('800 28px "Plus Jakarta Sans"'),
      document.fonts.load('500 13px "Geist Mono"'),
    ]);
    await document.fonts.ready;
  });
}

const THEMES = ['light', 'dark'] as const;
const WIDTHS = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'phone', width: 390, height: 844 },
] as const;

for (const theme of THEMES) {
  for (const size of WIDTHS) {
    test.describe(`people pages, ${theme}, ${size.name}`, () => {
      test.use({ viewport: { width: size.width, height: size.height }, colorScheme: theme });

      test.beforeEach(async ({ page }) => {
        await page.addInitScript((value) => {
          try {
            localStorage.setItem('ems-theme', value);
          } catch {
            /* storage unavailable: the media query decides */
          }
        }, theme);
        await mockApi(page);
      });

      test('directory', async ({ page }) => {
        await page.goto('/staff');
        await expect(page.getByRole('heading', { level: 1, name: 'People' })).toBeVisible();
        await expect(page.getByRole('link', { name: /Kwame Asante/ })).toBeVisible();
        await fontsLoaded(page);
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        ).toBe(true);
        await expectAccessible(page, 'app-staff');
        await expect(page).toHaveScreenshot(`directory-${theme}-${size.width}.png`, {
          fullPage: true,
          animations: 'disabled',
          caret: 'hide',
          maxDiffPixelRatio: 0.01,
        });
      });

      test('directory list and add person drawer', async ({ page }) => {
        test.skip(size.name !== 'desktop', 'one width is enough for these states');
        await page.goto('/staff');
        await page.getByRole('radio', { name: 'List' }).click();
        await expect(page.getByRole('table', { name: 'People' })).toBeVisible();
        await fontsLoaded(page);
        await expect(page).toHaveScreenshot(`directory-list-${theme}-${size.width}.png`, {
          animations: 'disabled',
          caret: 'hide',
          maxDiffPixelRatio: 0.01,
        });

        await page.getByRole('button', { name: 'Add person' }).click();
        const drawer = page.getByRole('dialog', { name: 'Add person' });
        await expect(drawer).toBeVisible();
        await expect(drawer.getByLabel('First name')).toBeFocused();
        await drawer.getByRole('button', { name: 'Add person' }).click();
        await expect(drawer.getByText('Enter their first name')).toBeVisible();
        await expectAccessible(page, '.ui-drawer');
        await expect(page).toHaveScreenshot(`add-person-${theme}-${size.width}.png`, {
          animations: 'disabled',
          caret: 'hide',
          maxDiffPixelRatio: 0.01,
        });
      });

      test('profile inline edit and archive confirmation', async ({ page }) => {
        test.skip(size.name !== 'desktop', 'one width is enough for these states');
        await page.goto('/staff/42');
        await page.getByRole('button', { name: 'Change department' }).click();
        await expect(page.getByRole('button', { name: 'Save changes' })).toBeVisible();
        await fontsLoaded(page);
        await expect(page).toHaveScreenshot(`profile-edit-${theme}-${size.width}.png`, {
          animations: 'disabled',
          caret: 'hide',
          maxDiffPixelRatio: 0.01,
        });
        await page.getByRole('button', { name: 'Cancel' }).click();

        await page.getByRole('button', { name: 'Manage' }).click();
        await page.getByRole('menuitem', { name: 'Archive' }).click();
        const confirm = page.getByRole('alertdialog', { name: 'Archive Kwame Asante?' });
        await expect(confirm).toBeVisible();
        await expect(confirm.getByRole('button', { name: 'Cancel' })).toBeFocused();
        await expect(page).toHaveScreenshot(`profile-archive-${theme}-${size.width}.png`, {
          animations: 'disabled',
          caret: 'hide',
          maxDiffPixelRatio: 0.01,
        });
      });

      test('profile', async ({ page }) => {
        await page.goto('/staff/42');
        await expect(page.getByRole('heading', { level: 1, name: 'Kwame Asante' })).toBeVisible();
        await fontsLoaded(page);
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        ).toBe(true);
        await expectAccessible(page, 'app-profile');
        await expect(page).toHaveScreenshot(`profile-${theme}-${size.width}.png`, {
          fullPage: true,
          animations: 'disabled',
          caret: 'hide',
          maxDiffPixelRatio: 0.01,
        });
      });
    });
  }
}

test.describe('people pages at 360 wide', () => {
  test.use({ viewport: { width: 360, height: 780 } });

  for (const url of ['/staff', '/staff/42']) {
    test(`${url} has no horizontal scroll`, async ({ page }) => {
      await mockApi(page);
      await page.goto(url);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      // The legacy shell keeps a fixed 220px sidebar on phones; the new shell (slice B1) moves it
      // into a drawer. Hide it here so this checks the page content at a real 360px layout
      // (360 minus the 16px gutters).
      await page.addStyleTag({
        content: `.app-layout > .sidebar { display: none !important; }
          .main-content { min-inline-size: 0; }
          app-staff, app-profile { padding-inline: 16px; }`,
      });
      await fontsLoaded(page);
      const overflowing = await page.evaluate(() => {
        const host = document.querySelector('app-staff, app-profile')!;
        const edge =
          Math.min(host.getBoundingClientRect().right, window.innerWidth) -
          parseFloat(getComputedStyle(host).paddingInlineEnd) +
          1;
        const page = document.documentElement;
        const pageScroll =
          page.scrollWidth > page.clientWidth
            ? [`html ${page.scrollWidth} > ${page.clientWidth}`]
            : [];
        return [
          ...pageScroll,
          ...[...host.querySelectorAll('*')]
            .filter(
              (el) =>
                el.scrollWidth > el.clientWidth + 1 || el.getBoundingClientRect().right > edge,
            )
            .filter((el) => {
              const style = getComputedStyle(el);
              // Inline boxes, deliberate ellipsis and visually hidden text are not page overflow.
              return (
                style.display !== 'inline' &&
                style.textOverflow !== 'ellipsis' &&
                !el.classList.contains('ui-visually-hidden')
              );
            })
            .map((el) => `${el.tagName.toLowerCase()}.${el.getAttribute('class') ?? ''}`),
        ];
      });
      expect(overflowing).toEqual([]);
    });
  }
});
