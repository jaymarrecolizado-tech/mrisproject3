import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { api, setAuthHandler } from '../services/api';
import { getAppBasePath } from '../utils/appBase';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  role_name: string;
  department: string | null;
  permissions: string[];
  project_access: Record<number, string>;
  role_id?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, email: string, newPassword: string) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasProjectAccess: (projectId: number, minLevel?: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function getInitialUser(): User | null {
  try {
    const stored = localStorage.getItem('mris_user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function getInitialToken(): string | null {
  return localStorage.getItem('mris_token');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getInitialUser());
  const [token, setToken] = useState<string | null>(() => getInitialToken());
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedRef = useRef(false);

  const loadUser = useCallback(async () => {
    const storedToken = localStorage.getItem('mris_token');
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get<User>('auth.me');
      setUser(response.data);
      setToken(storedToken);
    } catch {
      localStorage.removeItem('mris_token');
      localStorage.removeItem('mris_user');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    loadUser();
  }, [loadUser]);

  const login = async (email: string, password: string) => {
    const response = await api.post<{ token: string; user: User }>('auth.login', { email, password });
    localStorage.setItem('mris_token', response.data.token);
    localStorage.setItem('mris_user', JSON.stringify(response.data.user));
    setToken(response.data.token);
    setUser(response.data.user);
  };

  const logout = async () => {
    try {
      await api.post('auth.logout');
    } catch {
      // Ignore errors on logout
    }
    localStorage.removeItem('mris_token');
    localStorage.removeItem('mris_user');
    setToken(null);
    setUser(null);
    window.location.href = `${getAppBasePath()}login`;
  };

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const response = await api.post<{ token: string }>('auth.refresh');
      localStorage.setItem('mris_token', response.data.token);
      setToken(response.data.token);
      return true;
    } catch {
      localStorage.removeItem('mris_token');
      localStorage.removeItem('mris_user');
      setToken(null);
      setUser(null);
      return false;
    }
  }, []);

  // Register the refresh handler so the API layer can silently refresh an
  // expired access token on a 401 (see setAuthHandler in services/api.ts).
  useEffect(() => {
    setAuthHandler(refreshToken);
    return () => setAuthHandler(null);
  }, [refreshToken]);

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await api.post('auth.change-password', { current_password: currentPassword, new_password: newPassword });
    // Token version incremented on backend, need to re-login
    await refreshToken();
  };

  const forgotPassword = async (email: string) => {
    await api.post('auth.forgot-password', { email });
  };

  const resetPassword = async (token: string, email: string, newPassword: string) => {
    await api.post('auth.reset-password', { token, email, new_password: newPassword });
  };

  const hasPermission = useCallback(
    (permission: string) => {
      return user?.permissions.includes(permission) ?? false;
    },
    [user]
  );

  const hasProjectAccess = useCallback(
    (projectId: number, minLevel: string = 'view') => {
      if (!user) return false;
      if (user.permissions.includes('projects.manage')) return true;
      const level = user.project_access[projectId];
      if (!level) return false;
      const levels: Record<string, number> = { view: 1, edit: 2, admin: 3 };
      return (levels[level] ?? 0) >= (levels[minLevel] ?? 0);
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshToken, changePassword, forgotPassword, resetPassword, hasPermission, hasProjectAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
