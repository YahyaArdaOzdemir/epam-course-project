import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';

const defaultSecret = 'dev-secret';
const expiresIn = '8h';

export type AuthTokenPayload = {
  userId: string;
  role: 'submitter' | 'evaluator_admin';
};

export const signAuthToken = (payload: AuthTokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET ?? defaultSecret, { expiresIn });
};

export const verifyAuthToken = (token: string): AuthTokenPayload => {
  return jwt.verify(token, process.env.JWT_SECRET ?? defaultSecret) as AuthTokenPayload;
};

export const hashToken = (token: string): string => {
  return createHash('sha256').update(token).digest('hex');
};
