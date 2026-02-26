import { v4 as uuid } from 'uuid';
import { getDb } from '../lib/db';

export type EvaluationDecisionRecord = {
  id: string;
  ideaId: string;
  evaluatorUserId: string;
  evaluatorFullName: string;
  evaluatorEmail: string;
  decision: 'Accepted' | 'Rejected';
  comment: string;
  createdAt: string;
};

const mapDecision = (row: Record<string, unknown>): EvaluationDecisionRecord => ({
  id: String(row.id),
  ideaId: String(row.idea_id),
  evaluatorUserId: String(row.evaluator_user_id),
  evaluatorFullName: String(row.evaluator_full_name),
  evaluatorEmail: String(row.evaluator_email),
  decision: row.decision as 'Accepted' | 'Rejected',
  comment: String(row.comment),
  createdAt: String(row.created_at),
});

export const evaluationRepository = {
  create(input: { ideaId: string; evaluatorUserId: string; decision: 'Accepted' | 'Rejected'; comment: string }): void {
    const db = getDb();
    db.prepare(
      `INSERT INTO evaluation_decisions (id, idea_id, evaluator_user_id, decision, comment, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(uuid(), input.ideaId, input.evaluatorUserId, input.decision, input.comment, new Date().toISOString());
  },

  listByIdeaIdWithEvaluator(ideaId: string): EvaluationDecisionRecord[] {
    const db = getDb();
    const rows = db
      .prepare(
        `SELECT
          decision.id,
          decision.idea_id,
          decision.evaluator_user_id,
          user.full_name AS evaluator_full_name,
          user.email AS evaluator_email,
          decision.decision,
          decision.comment,
          decision.created_at
         FROM evaluation_decisions AS decision
         INNER JOIN users AS user ON user.id = decision.evaluator_user_id
         WHERE decision.idea_id = ?
         ORDER BY decision.created_at ASC`,
      )
      .all(ideaId) as Record<string, unknown>[];

    return rows.map(mapDecision);
  },
};
