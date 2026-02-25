import { v4 as uuid } from 'uuid';
import { getDb } from '../lib/db';

export type AttachmentRecord = {
  id: string;
  ideaId: string;
  originalFileName: string;
  storedFileName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  uploadedAt: string;
};

const mapAttachment = (row: Record<string, unknown>): AttachmentRecord => ({
  id: String(row.id),
  ideaId: String(row.idea_id),
  originalFileName: String(row.original_file_name),
  storedFileName: String(row.stored_file_name),
  mimeType: String(row.mime_type),
  sizeBytes: Number(row.size_bytes),
  storagePath: String(row.storage_path),
  uploadedAt: String(row.uploaded_at),
});

export const attachmentRepository = {
  create(input: {
    ideaId: string;
    originalFileName: string;
    storedFileName: string;
    mimeType: string;
    sizeBytes: number;
    storagePath: string;
  }): AttachmentRecord {
    const db = getDb();
    const id = uuid();
    const uploadedAt = new Date().toISOString();

    db.prepare(
      `INSERT INTO attachments (id, idea_id, original_file_name, stored_file_name, mime_type, size_bytes, storage_path, uploaded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      input.ideaId,
      input.originalFileName,
      input.storedFileName,
      input.mimeType,
      input.sizeBytes,
      input.storagePath,
      uploadedAt,
    );

    return {
      id,
      ideaId: input.ideaId,
      originalFileName: input.originalFileName,
      storedFileName: input.storedFileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      storagePath: input.storagePath,
      uploadedAt,
    };
  },

  findByIdeaId(ideaId: string): AttachmentRecord | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM attachments WHERE idea_id = ?').get(ideaId);
    return row ? mapAttachment(row as Record<string, unknown>) : null;
  },
};
