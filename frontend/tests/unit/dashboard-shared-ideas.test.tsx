import { act } from 'react-dom/test-utils';
import { createRoot, Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from '../../src/features/auth/pages/DashboardPage';
import { useAuth } from '../../src/features/auth/hooks/useAuth';
import { ideaApi } from '../../src/features/ideas/services/idea-service';

jest.mock('../../src/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

const useAuthMock = useAuth as jest.MockedFunction<typeof useAuth>;
let listSpy: jest.SpiedFunction<typeof ideaApi.list>;

describe('dashboard shared ideas and onboarding copy', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    window.localStorage.clear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    useAuthMock.mockReturnValue({
      session: {
        authenticated: true,
        userId: 'u-1',
        role: 'submitter',
        fullName: 'Arda User',
        email: 'arda@epam.com',
        expiresAt: new Date().toISOString(),
      },
      csrfToken: 'csrf-token',
      message: '',
      isLoading: false,
      register: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      refreshSession: jest.fn(),
      passwordResetRequest: jest.fn(),
      passwordResetConfirm: jest.fn(),
    });

    listSpy = jest.spyOn(ideaApi, 'list');
    listSpy
      .mockResolvedValueOnce({
        items: [],
        pagination: { page: 1, pageSize: 1, totalItems: 2, totalPages: 2 },
      })
      .mockResolvedValueOnce({
        items: [
          {
            id: 'idea-2',
            title: 'Shared innovation',
            category: 'Product Feature',
            status: 'Submitted',
            isShared: true,
            rowVersion: 0,
            ownerUserId: 'another-user',
            ownerFullName: 'Jane Epamer',
            latestEvaluationComment: null,
            ideaVotesUp: 8,
            ideaVotesDown: 2,
            createdAt: '2026-02-24T10:00:00.000Z',
          },
        ],
        pagination: { page: 1, pageSize: 5, totalItems: 1, totalPages: 1 },
      });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    listSpy?.mockRestore();
    jest.clearAllMocks();
  });

  it('renders welcome guidance and shared ideas list for submitter', async () => {
    window.localStorage.setItem(
      'innovateepam.ideaDrafts.u-1',
      JSON.stringify([
        {
          id: 'draft-1',
          userId: 'u-1',
          title: 'Draft: Reduce onboarding friction',
          description: 'Draft body',
          category: 'Other',
          dynamicFields: {},
          isShared: false,
          updatedAt: new Date().toISOString(),
        },
      ]),
    );

    await act(async () => {
      root.render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>,
      );
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const leftPanel = container.querySelector('[data-testid="dashboard-left-panel"]');
    const middlePanel = container.querySelector('[data-testid="dashboard-middle-panel"]');

    expect(leftPanel).not.toBeNull();
    expect(middlePanel).not.toBeNull();
    expect(container.textContent).toContain('Welcome Arda User,');
    expect(container.textContent).toContain('Here you can submit ideas, track your progress, and collaborate through shared idea discussions.');
    expect(container.textContent).toContain('Idea List');
    expect(container.textContent).toContain('Working Drafts');
    expect(container.textContent).toContain('Shared innovation');
    expect(container.textContent).toContain('Jane Epamer');
    expect(container.textContent).toContain('Submitted');
    expect(container.textContent).toContain('Product Feature');
    expect(container.textContent).toContain('Votes: 6');
    expect(container.textContent).toContain('Submitted ');
    expect(container.querySelector('button[aria-label="Show idea list"]')).not.toBeNull();
    expect(container.querySelector('button[aria-label="Show working drafts"]')).not.toBeNull();
    expect(container.querySelector('button[aria-label="Show idea list"]')?.getAttribute('aria-pressed')).toBe('true');
    expect(container.querySelector('a[href="/ideas/idea-2"]')).not.toBeNull();
    expect(container.querySelector('select[aria-label="Idea List Status Filter"]')).not.toBeNull();
    expect(container.querySelector('select[aria-label="Idea List Category Filter"]')).not.toBeNull();
    expect(container.querySelector('select[aria-label="Idea List Sort Filter"]')).not.toBeNull();
    expect(container.querySelector('input[aria-label="Idea List Date From"]')).not.toBeNull();
    expect(container.querySelector('input[aria-label="Idea List Date To"]')).not.toBeNull();

    const draftsButton = container.querySelector('button[aria-label="Show working drafts"]') as HTMLButtonElement;
    await act(async () => {
      draftsButton.click();
    });

    expect(container.textContent).toContain('Draft: Reduce onboarding friction');
    expect(container.textContent).toContain('Draft');
    expect(container.querySelector('a[href="/ideas/new?draftId=draft-1"]')).not.toBeNull();
    expect(container.textContent ?? '').not.toContain('Signed in as Arda User');
    expect(container.textContent ?? '').not.toContain('Recent Decisions');
  });

  it('shows admin recent decisions tab and keeps non-idea tabs filter-free', async () => {
    useAuthMock.mockReturnValue({
      session: {
        authenticated: true,
        userId: 'admin-1',
        role: 'admin',
        fullName: 'Admin User',
        email: 'admin@epam.com',
        expiresAt: new Date().toISOString(),
      },
      csrfToken: 'csrf-token',
      message: '',
      isLoading: false,
      register: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      refreshSession: jest.fn(),
      passwordResetRequest: jest.fn(),
      passwordResetConfirm: jest.fn(),
    });

    listSpy.mockReset();
    listSpy
      .mockResolvedValueOnce({
        items: [],
        pagination: { page: 1, pageSize: 1, totalItems: 0, totalPages: 1 },
      })
      .mockResolvedValueOnce({
        items: [],
        pagination: { page: 1, pageSize: 1, totalItems: 0, totalPages: 1 },
      })
      .mockResolvedValueOnce({
        items: [
          {
            id: 'decision-1',
            title: 'AI self-healing tests',
            category: 'Technology/IT',
            status: 'Accepted',
            isShared: true,
            rowVersion: 2,
            ownerUserId: 'u-4',
            ownerFullName: 'Taylor Epamer',
            latestEvaluationComment: 'Great impact',
            ideaVotesUp: 4,
            ideaVotesDown: 1,
            createdAt: '2026-02-20T10:00:00.000Z',
          },
        ],
        pagination: { page: 1, pageSize: 3, totalItems: 1, totalPages: 1 },
      })
      .mockResolvedValueOnce({
        items: [],
        pagination: { page: 1, pageSize: 3, totalItems: 0, totalPages: 1 },
      })
      .mockResolvedValueOnce({
        items: [],
        pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 1 },
      });

    await act(async () => {
      root.render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>,
      );
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const recentDecisionsButton = container.querySelector('button[aria-label="Show recent decisions"]') as HTMLButtonElement;
    expect(recentDecisionsButton).not.toBeNull();

    await act(async () => {
      recentDecisionsButton.click();
    });

    expect(container.textContent).toContain('AI self-healing tests');
    expect(container.querySelector('select[aria-label="Idea List Status Filter"]')).toBeNull();
    expect(container.querySelector('select[aria-label="Idea List Category Filter"]')).toBeNull();
    expect(container.querySelector('select[aria-label="Idea List Sort Filter"]')).toBeNull();
    expect(container.querySelector('input[aria-label="Idea List Date From"]')).toBeNull();
    expect(container.querySelector('input[aria-label="Idea List Date To"]')).toBeNull();
  });

  it('counts both Submitted and Under Review ideas in admin evaluation queue summary', async () => {
    useAuthMock.mockReturnValue({
      session: {
        authenticated: true,
        userId: 'admin-1',
        role: 'admin',
        fullName: 'Admin User',
        email: 'admin@epam.com',
        expiresAt: new Date().toISOString(),
      },
      csrfToken: 'csrf-token',
      message: '',
      isLoading: false,
      register: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      refreshSession: jest.fn(),
      passwordResetRequest: jest.fn(),
      passwordResetConfirm: jest.fn(),
    });

    listSpy.mockReset();
    listSpy.mockImplementation(async (query = {}) => {
      if (query.status === 'Submitted') {
        return {
          items: [],
          pagination: { page: 1, pageSize: 1, totalItems: 2, totalPages: 2 },
        };
      }

      if (query.status === 'Under Review') {
        return {
          items: [],
          pagination: { page: 1, pageSize: 1, totalItems: 3, totalPages: 3 },
        };
      }

      if (query.status === 'Accepted' || query.status === 'Rejected') {
        return {
          items: [],
          pagination: { page: 1, pageSize: 3, totalItems: 0, totalPages: 1 },
        };
      }

      return {
        items: [],
        pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 1 },
      };
    });

    await act(async () => {
      root.render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>,
      );
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(container.textContent).toContain('Evaluation Queue');
    expect(container.textContent).toContain('5');
    expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({ status: 'Under Review' }));
  });

  it('keeps queue count when recent decisions request fails', async () => {
    useAuthMock.mockReturnValue({
      session: {
        authenticated: true,
        userId: 'admin-1',
        role: 'admin',
        fullName: 'Admin User',
        email: 'admin@epam.com',
        expiresAt: new Date().toISOString(),
      },
      csrfToken: 'csrf-token',
      message: '',
      isLoading: false,
      register: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      refreshSession: jest.fn(),
      passwordResetRequest: jest.fn(),
      passwordResetConfirm: jest.fn(),
    });

    listSpy.mockReset();
    listSpy.mockImplementation(async (query = {}) => {
      if (query.status === 'Submitted') {
        return {
          items: [],
          pagination: { page: 1, pageSize: 1, totalItems: 6, totalPages: 6 },
        };
      }

      if (query.status === 'Under Review') {
        return {
          items: [],
          pagination: { page: 1, pageSize: 1, totalItems: 1, totalPages: 1 },
        };
      }

      if (query.status === 'Accepted') {
        throw new Error('Accepted query failed');
      }

      return {
        items: [],
        pagination: { page: 1, pageSize: 3, totalItems: 0, totalPages: 1 },
      };
    });

    await act(async () => {
      root.render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>,
      );
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(container.textContent).toContain('Evaluation Queue');
    expect(container.textContent).toContain('7');
  });
});
