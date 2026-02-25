export const USER_ROLES = ['submitter', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ['active', 'suspended'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const IDEA_CATEGORIES = ['Process Improvement', 'Product Feature', 'Cost Saving', 'Other'] as const;
export type IdeaCategory = (typeof IDEA_CATEGORIES)[number];

export const IDEA_STATUSES = ['Submitted', 'Under Review', 'Accepted', 'Rejected'] as const;
export type IdeaStatus = (typeof IDEA_STATUSES)[number];

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

export const AUTH_THROTTLE_LIMIT = 5;
export const AUTH_THROTTLE_WINDOW_MINUTES = 15;

export const SESSION_TTL_HOURS = 24;
export const PASSWORD_RESET_TTL_MINUTES = 30;
