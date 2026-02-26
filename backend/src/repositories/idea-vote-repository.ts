import { v4 as uuid } from 'uuid';
import { getDb } from '../lib/db';

export type IdeaVoteSummary = {
  upvotes: number;
  downvotes: number;
  totalVotes: number;
};

const getSummary = (ideaId: string): IdeaVoteSummary => {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT
         SUM(CASE WHEN value = 1 THEN 1 ELSE 0 END) AS upvotes,
         SUM(CASE WHEN value = -1 THEN 1 ELSE 0 END) AS downvotes,
         COUNT(*) AS total_votes
       FROM idea_votes
       WHERE idea_id = ?`,
    )
    .get(ideaId) as { upvotes: number | null; downvotes: number | null; total_votes: number | null };

  return {
    upvotes: Number(row?.upvotes ?? 0),
    downvotes: Number(row?.downvotes ?? 0),
    totalVotes: Number(row?.total_votes ?? 0),
  };
};

export const ideaVoteRepository = {
  setVote(input: { ideaId: string; userId: string; value: -1 | 1 }): IdeaVoteSummary {
    const db = getDb();
    const now = new Date().toISOString();
    const existing = db
      .prepare('SELECT id, value FROM idea_votes WHERE idea_id = ? AND user_id = ?')
      .get(input.ideaId, input.userId) as { id: string; value: number } | undefined;

    if (existing && existing.value === input.value) {
      db.prepare('DELETE FROM idea_votes WHERE id = ?').run(existing.id);
      return getSummary(input.ideaId);
    }

    if (existing) {
      db.prepare('UPDATE idea_votes SET value = ?, updated_at = ? WHERE id = ?').run(input.value, now, existing.id);
      return getSummary(input.ideaId);
    }

    db.prepare(
      `INSERT INTO idea_votes (id, idea_id, user_id, value, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(uuid(), input.ideaId, input.userId, input.value, now, now);

    return getSummary(input.ideaId);
  },
};
