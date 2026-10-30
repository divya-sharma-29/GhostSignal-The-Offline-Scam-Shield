import { createContext, useContext, useState, type ReactNode } from 'react';

const AUTH_STORAGE_KEY = 'ghostsignal_mock_auth_v1';

interface AuthState {
  countryCode: string;
  phoneNumber: string;
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
      return stored ? JSON.parse(stored) as AuthState : null;
    } catch {
      return null;
    }
  });

  const login = (authState: AuthState) => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
    setUser(authState);
  };

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
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