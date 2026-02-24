import { z } from 'zod';
import { validateOrThrow } from './common';

const authSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8).max(128),
});

export type AuthPayload = {
  email: string;
  password: string;
};

export const parseAuthPayload = (input: unknown): AuthPayload => {
  return validateOrThrow(authSchema, input);
};
