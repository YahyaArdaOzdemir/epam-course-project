jest.mock('../../src/repositories/idea-repository', () => ({
  ideaRepository: {
    findById: jest.fn(),
    updateIdea: jest.fn(),
    deleteIdeaCascade: jest.fn(),
  },
}));

jest.mock('../../src/repositories/attachment-repository', () => ({
  attachmentRepository: {
    findByIdeaId: jest.fn(),
  },
}));

import { ForbiddenError, ValidationError } from '../../src/lib/errors';
import { ideaService } from '../../src/services/idea-service';
import { ideaRepository } from '../../src/repositories/idea-repository';
import { attachmentRepository } from '../../src/repositories/attachment-repository';
import fs from 'fs';

const mockedIdeaRepository = ideaRepository as jest.Mocked<typeof ideaRepository>;
const mockedAttachmentRepository = attachmentRepository as jest.Mocked<typeof attachmentRepository>;
let existsSyncSpy: jest.SpyInstance;
let unlinkSyncSpy: jest.SpyInstance;

describe('idea edit/delete permissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAttachmentRepository.findByIdeaId.mockReturnValue(null);
    existsSyncSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    unlinkSyncSpy = jest.spyOn(fs, 'unlinkSync').mockImplementation(() => undefined);
  });

  afterEach(() => {
    existsSyncSpy.mockRestore();
    unlinkSyncSpy.mockRestore();
  });

  it('allows owner to edit only Submitted ideas', () => {
    mockedIdeaRepository.findById.mockReturnValue({
      id: 'idea-1',
      ownerUserId: 'owner-1',
      title: 'Before',
      description: 'Before',
      category: 'Other',
      status: 'Submitted',
      isShared: false,
      rowVersion: 1,
      latestEvaluationComment: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    mockedIdeaRepository.updateIdea.mockReturnValue({
      id: 'idea-1',
      ownerUserId: 'owner-1',
      title: 'After',
      description: 'After',
      category: 'Cost Saving',
      status: 'Submitted',
      isShared: false,
      rowVersion: 2,
      latestEvaluationComment: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const updated = ideaService.updateIdea({
      ideaId: 'idea-1',
      actorUserId: 'owner-1',
      actorRole: 'submitter',
      title: 'After',
      description: 'After',
      category: 'Cost Saving',
      expectedRowVersion: 1,
    });

    expect(updated.title).toBe('After');
  });

  it('rejects owner edit when status is not Submitted', () => {
    mockedIdeaRepository.findById.mockReturnValue({
      id: 'idea-1',
      ownerUserId: 'owner-1',
      title: 'Before',
      description: 'Before',
      category: 'Other',
      status: 'Under Review',
      isShared: false,
      rowVersion: 1,
      latestEvaluationComment: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(() => {
      ideaService.updateIdea({
        ideaId: 'idea-1',
        actorUserId: 'owner-1',
        actorRole: 'submitter',
        title: 'After',
        description: 'After',
        category: 'Other',
        expectedRowVersion: 1,
      });
    }).toThrow(ForbiddenError);
  });

  it('allows admin delete regardless of status', () => {
    mockedIdeaRepository.findById.mockReturnValue({
      id: 'idea-1',
      ownerUserId: 'owner-1',
      title: 'Before',
      description: 'Before',
      category: 'Other',
      status: 'Accepted',
      isShared: true,
      rowVersion: 1,
      latestEvaluationComment: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    mockedIdeaRepository.deleteIdeaCascade.mockReturnValue(true);

    const result = ideaService.deleteIdea({
      ideaId: 'idea-1',
      actorUserId: 'admin-1',
      actorRole: 'admin',
    });

    expect(result.deleted).toBe(true);
  });

  it('deletes attachment file from uploads when attachment exists', () => {
    mockedIdeaRepository.findById.mockReturnValue({
      id: 'idea-1',
      ownerUserId: 'owner-1',
      title: 'Before',
      description: 'Before',
      category: 'Other',
      status: 'Submitted',
      isShared: false,
      rowVersion: 1,
      latestEvaluationComment: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    mockedAttachmentRepository.findByIdeaId.mockReturnValue({
      id: 'att-1',
      ideaId: 'idea-1',
      originalFileName: 'proposal.pdf',
      storedFileName: 'stored.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1024,
      storagePath: '/tmp/uploads/stored.pdf',
      uploadedAt: new Date().toISOString(),
    });
    existsSyncSpy.mockReturnValue(true);
    mockedIdeaRepository.deleteIdeaCascade.mockReturnValue(true);

    ideaService.deleteIdea({
      ideaId: 'idea-1',
      actorUserId: 'owner-1',
      actorRole: 'submitter',
    });

    expect(unlinkSyncSpy).toHaveBeenCalledWith('/tmp/uploads/stored.pdf');
  });

  it('does not fail delete when attachment file is already missing', () => {
    mockedIdeaRepository.findById.mockReturnValue({
      id: 'idea-1',
      ownerUserId: 'owner-1',
      title: 'Before',
      description: 'Before',
      category: 'Other',
      status: 'Submitted',
      isShared: false,
      rowVersion: 1,
      latestEvaluationComment: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    mockedAttachmentRepository.findByIdeaId.mockReturnValue({
      id: 'att-1',
      ideaId: 'idea-1',
      originalFileName: 'proposal.pdf',
      storedFileName: 'stored.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1024,
      storagePath: '/tmp/uploads/missing.pdf',
      uploadedAt: new Date().toISOString(),
    });
    existsSyncSpy.mockReturnValue(false);
    mockedIdeaRepository.deleteIdeaCascade.mockReturnValue(true);

    const result = ideaService.deleteIdea({
      ideaId: 'idea-1',
      actorUserId: 'owner-1',
      actorRole: 'submitter',
    });

    expect(result.deleted).toBe(true);
    expect(unlinkSyncSpy).not.toHaveBeenCalled();
  });

  it('rejects owner delete when status is not Submitted', () => {
    mockedIdeaRepository.findById.mockReturnValue({
      id: 'idea-1',
      ownerUserId: 'owner-1',
      title: 'Before',
      description: 'Before',
      category: 'Other',
      status: 'Accepted',
      isShared: false,
      rowVersion: 1,
      latestEvaluationComment: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(() => {
      ideaService.deleteIdea({
        ideaId: 'idea-1',
        actorUserId: 'owner-1',
        actorRole: 'submitter',
      });
    }).toThrow(ForbiddenError);
  });

  it('throws validation when deleting unknown idea', () => {
    mockedIdeaRepository.findById.mockReturnValue(null);

    expect(() => {
      ideaService.deleteIdea({
        ideaId: 'missing',
        actorUserId: 'owner-1',
        actorRole: 'submitter',
      });
    }).toThrow(ValidationError);
  });
});
