import { NextFunction, Request, Response } from 'express';
import { AppError } from '../lib/errors';

export const errorHandler = (
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
): void => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      code: error.code,
      message: error.message,
    });
    return;
  }

  response.status(500).json({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Unexpected server error',
  });
};
