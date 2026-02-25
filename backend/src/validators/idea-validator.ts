import { z } from 'zod';
import { IDEA_CATEGORIES } from '../lib/domain-constants';
import { validateOrThrow } from './common';

const createIdeaSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(4000),
  category: z.enum(IDEA_CATEGORIES),
});

const shareIdeaSchema = z.object({
  isShared: z.boolean(),
});

export const parseCreateIdeaPayload = (input: unknown) => validateOrThrow(createIdeaSchema, input);
export const parseShareIdeaPayload = (input: unknown) => validateOrThrow(shareIdeaSchema, input);
