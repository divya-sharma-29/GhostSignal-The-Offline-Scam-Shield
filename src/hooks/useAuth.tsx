import { createContext, useContext, useState, type ReactNode } from 'react';

const AUTH_STORAGE_KEY = 'ghostsignal_auth_session';

export interface AuthState {
  countryCode: string;
  phoneNumber: string;
  authenticatedAt?: string;
}

interface AuthContextValue {
  user: AuthState | null;
  login: (authState: AuthState) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthState | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      return stored ? (JSON.parse(stored) as AuthState) : null;
    } catch {
      return null;
    }
  });

  const login = (authState: AuthState) => {
    const sessionData = {
      ...authState,
      authenticatedAt: new Date().toISOString()
    };
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionData));
    } catch {
      // storage quota or private mode
    }
    setUser(sessionData);
  };

  const logout = () => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // storage unavailable
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
