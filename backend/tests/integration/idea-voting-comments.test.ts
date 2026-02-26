import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { app } from '../../src/app';
import { migrate } from '../../src/lib/migrate';
import { getDb } from '../../src/lib/db';

describe('idea/comment voting and comment deletion', () => {
  beforeAll(() => {
    process.env.DATABASE_PATH = path.resolve(`backend/tests/tmp/idea-voting-comments-${Date.now()}.db`);
    fs.mkdirSync(path.dirname(process.env.DATABASE_PATH), { recursive: true });
    process.env.ALLOWED_EMAIL_DOMAINS = 'epam.com';
    migrate();
  });

  beforeEach(() => {
    const db = getDb();
    db.prepare('DELETE FROM idea_comment_votes').run();
    db.prepare('DELETE FROM idea_votes').run();
    db.prepare('DELETE FROM idea_comments').run();
    db.prepare('DELETE FROM status_history_entries').run();
    db.prepare('DELETE FROM evaluation_decisions').run();
    db.prepare('DELETE FROM attachments').run();
    db.prepare('DELETE FROM ideas').run();
    db.prepare('DELETE FROM csrf_tokens').run();
    db.prepare('DELETE FROM sessions').run();
    db.prepare('DELETE FROM users').run();
  });

  it('allows idea vote upsert and returns vote aggregates in detail/list', async () => {
    const ownerEmail = `owner-vote-${Date.now()}@epam.com`;
    const voterEmail = `voter-vote-${Date.now()}@epam.com`;
    const password = 'StrongPass123!';

    await request(app)
      .post('/api/auth/register')
      .send({ fullName: 'Owner User', email: ownerEmail, password, confirmPassword: password })
      .expect(201);

    await request(app)
      .post('/api/auth/register')
      .send({ fullName: 'Voter User', email: voterEmail, password, confirmPassword: password })
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

    const createdIdea = await request(app)
      .post('/api/ideas')
      .set('Cookie', ownerCookie)
      .set('X-CSRF-Token', ownerCsrf.body.csrfToken)
      .send({ title: 'Vote Idea', description: 'Vote Desc', category: 'Other', isShared: true })
      .expect(201);

    const voterLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: voterEmail, password })
      .expect(200);

    const voterCookie = voterLogin.headers['set-cookie']?.[0] as string;
    const voterCsrf = await request(app)
      .get('/api/auth/csrf')
      .set('Cookie', voterCookie)
      .expect(200);

    await request(app)
      .put(`/api/ideas/${createdIdea.body.id}/vote`)
      .set('Cookie', voterCookie)
      .set('X-CSRF-Token', voterCsrf.body.csrfToken)
      .send({ value: 1 })
      .expect(200);

    const detail = await request(app)
      .get(`/api/ideas/${createdIdea.body.id}`)
      .set('Cookie', voterCookie)
      .expect(200);

    expect(detail.body.ideaVotesUp).toBe(1);
    expect(detail.body.ideaVotesDown).toBe(0);
    expect(detail.body.ideaVotesTotal).toBe(1);

    const list = await request(app)
      .get('/api/ideas?visibilityScope=all')
      .set('Cookie', voterCookie)
      .expect(200);

    const listedIdea = list.body.items.find((item: { id: string }) => item.id === createdIdea.body.id);
    expect(listedIdea.ideaVotesUp).toBe(1);
    expect(listedIdea.ideaVotesTotal).toBe(1);
  });

  it('allows owner to delete own comment and admin to delete any comment', async () => {
    const ownerEmail = `owner-comment-${Date.now()}@epam.com`;
    const adminEmail = `admin-comment-${Date.now()}@epam.com`;
    const viewerEmail = `viewer-comment-${Date.now()}@epam.com`;
    const password = 'StrongPass123!';

    await request(app)
      .post('/api/auth/register')
      .send({ fullName: 'Owner User', email: ownerEmail, password, confirmPassword: password })
      .expect(201);

    await request(app)
      .post('/api/auth/register')
      .send({ fullName: 'Admin User', email: adminEmail, password, confirmPassword: password })
      .expect(201);

    await request(app)
      .post('/api/auth/register')
      .send({ fullName: 'Viewer User', email: viewerEmail, password, confirmPassword: password })
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

    const idea = await request(app)
      .post('/api/ideas')
      .set('Cookie', ownerCookie)
      .set('X-CSRF-Token', ownerCsrf.body.csrfToken)
      .send({ title: 'Comment Idea', description: 'Desc', category: 'Other', isShared: true })
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

    const comment = await request(app)
      .post(`/api/ideas/${idea.body.id}/comments`)
      .set('Cookie', viewerCookie)
      .set('X-CSRF-Token', viewerCsrf.body.csrfToken)
      .send({ body: 'A comment' })
      .expect(201);

    await request(app)
      .delete(`/api/ideas/${idea.body.id}/comments/${comment.body.id}`)
      .set('Cookie', viewerCookie)
      .set('X-CSRF-Token', viewerCsrf.body.csrfToken)
      .expect(204);

    const comment2 = await request(app)
      .post(`/api/ideas/${idea.body.id}/comments`)
      .set('Cookie', viewerCookie)
      .set('X-CSRF-Token', viewerCsrf.body.csrfToken)
      .send({ body: 'Another comment' })
      .expect(201);

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
      .delete(`/api/ideas/${idea.body.id}/comments/${comment2.body.id}`)
      .set('Cookie', adminCookie)
      .set('X-CSRF-Token', adminCsrf.body.csrfToken)
      .expect(204);
  });
});
