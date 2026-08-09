import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, setAccessToken } from '../apis/client';
import { AuthContext, type Admin, type AuthValue } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    api.post('/auth/refresh').then((r) => {
      setAccessToken(r.data.data.accessToken);
      setAdmin(r.data.data.admin);
    }).catch(() => setAccessToken(null)).finally(() => setReady(true));
  }, []);
  const value = useMemo<AuthValue>(() => ({
    admin,
    ready,
    async login(username, password) {
      const response = await api.post('/auth/login', { username, password });
      setAccessToken(response.data.data.accessToken);
      setAdmin(response.data.data.admin);
    },
    async logout() {
      await api.post('/auth/logout').catch(() => undefined);
      setAccessToken(null);
      setAdmin(null);
    },
  }), [admin, ready]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
