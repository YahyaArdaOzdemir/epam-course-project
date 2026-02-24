import { v4 as uuid } from 'uuid';
import { getDb } from '../lib/db';

export type IdeaRecord = {
  id: string;
  ownerUserId: string;
  title: string;
  description: string;
  category: string;
  status: 'Submitted' | 'Under Review' | 'Accepted' | 'Rejected';
  isShared: boolean;
  rowVersion: number;
  createdAt: string;
  updatedAt: string;
};

const mapIdea = (row: Record<string, unknown>): IdeaRecord => ({
  id: String(row.id),
  ownerUserId: String(row.owner_user_id),
  title: String(row.title),
  description: String(row.description),
  category: String(row.category),
  status: row.status as IdeaRecord['status'],
  isShared: Number(row.is_shared) === 1,
  rowVersion: Number(row.row_version),
  createdAt: String(row.created_at),
  updatedAt: String(row.updated_at),
});

export const ideaRepository = {
  create(input: { ownerUserId: string; title: string; description: string; category: string }): IdeaRecord {
    const db = getDb();
    const id = uuid();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO ideas (id, owner_user_id, title, description, category, status, is_shared, row_version, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'Submitted', 0, 0, ?, ?)`,
    ).run(id, input.ownerUserId, input.title, input.description, input.category, now, now);

    return {
      id,
      ownerUserId: input.ownerUserId,
      title: input.title,
      description: input.description,
      category: input.category,
      status: 'Submitted',
      isShared: false,
      rowVersion: 0,
      createdAt: now,
      updatedAt: now,
    };
  },

  findById(id: string): IdeaRecord | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM ideas WHERE id = ?').get(id);
    return row ? mapIdea(row as Record<string, unknown>) : null;
  },

  listVisible(userId: string, role: 'submitter' | 'evaluator_admin'): IdeaRecord[] {
    const db = getDb();
    const rows =
      role === 'evaluator_admin'
        ? db.prepare('SELECT * FROM ideas ORDER BY created_at DESC').all()
        : db
            .prepare('SELECT * FROM ideas WHERE owner_user_id = ? OR is_shared = 1 ORDER BY created_at DESC')
            .all(userId);

    return (rows as Record<string, unknown>[]).map(mapIdea);
  },

  updateShare(id: string, ownerUserId: string, isShared: boolean, expectedRowVersion: number): IdeaRecord | null {
    const db = getDb();
    const updatedAt = new Date().toISOString();
    const result = db
      .prepare(
        `UPDATE ideas
           SET is_shared = ?, row_version = row_version + 1, updated_at = ?
         WHERE id = ? AND owner_user_id = ? AND row_version = ?`,
      )
      .run(isShared ? 1 : 0, updatedAt, id, ownerUserId, expectedRowVersion);

    if (result.changes === 0) {
      return null;
    }

    return this.findById(id);
  },

  updateStatus(
    id: string,
    toStatus: IdeaRecord['status'],
    expectedRowVersion: number,
  ): IdeaRecord | null {
    const db = getDb();
    const updatedAt = new Date().toISOString();
    const result = db
      .prepare(
        `UPDATE ideas
           SET status = ?, row_version = row_version + 1, updated_at = ?
         WHERE id = ? AND row_version = ?`,
      )
      .run(toStatus, updatedAt, id, expectedRowVersion);

    if (result.changes === 0) {
      return null;
    }

    return this.findById(id);
  },
};
