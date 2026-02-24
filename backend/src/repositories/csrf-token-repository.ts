import { v4 as uuid } from 'uuid';
import { getDb } from '../lib/db';

export type CsrfTokenRecord = {
  id: string;
  sessionId: string;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
  revokedAt: string | null;
};

const mapRecord = (row: Record<string, unknown>): CsrfTokenRecord => ({
  id: String(row.id),
  sessionId: String(row.session_id),
  tokenHash: String(row.token_hash),
  expiresAt: String(row.expires_at),
  createdAt: String(row.created_at),
  revokedAt: row.revoked_at ? String(row.revoked_at) : null,
});

export const csrfTokenRepository = {
  issue(input: { sessionId: string; tokenHash: string; ttlMinutes: number }): CsrfTokenRecord {
    const db = getDb();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + input.ttlMinutes * 60 * 1000).toISOString();
    const id = uuid();

    db.prepare('UPDATE csrf_tokens SET revoked_at = ? WHERE session_id = ? AND revoked_at IS NULL').run(now.toISOString(), input.sessionId);

    db.prepare(
      `INSERT INTO csrf_tokens (id, session_id, token_hash, expires_at, created_at, revoked_at)
       VALUES (?, ?, ?, ?, ?, NULL)`,
    ).run(id, input.sessionId, input.tokenHash, expiresAt, now.toISOString());

    return {
      id,
      sessionId: input.sessionId,
      tokenHash: input.tokenHash,
      expiresAt,
      createdAt: now.toISOString(),
      revokedAt: null,
    };
  },

  findActive(input: { sessionId: string; tokenHash: string }): CsrfTokenRecord | null {
    const db = getDb();
    const row = db
      .prepare(
        `SELECT * FROM csrf_tokens
         WHERE session_id = ? AND token_hash = ? AND revoked_at IS NULL
         ORDER BY created_at DESC
         LIMIT 1`,
      )
      .get(input.sessionId, input.tokenHash);

    return row ? mapRecord(row as Record<string, unknown>) : null;
  },
};
