import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth-service';
import {
  parseLoginPayload,
  parsePasswordResetConfirmPayload,
  parsePasswordResetRequestPayload,
  parseRegisterPayload,
} from '../validators/auth-validator';
import { AuthenticatedRequest } from '../middleware/auth-guard';
import { UnauthorizedError } from '../lib/errors';

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? 'innovatepam_session';

const getAuthToken = (request: Request): string | null => {
  const header = request.header('authorization');
  if (header?.startsWith('Bearer ')) {
    return header.slice(7);
  }

  const cookieHeader = request.header('cookie');
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(';').map((part) => part.trim());
  const raw = cookies.find((entry) => entry.startsWith(`${SESSION_COOKIE_NAME}=`));
  if (!raw) {
    return null;
  }

  return decodeURIComponent(raw.slice(`${SESSION_COOKIE_NAME}=`.length));
};

export const authController = {
  async register(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const payload = parseRegisterPayload(request.body);
      const result = await authService.register({
        fullName: payload.fullName,
        email: payload.email,
        password: payload.password,
      });
      response.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  async login(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const payload = parseLoginPayload(request.body);
      const sourceIp = request.ip ?? '0.0.0.0';
      const result = await authService.login({
        email: payload.email,
        password: payload.password,
        sourceIp,
        userAgent: request.header('user-agent') ?? undefined,
      });

      response.cookie(SESSION_COOKIE_NAME, result.token, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: Number(process.env.SESSION_TTL_HOURS ?? 24) * 60 * 60 * 1000,
        path: '/',
      });

      response.status(200).json({
        userId: result.userId,
        role: result.role,
        redirectTo: result.redirectTo,
      });
    } catch (error) {
      next(error);
    }
  },

  logout(request: AuthenticatedRequest, response: Response, next: NextFunction): void {
    try {
      const token = getAuthToken(request);
      if (!token) {
        throw new UnauthorizedError();
      }

      authService.logout(token);
      response.clearCookie(SESSION_COOKIE_NAME, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
      });
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  session(request: Request, response: Response, next: NextFunction): void {
    try {
      const token = getAuthToken(request);
      if (!token) {
        throw new UnauthorizedError('Session is invalid');
      }

      const session = authService.getSession(token);
      response.status(200).json(session);
    } catch (error) {
      next(error);
    }
  },

  csrf(request: Request, response: Response, next: NextFunction): void {
    try {
      const token = getAuthToken(request);
      if (!token) {
        throw new UnauthorizedError('Session is invalid');
      }

      const result = authService.issueCsrf(token);
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  /** Accepts reset request input and responds with neutral 202 confirmation payload. */
  passwordResetRequest(request: Request, response: Response, next: NextFunction): void {
    try {
      const payload = parsePasswordResetRequestPayload(request.body);
      const sourceIp = request.ip ?? '0.0.0.0';
      const result = authService.requestPasswordReset({ email: payload.email, sourceIp });
      response.status(202).json(result);
    } catch (error) {
      next(error);
    }
  },

  /** Completes password reset for a valid token and compliant new password. */
  async passwordResetConfirm(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const payload = parsePasswordResetConfirmPayload(request.body);
      const sourceIp = request.ip ?? '0.0.0.0';
      const result = await authService.confirmPasswordReset({
        token: payload.token,
        newPassword: payload.newPassword,
        sourceIp,
      });
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};
