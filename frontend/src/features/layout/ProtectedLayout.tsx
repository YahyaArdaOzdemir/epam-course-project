import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/hooks/useAuth';

/**
 * Shared authenticated application shell with header, primary navigation,
 * and nested route outlet for protected content.
 */
export const ProtectedLayout = () => {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  const roleLabel = session?.role === 'admin' ? 'Admin' : 'Submitter';
  const identityLabel = session?.fullName ?? session?.email ?? 'Profile';

  const onLogout = async (): Promise<void> => {
    await logout();
    navigate('/');
  };

  const navigationLinkClassName = ({ isActive }: { isActive: boolean }): string => (
    `transition hover:text-blue-600 ${isActive ? 'font-semibold text-blue-700 underline underline-offset-4' : ''}`
  );

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/dashboard" className="text-lg font-semibold text-slate-900 transition hover:text-blue-600">InnovatEPAM Portal</Link>
          <div className="flex items-center gap-3 text-sm">
            <NavLink to="/profile" className="font-medium text-slate-700 transition hover:text-blue-700">
              {identityLabel}
            </NavLink>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700" aria-label="Role badge">
              [{roleLabel}]
            </span>
            <button type="button" onClick={() => { void onLogout(); }} className="rounded-md px-2 py-1 text-slate-700 transition hover:bg-slate-100 active:scale-[0.98]">Logout</button>
          </div>
        </div>
      </header>

      <nav aria-label="Primary" className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 shadow-sm">
        <NavLink to="/dashboard" className={navigationLinkClassName}>Dashboard</NavLink>
        <NavLink to="/ideas/new" className={navigationLinkClassName}>Submit Idea</NavLink>
        <NavLink to="/ideas" className={navigationLinkClassName}>My Ideas</NavLink>
        <NavLink to="/evaluation" className={navigationLinkClassName}>Evaluation Queue</NavLink>
      </nav>

      <main>
        <Outlet />
      </main>
    </div>
  );
};
