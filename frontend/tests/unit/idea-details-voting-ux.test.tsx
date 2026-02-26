import { act } from 'react-dom/test-utils';
import { createRoot, Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useAuth } from '../../src/features/auth/hooks/useAuth';
import { IdeaDetailsPage } from '../../src/features/ideas/pages/IdeaDetailsPage';
import { ideaApi } from '../../src/features/ideas/services/idea-service';

jest.mock('../../src/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

const useAuthMock = useAuth as jest.MockedFunction<typeof useAuth>;
let getByIdSpy: jest.SpiedFunction<typeof ideaApi.getById>;
let listCommentsSpy: jest.SpiedFunction<typeof ideaApi.listComments>;

describe('idea details voting and inline reply UX', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    useAuthMock.mockReturnValue({
      session: {
        authenticated: true,
        userId: 'u-1',
        role: 'submitter',
        fullName: 'User One',
        email: 'user1@epam.com',
        expiresAt: new Date().toISOString(),
      },
      csrfToken: 'csrf-token',
      logout: jest.fn(),
      message: '',
      isLoading: false,
      register: jest.fn(),
      login: jest.fn(),
      refreshSession: jest.fn(),
      passwordResetRequest: jest.fn(),
      passwordResetConfirm: jest.fn(),
    });

    getByIdSpy = jest.spyOn(ideaApi, 'getById');
    listCommentsSpy = jest.spyOn(ideaApi, 'listComments');

    getByIdSpy.mockResolvedValue({
      id: 'idea-1',
      title: 'Unified Idea Title',
      description: 'Description body',
      category: 'Other',
      status: 'Submitted',
      rowVersion: 0,
      ownerUserId: 'u-1',
      isShared: true,
      latestEvaluationComment: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attachment: null,
      ideaVotesUp: 3,
      ideaVotesDown: 1,
      ideaVotesTotal: 4,
    });

    listCommentsSpy.mockResolvedValue({
      items: [
        {
          id: 'comment-1',
          ideaId: 'idea-1',
          authorUserId: 'u-2',
          parentCommentId: null,
          depth: 1,
          body: 'Parent comment',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          authorEmail: 'user2@epam.com',
          authorFullName: 'User Two',
          upvotes: 2,
          downvotes: 1,
          score: 1,
        },
      ],
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    getByIdSpy?.mockRestore();
    listCommentsSpy?.mockRestore();
    jest.clearAllMocks();
  });

  it('uses idea title as primary heading and renders vote/rating controls', async () => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/evaluation/idea-1']}>
          <Routes>
            <Route path="/evaluation/:ideaId" element={<IdeaDetailsPage />} />
          </Routes>
        </MemoryRouter>,
      );
    });

    expect(container.textContent).toContain('Unified Idea Title');
    expect(container.textContent ?? '').not.toContain('Idea Details');
    expect(container.textContent ?? '').not.toContain('Evaluation Detail');
    expect(container.textContent).toContain('Total votes: 2');
    expect(container.textContent).toContain('↑');
    expect(container.textContent).toContain('↓');
    expect(container.textContent ?? '').not.toContain('up /');
  });

  it('renders inline reply form under selected comment', async () => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/ideas/idea-1']}>
          <Routes>
            <Route path="/ideas/:ideaId" element={<IdeaDetailsPage />} />
          </Routes>
        </MemoryRouter>,
      );
    });

    const replyButtons = Array.from(container.querySelectorAll('button')).filter((button) => button.textContent?.trim() === 'Reply');
    expect(replyButtons.length).toBeGreaterThan(0);

    await act(async () => {
      replyButtons[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const inlineReplyArea = container.querySelector('textarea[aria-label="Reply to comment"]');
    expect(inlineReplyArea).not.toBeNull();
  });

  it('renders highlighted evaluation decision comment without reply action', async () => {
    getByIdSpy.mockResolvedValueOnce({
      id: 'idea-1',
      title: 'Unified Idea Title',
      description: 'Description body',
      category: 'Other',
      status: 'Rejected',
      rowVersion: 0,
      ownerUserId: 'u-1',
      isShared: true,
      latestEvaluationComment: 'Rejected due to missing business case.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attachment: null,
      ideaVotesUp: 3,
      ideaVotesDown: 1,
      ideaVotesTotal: 4,
    });

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/ideas/idea-1']}>
          <Routes>
            <Route path="/ideas/:ideaId" element={<IdeaDetailsPage />} />
          </Routes>
        </MemoryRouter>,
      );
    });

    expect(container.textContent).toContain('Evaluation Decision');
    expect(container.textContent).toContain('Rejected due to missing business case.');
    const evaluationReplyButtons = Array.from(container.querySelectorAll('button')).filter((button) => button.textContent?.trim() === 'Reply' && button.closest('[data-evaluation-comment="true"]'));
    expect(evaluationReplyButtons).toHaveLength(0);
  });

  it('locks comment creation and replies for submitter on rejected idea', async () => {
    getByIdSpy.mockResolvedValueOnce({
      id: 'idea-1',
      title: 'Unified Idea Title',
      description: 'Description body',
      category: 'Other',
      status: 'Rejected',
      rowVersion: 0,
      ownerUserId: 'u-1',
      isShared: true,
      latestEvaluationComment: 'Rejected due to policy mismatch.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attachment: null,
      ideaVotesUp: 3,
      ideaVotesDown: 1,
      ideaVotesTotal: 4,
    });

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/ideas/idea-1']}>
          <Routes>
            <Route path="/ideas/:ideaId" element={<IdeaDetailsPage />} />
          </Routes>
        </MemoryRouter>,
      );
    });

    expect(container.textContent).toContain('Commenting is locked while this idea is Rejected');
    expect(container.querySelector('textarea[aria-label="Reply to comment"]')).toBeNull();
    expect(Array.from(container.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Reply')).toBe(false);
  });
});
