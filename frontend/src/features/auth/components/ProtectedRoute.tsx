import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useEffect } from 'react';

/**
 * Guards private routes by waiting for session recovery, then redirecting unauthenticated
 * users to /login while preserving attempted path state.
 */
export const ProtectedRoute = () => {
  const { session, csrfToken, isLoading, refreshSession } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && session && !csrfToken) {
      void refreshSession();
    }
  }, [csrfToken, isLoading, refreshSession, session]);

  if (isLoading) {
    return <p className="text-sm text-slate-600">Loading session...</p>;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!csrfToken) {
    return <p className="text-sm text-slate-600">Loading security token...</p>;
  }

  return <Outlet />;
};
