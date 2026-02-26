import { apiClient } from '../../../services/api-client';
import {
  IdeaComment,
  IdeaCommentListResponse,
  IdeaCreateRequest,
  IdeaDetails,
  IdeaListItem,
  IdeaListQuery,
  IdeaListResponse,
  IdeaUpdateRequest,
  ShareIdeaRequest,
} from '../../../services/contracts';

/** API helpers for creating/listing/sharing ideas. */
export const ideaApi = {
  async create(payload: IdeaCreateRequest, csrfToken: string): Promise<IdeaListItem> {
    const formData = new FormData();
    formData.append('title', payload.title);
    formData.append('description', payload.description);
    formData.append('category', payload.category);
    formData.append('isShared', payload.isShared ? 'true' : 'false');
    if (payload.file) {
      formData.append('file', payload.file);
    }

    return apiClient.post('/ideas', formData, true, csrfToken);
  },

  list(query: IdeaListQuery = {}): Promise<IdeaListResponse> {
    const searchParams = new URLSearchParams();

    if (query.page !== undefined) searchParams.set('page', String(query.page));
    if (query.pageSize !== undefined) searchParams.set('pageSize', String(query.pageSize));
    if (query.visibilityScope) searchParams.set('visibilityScope', query.visibilityScope);
    if (query.status) searchParams.set('status', query.status);
    if (query.category) searchParams.set('category', query.category);
    if (query.dateFrom) searchParams.set('dateFrom', query.dateFrom);
    if (query.dateTo) searchParams.set('dateTo', query.dateTo);
    if (query.sortBy) searchParams.set('sortBy', query.sortBy);
    if (query.sortDirection) searchParams.set('sortDirection', query.sortDirection);

    const querySuffix = searchParams.toString();
    return apiClient.get(`/ideas${querySuffix ? `?${querySuffix}` : ''}`);
  },

  getById(ideaId: string): Promise<IdeaDetails> {
    return apiClient.get(`/ideas/${ideaId}`);
  },

  share(ideaId: string, payload: ShareIdeaRequest, csrfToken: string): Promise<IdeaListItem> {
    return apiClient.patch(`/ideas/${ideaId}/share`, { isShared: payload.isShared }, payload.rowVersion, csrfToken);
  },

  update(ideaId: string, payload: IdeaUpdateRequest, csrfToken: string): Promise<IdeaListItem> {
    return apiClient.patch(
      `/ideas/${ideaId}`,
      {
        title: payload.title,
        description: payload.description,
        category: payload.category,
      },
      payload.rowVersion,
      csrfToken,
    );
  },

  delete(ideaId: string, csrfToken: string): Promise<void> {
    return apiClient.delete(`/ideas/${ideaId}`, csrfToken);
  },

  listComments(ideaId: string): Promise<IdeaCommentListResponse> {
    return apiClient.get(`/ideas/${ideaId}/comments`);
  },

  createComment(
    ideaId: string,
    payload: { body: string; parentCommentId?: string },
    csrfToken: string,
  ): Promise<IdeaComment> {
    return apiClient.post(`/ideas/${ideaId}/comments`, payload, false, csrfToken);
  },
};
