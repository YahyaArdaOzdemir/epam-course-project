import { v4 as uuid } from 'uuid';
import { getDb } from '../lib/db';

export type SessionRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
  revokedAt: string | null;
};

export const sessionRepository = {
  create(input: { userId: string; tokenHash: string; ttlHours: number }): SessionRecord {
    const db = getDb();
    const id = uuid();
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + input.ttlHours * 60 * 60 * 1000);

    db.prepare(
      `INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at, revoked_at)
       VALUES (?, ?, ?, ?, ?, NULL)`,
    ).run(id, input.userId, input.tokenHash, expiresAt.toISOString(), createdAt.toISOString());

    return {
      id,
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: expiresAt.toISOString(),
      createdAt: createdAt.toISOString(),
      revokedAt: null,
    };
  },
  revokeByTokenHash(tokenHash: string): void {
    const db = getDb();
    db.prepare('UPDATE sessions SET revoked_at = ? WHERE token_hash = ?').run(new Date().toISOString(), tokenHash);
  },
};
