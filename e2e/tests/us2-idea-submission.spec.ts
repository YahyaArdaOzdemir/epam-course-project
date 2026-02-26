import { test, expect } from '@playwright/test';

test('submitter can submit and list an idea', async ({ page }) => {
  const uniqueEmail = `submitter+${Date.now()}@epam.com`;
  const uniqueTitle = `Idea-${Date.now()}`;

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
  await page.getByLabel('Title').fill(uniqueTitle);
  await page.getByLabel('Description').fill('Description A');
  await page.getByLabel('Category').selectOption('Other');
  await page.getByRole('button', { name: 'Submit Idea' }).click();

  await expect(page.getByText('Idea submitted').first()).toBeVisible();

  await page.goto('/ideas');
  await page.getByRole('link', { name: uniqueTitle }).click();
  await page.getByRole('button', { name: 'Delete Idea' }).click();
});
