import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { singleAttachmentUpload } from '../lib/upload-policy';
import { ValidationError } from '../lib/errors';

const mapUploadError = (error: unknown): Error => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return new ValidationError('File exceeds size limit');
    }

    if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE' || error.code === 'LIMIT_PART_COUNT') {
      return new ValidationError('Only one file allowed');
    }
  }

  return error instanceof Error ? error : new ValidationError('Invalid file upload');
};

/** Executes single-file upload policy and normalizes upload errors to validation responses. */
export const handleSingleIdeaAttachmentUpload = (request: Request, response: Response, next: NextFunction): void => {
  singleAttachmentUpload.single('file')(request, response, (error: unknown) => {
    if (error) {
      next(mapUploadError(error));
      return;
    }

    next();
  });
};
