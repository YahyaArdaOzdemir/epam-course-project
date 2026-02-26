import { test, expect } from '@playwright/test';
import path from 'path';
import Database from 'better-sqlite3';

const dbPath = process.env.DATABASE_PATH ?? path.resolve('backend/data/app.db');

test('evaluator updates status and handles stale conflicts', async ({ page, request }) => {
  const uniqueEmail = `evaluator+${Date.now()}@epam.com`;
  const password = 'StrongPass123!';

  await request.post('http://localhost:3000/api/auth/register', {
    data: {
      fullName: 'Evaluator E2E User',
      email: uniqueEmail,
      password,
      confirmPassword: password,
    },
  });

  const db = new Database(dbPath);
  db.prepare('UPDATE users SET role = ? WHERE email = ?').run('admin', uniqueEmail);
  db.close();

  await page.goto('/login');
  await page.getByLabel('Email').fill(uniqueEmail);
  await page.getByLabel(/^Password$/).fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('**/dashboard');

  await page.goto('/evaluation');
  await expect(page.getByRole('heading', { name: 'Evaluation Queue' })).toBeVisible();
});
