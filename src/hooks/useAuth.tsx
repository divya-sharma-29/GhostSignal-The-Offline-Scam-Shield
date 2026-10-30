import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export interface AuthUser { id: string; displayName?: string }
interface AuthContextValue {
  user: AuthUser | null;
  authenticate: (user: AuthUser) => void;
  logout: () => Promise<void>;
}
const AuthContext = createContext<AuthContextValue | null>(null);

/** Authentication is only established by the server's verified OTP response or session. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  useEffect(() => {
    let active = true;
    fetch('/api/auth/session', { credentials: 'same-origin' })
      .then((response) => response.ok ? response.json() as Promise<{ user?: AuthUser }> : null)
      .then((session) => { if (active) setUser(session?.user ?? null); })
      .catch(() => { if (active) setUser(null); });
    return () => { active = false; };
  }, []);
  const authenticate = (authenticatedUser: AuthUser) => setUser(authenticatedUser);
  const logout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }); } finally { setUser(null); }
  };
  return <AuthContext.Provider value={{ user, authenticate, logout }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
