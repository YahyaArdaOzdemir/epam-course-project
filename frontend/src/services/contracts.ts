export type Role = 'submitter' | 'admin';
export type IdeaStatus = 'Submitted' | 'Under Review' | 'Accepted' | 'Rejected';
export type IdeaCategory = 'Process Improvement' | 'Product Feature' | 'Cost Saving' | 'Other';

export type IdeaSortBy = 'date' | 'status';
export type IdeaSortDirection = 'Newest' | 'Oldest';

export type AuthSession = {
  authenticated: true;
  userId: string;
  fullName?: string;
  email?: string;
  role: Role;
  expiresAt: string;
};

export type LoginResponse = {
  userId: string;
  role: Role;
  redirectTo: '/dashboard';
};

export type CsrfResponse = {
  csrfToken: string;
};

export type NeutralResponse = {
  message: string;
};

export type RegisterRequest = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type IdeaListItem = {
  id: string;
  title: string;
  category: IdeaCategory;
  status: IdeaStatus;
  isShared: boolean;
  rowVersion: number;
  ownerUserId: string;
  latestEvaluationComment: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type IdeaDetails = IdeaListItem & {
  description: string;
  createdAt: string;
  updatedAt: string;
  attachment: {
    originalFileName: string;
    mimeType: string;
    sizeBytes: number;
    uploadedAt: string;
    url: string;
  } | null;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type IdeaListResponse = {
  items: IdeaListItem[];
  pagination: PaginationMeta;
};

export type IdeaListQuery = {
  page?: number;
  pageSize?: number;
  visibilityScope?: 'owner' | 'all';
  status?: IdeaStatus;
  category?: IdeaCategory;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: IdeaSortBy;
  sortDirection?: IdeaSortDirection;
};

export type IdeaCreateRequest = {
  title: string;
  description: string;
  category: IdeaCategory;
  file?: File;
};

export type ShareIdeaRequest = {
  isShared: boolean;
  rowVersion: number;
};

export type EvaluateIdeaRequest = {
  toStatus: 'Under Review' | 'Accepted' | 'Rejected';
  comment?: string;
  rowVersion: number;
};
