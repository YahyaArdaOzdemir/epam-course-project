import { v4 as uuid } from 'uuid';
import { getDb } from '../lib/db';

export type IdeaCommentRecord = {
  id: string;
  ideaId: string;
  authorUserId: string;
  parentCommentId: string | null;
  depth: number;
  body: string;
  createdAt: string;
  updatedAt: string;
  authorEmail: string;
  authorFullName: string;
};

const mapComment = (row: Record<string, unknown>): IdeaCommentRecord => ({
  id: String(row.id),
  ideaId: String(row.idea_id),
  authorUserId: String(row.author_user_id),
  parentCommentId: row.parent_comment_id == null ? null : String(row.parent_comment_id),
  depth: Number(row.depth),
  body: String(row.body),
  createdAt: String(row.created_at),
  updatedAt: String(row.updated_at),
  authorEmail: String(row.author_email),
  authorFullName: String(row.author_full_name),
});

export const ideaCommentRepository = {
  findById(id: string): IdeaCommentRecord | null {
    const db = getDb();
    const row = db
      .prepare(
        `SELECT
          c.*,
          u.email AS author_email,
          u.full_name AS author_full_name
        FROM idea_comments c
        INNER JOIN users u ON u.id = c.author_user_id
        WHERE c.id = ?`,
      )
      .get(id);

    return row ? mapComment(row as Record<string, unknown>) : null;
  },

  listByIdeaId(ideaId: string): IdeaCommentRecord[] {
    const db = getDb();
    const rows = db
      .prepare(
        `SELECT
          c.*,
          u.email AS author_email,
          u.full_name AS author_full_name
        FROM idea_comments c
        INNER JOIN users u ON u.id = c.author_user_id
        WHERE c.idea_id = ?
        ORDER BY c.created_at ASC`,
      )
      .all(ideaId) as Record<string, unknown>[];

    return rows.map(mapComment);
  },

  create(input: {
    ideaId: string;
    authorUserId: string;
    parentCommentId?: string;
    depth: number;
    body: string;
  }): IdeaCommentRecord {
    const db = getDb();
    const id = uuid();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO idea_comments (id, idea_id, author_user_id, parent_comment_id, depth, body, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      input.ideaId,
      input.authorUserId,
      input.parentCommentId ?? null,
      input.depth,
      input.body,
      now,
      now,
    );

    return this.findById(id)!;
  },
};
