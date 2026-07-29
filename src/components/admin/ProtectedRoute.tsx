import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoadingState } from '../common/LoadingState';
import { useAuth } from '../../providers/auth-context';

export function ProtectedRoute() {
  const { admin, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <LoadingState />;
  return admin ? <Outlet /> : <Navigate to="/admin/login" state={{ from: location }} replace />;
}
