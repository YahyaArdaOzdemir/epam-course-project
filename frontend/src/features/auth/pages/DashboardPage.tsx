import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const DashboardPage = () => {
  const { session } = useAuth();
  const roleLabel = session?.role === 'evaluator_admin' ? 'Admin' : 'Submitter';
  const identityLabel = session?.fullName ?? session?.email ?? 'User';

  return (
    <main className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
      <p className="mt-2 text-sm text-slate-600">Signed in as {identityLabel} ({roleLabel})</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 active:scale-[0.98]" to="/ideas/new">Submit idea</Link>
        <Link className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 active:scale-[0.98]" to="/ideas">My ideas</Link>
        <Link className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 active:scale-[0.98]" to="/evaluation">Evaluation queue</Link>
      </div>
    </main>
  );
};
