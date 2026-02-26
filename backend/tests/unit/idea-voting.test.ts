jest.mock('../../src/repositories/idea-repository', () => ({
  ideaRepository: {
    findById: jest.fn(),
  },
}));

jest.mock('../../src/repositories/idea-vote-repository', () => ({
  ideaVoteRepository: {
    setVote: jest.fn(),
  },
}));

import { ForbiddenError, ValidationError } from '../../src/lib/errors';
import { ideaService } from '../../src/services/idea-service';
import { ideaRepository } from '../../src/repositories/idea-repository';
import { ideaVoteRepository } from '../../src/repositories/idea-vote-repository';

const mockedIdeaRepository = ideaRepository as jest.Mocked<typeof ideaRepository>;
const mockedIdeaVoteRepository = ideaVoteRepository as jest.Mocked<typeof ideaVoteRepository>;

describe('idea voting service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects voting when idea is missing', () => {
    mockedIdeaRepository.findById.mockReturnValue(null);

    expect(() => {
      ideaService.voteIdea({
        ideaId: 'missing',
        actorUserId: 'u-1',
        actorRole: 'submitter',
        value: 1,
      });
    }).toThrow(ValidationError);
  });

  it('rejects voting when submitter has no access', () => {
    mockedIdeaRepository.findById.mockReturnValue({
      id: 'idea-1',
      ownerUserId: 'owner-1',
      title: 'Idea',
      description: 'Desc',
      category: 'Other',
      status: 'Submitted',
      isShared: false,
      rowVersion: 0,
      latestEvaluationComment: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(() => {
      ideaService.voteIdea({
        ideaId: 'idea-1',
        actorUserId: 'viewer-1',
        actorRole: 'submitter',
        value: 1,
      });
    }).toThrow(ForbiddenError);
  });

  it('applies vote for authorized viewer', () => {
    mockedIdeaRepository.findById.mockReturnValue({
      id: 'idea-1',
      ownerUserId: 'owner-1',
      title: 'Idea',
      description: 'Desc',
      category: 'Other',
      status: 'Submitted',
      isShared: true,
      rowVersion: 0,
      latestEvaluationComment: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    mockedIdeaVoteRepository.setVote.mockReturnValue({
      upvotes: 2,
      downvotes: 1,
      totalVotes: 3,
    });

    const summary = ideaService.voteIdea({
      ideaId: 'idea-1',
      actorUserId: 'viewer-1',
      actorRole: 'submitter',
      value: 1,
    });

    expect(summary.totalVotes).toBe(3);
    expect(mockedIdeaVoteRepository.setVote).toHaveBeenCalledWith({
      ideaId: 'idea-1',
      userId: 'viewer-1',
      value: 1,
    });
  });
});
