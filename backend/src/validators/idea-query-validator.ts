import { z } from 'zod';
import { validateOrThrow } from './common';
import { IDEA_CATEGORIES } from '../lib/domain-constants';

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  visibilityScope: z.enum(['owner', 'all']).default('owner'),
  status: z.enum(['Submitted', 'Under Review', 'Accepted', 'Rejected']).optional(),
  category: z.enum(IDEA_CATEGORIES).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sortBy: z.enum(['date', 'status']).default('date'),
  sortDirection: z.enum(['Newest', 'Oldest']).default('Newest'),
});

export type IdeaListQuery = {
  page: number;
  pageSize: number;
  visibilityScope: 'owner' | 'all';
  status?: 'Submitted' | 'Under Review' | 'Accepted' | 'Rejected';
  category?: (typeof IDEA_CATEGORIES)[number];
  dateFrom?: string;
  dateTo?: string;
  sortBy: 'date' | 'status';
  sortDirection: 'Newest' | 'Oldest';
};

export const parseIdeaListQuery = (input: unknown): IdeaListQuery => {
  return validateOrThrow(querySchema, input) as IdeaListQuery;
};
