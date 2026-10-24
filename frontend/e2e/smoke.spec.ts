import { expect, test } from '@playwright/test';

test.describe('smoke', () => {
  test('the login page renders', async ({ page }) => {
    await page.goto('/login');

    await expect(page).toHaveTitle('Sign in · EMS');
    await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible();
    await expect(page.getByLabel('Work email')).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeEnabled();
  });
});
