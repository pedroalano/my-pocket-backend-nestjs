import { ApiError } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class ApiException extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiException';
  }
}

// Module-level access token — set by AuthContext, read by apiRequest
let _accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  _accessToken = token;
}

function getToken(): string | null {
  return _accessToken;
}

function getRefreshTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((r) => r.startsWith('refresh_token='));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

function getLocale(): string {
  if (typeof document === 'undefined') return 'en';
  const match = document.cookie
    .split('; ')
    .find((r) => r.startsWith('NEXT_LOCALE='));
  return match ? match.split('=')[1] : 'en';
}

// Auth endpoints that should NOT trigger the 401 refresh interceptor
const SKIP_REFRESH_ENDPOINTS = [
  '/auths/refresh',
  '/auths/login',
  '/auths/register',
];

async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = getRefreshTokenFromCookie();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_URL}/auths/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      // Revoke the stale refresh token cookie
      document.cookie = 'refresh_token=; path=/; max-age=0; SameSite=Strict';
      return null;
    }

    const data = await response.json();
    if (data.refresh_token) {
      const maxAge = 60 * 60 * 24 * 7;
      document.cookie = `refresh_token=${data.refresh_token}; path=/; max-age=${maxAge}; SameSite=Strict`;
    }
    return data.access_token ?? null;
  } catch {
    return null;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  _isRetry = false,
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept-Language': getLocale(),
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (
    response.status === 401 &&
    !_isRetry &&
    !SKIP_REFRESH_ENDPOINTS.includes(endpoint)
  ) {
    const newToken = await tryRefreshToken();
    if (newToken) {
      setAccessToken(newToken);
      return apiRequest<T>(endpoint, options, true);
    }
    // Refresh failed — clear state and redirect to login
    setAccessToken(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new ApiException(401, 'Session expired. Please log in again.');
  }

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      message: 'An unexpected error occurred',
      statusCode: response.status,
    }));
    throw new ApiException(response.status, error.message);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),

  post: <T>(endpoint: string, data?: unknown) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data?: unknown) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }),
};
