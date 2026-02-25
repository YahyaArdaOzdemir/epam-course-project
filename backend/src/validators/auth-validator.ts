import { z } from 'zod';
import { validateOrThrow } from './common';

const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,128}$/;

const loginSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(passwordPolicy, 'Password must include uppercase, lowercase, digit, and special character'),
});

const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Full name must contain at least 2 characters')
      .max(100, 'Full name must contain at most 100 characters'),
    email: z.string().email().transform((value) => value.trim().toLowerCase()),
    password: z
      .string()
      .min(8)
      .max(128)
      .regex(passwordPolicy, 'Password must include uppercase, lowercase, digit, and special character'),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Password confirmation does not match',
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

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type PasswordResetRequestPayload = {
  email: string;
};

export type PasswordResetConfirmPayload = {
  token: string;
  newPassword: string;
};

export const parseLoginPayload = (input: unknown): LoginPayload => {
  return validateOrThrow(loginSchema, input);
};

export const parseRegisterPayload = (input: unknown): RegisterPayload => {
  return validateOrThrow(registerSchema, input);
};

export const parsePasswordResetRequestPayload = (input: unknown): PasswordResetRequestPayload => {
  return validateOrThrow(passwordResetRequestSchema, input);
};

export const parsePasswordResetConfirmPayload = (input: unknown): PasswordResetConfirmPayload => {
  return validateOrThrow(passwordResetConfirmSchema, input);
};
