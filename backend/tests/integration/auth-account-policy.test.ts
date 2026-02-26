import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { app } from '../../src/app';
import { migrate } from '../../src/lib/migrate';
import { getDb } from '../../src/lib/db';

describe('auth account policy', () => {
	beforeAll(() => {
		process.env.DATABASE_PATH = path.resolve(`backend/tests/tmp/auth-policy-${Date.now()}.db`);
		fs.mkdirSync(path.dirname(process.env.DATABASE_PATH), { recursive: true });
		process.env.ALLOWED_EMAIL_DOMAINS = 'epam.com';
		migrate();
	});

	beforeEach(() => {
		const db = getDb();
		db.prepare('DELETE FROM password_reset_tokens').run();
		db.prepare('DELETE FROM csrf_tokens').run();
		db.prepare('DELETE FROM sessions').run();
		db.prepare('DELETE FROM users').run();
	});

	it('denies login for suspended account', async () => {
		const email = `suspended-${Date.now()}@epam.com`;

		await request(app)
			.post('/api/auth/register')
			.send({ fullName: 'Suspended User', email, password: 'StrongPass123!', confirmPassword: 'StrongPass123!' })
			.expect(201);

		const db = getDb();
		db.prepare('UPDATE users SET status = ? WHERE email = ?').run('suspended', email);

		await request(app)
			.post('/api/auth/login')
			.send({ email, password: 'StrongPass123!' })
			.expect(401);
	});
});
