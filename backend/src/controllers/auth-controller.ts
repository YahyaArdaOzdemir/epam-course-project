import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth-service';
import { parseAuthPayload } from '../validators/auth-validator';
import { AuthenticatedRequest } from '../middleware/auth-guard';
import { UnauthorizedError } from '../lib/errors';

export const authController = {
  async register(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const payload = parseAuthPayload(request.body);
      const result = await authService.register(payload.email, payload.password);
      response.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  async login(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const payload = parseAuthPayload(request.body);
      const result = await authService.login(payload.email, payload.password);
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  logout(request: AuthenticatedRequest, response: Response, next: NextFunction): void {
    try {
      const header = request.header('authorization');
      if (!header?.startsWith('Bearer ')) {
        throw new UnauthorizedError();
      }

      authService.logout(header.slice(7));
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};
