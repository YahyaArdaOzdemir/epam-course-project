import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { IdeaListItem } from '../../../services/contracts';
import { ideaApi } from '../../ideas/services/idea-service';
import { loadDrafts } from '../../ideas/services/idea-draft-storage';

export const DashboardPage = () => {
  const { session } = useAuth();
  const identityLabel = session?.fullName ?? session?.email ?? 'User';
  const [myIdeasCount, setMyIdeasCount] = useState(0);
  const [myRecentIdeas, setMyRecentIdeas] = useState<IdeaListItem[]>([]);
  const [sharedIdeas, setSharedIdeas] = useState<IdeaListItem[]>([]);
  const [drafts, setDrafts] = useState<Array<{ id: string; title: string; updatedAt: string }>>([]);
  const [evaluationQueueCount, setEvaluationQueueCount] = useState(0);
  const [recentDecisions, setRecentDecisions] = useState<IdeaListItem[]>([]);

  useEffect(() => {
    if (!session) {
      return;
    }

    if (session.role === 'submitter') {
      void Promise.all([
        ideaApi.list({ page: 1, pageSize: 6, visibilityScope: 'owner', sortBy: 'date', sortDirection: 'Newest' }),
        ideaApi.list({ page: 1, pageSize: 10, visibilityScope: 'all', sortBy: 'date', sortDirection: 'Newest' }),
      ]).then(([ownerIdeas, allVisibleIdeas]) => {
        setMyIdeasCount(ownerIdeas.pagination.totalItems);
        setMyRecentIdeas(ownerIdeas.items);
        setSharedIdeas(allVisibleIdeas.items.filter((item) => item.isShared && item.ownerUserId !== session.userId));
        setDrafts(loadDrafts(session.userId).map((draft) => ({ id: draft.id, title: draft.title || 'Untitled draft', updatedAt: draft.updatedAt })));
      }).catch(() => {
        setMyIdeasCount(0);
        setMyRecentIdeas([]);
        setSharedIdeas([]);
        setDrafts([]);
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
      setDrafts(loadDrafts(session.userId).map((draft) => ({ id: draft.id, title: draft.title || 'Untitled draft', updatedAt: draft.updatedAt })));
    }).catch(() => {
      setEvaluationQueueCount(0);
      setRecentDecisions([]);
    });
  }, [session]);

  const combinedIdeas = [...myRecentIdeas, ...sharedIdeas].slice(0, 10);

  return (
    <main className="mr-auto ml-0 max-w-6xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <section data-testid="dashboard-left-panel" className="space-y-4">
          <div>
            <h1 className="text-4xl font-semibold text-slate-900">Welcome {identityLabel},</h1>
            <p className="mt-2 text-sm text-slate-600">Here you can submit ideas, track your progress, and collaborate through shared idea discussions.</p>
          </div>

          {session?.role === 'submitter' ? (
            <>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h2 className="text-sm font-semibold text-slate-800">My Ideas</h2>
                <p className="mt-1 text-2xl font-bold text-slate-900">{myIdeasCount}</p>
                <p className="text-xs text-slate-600">Total ideas submitted by you</p>
              </div>

              <Link className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 active:scale-[0.98]" to="/ideas/new">
                Submit New Idea
              </Link>
            </>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h2 className="text-sm font-semibold text-slate-800">Evaluation Queue</h2>
              <p className="mt-1 text-2xl font-bold text-slate-900">{evaluationQueueCount}</p>
              <p className="text-xs text-slate-600">Ideas currently awaiting evaluation</p>
            </div>
          )}
        </section>

        <section data-testid="dashboard-middle-panel" className="space-y-4">
          <div className="rounded-lg border border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-800">Idea List</h2>
            {combinedIdeas.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">No ideas available right now.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {combinedIdeas.map((idea) => (
                  <li key={idea.id} className="flex items-center justify-between gap-3">
                    <Link className="text-sm font-medium text-blue-700 transition hover:text-blue-800" to={`/ideas/${idea.id}`}>
                      {idea.title}
                    </Link>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                      {idea.ownerUserId === session?.userId ? 'Own' : 'Shared'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 p-4">
              <h2 className="text-sm font-semibold text-slate-800">Working Drafts</h2>
              {drafts.length === 0 ? (
                <p className="mt-2 text-sm text-slate-600">No drafts available right now.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {drafts.map((draft) => (
                    <li key={draft.id} className="flex items-center justify-between gap-3">
                      <Link className="text-sm font-medium text-blue-700 transition hover:text-blue-800" to={`/ideas/new?draftId=${draft.id}`}>
                        {draft.title}
                      </Link>
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">Draft</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

          {session?.role !== 'submitter' ? (
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
          ) : null}
        </section>
      </div>
    </main>
  );
};
