import { z } from 'zod';
import { validateOrThrow } from './common';

const evaluationSchema = z.object({
  toStatus: z.enum(['Under Review', 'Accepted', 'Rejected']),
  comment: z.string().trim().optional(),
});

export const parseEvaluationPayload = (input: unknown) => {
  return validateOrThrow(evaluationSchema, input);
};
