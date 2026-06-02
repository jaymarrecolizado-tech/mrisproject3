import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from '../services/api';
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
  hasPermission: (permission: string) => boolean;
  hasProjectAccess: (projectId: number, minLevel?: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('mris_token'));
  const [isLoading, setIsLoading] = useState(true);

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
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, hasPermission, hasProjectAccess }}>
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
