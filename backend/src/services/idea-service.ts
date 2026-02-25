import { ConflictError, ForbiddenError, ValidationError } from '../lib/errors';
import { attachmentRepository } from '../repositories/attachment-repository';
import { ideaRepository, IdeaRecord, PaginatedIdeaListResult } from '../repositories/idea-repository';
import { IdeaListQuery } from '../validators/idea-query-validator';

type IdeaDetailsRecord = IdeaRecord & {
  attachment: {
    originalFileName: string;
    mimeType: string;
    sizeBytes: number;
    uploadedAt: string;
    url: string;
  } | null;
};

export const canViewIdea = (
  idea: Pick<IdeaRecord, 'ownerUserId' | 'isShared'>,
  viewer: { userId: string; role: 'submitter' | 'admin' },
): boolean => {
  if (viewer.role === 'admin') {
    return true;
  }

  return idea.ownerUserId === viewer.userId || idea.isShared;
};

export const canSeeEvaluationComment = (
  idea: Pick<IdeaRecord, 'isShared'>,
  role: 'submitter' | 'admin',
): boolean => {
  return role === 'admin' || idea.isShared;
};

/** Creates an idea with optional single attachment metadata. */
const createIdea = (input: {
  ownerUserId: string;
  title: string;
  description: string;
  category: string;
  file?: Express.Multer.File;
}) => {
  const idea = ideaRepository.create(input);

  if (input.file) {
    attachmentRepository.create({
      ideaId: idea.id,
      originalFileName: input.file.originalname,
      storedFileName: input.file.filename,
      mimeType: input.file.mimetype,
      sizeBytes: input.file.size,
      storagePath: input.file.path,
    });
  }

  return idea;
};

const listIdeas = (viewer: { userId: string; role: 'submitter' | 'admin'; query: IdeaListQuery }): PaginatedIdeaListResult => {
  return ideaRepository.listVisible({ userId: viewer.userId, role: viewer.role, query: viewer.query });
};

/** Returns single idea details for owner or admin viewer. */
const getIdeaById = (input: { ideaId: string; viewerUserId: string; viewerRole: 'submitter' | 'admin' }): IdeaDetailsRecord => {
  const existing = ideaRepository.findById(input.ideaId);
  if (!existing) {
    throw new ValidationError('Idea not found');
  }

  if (input.viewerRole !== 'admin' && existing.ownerUserId !== input.viewerUserId) {
    throw new ForbiddenError('You do not have access to this idea');
  }

  const attachment = attachmentRepository.findByIdeaId(existing.id);

  return {
    ...existing,
    attachment: attachment
      ? {
          originalFileName: attachment.originalFileName,
          mimeType: attachment.mimeType,
          sizeBytes: attachment.sizeBytes,
          uploadedAt: attachment.uploadedAt,
          url: `/uploads/${attachment.storedFileName}`,
        }
      : null,
  };
};

/** Toggles sharing state for an owner with optimistic concurrency. */
const toggleShare = (input: {
  ideaId: string;
  ownerUserId: string;
  isShared: boolean;
  expectedRowVersion: number;
}) => {
  const existing = ideaRepository.findById(input.ideaId);
  if (!existing) {
    throw new ValidationError('Idea not found');
  }

  if (existing.ownerUserId !== input.ownerUserId) {
    throw new ForbiddenError('Only owner can change sharing');
  }

  const updated = ideaRepository.updateShare(
    input.ideaId,
    input.ownerUserId,
    input.isShared,
    input.expectedRowVersion,
  );

  if (!updated) {
    throw new ConflictError('Idea was updated by another request');
  }

  return updated;
};

export const ideaService = {
  createIdea,
  listIdeas,
  getIdeaById,
  toggleShare,
};
