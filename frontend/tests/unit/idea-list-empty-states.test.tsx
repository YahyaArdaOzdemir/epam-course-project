import { act } from 'react-dom/test-utils';
import { createRoot, Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { IdeaListPage } from '../../src/features/ideas/pages/IdeaListPage';
import { EvaluationQueuePage } from '../../src/features/evaluation/pages/EvaluationQueuePage';
import { ideaApi } from '../../src/features/ideas/services/idea-service';

jest.mock('../../src/features/ideas/services/idea-service', () => ({
  ideaApi: {
    list: jest.fn(),
  },
}));

const mockedIdeaApi = ideaApi as jest.Mocked<typeof ideaApi>;

describe('idea and evaluation empty states', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    mockedIdeaApi.list.mockResolvedValue({
      items: [],
      pagination: { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 },
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    jest.clearAllMocks();
  });

  it('renders My Ideas empty state with submit CTA', async () => {
    await act(async () => {
      root.render(
        <MemoryRouter>
          <IdeaListPage />
        </MemoryRouter>,
      );
    });

    expect(container.textContent).toContain('No ideas found. Submit your first one!');
    const submitCta = container.querySelector('a[href="/ideas/new"]');
    expect(submitCta?.textContent).toBe('Submit New Idea');
  });

  it('renders Evaluation Queue empty state with dashboard CTA', async () => {
    await act(async () => {
      root.render(
        <MemoryRouter>
          <EvaluationQueuePage />
        </MemoryRouter>,
      );
    });

    expect(container.textContent).toContain('No ideas found in the evaluation queue.');
    const dashboardCta = container.querySelector('a[href="/dashboard"]');
    expect(dashboardCta?.textContent).toBe('Back to Dashboard');
  });

  it('disables previous/next pagination controls on a single-page My Ideas result', async () => {
    mockedIdeaApi.list.mockResolvedValueOnce({
      items: [
        {
          id: 'idea-1',
          title: 'Improve onboarding docs',
          category: 'Process Improvement',
          status: 'Submitted',
          isShared: false,
          rowVersion: 0,
          ownerUserId: 'owner-1',
          latestEvaluationComment: null,
          ideaVotesUp: 4,
          ideaVotesDown: 1,
          ideaVotesTotal: 5,
        },
      ],
      pagination: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
    });

    await act(async () => {
      root.render(
        <MemoryRouter>
          <IdeaListPage />
        </MemoryRouter>,
      );
    });

    const previousButton = container.querySelector('button[type="button"]:first-of-type') as HTMLButtonElement | null;
    const nextButton = container.querySelector('button[type="button"]:last-of-type') as HTMLButtonElement | null;
    expect(previousButton?.textContent).toBe('Previous');
    expect(nextButton?.textContent).toBe('Next');
    expect(previousButton?.disabled).toBe(true);
    expect(nextButton?.disabled).toBe(true);
    expect(container.textContent).toContain('Page 1 of 1 (1 total)');
    expect(container.textContent).toContain('Votes: 3');
    expect(container.textContent ?? '').not.toContain('↑');
    expect(container.textContent ?? '').not.toContain('shared:');

    const statusBadge = container.querySelector('[data-status-pill="true"]');
    expect(statusBadge?.textContent).toContain('Submitted');
  });
});
