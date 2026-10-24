import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, type Route } from '@playwright/test';

/**
 * Mocked API for page snapshots. The runtime config points the app at its own origin, so every
 * call is same-origin and `page.route` answers it: REST auth under /api/v1/auth, GraphQL at
 * /graphql (dispatched on the operation name).
 */

export type Theme = 'light' | 'dark';
export interface Viewport {
  name: string;
  width: number;
  height: number;
}
export const THEMES: readonly Theme[] = ['light', 'dark'];
export const VIEWPORTS: readonly Viewport[] = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'phone', width: 390, height: 844 },
];

/** Thursday morning, so the greeting and date never change. */
export const NOW = new Date('2026-10-22T09:30:00');

const ALL_PERMISSIONS = [
  'VIEW_ADMIN',
  'MANAGE_ADMIN',
  'VIEW_MANAGER',
  'VIEW_EMPLOYEE',
  'MANAGE_EMPLOYEE',
  'VIEW_DASHBOARD',
  'VIEW_SELF',
  'MANAGE_SELF',
];

const PLATFORM = { id: 'd-plat', departmentName: 'Platform Engineering' };

export interface MockUser {
  me: {
    account: { id: string; email: string; lastLoginAt: string | null };
    employee: {
      id: string;
      firstName: string;
      lastName: string;
      workEmail: string;
      status: string;
      position: { positionName: string } | null;
      department: { id: string; departmentName: string } | null;
      accessLevel: { accessLevelName: string } | null;
    } | null;
    permissions: string[];
  };
}

export const ADMIN: MockUser = {
  me: {
    account: { id: 'acc-1', email: 'ama.mensah@akwaabalabs.example', lastLoginAt: null },
    employee: {
      id: 'e-ama',
      firstName: 'Ama',
      lastName: 'Mensah',
      workEmail: 'ama.mensah@akwaabalabs.example',
      status: 'ACTIVE',
      position: { positionName: 'Engineering Manager' },
      department: PLATFORM,
      accessLevel: { accessLevelName: 'HR admin' },
    },
    permissions: ALL_PERMISSIONS,
  },
};

export const EMPLOYEE: MockUser = {
  me: {
    account: { id: 'acc-2', email: 'kwame.asante@akwaabalabs.example', lastLoginAt: null },
    employee: {
      id: 'e-kwame',
      firstName: 'Kwame',
      lastName: 'Asante',
      workEmail: 'kwame.asante@akwaabalabs.example',
      status: 'ACTIVE',
      position: { positionName: 'Senior Backend Engineer' },
      department: PLATFORM,
      accessLevel: { accessLevelName: 'Employee' },
    },
    permissions: ['VIEW_SELF', 'MANAGE_SELF', 'VIEW_EMPLOYEE'],
  },
};

const person = (
  id: string,
  firstName: string,
  lastName: string,
  jobTitle: string,
  department: string,
  status: string,
) => ({
  id,
  firstName,
  lastName,
  email: `${id}@akwaabalabs.example`,
  jobTitle,
  department,
  status,
});

const TEAM = [
  person('e-ama', 'Ama', 'Mensah', 'Engineering Manager', 'Platform Engineering', 'ACTIVE'),
  person('e-kwame', 'Kwame', 'Asante', 'Senior Backend Engineer', 'Platform Engineering', 'ACTIVE'),
  person('e-akosua', 'Akosua', 'Frimpong', 'Frontend Engineer', 'Platform Engineering', 'ACTIVE'),
  person('e-esi', 'Esi', 'Quaye', 'Intern, Engineering', 'Platform Engineering', 'PENDING'),
  person('e-yaw', 'Yaw', 'Boakye', 'Site Reliability Engineer', 'Platform Engineering', 'ACTIVE'),
];
const PENDING = [
  person('e-kofi', 'Kofi', 'Owusu', 'Data Analyst', 'Analytics', 'PENDING'),
  person('e-esi', 'Esi', 'Quaye', 'Intern, Engineering', 'Platform Engineering', 'PENDING'),
];

const page = <T>(data: T[]) => ({
  data,
  currentPage: 0,
  totalPages: 1,
  totalElements: data.length,
  pageSize: 12,
  hasNext: false,
  hasPrevious: false,
});

function profileFor(user: MockUser, complete: boolean) {
  const e = user.me.employee!;
  return {
    id: e.id,
    firstName: e.firstName,
    lastName: e.lastName,
    workEmail: e.workEmail,
    status: e.status,
    createdDate: '2024-02-01T09:00:00Z',
    lastModifiedDate: null,
    position: { id: 'p1', positionName: e.position?.positionName ?? '', level: 'SENIOR' },
    department: { id: PLATFORM.id, departmentName: PLATFORM.departmentName, departmentCode: 'PLT' },
    accessLevel: { id: 'al1', accessLevelName: e.accessLevel?.accessLevelName ?? '' },
    bio: { dateOfBirth: complete ? '1990-04-12' : null },
    contact: { phoneNumbers: complete ? ['+233 20 000 0000'] : [], personalEmails: [] },
    addresses: complete ? [{ id: 'a1', city: 'Accra', isCurrentAddress: true }] : [],
    identifications: [],
  };
}

export interface MockOptions {
  /** Signed-in user, or null for a visitor without a session. */
  user?: MockUser | null;
  /** Own profile has every detail Home asks for. */
  completeProfile?: boolean;
}

/** Installs the mocked API, the fixed clock and the theme. Call before `page.goto`. */
export async function mockApp(
  p: Page,
  theme: Theme,
  { user = null, completeProfile = false }: MockOptions = {},
): Promise<void> {
  await p.clock.setFixedTime(NOW);
  await p.emulateMedia({ reducedMotion: 'reduce', colorScheme: theme });
  await p.addInitScript((t) => {
    try {
      localStorage.setItem('ems-theme', t);
    } catch {
      /* ignore */
    }
  }, theme);

  await p.route('**/config.json', (route) =>
    route.fulfill({ json: { apiUrl: new URL(route.request().url()).origin } }),
  );

  let signedIn = !!user;
  await p.route('**/api/v1/auth/**', async (route: Route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/refresh-token')) {
      return signedIn
        ? route.fulfill({
            json: { accessToken: 'mock.access.token', expiresAt: '2100-01-01T00:00:00Z' },
          })
        : route.fulfill({
            status: 401,
            json: { status: 401, code: 'TOKEN_INVALID', message: 'No session' },
          });
    }
    if (path.endsWith('/logout') || path.endsWith('/logout-all')) {
      signedIn = false;
      return route.fulfill({ status: 204 });
    }
    return route.fulfill({ status: 204 });
  });

  await p.route('**/graphql', async (route: Route) => {
    const body = route.request().postDataJSON() as {
      query: string;
      operationName?: string;
      variables?: { filter?: { status?: string; departmentId?: string } };
    };
    const name = body.operationName ?? /(?:query|mutation)\s+(\w+)/.exec(body.query)?.[1];
    switch (name) {
      case 'Me':
        return route.fulfill({ json: { data: user ?? null } });
      case 'GetMyProfile':
        return route.fulfill({
          json: { data: { getMyProfile: user ? profileFor(user, completeProfile) : null } },
        });
      case 'GetEmployees': {
        const filter = body.variables?.filter ?? {};
        const data = filter.status === 'PENDING' ? PENDING : filter.departmentId ? TEAM : TEAM;
        return route.fulfill({ json: { data: { getEmployees: page(data) } } });
      }
      case 'GetDashboardSummary':
        return route.fulfill({
          json: {
            data: {
              getDashboardSummary: {
                companyCount: 1,
                officeCount: 3,
                departmentCount: 6,
                activeEmployeeCount: 42,
                headcountTrend: { trend: 'INCREASE' },
              },
            },
          },
        });
      default:
        return route.fulfill({ json: { data: null, errors: [{ message: `Unmocked ${name}` }] } });
    }
  });
}

/** Waits for fonts and network quiet, then checks no horizontal scroll and no axe violations. */
export async function settle(p: Page): Promise<void> {
  await p.waitForLoadState('networkidle');
  await p.evaluate(() => document.fonts.ready);
  const overflow = await p.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, 'no horizontal page scroll').toBeLessThanOrEqual(0);
}

export async function expectAccessible(p: Page): Promise<void> {
  const results = await new AxeBuilder({ page: p })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
}

/**
 * Runs `body` once per theme and viewport: the page is mocked, opened and screenshotted as
 * `<name>-<viewport>-<theme>.png`, with an axe pass.
 */
export function eachThemeAndViewport(
  register: (title: string, fn: (args: { page: Page }) => Promise<void>) => void,
  name: string,
  open: (p: Page, theme: Theme) => Promise<void>,
): void {
  for (const theme of THEMES) {
    for (const viewport of VIEWPORTS) {
      register(`${name} (${theme}, ${viewport.name})`, async ({ page: p }) => {
        await p.setViewportSize({ width: viewport.width, height: viewport.height });
        await open(p, theme);
        await settle(p);
        await expect(p.locator('html')).toHaveAttribute('data-theme', theme);
        await expect(p).toHaveScreenshot(`${name}-${viewport.name}-${theme}.png`, {
          fullPage: true,
        });
        await expectAccessible(p);
      });
    }
  }
}
