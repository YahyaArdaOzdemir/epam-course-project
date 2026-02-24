import { v4 as uuid } from 'uuid';
import { getDb } from '../lib/db';

export const evaluationRepository = {
  create(input: { ideaId: string; evaluatorUserId: string; decision: 'Accepted' | 'Rejected'; comment: string }): void {
    const db = getDb();
    db.prepare(
      `INSERT INTO evaluation_decisions (id, idea_id, evaluator_user_id, decision, comment, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(uuid(), input.ideaId, input.evaluatorUserId, input.decision, input.comment, new Date().toISOString());
  },
};
