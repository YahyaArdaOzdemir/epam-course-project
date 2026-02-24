import { v4 as uuid } from 'uuid';
import { getDb } from '../lib/db';

export type UserRole = 'submitter' | 'evaluator_admin';

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: 'active' | 'suspended';
  createdAt: string;
  updatedAt: string;
};

const mapUser = (row: Record<string, unknown>): UserRecord => ({
  id: String(row.id),
  email: String(row.email),
  passwordHash: String(row.password_hash),
  role: row.role as UserRole,
  status: row.status as 'active' | 'suspended',
  createdAt: String(row.created_at),
  updatedAt: String(row.updated_at),
});

export const userRepository = {
  findByEmail(email: string): UserRecord | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    return row ? mapUser(row as Record<string, unknown>) : null;
  },
  findById(id: string): UserRecord | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    return row ? mapUser(row as Record<string, unknown>) : null;
  },
  create(input: { email: string; passwordHash: string; role?: UserRole }): UserRecord {
    const db = getDb();
    const id = uuid();
    const now = new Date().toISOString();
    const role = input.role ?? 'submitter';

    db.prepare(
      `INSERT INTO users (id, email, password_hash, role, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'active', ?, ?)`,
    ).run(id, input.email, input.passwordHash, role, now, now);

    return {
      id,
      email: input.email,
      passwordHash: input.passwordHash,
      role,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
  },
  updatePassword(id: string, passwordHash: string): void {
    const db = getDb();
    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(passwordHash, new Date().toISOString(), id);
  },
};
