import { ForbiddenError, ValidationError } from '../lib/errors';
import { ideaCommentVoteRepository } from '../repositories/idea-comment-vote-repository';
import { ideaCommentRepository } from '../repositories/idea-comment-repository';
import { ideaRepository } from '../repositories/idea-repository';
import { canViewIdea } from './idea-service';

const MAX_COMMENT_DEPTH = 5;

export const ideaCommentService = {
  listComments(input: { ideaId: string; viewerUserId: string; viewerRole: 'submitter' | 'admin' }) {
    const idea = ideaRepository.findById(input.ideaId);
    if (!idea) {
      throw new ValidationError('Idea not found');
    }

    if (!canViewIdea(idea, { userId: input.viewerUserId, role: input.viewerRole })) {
      throw new ForbiddenError('You do not have access to this idea');
    }

    return ideaCommentRepository.listByIdeaId(input.ideaId);
  },

  createComment(input: {
    ideaId: string;
    actorUserId: string;
    actorRole: 'submitter' | 'admin';
    body: string;
    parentCommentId?: string;
  }) {
    const idea = ideaRepository.findById(input.ideaId);
    if (!idea) {
      throw new ValidationError('Idea not found');
    }

    if (!canViewIdea(idea, { userId: input.actorUserId, role: input.actorRole })) {
      throw new ForbiddenError('You do not have access to this idea');
    }

    let depth = 1;
    if (input.parentCommentId) {
      const parent = ideaCommentRepository.findById(input.parentCommentId);
      if (!parent || parent.ideaId !== input.ideaId) {
        throw new ValidationError('Parent comment not found');
      }

      depth = parent.depth + 1;
      if (depth > MAX_COMMENT_DEPTH) {
        throw new ValidationError('Maximum reply depth reached');
      }
    }

    return ideaCommentRepository.create({
      ideaId: input.ideaId,
      authorUserId: input.actorUserId,
      parentCommentId: input.parentCommentId,
      depth,
      body: input.body,
    });
  },

  deleteComment(input: {
    ideaId: string;
    commentId: string;
    actorUserId: string;
    actorRole: 'submitter' | 'admin';
  }) {
    const idea = ideaRepository.findById(input.ideaId);
    if (!idea) {
      throw new ValidationError('Idea not found');
    }

    if (!canViewIdea(idea, { userId: input.actorUserId, role: input.actorRole })) {
      throw new ForbiddenError('You do not have access to this idea');
    }

    const comment = ideaCommentRepository.findById(input.commentId);
    if (!comment || comment.ideaId !== input.ideaId) {
      throw new ValidationError('Comment not found');
    }

    if (input.actorRole !== 'admin' && comment.authorUserId !== input.actorUserId) {
      throw new ForbiddenError('You can only delete your own comments');
    }

    ideaCommentRepository.deleteById(input.commentId);
  },

  voteComment(input: {
    ideaId: string;
    commentId: string;
    actorUserId: string;
    actorRole: 'submitter' | 'admin';
    value: -1 | 1;
  }) {
    const idea = ideaRepository.findById(input.ideaId);
    if (!idea) {
      throw new ValidationError('Idea not found');
    }

    if (!canViewIdea(idea, { userId: input.actorUserId, role: input.actorRole })) {
      throw new ForbiddenError('You do not have access to this idea');
    }

    const comment = ideaCommentRepository.findById(input.commentId);
    if (!comment || comment.ideaId !== input.ideaId) {
      throw new ValidationError('Comment not found');
    }

    return ideaCommentVoteRepository.setVote({
      commentId: input.commentId,
      userId: input.actorUserId,
      value: input.value,
    });
  },
};
