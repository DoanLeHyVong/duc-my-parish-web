import { createContext, useContext } from 'react';

export type RoleCode = 'SUPER_ADMIN' | 'PARISH_ADMIN' | 'APPGLV_ADMIN' | 'TEACHER';
export type User = {
  id: string;
  username: string;
  displayName: string;
  email?: string | null;
  isActive: boolean;
  role?: RoleCode;
  roles: RoleCode[];
  permissions: string[];
};
export type Admin = { id: number | null; fullName: string; username: string; email?: string | null; roles: RoleCode[]; permissions: string[] };
export type AuthValue = {
  user: User | null;
  admin: Admin | null;
  ready: boolean;
  can: (permission: string) => boolean;
  hasRole: (role: RoleCode) => boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};
export const AuthContext = createContext<AuthValue | null>(null);
export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
};
