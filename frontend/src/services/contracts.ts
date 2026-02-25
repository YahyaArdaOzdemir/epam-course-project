export type Role = 'submitter' | 'evaluator_admin';
export type IdeaStatus = 'Submitted' | 'Under Review' | 'Accepted' | 'Rejected';

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
  category: string;
  status: IdeaStatus;
  isShared: boolean;
  rowVersion: number;
  ownerUserId: string;
  latestEvaluationComment: string | null;
};

export type IdeaCreateRequest = {
  title: string;
  description: string;
  category: string;
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
