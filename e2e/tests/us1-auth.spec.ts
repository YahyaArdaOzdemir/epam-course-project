import { test, expect } from '@playwright/test';
import path from 'path';
import { createHash, randomUUID } from 'crypto';
import Database from 'better-sqlite3';

const dbPath = process.env.DATABASE_PATH ?? path.resolve('backend/data/app.db');

const tokenHash = (value: string): string => createHash('sha256').update(value).digest('hex');

const insertResetToken = (email: string, rawToken: string, expiresAt: Date): void => {
  const db = new Database(dbPath);
  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: string } | undefined;
  if (!user) {
    db.close();
    throw new Error(`User not found for reset token seeding: ${email}`);
  }

  db.prepare(
    `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, created_at, consumed_at, requested_from_ip)
     VALUES (?, ?, ?, ?, ?, NULL, ?)`,
  ).run(randomUUID(), user.id, tokenHash(rawToken), expiresAt.toISOString(), new Date().toISOString(), '127.0.0.1');
  db.close();
};

test('register-login-logout and protected role path', async ({ page }) => {
  const uniqueEmail = `employee+${Date.now()}@epam.com`;

  await page.goto('/register');
  await page.getByLabel('Full Name').fill('Auth E2E User');
  await page.getByLabel('Email').fill(uniqueEmail);
  await page.getByLabel(/^Password$/).fill('StrongPass123!');
  await page.getByLabel('Confirm Password').fill('StrongPass123!');
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page.getByText('Registered successfully').first()).toBeVisible();

  await page.goto('/login');
  await page.getByLabel('Email').fill(uniqueEmail);
  await page.getByLabel(/^Password$/).fill('StrongPass123!');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('**/dashboard');

  await expect(page.getByText('Dashboard').first()).toBeVisible();
  await page.getByRole('button', { name: 'Logout' }).click();
  await page.waitForURL('**/');
});

test('denies direct protected route access and keeps session across refresh', async ({ page }) => {
  const uniqueEmail = `refresh+${Date.now()}@epam.com`;

  await page.goto('/dashboard');
  await page.waitForURL('**/login');

  await page.goto('/register');
  await page.getByLabel('Full Name').fill('Session E2E User');
  await page.getByLabel('Email').fill(uniqueEmail);
  await page.getByLabel(/^Password$/).fill('StrongPass123!');
  await page.getByLabel('Confirm Password').fill('StrongPass123!');
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page.getByText('Registered successfully').first()).toBeVisible();

  await page.goto('/login');
  await page.getByLabel('Email').fill(uniqueEmail);
  await page.getByLabel(/^Password$/).fill('StrongPass123!');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('**/dashboard');

  await page.reload();
  await page.waitForURL('**/dashboard');
  await expect(page.getByText('Dashboard').first()).toBeVisible();
});

test('supports reset success and rejects expired/reused reset tokens', async ({ page, request }) => {
  const uniqueEmail = `reset+${Date.now()}@epam.com`;
  const oldPassword = 'StrongPass123!';
  const newPassword = 'EvenStronger123!';
  const validToken = `valid-${Date.now()}`;
  const expiredToken = `expired-${Date.now()}`;

  await request.post('http://localhost:3000/api/auth/register', {
    data: {
      fullName: 'Reset E2E User',
      email: uniqueEmail,
      password: oldPassword,
      confirmPassword: oldPassword,
    },
  });

  insertResetToken(uniqueEmail, validToken, new Date(Date.now() + 20 * 60 * 1000));
  insertResetToken(uniqueEmail, expiredToken, new Date(Date.now() - 60 * 1000));

  await page.goto(`/reset-password/confirm?token=${expiredToken}`);
  await page.getByLabel('New Password').fill('StrongPass123!');
  await page.getByRole('button', { name: 'Reset password' }).click();
  await expect(page.getByText('Reset link is invalid or expired. Request a new one.').first()).toBeVisible();

  await page.goto(`/reset-password/confirm?token=${validToken}`);
  await page.getByLabel('New Password').fill(newPassword);
  await page.getByRole('button', { name: 'Reset password' }).click();
  await expect(page.getByText('Password reset completed').first()).toBeVisible();

  await page.goto('/reset-password/confirm');
  await page.getByLabel('Reset Token').fill(validToken);
  await page.getByLabel('New Password').fill('AnotherStrong123!');
  await page.getByRole('button', { name: 'Reset password' }).click();
  await expect(page.getByText('Reset link is invalid or expired. Request a new one.').first()).toBeVisible();

  await page.goto('/login');
  await page.getByLabel('Email').fill(uniqueEmail);
  await page.getByLabel(/^Password$/).fill(oldPassword);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByText('Email or password is incorrect.').first()).toBeVisible();

  await page.getByLabel(/^Password$/).fill(newPassword);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('**/dashboard');
});
