import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, setAccessToken } from '../apis/client';
import { AuthContext, type Admin, type AuthValue, type User } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [ready, setReady] = useState(false);

  const acceptSession = (data: { accessToken: string; user: User; admin: Admin }) => {
    setAccessToken(data.accessToken);
    setUser(data.user);
    setAdmin(data.admin);
  };

  useEffect(() => {
    api.post('/auth/refresh').then((response) => acceptSession(response.data.data))
      .catch(() => setAccessToken(null)).finally(() => setReady(true));
  }, []);

  const value = useMemo<AuthValue>(() => ({
    user,
    admin,
    ready,
    can: (permission) => user?.permissions.includes(permission) ?? false,
    hasRole: (role) => user?.roles.includes(role) ?? false,
    async login(username, password) {
      const response = await api.post('/auth/login', { username, password });
      acceptSession(response.data.data);
    },
    async logout() {
      await api.post('/auth/logout').catch(() => undefined);
      setAccessToken(null);
      setUser(null);
      setAdmin(null);
    },
  }), [user, admin, ready]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
