import { ConflictError, ForbiddenError, ValidationError } from '../lib/errors';
import { evaluationRepository } from '../repositories/evaluation-repository';
import { ideaRepository, IdeaRecord } from '../repositories/idea-repository';
import { statusHistoryRepository } from '../repositories/status-history-repository';

export const isValidTransition = (from: IdeaRecord['status'], to: IdeaRecord['status']): boolean => {
  if (from === 'Submitted' && to === 'Under Review') return true;
  if (from === 'Submitted' && (to === 'Accepted' || to === 'Rejected')) return true;
  if (from === 'Under Review' && (to === 'Accepted' || to === 'Rejected')) return true;
  if ((from === 'Accepted' || from === 'Rejected') && to === 'Under Review') return true;
  if ((from === 'Accepted' || from === 'Rejected') && (to === 'Accepted' || to === 'Rejected')) return true;
  return false;
};

/** Applies evaluator/admin status transition with optimistic concurrency. */
const updateIdeaStatus = (input: {
  ideaId: string;
  evaluatorUserId: string;
  evaluatorRole: 'submitter' | 'admin';
  toStatus: 'Under Review' | 'Accepted' | 'Rejected';
  comment?: string;
  expectedRowVersion: number;
}) => {
  if (input.evaluatorRole !== 'admin') {
    throw new ForbiddenError('Only evaluator/admin can evaluate ideas');
  }

  const existing = ideaRepository.findById(input.ideaId);
  if (!existing) {
    throw new ValidationError('Idea not found');
  }

  if (!isValidTransition(existing.status, input.toStatus)) {
    throw new ValidationError('Invalid status transition');
  }

  if ((input.toStatus === 'Accepted' || input.toStatus === 'Rejected') && !input.comment?.trim()) {
    throw new ValidationError('Final decision requires comment');
  }

  const updated = ideaRepository.updateStatus(input.ideaId, input.toStatus, input.expectedRowVersion);
  if (!updated) {
    throw new ConflictError('Idea changed by another evaluator. Refresh and retry.');
  }

  statusHistoryRepository.addEntry({
    ideaId: input.ideaId,
    fromStatus: existing.status,
    toStatus: input.toStatus,
    changedByUserId: input.evaluatorUserId,
    commentSnapshot: input.comment,
  });

  if (input.toStatus === 'Accepted' || input.toStatus === 'Rejected') {
    evaluationRepository.create({
      ideaId: input.ideaId,
      evaluatorUserId: input.evaluatorUserId,
      decision: input.toStatus,
      comment: input.comment!,
    });
  }

  return updated;
};

export const evaluationService = {
  updateIdeaStatus,
};
