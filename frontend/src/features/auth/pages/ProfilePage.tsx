import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const roleLabelMap: Record<'submitter' | 'admin', 'Submitter' | 'Admin'> = {
  submitter: 'Submitter',
  admin: 'Admin',
};

export const ProfilePage = () => {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async (): Promise<void> => {
    await logout();
    navigate('/');
  };

  return (
    <main className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
      <dl className="mt-6 space-y-4 text-sm text-slate-700">
        <div>
          <dt className="font-medium text-slate-900">Full Name</dt>
          <dd className="mt-1">{session?.fullName ?? session?.userId ?? 'Unknown user'}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-900">Email</dt>
          <dd className="mt-1">{session?.email ?? 'Unavailable'}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-900">Role</dt>
          <dd className="mt-1">{session ? roleLabelMap[session.role] : 'Unknown'}</dd>
        </div>
      </dl>
      <button
        type="button"
        onClick={onLogout}
        className="mt-8 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 active:scale-[0.98]"
      >
        Logout
      </button>
    </main>
  );
};
