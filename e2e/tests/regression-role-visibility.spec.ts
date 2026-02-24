import { test, expect } from '@playwright/test';

test('role and visibility regression smoke', async ({ page }) => {
  await page.goto('/ideas');
  await expect(page.locator('main')).toBeVisible();
});
