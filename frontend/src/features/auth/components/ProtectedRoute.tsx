import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Guards private routes by waiting for session recovery, then redirecting unauthenticated
 * users to /login while preserving attempted path state.
 */
export const ProtectedRoute = () => {
  const { session, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <p className="text-sm text-slate-600">Loading session...</p>;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
};
