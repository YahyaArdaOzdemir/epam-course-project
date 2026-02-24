import { v4 as uuid } from 'uuid';
import { getDb } from '../lib/db';

export type PasswordResetTokenRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
  consumedAt: string | null;
  requestedFromIp: string | null;
};

const mapRecord = (row: Record<string, unknown>): PasswordResetTokenRecord => ({
  id: String(row.id),
  userId: String(row.user_id),
  tokenHash: String(row.token_hash),
  expiresAt: String(row.expires_at),
  createdAt: String(row.created_at),
  consumedAt: row.consumed_at ? String(row.consumed_at) : null,
  requestedFromIp: row.requested_from_ip ? String(row.requested_from_ip) : null,
});

export const passwordResetRepository = {
  create(input: { userId: string; tokenHash: string; ttlMinutes: number; requestedFromIp?: string | null }): PasswordResetTokenRecord {
    const db = getDb();
    const id = uuid();
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + input.ttlMinutes * 60 * 1000);

    db.prepare(
      `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, created_at, consumed_at, requested_from_ip)
       VALUES (?, ?, ?, ?, ?, NULL, ?)`,
    ).run(id, input.userId, input.tokenHash, expiresAt.toISOString(), createdAt.toISOString(), input.requestedFromIp ?? null);

    return {
      id,
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: expiresAt.toISOString(),
      createdAt: createdAt.toISOString(),
      consumedAt: null,
      requestedFromIp: input.requestedFromIp ?? null,
    };
  },

  findActiveByTokenHash(tokenHash: string): PasswordResetTokenRecord | null {
    const db = getDb();
    const row = db
      .prepare(
        `SELECT * FROM password_reset_tokens
         WHERE token_hash = ? AND consumed_at IS NULL
         ORDER BY created_at DESC
         LIMIT 1`,
      )
      .get(tokenHash);

    return row ? mapRecord(row as Record<string, unknown>) : null;
  },

  consume(tokenId: string): void {
    const db = getDb();
    db.prepare('UPDATE password_reset_tokens SET consumed_at = ? WHERE id = ?').run(new Date().toISOString(), tokenId);
  },

  consumeAllForUser(userId: string): void {
    const db = getDb();
    db.prepare('UPDATE password_reset_tokens SET consumed_at = COALESCE(consumed_at, ?) WHERE user_id = ?').run(
      new Date().toISOString(),
      userId,
    );
  },
};
