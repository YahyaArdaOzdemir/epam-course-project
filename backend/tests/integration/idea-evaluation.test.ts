import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { app } from '../../src/app';
import { migrate } from '../../src/lib/migrate';
import { getDb } from '../../src/lib/db';

describe('idea evaluation integration', () => {
	beforeAll(() => {
		process.env.DATABASE_PATH = path.resolve(`backend/tests/tmp/idea-eval-${Date.now()}.db`);
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

	it('returns 400 when If-Match header is missing', async () => {
		const email = `admin-${Date.now()}@epam.com`;

		await request(app)
			.post('/api/auth/register')
			.send({ fullName: 'Admin User', email, password: 'StrongPass123!', confirmPassword: 'StrongPass123!' })
			.expect(201);

		const db = getDb();
		db.prepare('UPDATE users SET role = ? WHERE email = ?').run('admin', email);

		const login = await request(app)
			.post('/api/auth/login')
			.send({ email, password: 'StrongPass123!' })
			.expect(200);

		const cookie = login.headers['set-cookie']?.[0] as string;
		const csrf = await request(app)
			.get('/api/auth/csrf')
			.set('Cookie', cookie)
			.expect(200);

		const now = new Date().toISOString();
		db.prepare(
			`INSERT INTO ideas (id, owner_user_id, title, description, category, status, is_shared, row_version, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		).run('idea-eval-1', login.body.userId, 'Idea', 'Desc', 'Other', 'Submitted', 0, 0, now, now);

		await request(app)
			.patch('/api/ideas/idea-eval-1/status')
			.set('Cookie', cookie)
			.set('X-CSRF-Token', csrf.body.csrfToken)
			.send({ toStatus: 'Under Review' })
			.expect(400);
	});

	it('returns 409 on stale optimistic concurrency update', async () => {
		const email = `admin-stale-${Date.now()}@epam.com`;

		await request(app)
			.post('/api/auth/register')
			.send({ fullName: 'Admin User', email, password: 'StrongPass123!', confirmPassword: 'StrongPass123!' })
			.expect(201);

		const db = getDb();
		db.prepare('UPDATE users SET role = ? WHERE email = ?').run('admin', email);

		const login = await request(app)
			.post('/api/auth/login')
			.send({ email, password: 'StrongPass123!' })
			.expect(200);

		const cookie = login.headers['set-cookie']?.[0] as string;
		const csrf = await request(app)
			.get('/api/auth/csrf')
			.set('Cookie', cookie)
			.expect(200);

		const now = new Date().toISOString();
		db.prepare(
			`INSERT INTO ideas (id, owner_user_id, title, description, category, status, is_shared, row_version, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		).run('idea-eval-2', login.body.userId, 'Idea', 'Desc', 'Other', 'Submitted', 0, 1, now, now);

		await request(app)
			.patch('/api/ideas/idea-eval-2/status')
			.set('Cookie', cookie)
			.set('X-CSRF-Token', csrf.body.csrfToken)
			.set('If-Match', '0')
			.send({ toStatus: 'Under Review' })
			.expect(409);
	});
});
