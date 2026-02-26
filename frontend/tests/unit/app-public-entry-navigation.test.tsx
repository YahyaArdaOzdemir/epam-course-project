import { act } from 'react-dom/test-utils';
import { createRoot, Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../../src/App';
import { useAuth } from '../../src/features/auth/hooks/useAuth';
import { ideaApi } from '../../src/features/ideas/services/idea-service';

jest.mock('../../src/features/auth/pages/RegisterPage', () => ({
  RegisterPage: () => <div>Register Page</div>,
}));

jest.mock('../../src/features/auth/pages/LoginPage', () => ({
  LoginPage: () => <div>Login Page</div>,
}));

jest.mock('../../src/features/auth/pages/PasswordResetRequestPage', () => ({
  PasswordResetRequestPage: () => <div>Password Reset Request</div>,
}));

jest.mock('../../src/features/auth/pages/PasswordResetConfirmPage', () => ({
  PasswordResetConfirmPage: () => <div>Password Reset Confirm</div>,
}));

jest.mock('../../src/features/ideas/pages/IdeaSubmitPage', () => ({
  IdeaSubmitPage: () => <div>Idea Submit Page</div>,
}));

jest.mock('../../src/features/ideas/pages/IdeaListPage', () => ({
  IdeaListPage: () => <div>Idea List Page</div>,
}));

jest.mock('../../src/features/ideas/services/idea-service', () => ({
  ideaApi: {
    list: jest.fn(),
  },
}));

jest.mock('../../src/features/evaluation/pages', () => ({
  EvaluationQueuePage: () => <div>Evaluation Queue Page</div>,
}));

jest.mock('../../src/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedIdeaApi = ideaApi as jest.Mocked<typeof ideaApi>;

describe('App public entry and auth-aware navigation', () => {
  let container: HTMLDivElement;
  let root: Root;

  const mockAuthValue = (
    session: { authenticated: true; userId: string; fullName?: string; email?: string; role: 'submitter' | 'admin'; expiresAt: string } | null,
    overrides?: {
      register?: jest.Mock;
      login?: jest.Mock;
    },
  ) => {
    mockedUseAuth.mockReturnValue({
      session,
      csrfToken: session ? 'csrf-test-token' : null,
      message: '',
      isLoading: false,
      register: overrides?.register ?? jest.fn(),
      login: overrides?.login ?? jest.fn(),
      logout: jest.fn().mockResolvedValue(undefined),
      refreshSession: jest.fn(),
      passwordResetRequest: jest.fn(),
      passwordResetConfirm: jest.fn(),
    });
  };

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

  it('shows public landing content at / for guests and hides protected header links', async () => {
    mockAuthValue(null);

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>,
      );
    });

    expect(container.textContent).toContain('Welcome to InnovatEPAM Portal');
    expect(container.textContent).toContain('Register');
    expect(container.textContent).toContain('Login');
    expect(container.textContent).not.toContain('Dashboard');
    expect(container.textContent).not.toContain('Submit Idea');

    const guestHeaderRegisterLink = container.querySelector('header a[href="/register"]');
    const guestHeaderLoginLink = container.querySelector('header a[href="/login"]');
    expect(guestHeaderRegisterLink).toBeNull();
    expect(guestHeaderLoginLink).toBeNull();
  });

  it('redirects authenticated users from / to /dashboard', async () => {
    mockAuthValue({
      authenticated: true,
      userId: 'u-1',
      fullName: 'Alice Employee',
      email: 'alice@epam.com',
      role: 'submitter',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>,
      );
    });

    expect(container.textContent).toContain('Dashboard');
    expect(container.textContent ?? '').not.toContain('Signed in as Alice Employee');
    expect(container.textContent).toContain('Submitter');
    const profileLink = container.querySelector('header a[href="/profile"]');
    expect(profileLink?.textContent).toBe('Alice Employee');
    expect(Array.from(container.querySelectorAll('a')).some((link) => link.textContent === 'Evaluation Queue')).toBe(false);
  });

  it('renders admin dashboard widgets and protected header role badge', async () => {
    mockedIdeaApi.list.mockImplementation(async (query = {}) => {
      if (query.status === 'Submitted') {
        return { items: [], pagination: { page: 1, pageSize: 1, totalItems: 7, totalPages: 7 } };
      }

      if (query.status === 'Under Review') {
        return { items: [], pagination: { page: 1, pageSize: 1, totalItems: 1, totalPages: 1 } };
      }

      if (query.status === 'Accepted') {
        return {
          items: [
            {
              id: 'idea-1',
              title: 'Accepted idea',
              category: 'Other',
              status: 'Accepted',
              isShared: false,
              rowVersion: 0,
              ownerUserId: 'u-2',
              latestEvaluationComment: 'Good',
            },
          ],
          pagination: { page: 1, pageSize: 3, totalItems: 1, totalPages: 1 },
        };
      }

      if (query.status === 'Rejected') {
        return {
          items: [
            {
              id: 'idea-2',
              title: 'Rejected idea',
              category: 'Other',
              status: 'Rejected',
              isShared: false,
              rowVersion: 0,
              ownerUserId: 'u-2',
              latestEvaluationComment: 'Not now',
            },
          ],
          pagination: { page: 1, pageSize: 3, totalItems: 1, totalPages: 1 },
        };
      }

      return { items: [], pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 1 } };
    });

    mockAuthValue({
      authenticated: true,
      userId: 'u-2',
      fullName: 'Admin User',
      email: 'admin@epam.com',
      role: 'admin',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <App />
        </MemoryRouter>,
      );
    });

    expect(container.textContent).toContain('Admin');
    expect(container.textContent).toContain('Evaluation Queue');
    expect(container.textContent).toContain('Recent Decisions');

    const recentDecisionsTab = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Recent Decisions');
    await act(async () => {
      recentDecisionsTab?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain('Accepted idea');
    expect(container.textContent).toContain('Rejected idea');
    expect(Array.from(container.querySelectorAll('a')).some((link) => link.textContent === 'Evaluation Queue')).toBe(true);
  });

  it('uses logo link to / for guests and /dashboard for authenticated users', async () => {
    mockAuthValue(null);

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>,
      );
    });

    const guestLogoLink = container.querySelector('header a[href="/"]');
    expect(guestLogoLink).not.toBeNull();

    mockAuthValue({
      authenticated: true,
      userId: 'u-2',
      fullName: 'Bob Employee',
      email: 'bob@epam.com',
      role: 'submitter',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <App />
        </MemoryRouter>,
      );
    });

    const authLogoLink = container.querySelector('header a[href="/dashboard"]');
    expect(authLogoLink).not.toBeNull();
  });

  it('submits register form on landing, shows success, and switches to login mode', async () => {
    const register = jest.fn().mockResolvedValue({ message: 'Registered successfully. You can now login.' });
    mockAuthValue(null, { register });

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>,
      );
    });

    const fullNameInput = container.querySelector('input[aria-label="Full Name"]') as HTMLInputElement;
    const emailInput = container.querySelector('input[aria-label="Email"]') as HTMLInputElement;
    const passwordInput = container.querySelector('input[aria-label="Password"]') as HTMLInputElement;
    const confirmPasswordInput = container.querySelector('input[aria-label="Confirm Password"]') as HTMLInputElement;

    await act(async () => {
      fullNameInput.value = 'Alice Employee';
      fullNameInput.dispatchEvent(new Event('input', { bubbles: true }));
      emailInput.value = 'alice@epam.com';
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      passwordInput.value = 'StrongPass123!';
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
      confirmPasswordInput.value = 'StrongPass123!';
      confirmPasswordInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const form = container.querySelector('form') as HTMLFormElement;
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(register).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain('Registered successfully. You can now login.');
    expect(container.querySelector('input[aria-label="Full Name"]')).toBeNull();
  });

  it('submits login form on landing with entered credentials', async () => {
    const login = jest.fn().mockResolvedValue({ redirectTo: '/dashboard' });
    mockAuthValue(null, { login });

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>,
      );
    });

    const loginToggleButton = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Login');
    await act(async () => {
      loginToggleButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const emailInput = container.querySelector('input[aria-label="Email"]') as HTMLInputElement;
    const passwordInput = container.querySelector('input[aria-label="Password"]') as HTMLInputElement;

    await act(async () => {
      emailInput.value = 'user@epam.com';
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      passwordInput.value = 'StrongPass123!';
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const form = container.querySelector('form') as HTMLFormElement;
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(login).toHaveBeenCalledTimes(1);
  });
});
