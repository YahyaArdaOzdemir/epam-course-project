import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth-guard';
import { parseEvaluationPayload } from '../validators/evaluation-validator';
import { ValidationError } from '../lib/errors';
import { evaluationService } from '../services/evaluation-service';

export const evaluationController = {
  updateStatus(request: AuthenticatedRequest, response: Response, next: NextFunction): void {
    try {
      const auth = request.auth!;
      const payload = parseEvaluationPayload(request.body);
      const ifMatch = Number(request.header('if-match'));

      if (!Number.isInteger(ifMatch)) {
        throw new ValidationError('If-Match header is required');
      }

      const updated = evaluationService.updateIdeaStatus({
        ideaId: String(request.params.ideaId),
        evaluatorUserId: auth.userId,
        evaluatorRole: auth.role,
        toStatus: payload.toStatus,
        comment: payload.comment,
        expectedRowVersion: ifMatch,
      });

      response.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  },
};
