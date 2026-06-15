'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'STUDENT' | 'CLUB_HEAD' | 'HACKATHON_LEAD' | 'FEST_COORDINATOR';
  entityType: string | null;
  entityId: number | null;
  studentId: string | null;
  requiresPasswordChange: boolean;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (...roles: string[]) => boolean;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { method: 'GET', credentials: 'include' });
      if (!res.ok) { setUser(null); return; }
      const result = await res.json();
      if (result.success && result.data?.user) {
        setUser(result.data.user as User);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  // Rehydrate session on mount
  useEffect(() => {
    setLoading(true);
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (username: string, password: string): Promise<User> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const result = await res.json();

    if (!result.success) {
      throw new Error(result.error || 'Login failed');
    }

    setUser(result.user as User);
    return result.user as User;
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } finally {
      setUser(null);
      router.push('/login');
    }
  }, [router]);

  const isAuthenticated = Boolean(user);

  const hasRole = useCallback((...roles: string[]) => roles.includes(user?.role ?? ''), [user]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, isAuthenticated, login, logout, refreshUser, hasRole }),
    [user, loading, isAuthenticated, login, logout, refreshUser, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
