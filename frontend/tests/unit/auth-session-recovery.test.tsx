import { act } from 'react-dom/test-utils';
import { createRoot, Root } from 'react-dom/client';
import { AuthProvider, useAuth } from '../../src/features/auth/hooks/useAuth';
import { authApi } from '../../src/features/auth/services/auth-service';

jest.mock('../../src/features/auth/services/auth-service', () => ({
  authApi: {
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    session: jest.fn(),
    csrf: jest.fn(),
    passwordResetRequest: jest.fn(),
    passwordResetConfirm: jest.fn(),
  },
}));

const mockedAuthApi = authApi as jest.Mocked<typeof authApi>;

const Probe = () => {
  const auth = useAuth();
  return (
    <div>
      <span id="loading">{String(auth.isLoading)}</span>
      <span id="user">{auth.session?.userId ?? 'anonymous'}</span>
      <span id="csrf">{auth.csrfToken ?? 'none'}</span>
      <span id="message">{auth.message}</span>
      <button type="button" onClick={() => void auth.refreshSession()}>Refresh</button>
    </div>
  );
};

describe('auth session recovery', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root.unmount();
      });
    }
    container.remove();
    jest.clearAllMocks();
  });

  it('recovers session and csrf token during bootstrap', async () => {
    mockedAuthApi.session.mockResolvedValue({
      authenticated: true,
      userId: 'u-recovered',
      role: 'submitter',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });
    mockedAuthApi.csrf.mockResolvedValue({ csrfToken: 'csrf-1' });

    root = createRoot(container);
    await act(async () => {
      root.render(
        <AuthProvider>
          <Probe />
        </AuthProvider>,
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.querySelector('#loading')?.textContent).toBe('false');
    expect(container.querySelector('#user')?.textContent).toBe('u-recovered');
    expect(container.querySelector('#csrf')?.textContent).toBe('csrf-1');
  });

  it('clears session when refresh fails after being authenticated', async () => {
    mockedAuthApi.session
      .mockResolvedValueOnce({
        authenticated: true,
        userId: 'u-active',
        role: 'submitter',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      })
      .mockRejectedValueOnce(new Error('Session is invalid'));
    mockedAuthApi.csrf
      .mockResolvedValueOnce({ csrfToken: 'csrf-1' })
      .mockRejectedValueOnce(new Error('Session is invalid'));

    root = createRoot(container);
    await act(async () => {
      root.render(
        <AuthProvider>
          <Probe />
        </AuthProvider>,
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    const refreshButton = container.querySelector('button') as HTMLButtonElement;

    await act(async () => {
      refreshButton.click();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.querySelector('#user')?.textContent).toBe('anonymous');
  });
});
