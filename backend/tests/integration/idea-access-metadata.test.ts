import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { app } from '../../src/app';
import { migrate } from '../../src/lib/migrate';
import { getDb } from '../../src/lib/db';

describe('idea access and metadata integration', () => {
	beforeAll(() => {
		process.env.DATABASE_PATH = path.resolve(`backend/tests/tmp/idea-access-${Date.now()}.db`);
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

	it('returns idea details with attachment metadata for owner', async () => {
		const email = `owner-${Date.now()}@epam.com`;

		await request(app)
			.post('/api/auth/register')
			.send({ fullName: 'Owner User', email, password: 'StrongPass123!', confirmPassword: 'StrongPass123!' })
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
		).run('idea-meta-1', userId, 'Idea', 'Desc', 'Other', 'Submitted', 0, 0, now, now);

		db.prepare(
			`INSERT INTO attachments (id, idea_id, original_file_name, stored_file_name, mime_type, size_bytes, storage_path, uploaded_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		).run('att-1', 'idea-meta-1', 'deck.pdf', 'stored.pdf', 'application/pdf', 4096, '/tmp/stored.pdf', now);

		const details = await request(app)
			.get('/api/ideas/idea-meta-1')
			.set('Cookie', cookie)
			.expect(200);

		expect(details.body.id).toBe('idea-meta-1');
		expect(details.body.attachment.originalFileName).toBe('deck.pdf');
		expect(details.body.attachment.url).toBe('/uploads/stored.pdf');
	});

	it('denies non-owner submitter from idea details route', async () => {
		const ownerEmail = `owner-2-${Date.now()}@epam.com`;
		const otherEmail = `other-2-${Date.now()}@epam.com`;

		await request(app)
			.post('/api/auth/register')
			.send({ fullName: 'Owner User', email: ownerEmail, password: 'StrongPass123!', confirmPassword: 'StrongPass123!' })
			.expect(201);

		await request(app)
			.post('/api/auth/register')
			.send({ fullName: 'Other User', email: otherEmail, password: 'StrongPass123!', confirmPassword: 'StrongPass123!' })
			.expect(201);

		const ownerLogin = await request(app)
			.post('/api/auth/login')
			.send({ email: ownerEmail, password: 'StrongPass123!' })
			.expect(200);
		const ownerId = ownerLogin.body.userId as string;

		const otherLogin = await request(app)
			.post('/api/auth/login')
			.send({ email: otherEmail, password: 'StrongPass123!' })
			.expect(200);

		const otherCookie = otherLogin.headers['set-cookie']?.[0] as string;
		const db = getDb();
		const now = new Date().toISOString();

		db.prepare(
			`INSERT INTO ideas (id, owner_user_id, title, description, category, status, is_shared, row_version, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		).run('idea-private-1', ownerId, 'Private', 'Desc', 'Other', 'Submitted', 0, 0, now, now);

		await request(app)
			.get('/api/ideas/idea-private-1')
			.set('Cookie', otherCookie)
			.expect(403);
	});
});
