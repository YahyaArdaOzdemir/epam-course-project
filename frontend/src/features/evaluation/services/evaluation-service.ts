import { apiClient } from '../../../services/api-client';
import { EvaluateIdeaRequest, IdeaListItem } from '../../../services/contracts';

/** Updates idea status with optimistic concurrency conflict mapping. */
export const evaluationApi = {
  async updateStatus(ideaId: string, payload: EvaluateIdeaRequest, csrfToken: string): Promise<IdeaListItem> {
    try {
      return await apiClient.patch(
        `/ideas/${ideaId}/status`,
        {
          toStatus: payload.toStatus,
          comment: payload.comment,
        },
        payload.rowVersion,
        csrfToken,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (message.toLowerCase().includes('conflict')) {
        throw new Error('This idea was updated by someone else. Refresh and retry.');
      }
      throw error;
    }
  },
};
