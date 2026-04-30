import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface User {
  github_login: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: 'guest' | 'pending' | 'curator' | 'admin';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isCurator: boolean;
  isAdmin: boolean;
  isPending: boolean;
  isLoggedIn: boolean;
  login: () => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = () => {
    window.location.href = '/api/auth/github';
  };

  const logout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    setUser(null);
  };

  const refreshUser = async () => {
    setIsLoading(true);
    await fetchUser();
  };

  const isCurator = user?.role === 'curator' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';
  const isPending = user?.role === 'pending';
  const isLoggedIn = !!user;

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isCurator, isAdmin, isPending, isLoggedIn, login, logout, refreshUser }}
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
