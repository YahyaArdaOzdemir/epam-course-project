import { v4 as uuid } from 'uuid';
import { getDb } from '../lib/db';

export type CommentVoteSummary = {
  upvotes: number;
  downvotes: number;
  score: number;
};

const getSummary = (commentId: string): CommentVoteSummary => {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT
         SUM(CASE WHEN value = 1 THEN 1 ELSE 0 END) AS upvotes,
         SUM(CASE WHEN value = -1 THEN 1 ELSE 0 END) AS downvotes
       FROM idea_comment_votes
       WHERE comment_id = ?`,
    )
    .get(commentId) as { upvotes: number | null; downvotes: number | null };

  const upvotes = Number(row?.upvotes ?? 0);
  const downvotes = Number(row?.downvotes ?? 0);

  return {
    upvotes,
    downvotes,
    score: upvotes - downvotes,
  };
};

export const ideaCommentVoteRepository = {
  setVote(input: { commentId: string; userId: string; value: -1 | 1 }): CommentVoteSummary {
    const db = getDb();
    const now = new Date().toISOString();
    const existing = db
      .prepare('SELECT id, value FROM idea_comment_votes WHERE comment_id = ? AND user_id = ?')
      .get(input.commentId, input.userId) as { id: string; value: number } | undefined;

    if (existing && existing.value === input.value) {
      db.prepare('DELETE FROM idea_comment_votes WHERE id = ?').run(existing.id);
      return getSummary(input.commentId);
    }

    if (existing) {
      db.prepare('UPDATE idea_comment_votes SET value = ?, updated_at = ? WHERE id = ?').run(input.value, now, existing.id);
      return getSummary(input.commentId);
    }

    db.prepare(
      `INSERT INTO idea_comment_votes (id, comment_id, user_id, value, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(uuid(), input.commentId, input.userId, input.value, now, now);

    return getSummary(input.commentId);
  },
};
