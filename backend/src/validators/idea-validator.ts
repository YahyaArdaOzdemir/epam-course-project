import { z } from 'zod';
import { IDEA_CATEGORIES } from '../lib/domain-constants';
import { validateOrThrow } from './common';

const createIdeaSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(4000),
  category: z.enum(IDEA_CATEGORIES),
  isShared: z.coerce.boolean().optional(),
});

const shareIdeaSchema = z.object({
  isShared: z.boolean(),
});

const updateIdeaSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(4000),
  category: z.enum(IDEA_CATEGORIES),
});

const createCommentSchema = z.object({
  body: z.string().trim().min(1).max(2000),
  parentCommentId: z.string().uuid().optional(),
});

const voteSchema = z.object({
  value: z.union([z.literal(1), z.literal(-1)]),
});

export const parseCreateIdeaPayload = (input: unknown) => validateOrThrow(createIdeaSchema, input);
export const parseShareIdeaPayload = (input: unknown) => validateOrThrow(shareIdeaSchema, input);
export const parseUpdateIdeaPayload = (input: unknown) => validateOrThrow(updateIdeaSchema, input);
export const parseCreateCommentPayload = (input: unknown) => validateOrThrow(createCommentSchema, input);
export const parseVotePayload = (input: unknown) => validateOrThrow(voteSchema, input);
