import request from 'supertest';
import path from 'path';
import fs from 'fs';
import { app } from '../../src/app';
import { migrate } from '../../src/lib/migrate';
import { getDb } from '../../src/lib/db';
import { hashToken } from '../../src/lib/auth-tokens';
import { randomUUID } from 'crypto';

describe('auth routes', () => {
  beforeAll(() => {
    process.env.DATABASE_PATH = path.resolve(`backend/tests/tmp/auth-${Date.now()}.db`);
    fs.mkdirSync(path.dirname(process.env.DATABASE_PATH), { recursive: true });
    migrate();
    process.env.ALLOWED_EMAIL_DOMAINS = 'epam.com';
  });

  beforeEach(() => {
    const db = getDb();
    db.prepare('DELETE FROM password_reset_tokens').run();
    db.prepare('DELETE FROM csrf_tokens').run();
    db.prepare('DELETE FROM sessions').run();
    db.prepare('DELETE FROM users').run();
  });

  it('register/login/logout and role denial baseline', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ fullName: 'Auth Route User', email: 'a@epam.com', password: 'StrongPass123!', confirmPassword: 'StrongPass123!' })
      .expect(201);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@epam.com', password: 'StrongPass123!' })
      .expect(200);

    const cookie = login.headers['set-cookie']?.[0] as string | undefined;
    expect(cookie).toBeDefined();

    const csrf = await request(app)
      .get('/api/auth/csrf')
      .set('Cookie', cookie ?? '')
      .expect(200);

    const csrfToken = csrf.body.csrfToken as string;

    await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookie ?? '')
      .set('X-CSRF-Token', csrfToken)
      .expect(204);

    await request(app)
      .patch('/api/ideas/idea-1/status')
      .set('Cookie', cookie ?? '')
      .set('X-CSRF-Token', csrfToken)
      .set('If-Match', '0')
      .send({ toStatus: 'Under Review' })
      .expect(401);
  });

  it('rejects duplicate register and issues secure session cookie on login', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ fullName: 'Duplicate User', email: 'dup@epam.com', password: 'StrongPass123!', confirmPassword: 'StrongPass123!' })
      .expect(201);

    const duplicate = await request(app)
      .post('/api/auth/register')
      .send({ fullName: 'Duplicate User', email: 'dup@epam.com', password: 'StrongPass123!', confirmPassword: 'StrongPass123!' })
      .expect(409);

    expect(['AUTH_EMAIL_EXISTS', 'CONFLICT']).toContain(duplicate.body.code);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'dup@epam.com', password: 'StrongPass123!' })
      .expect(200);

    const setCookie = (login.headers['set-cookie']?.[0] ?? '') as string;
    expect(setCookie).toContain('innovatepam_session=');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('Secure');
    expect(setCookie).toContain('SameSite=Lax');
  });

  it('returns 401 for invalid /auth/session and /auth/csrf calls', async () => {
    const session = await request(app)
      .get('/api/auth/session')
      .expect(401);

    expect(session.body.code).toBe('UNAUTHORIZED');

    const csrf = await request(app)
      .get('/api/auth/csrf')
      .expect(401);

    expect(csrf.body.code).toBe('UNAUTHORIZED');
  });

  it('returns valid /auth/session and /auth/csrf payloads with active cookie session', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ fullName: 'Session User', email: 'session@epam.com', password: 'StrongPass123!', confirmPassword: 'StrongPass123!' })
      .expect(201);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'session@epam.com', password: 'StrongPass123!' })
      .expect(200);

    const cookie = login.headers['set-cookie']?.[0] as string;

    const session = await request(app)
      .get('/api/auth/session')
      .set('Cookie', cookie)
      .expect(200);

    expect(session.body.authenticated).toBe(true);
    expect(session.body.userId).toBe(login.body.userId);
    expect(session.body.role).toBe('submitter');
    expect(typeof session.body.expiresAt).toBe('string');

    const csrf = await request(app)
      .get('/api/auth/csrf')
      .set('Cookie', cookie)
      .expect(200);

    expect(typeof csrf.body.csrfToken).toBe('string');
    expect(csrf.body.csrfToken.length).toBeGreaterThan(10);
  });

  it('accepts valid reset token once and denies token reuse', async () => {
    const email = `reset+${Date.now()}@epam.com`;
    const oldPassword = 'StrongPass123!';
    const newPassword = 'EvenStronger123!';
    const resetToken = `token-${Date.now()}`;

    await request(app)
      .post('/api/auth/register')
      .send({ fullName: 'Reset User', email, password: oldPassword, confirmPassword: oldPassword })
      .expect(201);

    const db = getDb();
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: string };
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000).toISOString();

    db.prepare(
      `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, created_at, consumed_at, requested_from_ip)
       VALUES (?, ?, ?, ?, ?, NULL, ?)`,
    ).run(randomUUID(), user.id, hashToken(resetToken), expiresAt, now.toISOString(), '127.0.0.1');

    await request(app)
      .post('/api/auth/password-reset/confirm')
      .send({ token: resetToken, newPassword })
      .expect(200);

    const reuse = await request(app)
      .post('/api/auth/password-reset/confirm')
      .send({ token: resetToken, newPassword: 'AnotherStrong123!' })
      .expect(400);

    expect(reuse.body.code).toBe('AUTH_RESET_TOKEN_INVALID');

    await request(app)
      .post('/api/auth/login')
      .send({ email, password: oldPassword })
      .expect(401);

    await request(app)
      .post('/api/auth/login')
      .send({ email, password: newPassword })
      .expect(200);
  });
});
