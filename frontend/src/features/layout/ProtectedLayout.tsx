import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/hooks/useAuth';

/**
 * Shared authenticated application shell with header, primary navigation,
 * and nested route outlet for protected content.
 */
export const ProtectedLayout = () => {
  const { session, logout } = useAuth();

  return (
    <div>
      <header>
        <h1>InnovatEPAM Portal</h1>
        <p>{session?.userId} • {session?.role}</p>
        <button type="button" onClick={logout}>Logout</button>
      </header>
      <nav aria-label="Primary">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/ideas/new">Submit Idea</Link>
        <Link to="/ideas">Ideas</Link>
        <Link to="/evaluation">Evaluation</Link>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
};
