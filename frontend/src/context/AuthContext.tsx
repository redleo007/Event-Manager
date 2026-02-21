import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authAPI, AUTH_TOKEN_KEY, AUTH_USER_KEY } from '../api/client';

export type AuthRole = 'admin' | 'user';
export type AuthStatus = 'pending' | 'approved';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
  status: AuthStatus;
  approved_at?: string | null;
  approved_by?: string | null;
}

type SignupResult = { pending: true; message: string } | { pending: false; user: AuthUser };

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  isReadOnlyUser: boolean;
  canWrite: boolean;
  login: (payload: { email: string; password: string; mode?: AuthRole }) => Promise<AuthUser>;
  signup: (payload: { name: string; email: string; password: string; confirmPassword: string; role?: AuthRole }) => Promise<SignupResult>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const safeReadJson = <T,>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (err) {
    console.warn(`[auth] Failed to read ${key} from storage`, err);
    return null;
  }
};

const persistAuth = (token: string, user: AuthUser) => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

const clearAuth = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    } catch {
      return null;
    }
  });
  const [user, setUser] = useState<AuthUser | null>(() => safeReadJson<AuthUser>(AUTH_USER_KEY));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const logout = () => {
    clearAuth();
    setUser(null);
    setToken(null);
  };

  const refreshUser = async () => {
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const res = await authAPI.me();
      const data = (res as any).data ?? res;
      const nextUser: AuthUser = data.user ?? data;
      setUser(nextUser);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));
    } catch (err) {
      console.error('[auth] Failed to refresh session', err);
      logout();
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        setLoading(false);
        setUser(null);
        return;
      }

      await refreshUser();
      setLoading(false);
    };

    bootstrap();
    // Keep auth state in sync if another tab clears it
    const handleCleared = () => logout();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === AUTH_TOKEN_KEY && !event.newValue) {
        logout();
      }
    };
    window.addEventListener('auth:cleared', handleCleared);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('auth:cleared', handleCleared);
      window.removeEventListener('storage', handleStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = async (payload: { email: string; password: string; mode?: AuthRole }) => {
    setError(null);
    const res = await authAPI.login(payload);
    const data = (res as any).data ?? res;
    const authToken = data.token;
    const authUser: AuthUser = data.user ?? data;

    if (!authToken || !authUser) {
      throw new Error('Unexpected login response');
    }

    persistAuth(authToken, authUser);
    setToken(authToken);
    setUser(authUser);
    return authUser;
  };

  const signup = async (payload: { name: string; email: string; password: string; confirmPassword: string; role?: AuthRole }): Promise<SignupResult> => {
    setError(null);
    const res = await authAPI.signup(payload);
    const data = (res as any).data ?? res;

    if (data?.status === 'pending') {
      logout();
      const message = data.message ?? 'Admin account created. Waiting for approval by an existing admin.';
      return { pending: true, message };
    }

    const authToken = data.token;
    const authUser: AuthUser = data.user ?? data;

    if (!authToken || !authUser) {
      throw new Error('Unexpected signup response');
    }

    persistAuth(authToken, authUser);
    setToken(authToken);
    setUser(authUser);
    return { pending: false, user: authUser };
  };

  const value: AuthContextValue = useMemo(
    () => ({
      user,
      token,
      loading,
      error,
      isAdmin: Boolean(user && user.role === 'admin' && user.status === 'approved'),
      isReadOnlyUser: Boolean(user && user.role === 'user'),
      canWrite: Boolean(user && user.role === 'admin' && user.status === 'approved'),
      login,
      signup,
      logout,
      refreshUser,
    }),
    [user, token, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return ctx;
};