const API_BASE = '/api';

interface ApiOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ledgerflow_token');
}

function getCompanyId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ledgerflow_company_id');
}

async function request<T>(
  method: string,
  url: string,
  body?: unknown,
  options?: ApiOptions
): Promise<T> {
  const token = getAuthToken();
  const companyId = getCompanyId();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (companyId) {
    headers['X-Company-Id'] = companyId;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: options?.signal,
  });

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ledgerflow_token');
      window.location.href = '/login';
    }
    throw new ApiError('Unauthorized', 401);
  }

  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text();
    }
    throw new ApiError(
      (errorData as { message?: string })?.message || `Request failed with status ${response.status}`,
      response.status,
      errorData
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  get: <T>(url: string, options?: ApiOptions) => request<T>('GET', url, undefined, options),
  post: <T>(url: string, body?: unknown, options?: ApiOptions) => request<T>('POST', url, body, options),
  patch: <T>(url: string, body?: unknown, options?: ApiOptions) => request<T>('PATCH', url, body, options),
  put: <T>(url: string, body?: unknown, options?: ApiOptions) => request<T>('PUT', url, body, options),
  delete: <T>(url: string, options?: ApiOptions) => request<T>('DELETE', url, undefined, options),
};

export { ApiError };
export default api;
