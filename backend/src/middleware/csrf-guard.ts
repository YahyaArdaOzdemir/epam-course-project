import { NextFunction, Response } from 'express';
import { AuthenticatedRequest, requireAuth, requireCsrf } from './auth-guard';

export const csrfGuard = (request: AuthenticatedRequest, response: Response, next: NextFunction): void => {
  requireAuth(request, response, (authError?: unknown) => {
    if (authError) {
      next(authError);
      return;
    }

    requireCsrf(request, response, next);
  });
};
