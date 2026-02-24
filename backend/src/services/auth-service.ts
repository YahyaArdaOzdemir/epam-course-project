import { ConflictError, UnauthorizedError, ValidationError } from '../lib/errors';
import { hashToken, signAuthToken } from '../lib/auth-tokens';
import { hashPassword, verifyPassword } from '../lib/passwords';
import { sessionRepository } from '../repositories/session-repository';
import { userRepository } from '../repositories/user-repository';

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

export const authService = {
  async register(email: string, password: string): Promise<{ userId: string }> {
    assertCorporateDomain(email);

    const existing = userRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError('Account already exists');
    }

    const passwordHash = await hashPassword(password);
    const user = userRepository.create({ email, passwordHash, role: 'submitter' });
    return { userId: user.id };
  },

  async login(email: string, password: string): Promise<{ token: string; userId: string; role: 'submitter' | 'evaluator_admin' }> {
    const user = userRepository.findByEmail(email);
    if (!user || user.status !== 'active') {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const token = signAuthToken({ userId: user.id, role: user.role });
    sessionRepository.create({
      userId: user.id,
      tokenHash: hashToken(token),
      ttlHours: 8,
    });

    return {
      token,
      userId: user.id,
      role: user.role,
    };
  },

  logout(token: string): void {
    sessionRepository.revokeByTokenHash(hashToken(token));
  },
};
