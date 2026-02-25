import { test, expect } from '@playwright/test';

test('submitter can submit and list an idea', async ({ page }) => {
  const uniqueEmail = `submitter+${Date.now()}@epam.com`;

  await page.goto('/register');
  await page.getByLabel('Full Name').fill('Submitter E2E User');
  await page.getByLabel('Email').fill(uniqueEmail);
  await page.getByLabel(/^Password$/).fill('StrongPass123!');
  await page.getByLabel('Confirm Password').fill('StrongPass123!');
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page.getByText('Registered successfully').first()).toBeVisible();

  await page.goto('/login');
  await page.getByLabel('Email').fill(uniqueEmail);
  await page.getByLabel(/^Password$/).fill('StrongPass123!');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByText('Dashboard').first()).toBeVisible();

  await page.goto('/ideas/new');
  await page.getByLabel('Title').fill('Idea A');
  await page.getByLabel('Description').fill('Description A');
  await page.getByLabel('Category').fill('DX');
  await page.getByRole('button', { name: 'Submit Idea' }).click();

  await expect(page.getByText('Idea submitted').first()).toBeVisible();
});
