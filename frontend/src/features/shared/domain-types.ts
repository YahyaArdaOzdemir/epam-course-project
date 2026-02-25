export type UserRole = 'submitter' | 'admin';
export type UserStatus = 'active' | 'suspended';

export type IdeaCategory = 'Process Improvement' | 'Product Feature' | 'Cost Saving' | 'Other';
export type IdeaStatus = 'Submitted' | 'Under Review' | 'Accepted' | 'Rejected';

export type PaginationMeta = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};
