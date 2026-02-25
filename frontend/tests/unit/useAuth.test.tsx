import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { AuthProvider, useAuth } from '../../src/features/auth/hooks/useAuth';
import { authApi } from '../../src/features/auth/services/auth-service';
import { mapAuthError } from '../../src/features/auth/services/auth-error-mapper';

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

jest.mock('../../src/features/auth/services/auth-error-mapper', () => ({
  mapAuthError: jest.fn((error: unknown) => (error instanceof Error ? `mapped:${error.message}` : 'mapped:unknown')),
}));

const mockedAuthApi = authApi as jest.Mocked<typeof authApi>;
const mockedMapAuthError = mapAuthError as jest.MockedFunction<typeof mapAuthError>;

let latestAuth: ReturnType<typeof useAuth> | null = null;

const Probe = () => {
  const auth = useAuth();
  latestAuth = auth;

  return (
    <div>
      <span id="session">{auth.session?.userId ?? 'none'}</span>
      <span id="csrf">{auth.csrfToken ?? 'none'}</span>
      <span id="message">{auth.message}</span>
      <span id="loading">{String(auth.isLoading)}</span>
    </div>
  );
};

describe('useAuth', () => {
  let container: HTMLDivElement;
  let root: Root;

  const flush = async (): Promise<void> => {
    await Promise.resolve();
    await Promise.resolve();
  };

  beforeEach(() => {
    latestAuth = null;
    container = document.createElement('div');
    document.body.appendChild(container);

    mockedAuthApi.register.mockResolvedValue({ userId: 'u1' });
    mockedAuthApi.login.mockResolvedValue({ userId: 'u1', role: 'submitter', redirectTo: '/dashboard' });
    mockedAuthApi.logout.mockResolvedValue(undefined);
    mockedAuthApi.session.mockResolvedValue({
      authenticated: true,
      userId: 'u1',
      role: 'submitter',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });
    mockedAuthApi.csrf.mockResolvedValue({ csrfToken: 'csrf-1' });
    mockedAuthApi.passwordResetRequest.mockResolvedValue({ message: 'reset requested' });
    mockedAuthApi.passwordResetConfirm.mockResolvedValue({ message: 'reset confirmed' });
  });

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    container.remove();
    jest.clearAllMocks();
  });

  const mount = async (): Promise<void> => {
    root = createRoot(container);
    await act(async () => {
      root.render(
        <AuthProvider>
          <Probe />
        </AuthProvider>,
      );
      await flush();
    });
  };

  it('bootstraps session and csrf on mount', async () => {
    await mount();

    expect(mockedAuthApi.session).toHaveBeenCalled();
    expect(mockedAuthApi.csrf).toHaveBeenCalled();
    expect(container.querySelector('#session')?.textContent).toBe('u1');
    expect(container.querySelector('#csrf')?.textContent).toBe('csrf-1');
    expect(container.querySelector('#loading')?.textContent).toBe('false');
  });

  it('register sets success message and maps errors', async () => {
    await mount();

    await act(async () => {
      await latestAuth?.register({
        fullName: 'Alice Employee',
        email: 'a@epam.com',
        password: 'StrongPass123!',
        confirmPassword: 'StrongPass123!',
      });
    });
    expect(container.querySelector('#message')?.textContent).toBe('');

    mockedAuthApi.register.mockRejectedValueOnce(new Error('register failed'));
    await expect(latestAuth?.register({
      fullName: 'Alice Employee',
      email: 'a@epam.com',
      password: 'StrongPass123!',
      confirmPassword: 'StrongPass123!',
    }))
      .rejects.toThrow('mapped:register failed');
    expect(mockedMapAuthError).toHaveBeenCalled();
  });

  it('login returns redirect and maps errors', async () => {
    await mount();

    await act(async () => {
      await expect(latestAuth?.login({ email: 'a@epam.com', password: 'StrongPass123!' }))
        .resolves.toEqual({ redirectTo: '/dashboard' });
      await flush();
    });
    expect(container.querySelector('#message')?.textContent).toBe('');

    mockedAuthApi.login.mockRejectedValueOnce(new Error('login failed'));
    await expect(latestAuth?.login({ email: 'a@epam.com', password: 'StrongPass123!' }))
      .rejects.toThrow('mapped:login failed');
  });

  it('logout clears state with or without csrf token', async () => {
    await mount();

    await act(async () => {
      await latestAuth?.logout();
    });
    expect(mockedAuthApi.logout).toHaveBeenCalledWith('csrf-1');
    expect(container.querySelector('#session')?.textContent).toBe('none');
    expect(container.querySelector('#csrf')?.textContent).toBe('none');
    expect(container.querySelector('#message')?.textContent).toBe('');

    mockedAuthApi.session.mockRejectedValueOnce(new Error('session gone'));
    await act(async () => {
      await latestAuth?.refreshSession();
      await latestAuth?.logout();
    });
    expect(mockedAuthApi.logout).toHaveBeenCalledTimes(1);
  });

  it('forces logout message when refresh fails with active session', async () => {
    await mount();

    mockedAuthApi.session.mockRejectedValueOnce(new Error('invalid'));
    await act(async () => {
      await latestAuth?.refreshSession();
      await flush();
    });

    expect(container.querySelector('#session')?.textContent).toBe('none');
    expect(container.querySelector('#csrf')?.textContent).toBe('none');
    expect(container.querySelector('#message')?.textContent).toBe('Your session has expired. Please login again.');
  });

  it('clears silent refresh when no active session exists', async () => {
    mockedAuthApi.session.mockRejectedValueOnce(new Error('no session'));
    await mount();

    expect(container.querySelector('#session')?.textContent).toBe('none');
    expect(container.querySelector('#csrf')?.textContent).toBe('none');
    expect(container.querySelector('#message')?.textContent).toBe('');
  });

  it('handles password reset request/confirm success and mapped errors', async () => {
    await mount();

    await act(async () => {
      await latestAuth?.passwordResetRequest('a@epam.com');
    });
    expect(container.querySelector('#message')?.textContent).toBe('');

    await act(async () => {
      await latestAuth?.passwordResetConfirm('token-1', 'StrongPass123!');
    });
    expect(container.querySelector('#message')?.textContent).toBe('');

    mockedAuthApi.passwordResetRequest.mockRejectedValueOnce(new Error('request failed'));
    await expect(latestAuth?.passwordResetRequest('a@epam.com')).rejects.toThrow('mapped:request failed');

    mockedAuthApi.passwordResetConfirm.mockRejectedValueOnce(new Error('confirm failed'));
    await expect(latestAuth?.passwordResetConfirm('token-1', 'StrongPass123!')).rejects.toThrow('mapped:confirm failed');
  });
});
