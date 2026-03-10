'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { api, ApiException, setAccessToken } from '@/lib/api';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

function decodeToken(token: string): User | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name || decoded.email.split('@')[0],
    };
  } catch {
    return null;
  }
}

function setRefreshTokenCookie(token: string): void {
  const maxAge = 60 * 60 * 24 * 7; // 7 days — matches backend refresh token expiry
  const secure =
    typeof location !== 'undefined' && location.protocol === 'https:'
      ? '; Secure'
      : '';
  document.cookie = `refresh_token=${token}; path=/; max-age=${maxAge}; SameSite=Strict${secure}`;
}

function getRefreshTokenCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((r) => r.startsWith('refresh_token='));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

function clearRefreshTokenCookie(): void {
  document.cookie = 'refresh_token=; path=/; max-age=0; SameSite=Strict';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  function applySession(accessToken: string): void {
    const decodedUser = decodeToken(accessToken);
    setAccessToken(accessToken);
    setToken(accessToken);
    setUser(decodedUser);
  }

  function clearSession(): void {
    setAccessToken(null);
    setToken(null);
    setUser(null);
  }

  useEffect(() => {
    const refreshToken = getRefreshTokenCookie();
    if (!refreshToken) {
      setIsLoading(false);
      return;
    }
    api
      .post<AuthResponse>('/auths/refresh', { refresh_token: refreshToken })
      .then((response) => {
        if (response.refresh_token) {
          setRefreshTokenCookie(response.refresh_token);
        }
        applySession(response.access_token);
      })
      .catch(() => {
        clearRefreshTokenCookie();
        clearSession();
      })
      .finally(() => {
        setIsLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const response = await api.post<AuthResponse>('/auths/login', data);
    const decodedUser = decodeToken(response.access_token);
    if (!decodedUser) {
      throw new ApiException(401, 'Invalid token received');
    }
    if (response.refresh_token) {
      setRefreshTokenCookie(response.refresh_token);
    }
    setAccessToken(response.access_token);
    setToken(response.access_token);
    setUser(decodedUser);
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    const response = await api.post<AuthResponse>('/auths/register', data);
    const decodedUser = decodeToken(response.access_token);
    if (!decodedUser) {
      throw new ApiException(401, 'Invalid token received');
    }
    if (response.refresh_token) {
      setRefreshTokenCookie(response.refresh_token);
    }
    setAccessToken(response.access_token);
    setToken(response.access_token);
    setUser(decodedUser);
  }, []);

  const logout = useCallback(() => {
    api.post('/auths/logout').catch(() => {}); // best-effort server-side revocation
    clearRefreshTokenCookie();
    clearSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
