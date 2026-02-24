import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth-guard';
import { parseCreateIdeaPayload, parseShareIdeaPayload } from '../validators/idea-validator';
import { ideaService } from '../services/idea-service';
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
      const ideas = ideaService.listIdeas({ userId: auth.userId, role: auth.role });
      response.status(200).json(ideas);
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
};
