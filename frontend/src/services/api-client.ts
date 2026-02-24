const defaultBaseUrl = '/api';

export class ApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl = import.meta.env.VITE_API_BASE_URL ?? defaultBaseUrl) {
    this.baseUrl = baseUrl;
  }

  async get<T>(path: string, token?: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' }, token);
  }

  async post<T>(path: string, body?: BodyInit | object, token?: string, isFormData = false): Promise<T> {
    const headers: HeadersInit = {};
    let payload: BodyInit | undefined;

    if (body && isFormData) {
      payload = body as BodyInit;
    } else if (body && typeof body === 'object') {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    } else {
      payload = body as BodyInit | undefined;
    }

    return this.request<T>(path, { method: 'POST', body: payload, headers }, token);
  }

  async patch<T>(path: string, body: object, token?: string, ifMatch?: number): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (ifMatch !== undefined) {
      headers['If-Match'] = String(ifMatch);
    }

    return this.request<T>(path, { method: 'PATCH', body: JSON.stringify(body), headers }, token);
  }

  private async request<T>(path: string, init: RequestInit, token?: string): Promise<T> {
    const headers = new Headers(init.headers);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers,
    });

    if (!response.ok) {
      const maybeJson = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(maybeJson.message ?? 'Request failed');
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }
}

export const apiClient = new ApiClient();
