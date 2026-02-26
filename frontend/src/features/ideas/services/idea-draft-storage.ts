import { IdeaCategory } from '../../../services/contracts';

export type IdeaDraftDynamicFields = {
  currentPainPoints?: string;
  targetUserPersona?: string;
  estimatedAnnualSavings?: string;
  targetDepartment?: string;
  proposedSoftwareHardware?: string;
};

export type IdeaDraftRecord = {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: IdeaCategory | '';
  dynamicFields: IdeaDraftDynamicFields;
  isShared: boolean;
  updatedAt: string;
};

const draftStorageKey = (userId: string) => `innovateepam.ideaDrafts.${userId}`;

const parseDrafts = (raw: string | null): IdeaDraftRecord[] => {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is IdeaDraftRecord => {
      return typeof item === 'object' && item !== null && 'id' in item && 'userId' in item;
    });
  } catch {
    return [];
  }
};

export const loadDrafts = (userId: string): IdeaDraftRecord[] => {
  return parseDrafts(window.localStorage.getItem(draftStorageKey(userId)));
};

export const loadDraftById = (userId: string, draftId: string): IdeaDraftRecord | null => {
  const drafts = loadDrafts(userId);
  return drafts.find((draft) => draft.id === draftId) ?? null;
};

export const upsertDraft = (draft: IdeaDraftRecord): void => {
  const drafts = loadDrafts(draft.userId);
  const nextDrafts = [
    draft,
    ...drafts.filter((existing) => existing.id !== draft.id),
  ]
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    .slice(0, 20);

  window.localStorage.setItem(draftStorageKey(draft.userId), JSON.stringify(nextDrafts));
};

export const removeDraft = (userId: string, draftId: string): void => {
  const drafts = loadDrafts(userId);
  const nextDrafts = drafts.filter((draft) => draft.id !== draftId);
  window.localStorage.setItem(draftStorageKey(userId), JSON.stringify(nextDrafts));
};
