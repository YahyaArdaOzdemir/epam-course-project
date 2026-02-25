import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'crypto';
import { v4 as uuid } from 'uuid';

const defaultSecret = 'dev-secret';
const defaultSessionTtlHours = 24;

export type AuthTokenPayload = {
  userId: string;
  role: 'submitter' | 'admin';
  jti: string;
  exp: number;
};

const getSessionTtlHours = (): number => {
  const parsed = Number(process.env.SESSION_TTL_HOURS ?? defaultSessionTtlHours);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultSessionTtlHours;
};

const getSecret = (): string => process.env.JWT_SECRET ?? defaultSecret;

export const signAuthToken = (payload: Omit<AuthTokenPayload, 'jti' | 'exp'>): { token: string; jti: string; expiresAt: string } => {
  const ttlHours = getSessionTtlHours();
  const now = Math.floor(Date.now() / 1000);
  const exp = now + ttlHours * 60 * 60;
  const jti = uuid();
  const token = jwt.sign({ ...payload, jti, exp }, getSecret());

  return {
    token,
    jti,
    expiresAt: new Date(exp * 1000).toISOString(),
  };
};

export const verifyAuthToken = (token: string): AuthTokenPayload => {
  return jwt.verify(token, getSecret()) as AuthTokenPayload;
};

export const hashToken = (token: string): string => {
  return createHash('sha256').update(token).digest('hex');
};

export const generateOpaqueToken = (bytes = 32): string => {
  return randomBytes(bytes).toString('hex');
};
