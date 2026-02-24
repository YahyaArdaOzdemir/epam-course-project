import { ZodError, ZodType } from 'zod';
import { ValidationError } from '../lib/errors';

export const validateOrThrow = <T>(schema: ZodType<T>, input: unknown): T => {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(zodToMessage(result.error));
  }
  return result.data;
};

const zodToMessage = (error: ZodError): string => {
  return error.issues.map((issue) => issue.message).join('; ');
};
