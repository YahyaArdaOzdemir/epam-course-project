import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { IdeaListItem } from '../../../services/contracts';
import { ideaApi } from '../../ideas/services/idea-service';

export const DashboardPage = () => {
  const { session } = useAuth();
  const identityLabel = session?.fullName ?? session?.email ?? 'User';
  const [myIdeasCount, setMyIdeasCount] = useState(0);
  const [sharedIdeas, setSharedIdeas] = useState<IdeaListItem[]>([]);
  const [evaluationQueueCount, setEvaluationQueueCount] = useState(0);
  const [recentDecisions, setRecentDecisions] = useState<IdeaListItem[]>([]);

  useEffect(() => {
    if (!session) {
      return;
    }

    if (session.role === 'submitter') {
      void Promise.all([
        ideaApi.list({ page: 1, pageSize: 1, visibilityScope: 'owner', sortBy: 'date', sortDirection: 'Newest' }),
        ideaApi.list({ page: 1, pageSize: 5, visibilityScope: 'all', sortBy: 'date', sortDirection: 'Newest' }),
      ]).then(([ownerIdeas, allVisibleIdeas]) => {
        setMyIdeasCount(ownerIdeas.pagination.totalItems);
        setSharedIdeas(allVisibleIdeas.items.filter((item) => item.isShared && item.ownerUserId !== session.userId));
      }).catch(() => {
        setMyIdeasCount(0);
        setSharedIdeas([]);
      });
      return;
    }

    void Promise.all([
      ideaApi.list({ page: 1, pageSize: 1, status: 'Submitted', sortBy: 'date', sortDirection: 'Newest' }),
      ideaApi.list({ page: 1, pageSize: 3, status: 'Accepted', sortBy: 'date', sortDirection: 'Newest' }),
      ideaApi.list({ page: 1, pageSize: 3, status: 'Rejected', sortBy: 'date', sortDirection: 'Newest' }),
    ]).then(([queue, accepted, rejected]) => {
      setEvaluationQueueCount(queue.pagination.totalItems);
      setRecentDecisions([...accepted.items, ...rejected.items].slice(0, 3));
    }).catch(() => {
      setEvaluationQueueCount(0);
      setRecentDecisions([]);
    });
  }, [session]);

  return (
    <main className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Welcome {identityLabel}, here you can submit ideas, track your progress, and collaborate through shared idea discussions.</h1>

      {session?.role === 'submitter' ? (
        <section className="mt-6 space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-sm font-semibold text-slate-800">My Ideas</h2>
            <p className="mt-1 text-2xl font-bold text-slate-900">{myIdeasCount}</p>
            <p className="text-xs text-slate-600">Total ideas submitted by you</p>
          </div>

          <Link className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 active:scale-[0.98]" to="/ideas/new">
            Submit New Idea
          </Link>

          <div className="rounded-lg border border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-800">Shared ideas</h2>
            {sharedIdeas.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">No shared ideas available right now.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {sharedIdeas.map((idea) => (
                  <li key={idea.id}>
                    <Link className="text-sm font-medium text-blue-700 transition hover:text-blue-800" to={`/ideas/${idea.id}`}>
                      {idea.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : (
        <section className="mt-6 space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-sm font-semibold text-slate-800">Evaluation Queue</h2>
            <p className="mt-1 text-2xl font-bold text-slate-900">{evaluationQueueCount}</p>
            <p className="text-xs text-slate-600">Ideas currently awaiting evaluation</p>
          </div>

          <div className="rounded-lg border border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-800">Recent Decisions</h2>
            {recentDecisions.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">No recent decisions.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {recentDecisions.map((idea) => (
                  <li key={idea.id}>
                    <Link className="text-sm font-medium text-blue-700 transition hover:text-blue-800" to={`/evaluation/${idea.id}`}>
                      {idea.title} ({idea.status})
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </main>
  );
};
