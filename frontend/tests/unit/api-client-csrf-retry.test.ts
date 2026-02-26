import { ApiClient } from '../../src/services/api-client';

describe('ApiClient CSRF retry', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('retries state-changing request once after refreshing csrf token', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'CSRF token is invalid', code: 'AUTH_CSRF_INVALID' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ csrfToken: 'fresh-csrf-token' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 'idea-1' }),
      });

    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const client = new ApiClient('/api');
    const result = await client.post<{ id: string }>('/ideas', { title: 'Idea' }, false, 'stale-token');

    expect(result.id).toBe('idea-1');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/auth/csrf', {
      method: 'GET',
      credentials: 'include',
    });

    const retryCall = fetchMock.mock.calls[2] as [string, RequestInit];
    expect(retryCall[0]).toBe('/api/ideas');
    const retryHeaders = new Headers(retryCall[1].headers);
    expect(retryHeaders.get('X-CSRF-Token')).toBe('fresh-csrf-token');
  });

  it('does not retry when error is not csrf-related', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ message: 'Forbidden', code: 'AUTH_FORBIDDEN' }),
    });

    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const client = new ApiClient('/api');

    await expect(client.post('/ideas', { title: 'Idea' }, false, 'token')).rejects.toThrow('Forbidden');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
