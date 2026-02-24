import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { app } from '../../src/app';
import { migrate } from '../../src/lib/migrate';

describe('contracts conformance', () => {
  beforeEach(() => {
    process.env.DATABASE_PATH = path.resolve('backend/tests/tmp/contracts.db');
    fs.mkdirSync(path.dirname(process.env.DATABASE_PATH), { recursive: true });
    if (fs.existsSync(process.env.DATABASE_PATH)) fs.unlinkSync(process.env.DATABASE_PATH);
    migrate();
    process.env.ALLOWED_EMAIL_DOMAINS = 'epam.com';
  });

  it('exposes auth and ideas endpoints from contract', async () => {
    const register = await request(app).post('/api/auth/register').send({ email: 'contract@epam.com', password: 'StrongPass123!' });
    expect([201, 400, 409]).toContain(register.status);

    const ideas = await request(app).get('/api/ideas');
    expect([200, 401]).toContain(ideas.status);
  });
});
