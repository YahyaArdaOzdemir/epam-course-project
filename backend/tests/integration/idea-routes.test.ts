import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { app } from '../../src/app';
import { migrate } from '../../src/lib/migrate';
import { getDb } from '../../src/lib/db';

describe('idea routes', () => {
  beforeAll(() => {
    process.env.DATABASE_PATH = path.resolve(`backend/tests/tmp/ideas-${Date.now()}.db`);
    fs.mkdirSync(path.dirname(process.env.DATABASE_PATH), { recursive: true });
    process.env.ALLOWED_EMAIL_DOMAINS = 'epam.com';
    migrate();
  });

  beforeEach(() => {
    const db = getDb();
    db.prepare('DELETE FROM status_history_entries').run();
    db.prepare('DELETE FROM evaluation_decisions').run();
    db.prepare('DELETE FROM attachments').run();
    db.prepare('DELETE FROM ideas').run();
    db.prepare('DELETE FROM csrf_tokens').run();
    db.prepare('DELETE FROM sessions').run();
    db.prepare('DELETE FROM users').run();
  });

  it('requires auth for listing ideas', async () => {
    await request(app).get('/api/ideas').expect(401);
  });

  it('returns only owner ideas for submitter on My Ideas route even when others are shared', async () => {
    const submitterEmail = `submitter-${Date.now()}@epam.com`;
    const otherEmail = `other-${Date.now()}@epam.com`;

    await request(app)
      .post('/api/auth/register')
      .send({ fullName: 'Submitter User', email: submitterEmail, password: 'StrongPass123!', confirmPassword: 'StrongPass123!' })
      .expect(201);

    await request(app)
      .post('/api/auth/register')
      .send({ fullName: 'Other User', email: otherEmail, password: 'StrongPass123!', confirmPassword: 'StrongPass123!' })
      .expect(201);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: submitterEmail, password: 'StrongPass123!' })
      .expect(200);

    const cookie = login.headers['set-cookie']?.[0] as string;
    const submitterUserId = login.body.userId as string;

    const db = getDb();
    const otherUser = db.prepare('SELECT id FROM users WHERE email = ?').get(otherEmail) as { id: string };
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO ideas (id, owner_user_id, title, description, category, status, is_shared, row_version, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run('idea-owner', submitterUserId, 'Owner private idea', 'Owned by submitter', 'Other', 'Submitted', 0, 0, now, now);

    db.prepare(
      `INSERT INTO ideas (id, owner_user_id, title, description, category, status, is_shared, row_version, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run('idea-other-shared', otherUser.id, 'Other shared idea', 'Owned by someone else', 'Other', 'Submitted', 1, 0, now, now);

    const response = await request(app)
      .get('/api/ideas')
      .set('Cookie', cookie)
      .expect(200);

    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].id).toBe('idea-owner');
    expect(response.body.items[0].ownerUserId).toBe(submitterUserId);
    expect(response.body.pagination.totalItems).toBe(1);
  });

  it('applies pagination, filters, and sorting query params for list endpoint', async () => {
    const adminEmail = `admin-${Date.now()}@epam.com`;
    const adminPassword = 'StrongPass123!';

    await request(app)
      .post('/api/auth/register')
      .send({ fullName: 'Admin User', email: adminEmail, password: adminPassword, confirmPassword: adminPassword })
      .expect(201);

    const db = getDb();
    db.prepare('UPDATE users SET role = ? WHERE email = ?').run('admin', adminEmail);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(200);

    const cookie = login.headers['set-cookie']?.[0] as string;
    const userId = login.body.userId as string;
    const now = Date.now();
    const oldest = new Date(now - 60_000).toISOString();
    const newer = new Date(now - 30_000).toISOString();
    const latest = new Date(now - 10_000).toISOString();

    db.prepare(
      `INSERT INTO ideas (id, owner_user_id, title, description, category, status, is_shared, row_version, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run('idea-a', userId, 'A', 'A desc', 'Other', 'Submitted', 0, 0, oldest, oldest);

    db.prepare(
      `INSERT INTO ideas (id, owner_user_id, title, description, category, status, is_shared, row_version, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run('idea-b', userId, 'B', 'B desc', 'Other', 'Under Review', 0, 0, newer, newer);

    db.prepare(
      `INSERT INTO ideas (id, owner_user_id, title, description, category, status, is_shared, row_version, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run('idea-c', userId, 'C', 'C desc', 'Other', 'Submitted', 0, 0, latest, latest);

    const filteredPaged = await request(app)
      .get('/api/ideas?page=1&pageSize=1&status=Submitted&category=Other&sortBy=date&sortDirection=Oldest')
      .set('Cookie', cookie)
      .expect(200);

    expect(filteredPaged.body.items).toHaveLength(1);
    expect(filteredPaged.body.items[0].id).toBe('idea-a');
    expect(filteredPaged.body.pagination.page).toBe(1);
    expect(filteredPaged.body.pagination.pageSize).toBe(1);
    expect(filteredPaged.body.pagination.totalItems).toBe(2);
    expect(filteredPaged.body.pagination.totalPages).toBe(2);

    const statusSorted = await request(app)
      .get('/api/ideas?page=1&pageSize=10&sortBy=status&sortDirection=Newest')
      .set('Cookie', cookie)
      .expect(200);

    expect(statusSorted.body.items.map((item: { id: string }) => item.id)).toEqual(['idea-c', 'idea-a', 'idea-b']);
  });

  it('returns 400 for invalid idea list query params', async () => {
    const email = `query-${Date.now()}@epam.com`;

    await request(app)
      .post('/api/auth/register')
      .send({ fullName: 'Query User', email, password: 'StrongPass123!', confirmPassword: 'StrongPass123!' })
      .expect(201);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'StrongPass123!' })
      .expect(200);

    const cookie = login.headers['set-cookie']?.[0] as string;

    await request(app)
      .get('/api/ideas?page=0')
      .set('Cookie', cookie)
      .expect(400);
  });
});
