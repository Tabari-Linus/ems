import { expect, test } from '@playwright/test';

test.describe('smoke', () => {
  test('the login page renders', async ({ page }) => {
    await page.goto('/login');

    await expect(page).toHaveTitle('EMS');
    await expect(page.getByRole('heading', { level: 1, name: 'EMS Portal' })).toBeVisible();
    await expect(page.getByLabel('Work Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeEnabled();
  });
});
