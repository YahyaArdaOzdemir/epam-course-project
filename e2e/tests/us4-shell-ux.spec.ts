import { test, expect } from '@playwright/test';

test('protected shell redirects unauthenticated users to login', async ({ page }) => {
  await page.goto('/dashboard');
  await page.waitForURL('**/login');
  await expect(page.getByText('Login').first()).toBeVisible();
});
