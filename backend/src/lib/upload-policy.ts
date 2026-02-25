import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { ValidationError } from './errors';

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/png',
  'image/jpeg',
]);

const ALLOWED_EXTENSIONS_BY_MIME = new Map<string, Set<string>>([
  ['application/pdf', new Set(['.pdf'])],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', new Set(['.docx'])],
  ['application/vnd.openxmlformats-officedocument.presentationml.presentation', new Set(['.pptx'])],
  ['image/png', new Set(['.png'])],
  ['image/jpeg', new Set(['.jpg', '.jpeg'])],
]);

const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? 'backend/uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => callback(null, uploadDir),
  filename: (_request, file, callback) => {
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    callback(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

export const singleAttachmentUpload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      callback(new ValidationError('Unsupported file type'));
      return;
    }

    const normalizedExtension = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ALLOWED_EXTENSIONS_BY_MIME.get(file.mimetype);
    if (!allowedExtensions || !allowedExtensions.has(normalizedExtension)) {
      callback(new ValidationError('Unsupported file type'));
      return;
    }

    callback(null, true);
  },
});
