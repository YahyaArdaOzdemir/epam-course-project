import { act } from 'react-dom/test-utils';
import { createRoot, Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../../src/features/auth/components/ProtectedRoute';
import { useAuth } from '../../src/features/auth/hooks/useAuth';

jest.mock('../../src/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('ProtectedRoute', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    jest.clearAllMocks();
  });

  it('redirects to /login when no active session exists', async () => {
    mockedUseAuth.mockReturnValue({
      session: null,
      csrfToken: null,
      message: '',
      isLoading: false,
      register: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      refreshSession: jest.fn(),
      passwordResetRequest: jest.fn(),
      passwordResetConfirm: jest.fn(),
    });

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<div>Protected Dashboard</div>} />
            </Route>
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>,
      );
    });

    expect(container.textContent).toContain('Login Page');
    expect(container.textContent).not.toContain('Protected Dashboard');
  });

  it('renders child route when session exists', async () => {
    mockedUseAuth.mockReturnValue({
      session: {
        authenticated: true,
        userId: 'u-1',
        role: 'submitter',
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
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

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<div>Protected Dashboard</div>} />
            </Route>
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>,
      );
    });

    expect(container.textContent).toContain('Protected Dashboard');
  });

  it('waits for csrf token when session exists but csrf token is missing', async () => {
    const refreshSession = jest.fn();

    mockedUseAuth.mockReturnValue({
      session: {
        authenticated: true,
        userId: 'u-1',
        role: 'submitter',
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      },
      csrfToken: null,
      message: '',
      isLoading: false,
      register: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      refreshSession,
      passwordResetRequest: jest.fn(),
      passwordResetConfirm: jest.fn(),
    });

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<div>Protected Dashboard</div>} />
            </Route>
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>,
      );
    });

    expect(container.textContent).toContain('Loading security token...');
    expect(container.textContent).not.toContain('Protected Dashboard');
    expect(refreshSession).toHaveBeenCalled();
  });
});
