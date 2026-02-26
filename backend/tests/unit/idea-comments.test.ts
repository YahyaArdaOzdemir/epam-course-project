jest.mock('../../src/repositories/idea-repository', () => ({
  ideaRepository: {
    findById: jest.fn(),
  },
}));

jest.mock('../../src/repositories/idea-comment-repository', () => ({
  ideaCommentRepository: {
    listByIdeaId: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  },
}));

import { ForbiddenError, ValidationError } from '../../src/lib/errors';
import { ideaCommentService } from '../../src/services';
import { ideaRepository } from '../../src/repositories/idea-repository';
import { ideaCommentRepository } from '../../src/repositories';

const mockedIdeaRepository = ideaRepository as jest.Mocked<typeof ideaRepository>;
const mockedIdeaCommentRepository = ideaCommentRepository as jest.Mocked<typeof ideaCommentRepository>;

describe('idea comment service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows authorized viewers to list comments', () => {
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
    mockedIdeaCommentRepository.listByIdeaId.mockReturnValue([]);

    const comments = ideaCommentService.listComments({
      ideaId: 'idea-1',
      viewerUserId: 'viewer-1',
      viewerRole: 'submitter',
    });

    expect(comments).toEqual([]);
  });

  it('rejects creating reply deeper than 5 levels', () => {
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
    mockedIdeaCommentRepository.findById.mockReturnValue({
      id: 'comment-parent',
      ideaId: 'idea-1',
      authorUserId: 'author-1',
      parentCommentId: 'c4',
      depth: 5,
      body: 'parent',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authorEmail: 'author@epam.com',
      authorFullName: 'Author',
    });

    expect(() => {
      ideaCommentService.createComment({
        ideaId: 'idea-1',
        actorUserId: 'viewer-1',
        actorRole: 'submitter',
        body: 'reply',
        parentCommentId: 'comment-parent',
      });
    }).toThrow(ValidationError);
  });

  it('rejects comment creation for unauthorized viewer', () => {
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
      ideaCommentService.createComment({
        ideaId: 'idea-1',
        actorUserId: 'viewer-1',
        actorRole: 'submitter',
        body: 'Comment',
      });
    }).toThrow(ForbiddenError);
  });
});
