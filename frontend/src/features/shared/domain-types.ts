export type UserRole = 'submitter' | 'admin';
export type UserStatus = 'active' | 'suspended';

export type IdeaCategory =
  | 'Process Improvement'
  | 'Product Feature'
  | 'Cost Saving'
  | 'Workplace Wellness'
  | 'Technology/IT'
  | 'Other';
export type IdeaStatus = 'Submitted' | 'Under Review' | 'Accepted' | 'Rejected';

export type PaginationMeta = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};
