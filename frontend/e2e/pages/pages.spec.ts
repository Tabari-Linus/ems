import { expect, test } from '@playwright/test';
import { ADMIN, EMPLOYEE, eachThemeAndViewport, mockApp } from './support';

test.describe.configure({ timeout: 60_000 });

test.describe('Sign in', () => {
  eachThemeAndViewport(test, 'login', async (page, theme) => {
    await mockApp(page, theme);
    await page.goto('/login');
    await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible();
  });

  eachThemeAndViewport(test, 'login-locked', async (page, theme) => {
    await mockApp(page, theme);
    await page.route('**/api/v1/auth/login', (route) =>
      route.fulfill({
        status: 423,
        json: { status: 423, code: 'ACCOUNT_LOCKED', message: 'Too many failed sign-in attempts.' },
      }),
    );
    await page.goto('/login');
    await page.getByLabel('Work email').fill('ama.mensah@akwaabalabs.example');
    await page.getByLabel('Password', { exact: true }).fill('not-my-password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Account locked for 15 minutes')).toBeVisible();
    await page.getByLabel('Password', { exact: true }).blur();
  });
});

test.describe('Set password', () => {
  eachThemeAndViewport(test, 'set-password', async (page, theme) => {
    await mockApp(page, theme);
    await page.goto('/set-password?token=one-time-token');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Choose your password' }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/set-password$/);
    await page.getByLabel('New password').fill('a calm river at dawn');
  });

  eachThemeAndViewport(test, 'set-password-expired', async (page, theme) => {
    await mockApp(page, theme);
    await page.route('**/api/v1/auth/set-password', (route) =>
      route.fulfill({
        status: 400,
        json: { status: 400, code: 'TOKEN_EXPIRED', message: 'The link has expired.' },
      }),
    );
    await page.goto('/set-password?token=old-token');
    await page.getByLabel('New password').fill('a calm river at dawn');
    await page.getByLabel('Confirm password').fill('a calm river at dawn');
    await page.getByRole('button', { name: 'Set password' }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: 'This link has expired' }),
    ).toBeVisible();
  });
});

test.describe('Home', () => {
  eachThemeAndViewport(test, 'home-admin', async (page, theme) => {
    await mockApp(page, theme, { user: ADMIN });
    await page.goto('/home');
    await expect(page.getByRole('heading', { level: 1, name: 'Good morning, Ama' })).toBeVisible();
    await expect(page.getByText('Kofi Owusu has not set a password yet')).toBeVisible();
    await expect(page.getByText('Across the organisation')).toBeVisible();
  });

  eachThemeAndViewport(test, 'home-employee', async (page, theme) => {
    await mockApp(page, theme, { user: EMPLOYEE, completeProfile: true });
    await page.goto('/home');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Good morning, Kwame' }),
    ).toBeVisible();
    await expect(page.getByText('You are all caught up.')).toBeVisible();
  });
});

test.describe('Change password', () => {
  eachThemeAndViewport(test, 'change-password', async (page, theme) => {
    await mockApp(page, theme, { user: EMPLOYEE, completeProfile: true });
    await page.goto('/change-password');
    await expect(page.getByRole('heading', { level: 1, name: 'Change password' })).toBeVisible();
  });
});

test.describe('Errors', () => {
  eachThemeAndViewport(test, 'not-found-signed-in', async (page, theme) => {
    await mockApp(page, theme, { user: EMPLOYEE, completeProfile: true });
    await page.goto('/no-such-page');
    await expect(
      page.getByRole('heading', { level: 1, name: "We can't find that page" }),
    ).toBeVisible();
  });

  eachThemeAndViewport(test, 'not-found-signed-out', async (page, theme) => {
    await mockApp(page, theme);
    await page.goto('/no-such-page');
    await expect(page.getByRole('button', { name: 'Go to sign in' })).toBeVisible();
  });

  eachThemeAndViewport(test, 'unauthorized', async (page, theme) => {
    await mockApp(page, theme, { user: EMPLOYEE, completeProfile: true });
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/unauthorized$/);
    await expect(
      page.getByRole('heading', { level: 1, name: "You don't have access to this page" }),
    ).toBeVisible();
  });
});

test.describe('Flows', () => {
  test('signs in and lands Home; old staff links redirect to People', async ({ page }) => {
    await mockApp(page, 'light');
    let signedIn = false;
    await page.route('**/api/v1/auth/login', (route) => {
      signedIn = true;
      return route.fulfill({
        json: { accessToken: 'mock.access.token', expiresAt: '2100-01-01T00:00:00Z' },
      });
    });
    await page.route('**/graphql', async (route) => {
      const body = route.request().postDataJSON() as { operationName?: string };
      if (body.operationName === 'Me' && signedIn) return route.fulfill({ json: { data: ADMIN } });
      return route.fallback();
    });
    await page.goto('/people');
    await expect(page).toHaveURL(/\/login\?returnUrl=%2Fpeople$/);
    await page.getByLabel('Work email').fill('ama.mensah@akwaabalabs.example');
    await page.getByLabel('Password', { exact: true }).fill('correct horse battery');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/people$/);
  });

  test('the user menu switches theme and signs out', async ({ page }) => {
    await mockApp(page, 'light', { user: ADMIN });
    await page.goto('/home');
    const trigger = page.getByRole('button', { name: /Account menu/ });
    await trigger.focus();
    await page.keyboard.press('Enter');
    const menu = page.getByRole('menu');
    await expect(menu.getByRole('menuitem')).toHaveText([
      'My profile',
      'Change password',
      'Sign out',
      'Sign out of all devices',
    ]);
    await menu.getByRole('menuitemradio', { name: 'Dark' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await trigger.click();
    await page.getByRole('menuitem', { name: 'Sign out', exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('top-bar search opens People with the query', async ({ page }) => {
    await mockApp(page, 'light', { user: ADMIN });
    await page.goto('/home');
    await page.getByRole('searchbox', { name: 'Search people' }).fill('kofi');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/people\?q=kofi$/);
  });
});
