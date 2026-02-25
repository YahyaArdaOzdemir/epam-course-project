import { AppError, ConflictError, UnauthorizedError, ValidationError } from '../lib/errors';
import { generateOpaqueToken, hashToken, signAuthToken, verifyAuthToken } from '../lib/auth-tokens';
import { hashPassword, verifyPassword } from '../lib/passwords';
import { authThrottleRepository } from '../repositories/auth-throttle-repository';
import { csrfTokenRepository } from '../repositories/csrf-token-repository';
import { passwordResetRepository } from '../repositories/password-reset-repository';
import { sessionRepository } from '../repositories/session-repository';
import { userRepository } from '../repositories/user-repository';

const resetTokenTtlMinutes = Number(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES ?? 30);

const getAllowedDomains = (): string[] => {
  return (process.env.ALLOWED_EMAIL_DOMAINS ?? 'epam.com')
    .split(',')
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);
};

const assertCorporateDomain = (email: string): void => {
  const domain = email.split('@')[1]?.toLowerCase();
  const allowedDomains = getAllowedDomains();
  if (!domain || !allowedDomains.includes(domain)) {
    throw new ValidationError('Email domain is not allowed');
  }
};

const ensureNotThrottled = (input: { actionType: 'login' | 'password_reset'; accountKey: string; sourceIp: string }): void => {
  if (authThrottleRepository.isBlocked(input)) {
    throw new AppError('Too many attempts. Please try again later.', 429, 'AUTH_THROTTLED');
  }
};

const recordThrottleFailure = (input: { actionType: 'login' | 'password_reset'; accountKey: string; sourceIp: string }): void => {
  authThrottleRepository.recordFailure(input);
};

type SessionSnapshot = {
  authenticated: true;
  userId: string;
  fullName: string;
  email: string;
  role: 'submitter' | 'admin';
  expiresAt: string;
};

/**
 * Core authentication domain service for credential login, cookie-backed session lifecycle,
 * CSRF issuance, and password reset token workflows.
 */
export const authService = {
  /** Registers a new user account with validated email/password and stored bcrypt hash. */
  async register(input: { fullName: string; email: string; password: string }): Promise<{ userId: string }> {
    assertCorporateDomain(input.email);

    const existing = userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('Account already exists');
    }

    const passwordHash = await hashPassword(input.password);
    const user = userRepository.create({
      fullName: input.fullName,
      email: input.email,
      passwordHash,
      role: 'submitter',
    });
    return { userId: user.id };
  },

  async login(input: {
    email: string;
    password: string;
    sourceIp: string;
    userAgent?: string;
  }): Promise<{ token: string; userId: string; role: 'submitter' | 'admin'; redirectTo: '/dashboard'; expiresAt: string }> {
    const normalizedEmail = input.email.trim().toLowerCase();
    ensureNotThrottled({ actionType: 'login', accountKey: normalizedEmail, sourceIp: input.sourceIp });

    const user = userRepository.findByEmail(normalizedEmail);
    if (!user || user.status !== 'active') {
      recordThrottleFailure({ actionType: 'login', accountKey: normalizedEmail, sourceIp: input.sourceIp });
      throw new UnauthorizedError('Invalid credentials');
    }

    const isValidPassword = await verifyPassword(input.password, user.passwordHash);
    if (!isValidPassword) {
      recordThrottleFailure({ actionType: 'login', accountKey: normalizedEmail, sourceIp: input.sourceIp });
      throw new UnauthorizedError('Invalid credentials');
    }

    const signed = signAuthToken({ userId: user.id, role: user.role });
    sessionRepository.revokeByUserId(user.id);
    sessionRepository.create({
      userId: user.id,
      jwtId: signed.jti,
      tokenHash: hashToken(signed.token),
      ttlHours: Number(process.env.SESSION_TTL_HOURS ?? 24),
      createdFromIp: input.sourceIp,
      createdFromUserAgent: input.userAgent ?? null,
    });

    authThrottleRepository.clearWindow({ actionType: 'login', accountKey: normalizedEmail, sourceIp: input.sourceIp });

    return {
      token: signed.token,
      userId: user.id,
      role: user.role,
      redirectTo: '/dashboard',
      expiresAt: signed.expiresAt,
    };
  },

  logout(token: string): void {
    sessionRepository.revokeByTokenHash(hashToken(token));
  },

  getSession(token: string): SessionSnapshot {
    const payload = verifyAuthToken(token);
    const session = sessionRepository.findActiveByTokenHash(hashToken(token));
    const user = userRepository.findById(payload.userId);

    if (!session || session.userId !== payload.userId || new Date(session.expiresAt).getTime() <= Date.now() || !user) {
      throw new UnauthorizedError('Session is invalid');
    }

    return {
      authenticated: true,
      userId: payload.userId,
      fullName: user.fullName,
      email: user.email,
      role: payload.role,
      expiresAt: session.expiresAt,
    };
  },

  issueCsrf(token: string): { csrfToken: string } {
    const session = sessionRepository.findActiveByTokenHash(hashToken(token));
    if (!session) {
      throw new UnauthorizedError('Session is invalid');
    }

    const csrfToken = generateOpaqueToken(24);
    csrfTokenRepository.issue({
      sessionId: session.id,
      tokenHash: hashToken(csrfToken),
      ttlMinutes: 30,
    });

    return { csrfToken };
  },

  requestPasswordReset(input: { email: string; sourceIp: string }): { message: string } {
    const normalizedEmail = input.email.trim().toLowerCase();
    ensureNotThrottled({ actionType: 'password_reset', accountKey: normalizedEmail, sourceIp: input.sourceIp });

    const user = userRepository.findByEmail(normalizedEmail);
    if (!user) {
      return { message: 'If an account exists, a reset link has been sent.' };
    }

    const resetToken = generateOpaqueToken(32);
    passwordResetRepository.create({
      userId: user.id,
      tokenHash: hashToken(resetToken),
      ttlMinutes: resetTokenTtlMinutes,
      requestedFromIp: input.sourceIp,
    });

    return {
      message: 'If an account exists, a reset link has been sent.',
    };
  },

  async confirmPasswordReset(input: { token: string; newPassword: string; sourceIp: string }): Promise<{ message: string }> {
    const tokenHash = hashToken(input.token);
    const record = passwordResetRepository.findActiveByTokenHash(tokenHash);

    if (!record || new Date(record.expiresAt).getTime() <= Date.now()) {
      recordThrottleFailure({ actionType: 'password_reset', accountKey: 'token', sourceIp: input.sourceIp });
      throw new AppError('Reset token is invalid or expired', 400, 'AUTH_RESET_TOKEN_INVALID');
    }

    const user = userRepository.findById(record.userId);
    if (!user) {
      throw new AppError('Reset token is invalid or expired', 400, 'AUTH_RESET_TOKEN_INVALID');
    }

    const nextPasswordHash = await hashPassword(input.newPassword);
    userRepository.updatePassword(user.id, nextPasswordHash);

    passwordResetRepository.consume(record.id);
    passwordResetRepository.consumeAllForUser(user.id);
    sessionRepository.revokeByUserId(user.id);

    return { message: 'Password reset completed' };
  },
};
