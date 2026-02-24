import { apiClient } from '../../../services/api-client';
import { IdeaCreateRequest, IdeaListItem, ShareIdeaRequest } from '../../../services/contracts';

/** API helpers for creating/listing/sharing ideas. */
export const ideaApi = {
  async create(token: string, payload: IdeaCreateRequest): Promise<IdeaListItem> {
    const formData = new FormData();
    formData.append('title', payload.title);
    formData.append('description', payload.description);
    formData.append('category', payload.category);
    if (payload.file) {
      formData.append('file', payload.file);
    }

    return apiClient.post('/ideas', formData, token, true);
  },

  list(token: string): Promise<IdeaListItem[]> {
    return apiClient.get('/ideas', token);
  },

  share(ideaId: string, token: string, payload: ShareIdeaRequest): Promise<IdeaListItem> {
    return apiClient.patch(`/ideas/${ideaId}/share`, { isShared: payload.isShared }, token, payload.rowVersion);
  },
};
