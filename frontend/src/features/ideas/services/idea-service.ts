import { apiClient } from '../../../services/api-client';
import { IdeaCreateRequest, IdeaListItem, ShareIdeaRequest } from '../../../services/contracts';

/** API helpers for creating/listing/sharing ideas. */
export const ideaApi = {
  async create(payload: IdeaCreateRequest, csrfToken: string): Promise<IdeaListItem> {
    const formData = new FormData();
    formData.append('title', payload.title);
    formData.append('description', payload.description);
    formData.append('category', payload.category);
    if (payload.file) {
      formData.append('file', payload.file);
    }

    return apiClient.post('/ideas', formData, true, csrfToken);
  },

  list(): Promise<IdeaListItem[]> {
    return apiClient.get('/ideas');
  },

  share(ideaId: string, payload: ShareIdeaRequest, csrfToken: string): Promise<IdeaListItem> {
    return apiClient.patch(`/ideas/${ideaId}/share`, { isShared: payload.isShared }, payload.rowVersion, csrfToken);
  },
};
