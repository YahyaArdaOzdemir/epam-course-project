const defaultBaseUrl = '/api';

const resolveApiBaseUrl = (): string => {
  const runtime = globalThis as {
    process?: { env?: Record<string, string | undefined> };
    VITE_API_BASE_URL?: unknown;
  };

  const processEnvBaseUrl =
    runtime.process?.env && typeof runtime.process.env.VITE_API_BASE_URL === 'string'
      ? runtime.process.env.VITE_API_BASE_URL
      : undefined;

  const globalEnvBaseUrl =
    runtime.VITE_API_BASE_URL && typeof runtime.VITE_API_BASE_URL === 'string'
      ? runtime.VITE_API_BASE_URL
      : undefined;

  return processEnvBaseUrl ?? globalEnvBaseUrl ?? defaultBaseUrl;
};

export class ApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl = resolveApiBaseUrl()) {
    this.baseUrl = baseUrl;
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  async post<T>(path: string, body?: BodyInit | object, isFormData = false, csrfToken?: string): Promise<T> {
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

    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    return this.request<T>(path, { method: 'POST', body: payload, headers });
  }

  async patch<T>(path: string, body: object, ifMatch?: number, csrfToken?: string): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (ifMatch !== undefined) {
      headers['If-Match'] = String(ifMatch);
    }

    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    return this.request<T>(path, { method: 'PATCH', body: JSON.stringify(body), headers });
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const headers = new Headers(init.headers);

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers,
      credentials: 'include',
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
