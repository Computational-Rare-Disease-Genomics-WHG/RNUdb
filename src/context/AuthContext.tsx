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

  /**
   * Signs out the current user by calling the logout endpoint.
   * 
   * KNOWN ISSUE: Sign-out timing problem
   * -----------------------------------
   * The fetch to /api/auth/logout is asynchronous and immediately returns.
   * The window.location.href redirect happens before the server confirms
   * the cookie was cleared. If the page navigates before the cookie is 
   * cleared server-side, the browser may still have the old cookie state.
   * 
   * Additionally, GitHub OAuth may have its own session/cookie that persists,
   * causing automatic re-authentication on subsequent visits to the login page.
   * 
   * This is a documented issue - see docs/AUTH_ISSUE.md for details.
   * Possible fixes include:
   * 1. Await logout request completion before redirect
   * 2. Use window.location.replace() for hard navigation
   * 3. Clear OAuth state before initiating login
   */
  const logout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    setUser(null);
    window.location.href = '/';
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
