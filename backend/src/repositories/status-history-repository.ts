import { v4 as uuid } from 'uuid';
import { getDb } from '../lib/db';
import { IdeaRecord } from './idea-repository';

export const statusHistoryRepository = {
  addEntry(input: {
    ideaId: string;
    fromStatus: IdeaRecord['status'] | null;
    toStatus: IdeaRecord['status'];
    changedByUserId: string;
    commentSnapshot?: string;
  }): void {
    const db = getDb();
    db.prepare(
      `INSERT INTO status_history_entries (id, idea_id, from_status, to_status, changed_by_user_id, comment_snapshot, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      uuid(),
      input.ideaId,
      input.fromStatus,
      input.toStatus,
      input.changedByUserId,
      input.commentSnapshot ?? null,
      new Date().toISOString(),
    );
  },
};
