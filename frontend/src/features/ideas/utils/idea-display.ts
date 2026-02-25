import { IdeaDetails, IdeaStatus } from '../../../services/contracts';

export const formatRelativeTime = (isoDate: string): string => {
  const createdAt = new Date(isoDate).getTime();
  const now = Date.now();
  const diffMs = createdAt - now;
  const absoluteSeconds = Math.abs(diffMs) / 1000;
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (absoluteSeconds < 60) {
    return formatter.format(Math.round(diffMs / 1000), 'second');
  }

  const absoluteMinutes = absoluteSeconds / 60;
  if (absoluteMinutes < 60) {
    return formatter.format(Math.round(diffMs / (60 * 1000)), 'minute');
  }

  const absoluteHours = absoluteMinutes / 60;
  if (absoluteHours < 24) {
    return formatter.format(Math.round(diffMs / (60 * 60 * 1000)), 'hour');
  }

  const absoluteDays = absoluteHours / 24;
  if (absoluteDays < 30) {
    return formatter.format(Math.round(diffMs / (24 * 60 * 60 * 1000)), 'day');
  }

  const absoluteMonths = absoluteDays / 30;
  if (absoluteMonths < 12) {
    return formatter.format(Math.round(diffMs / (30 * 24 * 60 * 60 * 1000)), 'month');
  }

  return formatter.format(Math.round(diffMs / (365 * 24 * 60 * 60 * 1000)), 'year');
};

export const getStatusBadgeClassName = (status: IdeaStatus): string => {
  if (status === 'Submitted') return 'bg-blue-100 text-blue-800';
  if (status === 'Accepted') return 'bg-green-100 text-green-800';
  if (status === 'Rejected') return 'bg-red-100 text-red-800';
  return 'bg-yellow-100 text-yellow-800';
};

export const formatAttachmentSize = (sizeBytes: number): string => {
  const sizeMb = sizeBytes / (1024 * 1024);
  if (sizeMb >= 1) {
    return `${sizeMb.toFixed(sizeMb >= 10 ? 0 : 1)} MB`;
  }

  const sizeKb = sizeBytes / 1024;
  return `${Math.max(1, Math.round(sizeKb))} KB`;
};

export const hasImageAttachmentPreview = (idea: IdeaDetails): boolean => {
  return Boolean(idea.attachment && idea.attachment.mimeType.startsWith('image/'));
};

export const getWaitTimeDays = (createdAt: string): number => {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  return Math.max(0, Math.floor(diffMs / (24 * 60 * 60 * 1000)));
};
