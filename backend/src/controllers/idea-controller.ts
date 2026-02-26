import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth-guard';
import {
  parseCreateCommentPayload,
  parseCreateIdeaPayload,
  parseShareIdeaPayload,
  parseUpdateIdeaPayload,
  parseVotePayload,
} from '../validators/idea-validator';
import { parseIdeaListQuery } from '../validators/idea-query-validator';
import { ideaService } from '../services/idea-service';
import { ideaCommentService } from '../services/idea-comment-service';
import { ValidationError } from '../lib/errors';

export const ideaController = {
  create(request: AuthenticatedRequest, response: Response, next: NextFunction): void {
    try {
      const auth = request.auth!;
      const payload = parseCreateIdeaPayload(request.body);
      const idea = ideaService.createIdea({
        ownerUserId: auth.userId,
        ...payload,
        file: request.file,
      });
      response.status(201).json(idea);
    } catch (error) {
      next(error);
    }
  },

  list(request: AuthenticatedRequest, response: Response, next: NextFunction): void {
    try {
      const auth = request.auth!;
      const query = parseIdeaListQuery(request.query);
      const ideas = ideaService.listIdeas({ userId: auth.userId, role: auth.role, query });
      response.status(200).json(ideas);
    } catch (error) {
      next(error);
    }
  },

  getById(request: AuthenticatedRequest, response: Response, next: NextFunction): void {
    try {
      const auth = request.auth!;
      const idea = ideaService.getIdeaById({
        ideaId: String(request.params.ideaId),
        viewerUserId: auth.userId,
        viewerRole: auth.role,
      });

      response.status(200).json(idea);
    } catch (error) {
      next(error);
    }
  },

  share(request: AuthenticatedRequest, response: Response, next: NextFunction): void {
    try {
      const auth = request.auth!;
      const ideaId = String(request.params.ideaId);
      const payload = parseShareIdeaPayload(request.body);
      const ifMatch = Number(request.header('if-match'));

      if (!Number.isInteger(ifMatch)) {
        throw new ValidationError('If-Match header is required');
      }

      const updated = ideaService.toggleShare({
        ideaId,
        ownerUserId: auth.userId,
        isShared: payload.isShared,
        expectedRowVersion: ifMatch,
      });

      response.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  },

  update(request: AuthenticatedRequest, response: Response, next: NextFunction): void {
    try {
      const auth = request.auth!;
      const ideaId = String(request.params.ideaId);
      const payload = parseUpdateIdeaPayload(request.body);
      const ifMatch = Number(request.header('if-match'));

      if (!Number.isInteger(ifMatch)) {
        throw new ValidationError('If-Match header is required');
      }

      const updated = ideaService.updateIdea({
        ideaId,
        actorUserId: auth.userId,
        actorRole: auth.role,
        title: payload.title,
        description: payload.description,
        category: payload.category,
        expectedRowVersion: ifMatch,
      });

      response.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  },

  delete(request: AuthenticatedRequest, response: Response, next: NextFunction): void {
    try {
      const auth = request.auth!;
      const ideaId = String(request.params.ideaId);
      ideaService.deleteIdea({
        ideaId,
        actorUserId: auth.userId,
        actorRole: auth.role,
      });

      response.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  listComments(request: AuthenticatedRequest, response: Response, next: NextFunction): void {
    try {
      const auth = request.auth!;
      const ideaId = String(request.params.ideaId);
      const items = ideaCommentService.listComments({
        ideaId,
        viewerUserId: auth.userId,
        viewerRole: auth.role,
      });

      response.status(200).json({ items });
    } catch (error) {
      next(error);
    }
  },

  createComment(request: AuthenticatedRequest, response: Response, next: NextFunction): void {
    try {
      const auth = request.auth!;
      const ideaId = String(request.params.ideaId);
      const payload = parseCreateCommentPayload(request.body);
      const created = ideaCommentService.createComment({
        ideaId,
        actorUserId: auth.userId,
        actorRole: auth.role,
        body: payload.body,
        parentCommentId: payload.parentCommentId,
      });

      response.status(201).json(created);
    } catch (error) {
      next(error);
    }
  },

  deleteComment(request: AuthenticatedRequest, response: Response, next: NextFunction): void {
    try {
      const auth = request.auth!;
      const ideaId = String(request.params.ideaId);
      const commentId = String(request.params.commentId);
      ideaCommentService.deleteComment({
        ideaId,
        commentId,
        actorUserId: auth.userId,
        actorRole: auth.role,
      });

      response.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  voteIdea(request: AuthenticatedRequest, response: Response, next: NextFunction): void {
    try {
      const auth = request.auth!;
      const ideaId = String(request.params.ideaId);
      const payload = parseVotePayload(request.body);
      const summary = ideaService.voteIdea({
        ideaId,
        actorUserId: auth.userId,
        actorRole: auth.role,
        value: payload.value,
      });

      response.status(200).json(summary);
    } catch (error) {
      next(error);
    }
  },

  voteComment(request: AuthenticatedRequest, response: Response, next: NextFunction): void {
    try {
      const auth = request.auth!;
      const ideaId = String(request.params.ideaId);
      const commentId = String(request.params.commentId);
      const payload = parseVotePayload(request.body);
      const summary = ideaCommentService.voteComment({
        ideaId,
        commentId,
        actorUserId: auth.userId,
        actorRole: auth.role,
        value: payload.value,
      });

      response.status(200).json(summary);
    } catch (error) {
      next(error);
    }
  },
};
