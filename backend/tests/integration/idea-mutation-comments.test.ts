import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { app } from '../../src/app';
import { migrate } from '../../src/lib/migrate';
import { getDb } from '../../src/lib/db';

describe('idea mutations and threaded comments', () => {
  beforeAll(() => {
    process.env.DATABASE_PATH = path.resolve(`backend/tests/tmp/idea-mutations-${Date.now()}.db`);
    fs.mkdirSync(path.dirname(process.env.DATABASE_PATH), { recursive: true });
    process.env.ALLOWED_EMAIL_DOMAINS = 'epam.com';
    migrate();
  });

  beforeEach(() => {
    const db = getDb();
    db.prepare('DELETE FROM idea_comments').run();
    db.prepare('DELETE FROM status_history_entries').run();
    db.prepare('DELETE FROM evaluation_decisions').run();
    db.prepare('DELETE FROM attachments').run();
    db.prepare('DELETE FROM ideas').run();
    db.prepare('DELETE FROM csrf_tokens').run();
    db.prepare('DELETE FROM sessions').run();
    db.prepare('DELETE FROM users').run();
  });

  it('allows owner to edit own submitted idea', async () => {
    const email = `owner-${Date.now()}@epam.com`;
    const password = 'StrongPass123!';

    await request(app)
      .post('/api/auth/register')
      .send({ fullName: 'Owner User', email, password, confirmPassword: password })
      .expect(201);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    const cookie = login.headers['set-cookie']?.[0] as string;
    const csrf = await request(app)
      .get('/api/auth/csrf')
      .set('Cookie', cookie)
      .expect(200);

    const create = await request(app)
      .post('/api/ideas')
      .set('Cookie', cookie)
      .set('X-CSRF-Token', csrf.body.csrfToken)
      .send({ title: 'Old', description: 'Old desc', category: 'Other' })
      .expect(201);

    const update = await request(app)
      .patch(`/api/ideas/${create.body.id}`)
      .set('Cookie', cookie)
      .set('X-CSRF-Token', csrf.body.csrfToken)
      .set('If-Match', String(create.body.rowVersion))
      .send({ title: 'New', description: 'New desc', category: 'Cost Saving' })
      .expect(200);

    expect(update.body.title).toBe('New');
    expect(update.body.category).toBe('Cost Saving');
  });

  it('allows admin to delete any idea status', async () => {
    const ownerEmail = `owner2-${Date.now()}@epam.com`;
    const adminEmail = `admin2-${Date.now()}@epam.com`;
    const password = 'StrongPass123!';

    await request(app)
      .post('/api/auth/register')
      .send({ fullName: 'Owner User', email: ownerEmail, password, confirmPassword: password })
      .expect(201);

    await request(app)
      .post('/api/auth/register')
      .send({ fullName: 'Admin User', email: adminEmail, password, confirmPassword: password })
      .expect(201);

    const db = getDb();
    db.prepare('UPDATE users SET role = ? WHERE email = ?').run('admin', adminEmail);

    const ownerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: ownerEmail, password })
      .expect(200);

    const ownerCookie = ownerLogin.headers['set-cookie']?.[0] as string;
    const ownerCsrf = await request(app)
      .get('/api/auth/csrf')
      .set('Cookie', ownerCookie)
      .expect(200);

    const created = await request(app)
      .post('/api/ideas')
      .set('Cookie', ownerCookie)
      .set('X-CSRF-Token', ownerCsrf.body.csrfToken)
      .send({ title: 'Delete me', description: 'Desc', category: 'Other' })
      .expect(201);

    await request(app)
      .patch(`/api/ideas/${created.body.id}/status`)
      .set('Cookie', ownerCookie)
      .set('X-CSRF-Token', ownerCsrf.body.csrfToken)
      .set('If-Match', String(created.body.rowVersion))
      .send({ toStatus: 'Under Review' });

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail, password })
      .expect(200);

    const adminCookie = adminLogin.headers['set-cookie']?.[0] as string;
    const adminCsrf = await request(app)
      .get('/api/auth/csrf')
      .set('Cookie', adminCookie)
      .expect(200);

    await request(app)
      .delete(`/api/ideas/${created.body.id}`)
      .set('Cookie', adminCookie)
      .set('X-CSRF-Token', adminCsrf.body.csrfToken)
      .expect(204);
  });

  it('supports commenting and replying up to depth 5', async () => {
    const ownerEmail = `owner3-${Date.now()}@epam.com`;
    const viewerEmail = `viewer3-${Date.now()}@epam.com`;
    const password = 'StrongPass123!';

    await request(app)
      .post('/api/auth/register')
      .send({ fullName: 'Owner User', email: ownerEmail, password, confirmPassword: password })
      .expect(201);

    await request(app)
      .post('/api/auth/register')
      .send({ fullName: 'Viewer User', email: viewerEmail, password, confirmPassword: password })
      .expect(201);

    const ownerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: ownerEmail, password })
      .expect(200);

    const ownerCookie = ownerLogin.headers['set-cookie']?.[0] as string;
    const ownerCsrf = await request(app)
      .get('/api/auth/csrf')
      .set('Cookie', ownerCookie)
      .expect(200);

    const idea = await request(app)
      .post('/api/ideas')
      .set('Cookie', ownerCookie)
      .set('X-CSRF-Token', ownerCsrf.body.csrfToken)
      .send({ title: 'Shared', description: 'Desc', category: 'Other', isShared: true })
      .expect(201);

    const viewerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: viewerEmail, password })
      .expect(200);

    const viewerCookie = viewerLogin.headers['set-cookie']?.[0] as string;
    const viewerCsrf = await request(app)
      .get('/api/auth/csrf')
      .set('Cookie', viewerCookie)
      .expect(200);

    const created: string[] = [];

    const root = await request(app)
      .post(`/api/ideas/${idea.body.id}/comments`)
      .set('Cookie', viewerCookie)
      .set('X-CSRF-Token', viewerCsrf.body.csrfToken)
      .send({ body: 'root' })
      .expect(201);

    created.push(root.body.id);

    for (let i = 0; i < 4; i += 1) {
      const reply = await request(app)
        .post(`/api/ideas/${idea.body.id}/comments`)
        .set('Cookie', viewerCookie)
        .set('X-CSRF-Token', viewerCsrf.body.csrfToken)
        .send({ body: `reply-${i}`, parentCommentId: created[created.length - 1] })
        .expect(201);

      created.push(reply.body.id);
    }

    await request(app)
      .post(`/api/ideas/${idea.body.id}/comments`)
      .set('Cookie', viewerCookie)
      .set('X-CSRF-Token', viewerCsrf.body.csrfToken)
      .send({ body: 'too-deep', parentCommentId: created[created.length - 1] })
      .expect(400);

    const list = await request(app)
      .get(`/api/ideas/${idea.body.id}/comments`)
      .set('Cookie', viewerCookie)
      .expect(200);

    expect(Array.isArray(list.body.items)).toBe(true);
    expect(list.body.items.length).toBeGreaterThanOrEqual(5);
  });
});
