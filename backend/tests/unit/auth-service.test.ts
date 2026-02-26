jest.mock('../../src/lib/auth-tokens', () => ({
  generateOpaqueToken: jest.fn(),
  hashToken: jest.fn(),
  signAuthToken: jest.fn(),
  verifyAuthToken: jest.fn(),
}));

jest.mock('../../src/lib/passwords', () => ({
  hashPassword: jest.fn(),
  verifyPassword: jest.fn(),
}));

jest.mock('../../src/repositories/auth-throttle-repository', () => ({
  authThrottleRepository: {
    isBlocked: jest.fn(),
    recordFailure: jest.fn(),
    clearWindow: jest.fn(),
  },
}));

jest.mock('../../src/repositories/csrf-token-repository', () => ({
  csrfTokenRepository: {
    issue: jest.fn(),
  },
}));

jest.mock('../../src/repositories/password-reset-repository', () => ({
  passwordResetRepository: {
    create: jest.fn(),
    findActiveByTokenHash: jest.fn(),
    consume: jest.fn(),
    consumeAllForUser: jest.fn(),
  },
}));

jest.mock('../../src/repositories/session-repository', () => ({
  sessionRepository: {
    create: jest.fn(),
    findActiveByTokenHash: jest.fn(),
    revokeByUserId: jest.fn(),
    revokeByTokenHash: jest.fn(),
  },
}));

jest.mock('../../src/repositories/user-repository', () => ({
  userRepository: {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    updatePassword: jest.fn(),
  },
}));

import { AppError, ConflictError, UnauthorizedError, ValidationError } from '../../src/lib/errors';
import { authService } from '../../src/services/auth-service';
import { generateOpaqueToken, hashToken, signAuthToken, verifyAuthToken } from '../../src/lib/auth-tokens';
import { hashPassword, verifyPassword } from '../../src/lib/passwords';
import { authThrottleRepository } from '../../src/repositories/auth-throttle-repository';
import { csrfTokenRepository } from '../../src/repositories/csrf-token-repository';
import { passwordResetRepository } from '../../src/repositories/password-reset-repository';
import { sessionRepository } from '../../src/repositories/session-repository';
import { userRepository } from '../../src/repositories/user-repository';

const mockedGenerateOpaqueToken = generateOpaqueToken as jest.MockedFunction<typeof generateOpaqueToken>;
const mockedHashToken = hashToken as jest.MockedFunction<typeof hashToken>;
const mockedSignAuthToken = signAuthToken as jest.MockedFunction<typeof signAuthToken>;
const mockedVerifyAuthToken = verifyAuthToken as jest.MockedFunction<typeof verifyAuthToken>;

const mockedHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>;
const mockedVerifyPassword = verifyPassword as jest.MockedFunction<typeof verifyPassword>;

const mockedThrottleRepo = authThrottleRepository as jest.Mocked<typeof authThrottleRepository>;
const mockedCsrfRepo = csrfTokenRepository as jest.Mocked<typeof csrfTokenRepository>;
const mockedResetRepo = passwordResetRepository as jest.Mocked<typeof passwordResetRepository>;
const mockedSessionRepo = sessionRepository as jest.Mocked<typeof sessionRepository>;
const mockedUserRepo = userRepository as jest.Mocked<typeof userRepository>;

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ALLOWED_EMAIL_DOMAINS = 'epam.com,corp.epam.com';
    mockedHashToken.mockImplementation((token: string) => `hash:${token}`);
    mockedThrottleRepo.isBlocked.mockReturnValue(false);
  });

  describe('register', () => {
    it('rejects non-corporate email domain', async () => {
      await expect(
        authService.register({
          fullName: 'User',
          email: 'user@gmail.com',
          password: 'StrongPass123!',
        }),
      ).rejects.toBeInstanceOf(ValidationError);
    });

    it('rejects duplicate account registration', async () => {
      mockedUserRepo.findByEmail.mockReturnValue({
        id: 'u-1',
        fullName: 'Existing',
        email: 'existing@epam.com',
        passwordHash: 'h',
        role: 'submitter',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await expect(
        authService.register({
          fullName: 'Existing',
          email: 'existing@epam.com',
          password: 'StrongPass123!',
        }),
      ).rejects.toBeInstanceOf(ConflictError);
    });

    it('creates account with hashed password and submitter role', async () => {
      mockedUserRepo.findByEmail.mockReturnValue(null);
      mockedHashPassword.mockResolvedValue('hashed-password');
      mockedUserRepo.create.mockReturnValue({
        id: 'u-2',
        fullName: 'New User',
        email: 'new@epam.com',
        passwordHash: 'hashed-password',
        role: 'submitter',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await expect(
        authService.register({
          fullName: 'New User',
          email: 'new@epam.com',
          password: 'StrongPass123!',
        }),
      ).resolves.toEqual({ userId: 'u-2' });

      expect(mockedUserRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'New User',
          email: 'new@epam.com',
          passwordHash: 'hashed-password',
          role: 'submitter',
        }),
      );
    });
  });

  describe('login', () => {
    it('blocks throttled login attempt', async () => {
      mockedThrottleRepo.isBlocked.mockReturnValue(true);

      await expect(
        authService.login({
          email: 'user@epam.com',
          password: 'StrongPass123!',
          sourceIp: '127.0.0.1',
        }),
      ).rejects.toEqual(expect.objectContaining({ statusCode: 429, code: 'AUTH_THROTTLED' }));
    });

    it('records throttle failure and rejects when user is missing', async () => {
      mockedUserRepo.findByEmail.mockReturnValue(null);

      await expect(
        authService.login({
          email: 'missing@epam.com',
          password: 'StrongPass123!',
          sourceIp: '127.0.0.1',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedError);

      expect(mockedThrottleRepo.recordFailure).toHaveBeenCalledWith({
        actionType: 'login',
        accountKey: 'missing@epam.com',
        sourceIp: '127.0.0.1',
      });
    });

    it('records throttle failure and rejects suspended user', async () => {
      mockedUserRepo.findByEmail.mockReturnValue({
        id: 'u-suspended',
        fullName: 'Suspended',
        email: 'suspended@epam.com',
        passwordHash: 'hash',
        role: 'submitter',
        status: 'suspended',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await expect(
        authService.login({
          email: 'suspended@epam.com',
          password: 'StrongPass123!',
          sourceIp: '127.0.0.1',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it('records throttle failure and rejects invalid password', async () => {
      mockedUserRepo.findByEmail.mockReturnValue({
        id: 'u-3',
        fullName: 'User',
        email: 'user@epam.com',
        passwordHash: 'stored-hash',
        role: 'submitter',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      mockedVerifyPassword.mockResolvedValue(false);

      await expect(
        authService.login({
          email: 'user@epam.com',
          password: 'WrongPass123!',
          sourceIp: '127.0.0.1',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedError);

      expect(mockedThrottleRepo.recordFailure).toHaveBeenCalled();
    });

    it('creates session and clears throttle on successful login', async () => {
      mockedUserRepo.findByEmail.mockReturnValue({
        id: 'u-4',
        fullName: 'Admin User',
        email: 'admin@epam.com',
        passwordHash: 'stored-hash',
        role: 'admin',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      mockedVerifyPassword.mockResolvedValue(true);
      mockedSignAuthToken.mockReturnValue({
        token: 'jwt-token',
        expiresAt: '2030-01-01T00:00:00.000Z',
        jti: 'jwt-id-1',
      });

      await expect(
        authService.login({
          email: 'admin@epam.com',
          password: 'StrongPass123!',
          sourceIp: '10.0.0.1',
        }),
      ).resolves.toEqual({
        token: 'jwt-token',
        userId: 'u-4',
        role: 'admin',
        redirectTo: '/dashboard',
        expiresAt: '2030-01-01T00:00:00.000Z',
      });

      expect(mockedSessionRepo.revokeByUserId).toHaveBeenCalledWith('u-4');
      expect(mockedSessionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u-4',
          jwtId: 'jwt-id-1',
          tokenHash: 'hash:jwt-token',
          createdFromIp: '10.0.0.1',
          createdFromUserAgent: null,
        }),
      );
      expect(mockedThrottleRepo.clearWindow).toHaveBeenCalledWith({
        actionType: 'login',
        accountKey: 'admin@epam.com',
        sourceIp: '10.0.0.1',
      });
    });
  });

  describe('session + csrf', () => {
    it('revokes session on logout by hashed token', () => {
      authService.logout('raw-token');
      expect(mockedSessionRepo.revokeByTokenHash).toHaveBeenCalledWith('hash:raw-token');
    });

    it('rejects session when active record is missing', () => {
      mockedVerifyAuthToken.mockReturnValue({ userId: 'u-1', role: 'submitter', jti: 'j-1', exp: 1_893_456_000 });
      mockedSessionRepo.findActiveByTokenHash.mockReturnValue(null);
      mockedUserRepo.findById.mockReturnValue(null);

      expect(() => authService.getSession('jwt')).toThrow(UnauthorizedError);
    });

    it('rejects session when stored session user does not match token payload', () => {
      mockedVerifyAuthToken.mockReturnValue({ userId: 'u-1', role: 'submitter', jti: 'j-1', exp: 1_893_456_000 });
      mockedSessionRepo.findActiveByTokenHash.mockReturnValue({
        id: 's-1',
        userId: 'u-2',
        jwtId: 'j-1',
        tokenHash: 'hash:jwt',
        expiresAt: '2030-01-01T00:00:00.000Z',
        createdAt: '2029-01-01T00:00:00.000Z',
        revokedAt: null,
        createdFromIp: null,
        createdFromUserAgent: null,
      });
      mockedUserRepo.findById.mockReturnValue({
        id: 'u-1',
        fullName: 'User',
        email: 'user@epam.com',
        passwordHash: 'hash',
        role: 'submitter',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      expect(() => authService.getSession('jwt')).toThrow(UnauthorizedError);
    });

    it('returns session snapshot for valid token/session/user', () => {
      mockedVerifyAuthToken.mockReturnValue({ userId: 'u-1', role: 'admin', jti: 'j-1', exp: 1_893_456_000 });
      mockedSessionRepo.findActiveByTokenHash.mockReturnValue({
        id: 's-1',
        userId: 'u-1',
        jwtId: 'j-1',
        tokenHash: 'hash:jwt',
        expiresAt: '2030-01-01T00:00:00.000Z',
        createdAt: '2029-01-01T00:00:00.000Z',
        revokedAt: null,
        createdFromIp: null,
        createdFromUserAgent: null,
      });
      mockedUserRepo.findById.mockReturnValue({
        id: 'u-1',
        fullName: 'Admin User',
        email: 'admin@epam.com',
        passwordHash: 'hash',
        role: 'admin',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      expect(authService.getSession('jwt')).toEqual({
        authenticated: true,
        userId: 'u-1',
        fullName: 'Admin User',
        email: 'admin@epam.com',
        role: 'admin',
        expiresAt: '2030-01-01T00:00:00.000Z',
      });
    });

    it('rejects csrf issuance when session is invalid', () => {
      mockedSessionRepo.findActiveByTokenHash.mockReturnValue(null);
      expect(() => authService.issueCsrf('bad-token')).toThrow(UnauthorizedError);
    });

    it('issues csrf token for active session', () => {
      mockedSessionRepo.findActiveByTokenHash.mockReturnValue({
        id: 'session-1',
        userId: 'u-1',
        jwtId: 'j-1',
        tokenHash: 'hash:jwt',
        expiresAt: '2030-01-01T00:00:00.000Z',
        createdAt: '2029-01-01T00:00:00.000Z',
        revokedAt: null,
        createdFromIp: null,
        createdFromUserAgent: null,
      });
      mockedGenerateOpaqueToken.mockReturnValue('csrf-raw-token');

      expect(authService.issueCsrf('jwt-token')).toEqual({ csrfToken: 'csrf-raw-token' });
      expect(mockedCsrfRepo.issue).toHaveBeenCalledWith({
        sessionId: 'session-1',
        tokenHash: 'hash:csrf-raw-token',
        ttlMinutes: 30,
      });
    });
  });

  describe('password reset flows', () => {
    it('blocks password reset request when throttled', () => {
      mockedThrottleRepo.isBlocked.mockReturnValue(true);

      expect(() => {
        authService.requestPasswordReset({
          email: 'user@epam.com',
          sourceIp: '127.0.0.1',
        });
      }).toThrow(expect.objectContaining({ statusCode: 429, code: 'AUTH_THROTTLED' }));
    });

    it('returns neutral message when account does not exist', () => {
      mockedUserRepo.findByEmail.mockReturnValue(null);

      expect(
        authService.requestPasswordReset({
          email: 'unknown@epam.com',
          sourceIp: '127.0.0.1',
        }),
      ).toEqual({ message: 'If an account exists, a reset link has been sent.' });

      expect(mockedResetRepo.create).not.toHaveBeenCalled();
    });

    it('creates reset token for known account', () => {
      mockedUserRepo.findByEmail.mockReturnValue({
        id: 'u-reset',
        fullName: 'Reset User',
        email: 'reset@epam.com',
        passwordHash: 'hash',
        role: 'submitter',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      mockedGenerateOpaqueToken.mockReturnValue('reset-raw-token');

      const result = authService.requestPasswordReset({
        email: 'reset@epam.com',
        sourceIp: '127.0.0.1',
      });

      expect(mockedResetRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u-reset',
          tokenHash: 'hash:reset-raw-token',
          requestedFromIp: '127.0.0.1',
        }),
      );
      expect(result).toEqual({ message: 'If an account exists, a reset link has been sent.' });
    });

    it('records throttle failure and rejects invalid reset token', async () => {
      mockedResetRepo.findActiveByTokenHash.mockReturnValue(null);

      await expect(
        authService.confirmPasswordReset({ token: 'bad-token', newPassword: 'StrongPass123!', sourceIp: '127.0.0.1' }),
      ).rejects.toEqual(expect.objectContaining({ code: 'AUTH_RESET_TOKEN_INVALID' }));

      expect(mockedThrottleRepo.recordFailure).toHaveBeenCalledWith({
        actionType: 'password_reset',
        accountKey: 'token',
        sourceIp: '127.0.0.1',
      });
    });

    it('rejects reset token when referenced user cannot be found', async () => {
      mockedResetRepo.findActiveByTokenHash.mockReturnValue({
        id: 'reset-1',
        userId: 'missing-user',
        tokenHash: 'hash:raw',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        consumedAt: null,
        requestedFromIp: '127.0.0.1',
      } as never);
      mockedUserRepo.findById.mockReturnValue(null);

      await expect(
        authService.confirmPasswordReset({ token: 'raw', newPassword: 'StrongPass123!', sourceIp: '127.0.0.1' }),
      ).rejects.toEqual(expect.objectContaining({ code: 'AUTH_RESET_TOKEN_INVALID' }));
    });

    it('resets password and revokes sessions for valid token', async () => {
      mockedResetRepo.findActiveByTokenHash.mockReturnValue({
        id: 'reset-2',
        userId: 'u-9',
        tokenHash: 'hash:raw',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        consumedAt: null,
        requestedFromIp: '127.0.0.1',
      } as never);
      mockedUserRepo.findById.mockReturnValue({
        id: 'u-9',
        fullName: 'Resettable User',
        email: 'resettable@epam.com',
        passwordHash: 'old-hash',
        role: 'submitter',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      mockedHashPassword.mockResolvedValue('new-hash');

      await expect(
        authService.confirmPasswordReset({ token: 'raw', newPassword: 'NewStrong123!', sourceIp: '127.0.0.1' }),
      ).resolves.toEqual({ message: 'Password reset completed' });

      expect(mockedUserRepo.updatePassword).toHaveBeenCalledWith('u-9', 'new-hash');
      expect(mockedResetRepo.consume).toHaveBeenCalledWith('reset-2');
      expect(mockedResetRepo.consumeAllForUser).toHaveBeenCalledWith('u-9');
      expect(mockedSessionRepo.revokeByUserId).toHaveBeenCalledWith('u-9');
    });
  });
});
