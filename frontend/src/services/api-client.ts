const defaultBaseUrl = '/api';

type ApiErrorPayload = {
  message?: string;
  code?: string;
};

class ApiError extends Error {
  readonly status: number;

  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

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

  async delete<T>(path: string, csrfToken?: string): Promise<T> {
    const headers: HeadersInit = {};
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    return this.request<T>(path, { method: 'DELETE', headers });
  }

  async put<T>(path: string, body: object, csrfToken?: string): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    return this.request<T>(path, { method: 'PUT', body: JSON.stringify(body), headers });
  }

  private async issueFreshCsrfToken(): Promise<string | null> {
    const response = await fetch(`${this.baseUrl}/auth/csrf`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json().catch(() => ({}))) as { csrfToken?: string };
    return typeof payload.csrfToken === 'string' && payload.csrfToken.length > 0
      ? payload.csrfToken
      : null;
  }

  private async request<T>(path: string, init: RequestInit, retryOnCsrfInvalid = true): Promise<T> {
    const headers = new Headers(init.headers);

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const maybeJson = (await response.json().catch(() => ({ message: response.statusText }))) as ApiErrorPayload;

      if (
        retryOnCsrfInvalid
        && init.method
        && init.method !== 'GET'
        && maybeJson.code === 'AUTH_CSRF_INVALID'
        && !path.startsWith('/auth/csrf')
      ) {
        const nextCsrfToken = await this.issueFreshCsrfToken();
        if (nextCsrfToken) {
          const retryHeaders = new Headers(init.headers);
          retryHeaders.set('X-CSRF-Token', nextCsrfToken);
          return this.request<T>(path, { ...init, headers: retryHeaders }, false);
        }
      }

      throw new ApiError(maybeJson.message ?? 'Request failed', response.status, maybeJson.code);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }
}

export const apiClient = new ApiClient();
