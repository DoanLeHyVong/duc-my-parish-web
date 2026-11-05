import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoadingState } from '../common/LoadingState';
import { useAuth } from '../../providers/auth-context';

export function ProtectedRoute() {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <LoadingState />;
  return user ? <Outlet /> : <Navigate to="/admin/login" state={{ from: location }} replace />;
}

export function PermissionRoute({ permission }: { permission: string }) {
  const { can } = useAuth();
  return can(permission) ? <Outlet /> : <Navigate to="/admin" replace />;
}
