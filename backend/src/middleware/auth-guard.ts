import { NextFunction, Request, Response } from 'express';
import { verifyAuthToken } from '../lib/auth-tokens';
import { ForbiddenError, UnauthorizedError } from '../lib/errors';

type Role = 'submitter' | 'evaluator_admin';

export type AuthenticatedRequest = Request & {
  auth?: {
    userId: string;
    role: Role;
  };
};

export const requireAuth = (request: AuthenticatedRequest, _response: Response, next: NextFunction): void => {
  const header = request.header('authorization');
  if (!header || !header.startsWith('Bearer ')) {
    next(new UnauthorizedError());
    return;
  }

  const token = header.slice(7);
  try {
    const payload = verifyAuthToken(token);
    request.auth = {
      userId: payload.userId,
      role: payload.role,
    };
    next();
  } catch {
    next(new UnauthorizedError());
  }
};

export const requireRole = (...roles: Role[]) => {
  return (request: AuthenticatedRequest, _response: Response, next: NextFunction): void => {
    if (!request.auth) {
      next(new UnauthorizedError());
      return;
    }

    if (!roles.includes(request.auth.role)) {
      next(new ForbiddenError());
      return;
    }

    next();
  };
};
