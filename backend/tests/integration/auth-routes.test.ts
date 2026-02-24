import request from 'supertest';
import path from 'path';
import fs from 'fs';
import { app } from '../../src/app';
import { migrate } from '../../src/lib/migrate';

describe('auth routes', () => {
  beforeEach(() => {
    process.env.DATABASE_PATH = path.resolve('backend/tests/tmp/auth.db');
    fs.mkdirSync(path.dirname(process.env.DATABASE_PATH), { recursive: true });
    if (fs.existsSync(process.env.DATABASE_PATH)) fs.unlinkSync(process.env.DATABASE_PATH);
    migrate();
    process.env.ALLOWED_EMAIL_DOMAINS = 'epam.com';
  });

  it('register/login/logout and role denial baseline', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@epam.com', password: 'StrongPass123!' })
      .expect(201);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@epam.com', password: 'StrongPass123!' })
      .expect(200);

    const token = login.body.token as string;

    await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    await request(app)
      .patch('/api/ideas/idea-1/status')
      .set('Authorization', `Bearer ${token}`)
      .set('If-Match', '0')
      .send({ toStatus: 'Under Review' })
      .expect(403);
  });
});
