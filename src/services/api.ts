import { getApiBasePath, getAppBasePath } from '../utils/appBase';

const API_BASE = getApiBasePath();

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string>;
}

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    total: number;
    page: number;
    per_page: number;
    last_page: number;
  };
}

function getToken(): string | null {
  return localStorage.getItem('mris_token');
}

// --- Auth refresh registry ---
// AuthContext registers its refreshToken() here so the request layer can
// silently refresh an expired access token on a 401 without creating a
// circular import (api.ts <- AuthContext <- api.ts).
let refreshHandler: (() => Promise<boolean>) | null = null;
let refreshInFlight: Promise<boolean> | null = null;

export function setAuthHandler(refresh: (() => Promise<boolean>) | null): void {
  refreshHandler = refresh;
  refreshInFlight = null;
}

async function tryRefresh(): Promise<boolean> {
  if (!refreshHandler) return false;
  // Coalesce concurrent 401s into a single refresh attempt.
  if (!refreshInFlight) {
    refreshInFlight = refreshHandler().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

function buildUrl(action: string, params?: Record<string, string | number | null>): string {
  const searchParams = new URLSearchParams({ action });
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        searchParams.set(key, String(value));
      }
    });
  }
  return `${API_BASE}/index.php?${searchParams.toString()}`;
}

async function request<T>(action: string, method: string = 'GET', body?: unknown, params?: Record<string, string | number | null>, isRetry = false): Promise<T> {
  const url = buildUrl(action, params);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      // Attempt a single silent token refresh, then retry the original request once.
      // Skip auth.login/auth.refresh/auth.logout so a bad credential or a dead
      // refresh token can never trigger a refresh loop.
      const canRefresh = !isRetry && action !== 'auth.login' && action !== 'auth.refresh' && action !== 'auth.logout';
      if (canRefresh && (await tryRefresh())) {
        return request<T>(action, method, body, params, true);
      }
      // Refresh not possible, failed, or already retried — clear auth and redirect.
      localStorage.removeItem('mris_token');
      localStorage.removeItem('mris_user');
      sessionStorage.clear();
      window.location.href = `${getAppBasePath()}login`;
    }
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

export const api = {
  get: <T>(action: string, params?: Record<string, string | number | null>) =>
    request<ApiSuccess<T>>(action, 'GET', undefined, params),

  post: <T>(action: string, body?: unknown, params?: Record<string, string | number | null>) =>
    request<ApiSuccess<T>>(action, 'POST', body, params),

  put: <T>(action: string, body?: unknown, id?: string | number) =>
    request<ApiSuccess<T>>(action, 'PUT', body, id ? { id: String(id) } : undefined),

  delete: <T>(action: string, id?: string | number) =>
    request<ApiSuccess<T>>(action, 'DELETE', undefined, id ? { id: String(id) } : undefined),

  getPaginated: <T>(action: string, params?: Record<string, string | number | null>) =>
    request<PaginatedResponse<T>>(action, 'GET', undefined, params),

  upload: async <T>(action: string, file: File, params?: Record<string, string | number | null>) => {
    const url = buildUrl(action, params);
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Upload failed');
    }
    return data as ApiSuccess<T>;
  },

  download: async (action: string, filename: string, params?: Record<string, unknown>, method: 'GET' | 'POST' = 'GET') => {
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let url: string;
    let fetchOptions: RequestInit;

    if (method === 'POST') {
      url = buildUrl(action);
      headers['Content-Type'] = 'application/json';
      fetchOptions = {
        method: 'POST',
        headers,
        body: JSON.stringify(params ?? {}),
      };
    } else {
      url = buildUrl(action, params as Record<string, string | number | null> | undefined);
      fetchOptions = { method: 'GET', headers };
    }

    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.message || 'Download failed');
    }

    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  },

};
