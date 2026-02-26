import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { app } from '../../src/app';
import { migrate } from '../../src/lib/migrate';
import { getDb } from '../../src/lib/db';

describe('idea list query integration', () => {
	beforeAll(() => {
		process.env.DATABASE_PATH = path.resolve(`backend/tests/tmp/idea-query-${Date.now()}.db`);
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

	it('returns 400 when query date format is invalid', async () => {
		const email = `query-user-${Date.now()}@epam.com`;

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
			.get('/api/ideas?dateFrom=not-a-date')
			.set('Cookie', cookie)
			.expect(400);
	});

	it('returns deterministic pagination totals for owner scope', async () => {
		const email = `paged-${Date.now()}@epam.com`;

		await request(app)
			.post('/api/auth/register')
			.send({ fullName: 'Paged User', email, password: 'StrongPass123!', confirmPassword: 'StrongPass123!' })
			.expect(201);

		const login = await request(app)
			.post('/api/auth/login')
			.send({ email, password: 'StrongPass123!' })
			.expect(200);

		const cookie = login.headers['set-cookie']?.[0] as string;
		const userId = login.body.userId as string;
		const db = getDb();
		const now = new Date().toISOString();

		db.prepare(
			`INSERT INTO ideas (id, owner_user_id, title, description, category, status, is_shared, row_version, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		).run('idea-q1', userId, 'Q1', 'Desc', 'Other', 'Submitted', 0, 0, now, now);

		db.prepare(
			`INSERT INTO ideas (id, owner_user_id, title, description, category, status, is_shared, row_version, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		).run('idea-q2', userId, 'Q2', 'Desc', 'Other', 'Submitted', 0, 0, now, now);

		const response = await request(app)
			.get('/api/ideas?page=2&pageSize=1')
			.set('Cookie', cookie)
			.expect(200);

		expect(response.body.pagination.page).toBe(2);
		expect(response.body.pagination.pageSize).toBe(1);
		expect(response.body.pagination.totalItems).toBe(2);
		expect(response.body.pagination.totalPages).toBe(2);
		expect(response.body.items).toHaveLength(1);
	});
});
