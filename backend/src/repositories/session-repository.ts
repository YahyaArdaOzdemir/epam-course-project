import { v4 as uuid } from 'uuid';
import { getDb } from '../lib/db';

export type SessionRecord = {
  id: string;
  userId: string;
  jwtId: string | null;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
  revokedAt: string | null;
  createdFromIp: string | null;
  createdFromUserAgent: string | null;
};

const mapRecord = (row: Record<string, unknown>): SessionRecord => ({
  id: String(row.id),
  userId: String(row.user_id),
  jwtId: row.jwt_id ? String(row.jwt_id) : null,
  tokenHash: String(row.token_hash),
  expiresAt: String(row.expires_at),
  createdAt: String(row.created_at),
  revokedAt: row.revoked_at ? String(row.revoked_at) : null,
  createdFromIp: row.created_from_ip ? String(row.created_from_ip) : null,
  createdFromUserAgent: row.created_from_user_agent ? String(row.created_from_user_agent) : null,
});

export const sessionRepository = {
  create(input: {
    userId: string;
    tokenHash: string;
    ttlHours: number;
    jwtId?: string;
    createdFromIp?: string | null;
    createdFromUserAgent?: string | null;
  }): SessionRecord {
    const db = getDb();
    const id = uuid();
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + input.ttlHours * 60 * 60 * 1000);

    db.prepare(
      `INSERT INTO sessions
        (id, user_id, jwt_id, token_hash, expires_at, created_at, revoked_at, created_from_ip, created_from_user_agent)
       VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
    ).run(
      id,
      input.userId,
      input.jwtId ?? null,
      input.tokenHash,
      expiresAt.toISOString(),
      createdAt.toISOString(),
      input.createdFromIp ?? null,
      input.createdFromUserAgent ?? null,
    );

    return {
      id,
      userId: input.userId,
      jwtId: input.jwtId ?? null,
      tokenHash: input.tokenHash,
      expiresAt: expiresAt.toISOString(),
      createdAt: createdAt.toISOString(),
      revokedAt: null,
      createdFromIp: input.createdFromIp ?? null,
      createdFromUserAgent: input.createdFromUserAgent ?? null,
    };
  },
  findActiveByTokenHash(tokenHash: string): SessionRecord | null {
    const db = getDb();
    const row = db
      .prepare(
        `SELECT * FROM sessions
         WHERE token_hash = ? AND revoked_at IS NULL
         ORDER BY created_at DESC
         LIMIT 1`,
      )
      .get(tokenHash);

    return row ? mapRecord(row as Record<string, unknown>) : null;
  },
  revokeById(id: string): void {
    const db = getDb();
    db.prepare('UPDATE sessions SET revoked_at = ? WHERE id = ?').run(new Date().toISOString(), id);
  },
  revokeByUserId(userId: string): void {
    const db = getDb();
    db.prepare('UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL').run(new Date().toISOString(), userId);
  },
  revokeByTokenHash(tokenHash: string): void {
    const db = getDb();
    db.prepare('UPDATE sessions SET revoked_at = ? WHERE token_hash = ?').run(new Date().toISOString(), tokenHash);
  },
};
