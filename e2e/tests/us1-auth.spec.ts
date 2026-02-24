import { test, expect } from '@playwright/test';

test('register-login-logout and protected role path', async ({ page }) => {
  const uniqueEmail = `employee+${Date.now()}@epam.com`;

  await page.goto('/register');
  await page.getByLabel('Email').fill(uniqueEmail);
  await page.getByLabel('Password').fill('StrongPass123!');
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page.getByText('Registered successfully').first()).toBeVisible();

  await page.goto('/login');
  await page.getByLabel('Email').fill(uniqueEmail);
  await page.getByLabel('Password').fill('StrongPass123!');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByText('Logged in').first()).toBeVisible();
  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page.getByText('Logged out').first()).toBeVisible();
});
