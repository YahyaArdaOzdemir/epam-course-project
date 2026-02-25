import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { AppError } from '../lib/errors';

export const errorHandler = (
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
): void => {
  if (error instanceof multer.MulterError) {
    let message = 'Invalid file upload';

    if (error.code === 'LIMIT_FILE_SIZE') {
      message = 'File exceeds size limit';
    } else if (
      error.code === 'LIMIT_FILE_COUNT'
      || error.code === 'LIMIT_UNEXPECTED_FILE'
      || error.code === 'LIMIT_PART_COUNT'
    ) {
      message = 'Only one file allowed';
    }

    response.status(400).json({
      code: 'VALIDATION_ERROR',
      message,
    });
    return;
  }

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
