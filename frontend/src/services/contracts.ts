export type Role = 'submitter' | 'evaluator_admin';
export type IdeaStatus = 'Submitted' | 'Under Review' | 'Accepted' | 'Rejected';

export type AuthSession = {
  token: string;
  userId: string;
  role: Role;
};

export type RegisterRequest = {
  email: string;
  password: string;
};

export type LoginRequest = RegisterRequest;

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
