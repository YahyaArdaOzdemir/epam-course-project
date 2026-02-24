import { z } from 'zod';
import { validateOrThrow } from './common';

const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,128}$/;

const authSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(passwordPolicy, 'Password must include uppercase, lowercase, digit, and special character'),
});

const passwordResetRequestSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
});

const passwordResetConfirmSchema = z.object({
  token: z.string().min(1),
  newPassword: z
    .string()
    .min(8)
    .max(128)
    .regex(passwordPolicy, 'Password must include uppercase, lowercase, digit, and special character'),
});

export type AuthPayload = {
  email: string;
  password: string;
};

export type PasswordResetRequestPayload = {
  email: string;
};

export type PasswordResetConfirmPayload = {
  token: string;
  newPassword: string;
};

export const parseAuthPayload = (input: unknown): AuthPayload => {
  return validateOrThrow(authSchema, input);
};

export const parsePasswordResetRequestPayload = (input: unknown): PasswordResetRequestPayload => {
  return validateOrThrow(passwordResetRequestSchema, input);
};

export const parsePasswordResetConfirmPayload = (input: unknown): PasswordResetConfirmPayload => {
  return validateOrThrow(passwordResetConfirmSchema, input);
};
