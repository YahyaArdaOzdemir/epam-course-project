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
    mockedIdeaApi.list.mockResolvedValue([]);
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
});
