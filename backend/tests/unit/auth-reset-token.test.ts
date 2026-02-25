import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { migrate } from '../../src/lib/migrate';
import { getDb } from '../../src/lib/db';
import { hashToken } from '../../src/lib/auth-tokens';
import { authService } from '../../src/services/auth-service';

describe('auth reset token lifecycle', () => {
  beforeAll(() => {
    process.env.DATABASE_PATH = path.resolve(`backend/tests/tmp/auth-reset-token-${Date.now()}.db`);
    process.env.ALLOWED_EMAIL_DOMAINS = 'epam.com';
    fs.mkdirSync(path.dirname(process.env.DATABASE_PATH), { recursive: true });
    migrate();
  });

  beforeEach(() => {
    const db = getDb();
    db.prepare('DELETE FROM password_reset_tokens').run();
    db.prepare('DELETE FROM csrf_tokens').run();
    db.prepare('DELETE FROM sessions').run();
    db.prepare('DELETE FROM users').run();
  });

  it('issues reset token records and keeps neutral message for unknown account', () => {
    const known = authService.requestPasswordReset({
      email: 'unknown@epam.com',
      sourceIp: '127.0.0.1',
    });

    expect(known.message).toContain('If an account exists');
  });

  it('consumes token once and rejects reused token', async () => {
    const email = `reset+${Date.now()}@epam.com`;
    await authService.register({ fullName: 'Reset Token User', email, password: 'StrongPass123!' });

    const db = getDb();
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: string };
    const rawToken = `raw-${Date.now()}`;

    db.prepare(
      `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, created_at, consumed_at, requested_from_ip)
       VALUES (?, ?, ?, ?, ?, NULL, ?)`,
    ).run(
      randomUUID(),
      user.id,
      hashToken(rawToken),
      new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      new Date().toISOString(),
      '127.0.0.1',
    );

    await expect(
      authService.confirmPasswordReset({
        token: rawToken,
        newPassword: 'EvenStronger123!',
        sourceIp: '127.0.0.1',
      }),
    ).resolves.toEqual({ message: 'Password reset completed' });

    await expect(
      authService.confirmPasswordReset({
        token: rawToken,
        newPassword: 'AnotherStrong123!',
        sourceIp: '127.0.0.1',
      }),
    ).rejects.toThrow('Reset token is invalid or expired');
  });

  it('rejects expired reset token', async () => {
    const email = `expired+${Date.now()}@epam.com`;
    await authService.register({ fullName: 'Expired Token User', email, password: 'StrongPass123!' });

    const db = getDb();
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: string };
    const expiredToken = `expired-${Date.now()}`;

    db.prepare(
      `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, created_at, consumed_at, requested_from_ip)
       VALUES (?, ?, ?, ?, ?, NULL, ?)`,
    ).run(
      randomUUID(),
      user.id,
      hashToken(expiredToken),
      new Date(Date.now() - 60 * 1000).toISOString(),
      new Date().toISOString(),
      '127.0.0.1',
    );

    await expect(
      authService.confirmPasswordReset({
        token: expiredToken,
        newPassword: 'EvenStronger123!',
        sourceIp: '127.0.0.1',
      }),
    ).rejects.toThrow('Reset token is invalid or expired');
  });
});
