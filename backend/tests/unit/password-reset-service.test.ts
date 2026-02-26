jest.mock('../../src/services/auth-service', () => ({
  authService: {
    requestPasswordReset: jest.fn(),
    confirmPasswordReset: jest.fn(),
  },
}));

import { passwordResetService } from '../../src/services/password-reset-service';
import { authService } from '../../src/services/auth-service';

const mockedAuthService = authService as jest.Mocked<typeof authService>;

describe('passwordResetService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates request to authService', () => {
    mockedAuthService.requestPasswordReset.mockReturnValue({ message: 'If an account exists, a reset link has been sent.' });

    const result = passwordResetService.request({
      email: 'employee@epam.com',
      sourceIp: '127.0.0.1',
    });

    expect(mockedAuthService.requestPasswordReset).toHaveBeenCalledWith({
      email: 'employee@epam.com',
      sourceIp: '127.0.0.1',
    });
    expect(result).toEqual({ message: 'If an account exists, a reset link has been sent.' });
  });

  it('delegates confirm to authService', async () => {
    mockedAuthService.confirmPasswordReset.mockResolvedValue({ message: 'Password reset completed' });

    await expect(
      passwordResetService.confirm({
        token: 'token-1',
        newPassword: 'StrongPass123!',
        sourceIp: '127.0.0.1',
      }),
    ).resolves.toEqual({ message: 'Password reset completed' });

    expect(mockedAuthService.confirmPasswordReset).toHaveBeenCalledWith({
      token: 'token-1',
      newPassword: 'StrongPass123!',
      sourceIp: '127.0.0.1',
    });
  });
});
