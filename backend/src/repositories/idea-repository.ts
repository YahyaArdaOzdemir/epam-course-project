import { v4 as uuid } from 'uuid';
import { getDb } from '../lib/db';
import { IdeaListQuery } from '../validators/idea-query-validator';

export type IdeaRecord = {
  id: string;
  ownerUserId: string;
  ownerFullName?: string;
  title: string;
  description: string;
  category: string;
  status: 'Submitted' | 'Under Review' | 'Accepted' | 'Rejected';
  isShared: boolean;
  rowVersion: number;
  latestEvaluationComment: string | null;
  ideaVotesUp?: number;
  ideaVotesDown?: number;
  ideaVotesTotal?: number;
  createdAt: string;
  updatedAt: string;
};

const mapIdea = (row: Record<string, unknown>): IdeaRecord => ({
  id: String(row.id),
  ownerUserId: String(row.owner_user_id),
  ownerFullName: row.owner_full_name == null ? undefined : String(row.owner_full_name),
  title: String(row.title),
  description: String(row.description),
  category: String(row.category),
  status: row.status as IdeaRecord['status'],
  isShared: Number(row.is_shared) === 1,
  rowVersion: Number(row.row_version),
  latestEvaluationComment: row.latest_evaluation_comment == null ? null : String(row.latest_evaluation_comment),
  ideaVotesUp: Number(row.idea_votes_up ?? 0),
  ideaVotesDown: Number(row.idea_votes_down ?? 0),
  ideaVotesTotal: Number(row.idea_votes_total ?? 0),
  createdAt: String(row.created_at),
  updatedAt: String(row.updated_at),
});

export type PaginatedIdeaListResult = {
  items: IdeaRecord[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

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
      ownerFullName: undefined,
      title: input.title,
      description: input.description,
      category: input.category,
      status: 'Submitted',
      isShared: false,
      rowVersion: 0,
      latestEvaluationComment: null,
      ideaVotesUp: 0,
      ideaVotesDown: 0,
      ideaVotesTotal: 0,
      createdAt: now,
      updatedAt: now,
    };
  },

  createWithSharing(input: { ownerUserId: string; title: string; description: string; category: string; isShared: boolean }): IdeaRecord {
    const db = getDb();
    const id = uuid();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO ideas (id, owner_user_id, title, description, category, status, is_shared, row_version, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'Submitted', ?, 0, ?, ?)`,
    ).run(id, input.ownerUserId, input.title, input.description, input.category, input.isShared ? 1 : 0, now, now);

    return {
      id,
      ownerUserId: input.ownerUserId,
      ownerFullName: undefined,
      title: input.title,
      description: input.description,
      category: input.category,
      status: 'Submitted',
      isShared: input.isShared,
      rowVersion: 0,
      latestEvaluationComment: null,
      ideaVotesUp: 0,
      ideaVotesDown: 0,
      ideaVotesTotal: 0,
      createdAt: now,
      updatedAt: now,
    };
  },

  findById(id: string): IdeaRecord | null {
    const db = getDb();
    const row = db
      .prepare(
        `SELECT
            ideas.*,
          users.full_name AS owner_full_name,
            (
              SELECT decision.comment
              FROM evaluation_decisions AS decision
              WHERE decision.idea_id = ideas.id
              ORDER BY decision.created_at DESC
              LIMIT 1
            ) AS latest_evaluation_comment
            ,(
              SELECT COUNT(*)
              FROM idea_votes AS iv
              WHERE iv.idea_id = ideas.id AND iv.value = 1
            ) AS idea_votes_up
            ,(
              SELECT COUNT(*)
              FROM idea_votes AS iv
              WHERE iv.idea_id = ideas.id AND iv.value = -1
            ) AS idea_votes_down
            ,(
              SELECT COUNT(*)
              FROM idea_votes AS iv
              WHERE iv.idea_id = ideas.id
            ) AS idea_votes_total
         FROM ideas
        INNER JOIN users ON users.id = ideas.owner_user_id
         WHERE ideas.id = ?`,
      )
      .get(id);
    return row ? mapIdea(row as Record<string, unknown>) : null;
  },

  listVisible(input: { userId: string; role: 'submitter' | 'admin'; query: IdeaListQuery }): PaginatedIdeaListResult {
    const db = getDb();
    const whereClauses: string[] = [];
    const whereParams: Array<string | number> = [];

    if (input.role === 'admin') {
      if (input.query.visibilityScope === 'owner') {
        whereClauses.push('ideas.owner_user_id = ?');
        whereParams.push(input.userId);
      }
    } else if (input.query.visibilityScope === 'all') {
      whereClauses.push('(ideas.owner_user_id = ? OR ideas.is_shared = 1)');
      whereParams.push(input.userId);
    } else {
      whereClauses.push('ideas.owner_user_id = ?');
      whereParams.push(input.userId);
    }

    if (input.query.status) {
      whereClauses.push('ideas.status = ?');
      whereParams.push(input.query.status);
    }

    if (input.query.category) {
      whereClauses.push('ideas.category = ?');
      whereParams.push(input.query.category);
    }

    if (input.query.dateFrom) {
      whereClauses.push('ideas.created_at >= ?');
      whereParams.push(input.query.dateFrom);
    }

    if (input.query.dateTo) {
      whereClauses.push('ideas.created_at <= ?');
      whereParams.push(input.query.dateTo);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const totalRow = db
      .prepare(`SELECT COUNT(*) as total_count FROM ideas ${whereSql}`)
      .get(...whereParams) as { total_count: number };
    const totalItems = Number(totalRow.total_count ?? 0);

    const orderBySql =
      input.query.sortBy === 'status'
        ? `ORDER BY CASE ideas.status
              WHEN 'Submitted' THEN 1
              WHEN 'Under Review' THEN 2
              WHEN 'Accepted' THEN 3
              WHEN 'Rejected' THEN 4
            END ASC, ideas.created_at DESC`
        : `ORDER BY ideas.created_at ${input.query.sortDirection === 'Oldest' ? 'ASC' : 'DESC'}`;

    const offset = (input.query.page - 1) * input.query.pageSize;
    const rows = db
      .prepare(
        `SELECT
            ideas.*,
            (
              SELECT decision.comment
              FROM evaluation_decisions AS decision
              WHERE decision.idea_id = ideas.id
              ORDER BY decision.created_at DESC
              LIMIT 1
            ) AS latest_evaluation_comment
            ,(
              SELECT COUNT(*)
              FROM idea_votes AS iv
              WHERE iv.idea_id = ideas.id AND iv.value = 1
            ) AS idea_votes_up
            ,(
              SELECT COUNT(*)
              FROM idea_votes AS iv
              WHERE iv.idea_id = ideas.id AND iv.value = -1
            ) AS idea_votes_down
            ,(
              SELECT COUNT(*)
              FROM idea_votes AS iv
              WHERE iv.idea_id = ideas.id
            ) AS idea_votes_total
        FROM ideas
        INNER JOIN users ON users.id = ideas.owner_user_id
         ${whereSql}
         ${orderBySql}
         LIMIT ? OFFSET ?`,
      )
      .all(...whereParams, input.query.pageSize, offset) as Record<string, unknown>[];

    return {
      items: rows.map(mapIdea),
      pagination: {
        page: input.query.page,
        pageSize: input.query.pageSize,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / input.query.pageSize)),
      },
    };
  },

  updateIdea(
    id: string,
    expectedRowVersion: number,
    payload: { title: string; description: string; category: string },
  ): IdeaRecord | null {
    const db = getDb();
    const updatedAt = new Date().toISOString();
    const result = db
      .prepare(
        `UPDATE ideas
           SET title = ?, description = ?, category = ?, row_version = row_version + 1, updated_at = ?
         WHERE id = ? AND row_version = ?`,
      )
      .run(payload.title, payload.description, payload.category, updatedAt, id, expectedRowVersion);

    if (result.changes === 0) {
      return null;
    }

    return this.findById(id);
  },

  deleteIdeaCascade(id: string): boolean {
    const db = getDb();
    const transaction = db.transaction(() => {
      db.prepare('DELETE FROM idea_comments WHERE idea_id = ?').run(id);
      db.prepare('DELETE FROM idea_votes WHERE idea_id = ?').run(id);
      db.prepare('DELETE FROM status_history_entries WHERE idea_id = ?').run(id);
      db.prepare('DELETE FROM evaluation_decisions WHERE idea_id = ?').run(id);
      db.prepare('DELETE FROM attachments WHERE idea_id = ?').run(id);
      const result = db.prepare('DELETE FROM ideas WHERE id = ?').run(id);
      return result.changes > 0;
    });

    return transaction();
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
