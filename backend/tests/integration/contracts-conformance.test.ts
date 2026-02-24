import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { app } from '../../src/app';
import { migrate } from '../../src/lib/migrate';
import { getDb } from '../../src/lib/db';

describe('contracts conformance', () => {
  beforeAll(() => {
    process.env.DATABASE_PATH = path.resolve(`backend/tests/tmp/contracts-${Date.now()}.db`);
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
    db.prepare('DELETE FROM ideas').run();
  });

  it('exposes auth and ideas endpoints from contract', async () => {
    const register = await request(app).post('/api/auth/register').send({ email: 'contract@epam.com', password: 'StrongPass123!' });
    expect([201, 400, 409]).toContain(register.status);

    const ideas = await request(app).get('/api/ideas');
    expect([200, 401]).toContain(ideas.status);
  });

  it('matches auth session/csrf/reset contract status behavior', async () => {
    const email = `contract+${Date.now()}@epam.com`;

    await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'StrongPass123!' })
      .expect(201);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'StrongPass123!' })
      .expect(200);

    const cookie = login.headers['set-cookie']?.[0] as string | undefined;
    expect(login.body.redirectTo).toBe('/dashboard');

    await request(app).get('/api/auth/session').expect(401);
    await request(app)
      .get('/api/auth/session')
      .set('Cookie', cookie ?? '')
      .expect(200);

    await request(app).get('/api/auth/csrf').expect(401);
    const csrf = await request(app)
      .get('/api/auth/csrf')
      .set('Cookie', cookie ?? '')
      .expect(200);
    expect(typeof csrf.body.csrfToken).toBe('string');

    await request(app)
      .post('/api/auth/password-reset/request')
      .send({ email })
      .expect(202);

    const resetInvalid = await request(app)
      .post('/api/auth/password-reset/confirm')
      .send({ token: 'invalid-token', newPassword: 'StrongPass123!' })
      .expect(400);

    expect(resetInvalid.body.code).toBe('AUTH_RESET_TOKEN_INVALID');
  });
});
