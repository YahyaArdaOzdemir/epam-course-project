import { z } from 'zod';
import { IDEA_CATEGORIES } from '../lib/domain-constants';
import { validateOrThrow } from './common';

const dynamicFieldsSchema = z.object({
  currentPainPoints: z.string().trim().min(1).max(2000).optional(),
  targetUserPersona: z.string().trim().min(1).max(300).optional(),
  estimatedAnnualSavings: z.coerce.number().finite().min(0).optional(),
  targetDepartment: z.string().trim().min(1).max(300).optional(),
  proposedSoftwareHardware: z.string().trim().min(1).max(500).optional(),
}).strict();

type IdeaDynamicFields = z.infer<typeof dynamicFieldsSchema>;

const createIdeaSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(4000),
  category: z.enum(IDEA_CATEGORIES),
  isShared: z.coerce.boolean().optional(),
  dynamicFields: dynamicFieldsSchema.optional(),
}).superRefine((payload, context) => {
  const keys = Object.keys(payload.dynamicFields ?? {});
  if (keys.length === 0) {
    return;
  }

  const expectedByCategory: Record<(typeof IDEA_CATEGORIES)[number], string | null> = {
    'Process Improvement': 'currentPainPoints',
    'Product Feature': 'targetUserPersona',
    'Cost Saving': 'estimatedAnnualSavings',
    'Workplace Wellness': 'targetDepartment',
    'Technology/IT': 'proposedSoftwareHardware',
    'Other': null,
  };

  const expectedField = expectedByCategory[payload.category];
  if (!expectedField) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['dynamicFields'],
      message: 'Dynamic fields are not allowed for this category.',
    });
    return;
  }

  if (keys.length !== 1 || !keys.includes(expectedField)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['dynamicFields'],
      message: `Category ${payload.category} only accepts ${expectedField}.`,
    });
  }
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

const normalizeCreateIdeaInput = (input: unknown): unknown => {
  if (typeof input !== 'object' || input === null) {
    return input;
  }

  const normalized = { ...(input as Record<string, unknown>) };
  if (typeof normalized.dynamicFields === 'string') {
    try {
      normalized.dynamicFields = JSON.parse(normalized.dynamicFields) as unknown;
    } catch {
      return normalized;
    }
  }

  return normalized;
};

export const parseCreateIdeaPayload = (input: unknown) => validateOrThrow(createIdeaSchema, normalizeCreateIdeaInput(input));
export const parseShareIdeaPayload = (input: unknown) => validateOrThrow(shareIdeaSchema, input);
export const parseUpdateIdeaPayload = (input: unknown) => validateOrThrow(updateIdeaSchema, input);
export const parseCreateCommentPayload = (input: unknown) => validateOrThrow(createCommentSchema, input);
export const parseVotePayload = (input: unknown) => validateOrThrow(voteSchema, input);
