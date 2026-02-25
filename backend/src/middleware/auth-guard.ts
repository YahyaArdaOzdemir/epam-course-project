import { NextFunction, Request, Response } from 'express';
import { hashToken, verifyAuthToken } from '../lib/auth-tokens';
import { AppError, ForbiddenError, UnauthorizedError } from '../lib/errors';
import { sessionRepository } from '../repositories/session-repository';
import { csrfTokenRepository } from '../repositories/csrf-token-repository';

type Role = 'submitter' | 'admin';

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? 'innovatepam_session';

export type AuthenticatedRequest = Request & {
  auth?: {
    userId: string;
    role: Role;
    sessionId: string;
  };
  authToken?: string;
};

const parseCookies = (cookieHeader?: string): Record<string, string> => {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, part) => {
      const [name, ...value] = part.split('=');
      if (name && value.length > 0) {
        acc[name] = decodeURIComponent(value.join('='));
      }
      return acc;
    }, {});
};

const getTokenFromRequest = (request: Request): string | null => {
  const header = request.header('authorization');
  if (header?.startsWith('Bearer ')) {
    return header.slice(7);
  }

  const cookies = parseCookies(request.header('cookie'));
  return cookies[SESSION_COOKIE_NAME] ?? null;
};

/**
 * Validates bearer/cookie auth token, loads active session, and attaches auth context
 * to the request for downstream handlers.
 */
export const requireAuth = (request: AuthenticatedRequest, _response: Response, next: NextFunction): void => {
  const token = getTokenFromRequest(request);
  if (!token) {
    next(new UnauthorizedError());
    return;
  }

  try {
    const payload = verifyAuthToken(token);
    const session = sessionRepository.findActiveByTokenHash(hashToken(token));
    if (!session || session.userId !== payload.userId) {
      throw new UnauthorizedError('Session is invalid');
    }

    const now = Date.now();
    if (new Date(session.expiresAt).getTime() <= now || (session.revokedAt && new Date(session.revokedAt).getTime() <= now)) {
      throw new UnauthorizedError('Session is invalid');
    }

    request.auth = {
      userId: payload.userId,
      role: payload.role,
      sessionId: session.id,
    };
    request.authToken = token;
    next();
  } catch {
    next(new UnauthorizedError());
  }
};

/** Enforces that the authenticated user belongs to one of the required roles. */
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

/** Validates X-CSRF-Token against an active token bound to the authenticated session. */
export const requireCsrf = (request: AuthenticatedRequest, _response: Response, next: NextFunction): void => {
  const csrfToken = request.header('x-csrf-token');
  if (!request.auth || !csrfToken) {
    next(new AppError('CSRF token is required', 401, 'AUTH_CSRF_INVALID'));
    return;
  }

  const record = csrfTokenRepository.findActive({
    sessionId: request.auth.sessionId,
    tokenHash: hashToken(csrfToken),
  });

  if (!record || new Date(record.expiresAt).getTime() <= Date.now()) {
    next(new AppError('CSRF token is invalid', 401, 'AUTH_CSRF_INVALID'));
    return;
  }

  next();
};
