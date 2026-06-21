import { handleMockRequest } from './mocks';

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

  // If already in mock mode, bypass actual fetch and use mock db
  if (token && token.startsWith('mock-token-') && url !== '/v1/auth/login') {
    try {
      return handleMockRequest(method, url, body) as T;
    } catch (e: any) {
      throw new ApiError(e.message || 'Mock request failed', 400);
    }
  }

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

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${url}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: options?.signal,
    });
  } catch (fetchErr) {
    console.warn('[API Connection Error] Failed to reach backend, falling back to mock database:', fetchErr);
    try {
      return handleMockRequest(method, url, body) as T;
    } catch (mockErr: any) {
      throw new ApiError('Authentication API offline. Fallback failed: ' + mockErr.message, 503);
    }
  }

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ledgerflow_token');
      window.location.href = '/login';
    }
    throw new ApiError('Unauthorized', 401);
  }

  if (!response.ok) {
    // If we get a server-side gateway error (502, 504), or a 404 (e.g. backend offline on Vercel), fall back to mocks
    if (response.status >= 500 || response.status === 404) {
      console.warn(`[API Server Error ${response.status}] Backend returned error, falling back to mock database`);
      try {
        return handleMockRequest(method, url, body) as T;
      } catch (mockErr) {
        // Fall through to throw original gateway error if mock fails
      }
    }

    let errorData: unknown;
    try {
      const text = await response.text();
      try {
        errorData = JSON.parse(text);
      } catch {
        errorData = text;
      }
    } catch {
      errorData = 'Failed to read error response';
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
