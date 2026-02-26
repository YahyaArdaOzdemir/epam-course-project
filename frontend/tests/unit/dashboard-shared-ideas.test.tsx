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
            latestEvaluationComment: null,
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
    expect(container.textContent).toContain('Shared innovation');
    expect(container.textContent).toContain('Draft: Reduce onboarding friction');
    expect(container.textContent).toContain('Draft');
    expect(container.querySelector('a[href="/ideas/new?draftId=draft-1"]')).not.toBeNull();
    expect(container.textContent ?? '').not.toContain('Signed in as Arda User');
  });
});
