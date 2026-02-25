import { v4 as uuid } from 'uuid';
import { getDb } from '../lib/db';
import { IdeaListQuery } from '../validators/idea-query-validator';

export type IdeaRecord = {
  id: string;
  ownerUserId: string;
  title: string;
  description: string;
  category: string;
  status: 'Submitted' | 'Under Review' | 'Accepted' | 'Rejected';
  isShared: boolean;
  rowVersion: number;
  latestEvaluationComment: string | null;
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
  latestEvaluationComment: row.latest_evaluation_comment == null ? null : String(row.latest_evaluation_comment),
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
      title: input.title,
      description: input.description,
      category: input.category,
      status: 'Submitted',
      isShared: false,
      rowVersion: 0,
      latestEvaluationComment: null,
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
            (
              SELECT decision.comment
              FROM evaluation_decisions AS decision
              WHERE decision.idea_id = ideas.id
              ORDER BY decision.created_at DESC
              LIMIT 1
            ) AS latest_evaluation_comment
         FROM ideas
         WHERE ideas.id = ?`,
      )
      .get(id);
    return row ? mapIdea(row as Record<string, unknown>) : null;
  },

  listVisible(input: { userId: string; role: 'submitter' | 'admin'; query: IdeaListQuery }): PaginatedIdeaListResult {
    const db = getDb();
    const whereClauses: string[] = [];
    const whereParams: Array<string | number> = [];

    const shouldRestrictToOwner = input.query.visibilityScope === 'owner' || input.role !== 'admin';
    if (shouldRestrictToOwner) {
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
        ? `ORDER BY CASE status
              WHEN 'Submitted' THEN 1
              WHEN 'Under Review' THEN 2
              WHEN 'Accepted' THEN 3
              WHEN 'Rejected' THEN 4
            END ASC, created_at DESC`
        : `ORDER BY created_at ${input.query.sortDirection === 'Oldest' ? 'ASC' : 'DESC'}`;

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
         FROM ideas
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
