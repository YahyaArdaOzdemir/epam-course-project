import { authApi } from '../../src/features/auth/services/auth-service';
import { apiClient } from '../../src/services/api-client';

jest.mock('../../src/services/api-client', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

describe('authApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('delegates register payload to api client', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ userId: 'u-1' });

    const result = await authApi.register({
      fullName: 'Person Employee',
      email: 'person@epam.com',
      password: 'StrongPass123!',
      confirmPassword: 'StrongPass123!',
    });

    expect(apiClient.post).toHaveBeenCalledWith('/auth/register', {
      fullName: 'Person Employee',
      email: 'person@epam.com',
      password: 'StrongPass123!',
      confirmPassword: 'StrongPass123!',
    });
    expect(result).toEqual({ userId: 'u-1' });
  });

  test('delegates login payload to api client', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ userId: 'u-1', role: 'submitter', redirectTo: '/dashboard' });

    const result = await authApi.login({ email: 'person@epam.com', password: 'StrongPass123!' });

    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', { email: 'person@epam.com', password: 'StrongPass123!' });
    expect(result.redirectTo).toBe('/dashboard');
  });

  test('sends csrf token on logout', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue(undefined);

    await authApi.logout('csrf-token');

    expect(apiClient.post).toHaveBeenCalledWith('/auth/logout', undefined, false, 'csrf-token');
  });

  test('requests session and csrf snapshots', async () => {
    (apiClient.get as jest.Mock)
      .mockResolvedValueOnce({ authenticated: true, userId: 'u-1', role: 'submitter', expiresAt: '2026-02-26T00:00:00.000Z' })
      .mockResolvedValueOnce({ csrfToken: 'csrf-token' });

    const session = await authApi.session();
    const csrf = await authApi.csrf();

    expect(apiClient.get).toHaveBeenNthCalledWith(1, '/auth/session');
    expect(apiClient.get).toHaveBeenNthCalledWith(2, '/auth/csrf');
    expect(session.authenticated).toBe(true);
    expect(csrf.csrfToken).toBe('csrf-token');
  });

  test('handles password reset request and confirm payloads', async () => {
    (apiClient.post as jest.Mock)
      .mockResolvedValueOnce({ message: 'sent' })
      .mockResolvedValueOnce({ message: 'done' });

    const requestResult = await authApi.passwordResetRequest('person@epam.com');
    const confirmResult = await authApi.passwordResetConfirm('token-123', 'StrongerPass123!', 'StrongerPass123!');

    expect(apiClient.post).toHaveBeenNthCalledWith(1, '/auth/password-reset/request', { email: 'person@epam.com' });
    expect(apiClient.post).toHaveBeenNthCalledWith(2, '/auth/password-reset/confirm', {
      token: 'token-123',
      newPassword: 'StrongerPass123!',
      confirmPassword: 'StrongerPass123!',
    });
    expect(requestResult.message).toBe('sent');
    expect(confirmResult.message).toBe('done');
  });
});
