jest.mock('../../src/repositories/idea-repository', () => ({
  ideaRepository: {
    findById: jest.fn(),
    updateIdea: jest.fn(),
    deleteIdeaCascade: jest.fn(),
  },
}));

import { ForbiddenError, ValidationError } from '../../src/lib/errors';
import { ideaService } from '../../src/services/idea-service';
import { ideaRepository } from '../../src/repositories/idea-repository';

const mockedIdeaRepository = ideaRepository as jest.Mocked<typeof ideaRepository>;

describe('idea edit/delete permissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
