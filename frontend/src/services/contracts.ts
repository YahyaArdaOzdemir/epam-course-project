export type Role = 'submitter' | 'admin';
export type IdeaStatus = 'Submitted' | 'Under Review' | 'Accepted' | 'Rejected';
export type IdeaCategory =
  | 'Process Improvement'
  | 'Product Feature'
  | 'Cost Saving'
  | 'Workplace Wellness'
  | 'Technology/IT'
  | 'Other';

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
  ideaVotesUp?: number;
  ideaVotesDown?: number;
  ideaVotesTotal?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type IdeaDetails = IdeaListItem & {
  description: string;
  createdAt: string;
  updatedAt: string;
  evaluationDecisions: Array<{
    id: string;
    evaluatorUserId: string;
    evaluatorFullName: string;
    evaluatorEmail: string;
    decision: 'Accepted' | 'Rejected';
    comment: string;
    createdAt: string;
  }>;
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
  dynamicFields?: {
    currentPainPoints?: string;
    targetUserPersona?: string;
    estimatedAnnualSavings?: number;
    targetDepartment?: string;
    proposedSoftwareHardware?: string;
  };
  isShared?: boolean;
  file?: File;
};

export type IdeaUpdateRequest = {
  title: string;
  description: string;
  category: IdeaCategory;
  rowVersion: number;
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

export type IdeaComment = {
  id: string;
  ideaId: string;
  authorUserId: string;
  parentCommentId: string | null;
  depth: number;
  body: string;
  createdAt: string;
  updatedAt: string;
  authorEmail: string;
  authorFullName: string;
  upvotes?: number;
  downvotes?: number;
  score?: number;
};

export type VoteSummary = {
  upvotes: number;
  downvotes: number;
  totalVotes?: number;
  score?: number;
};

export type IdeaCommentListResponse = {
  items: IdeaComment[];
};
