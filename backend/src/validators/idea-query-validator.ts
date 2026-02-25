import { z } from 'zod';
import { validateOrThrow } from './common';

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['Submitted', 'Under Review', 'Accepted', 'Rejected']).optional(),
  category: z.enum(['Process Improvement', 'Product Feature', 'Cost Saving', 'Other']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sortBy: z.enum(['date', 'status']).default('date'),
  sortDirection: z.enum(['Newest', 'Oldest']).default('Newest'),
});

export type IdeaListQuery = {
  page: number;
  pageSize: number;
  status?: 'Submitted' | 'Under Review' | 'Accepted' | 'Rejected';
  category?: 'Process Improvement' | 'Product Feature' | 'Cost Saving' | 'Other';
  dateFrom?: string;
  dateTo?: string;
  sortBy: 'date' | 'status';
  sortDirection: 'Newest' | 'Oldest';
};

export const parseIdeaListQuery = (input: unknown): IdeaListQuery => {
  return validateOrThrow(querySchema, input) as IdeaListQuery;
};
