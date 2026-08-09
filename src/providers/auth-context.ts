import { createContext, useContext } from 'react';

export type Admin = { id: number; fullName: string; username: string; email: string };
export type AuthValue = {
  admin: Admin | null;
  ready: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};
export const AuthContext = createContext<AuthValue | null>(null);
export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
};
