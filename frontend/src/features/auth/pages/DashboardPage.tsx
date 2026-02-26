import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { IdeaCategory, IdeaListItem, IdeaStatus, IdeaSortDirection } from '../../../services/contracts';
import { ideaApi } from '../../ideas/services/idea-service';
import { loadDrafts } from '../../ideas/services/idea-draft-storage';
import { Badge } from '../../../components/ui/Badge';
import { Select } from '../../../components/ui/Select';
import { formatRelativeTime, getStatusBadgeClassName } from '../../ideas/utils/idea-display';

type DashboardTab = 'idea-list' | 'working-drafts' | 'recent-decisions';

const STATUS_OPTIONS: Array<IdeaStatus> = ['Submitted', 'Under Review', 'Accepted', 'Rejected'];
const CATEGORY_OPTIONS: Array<IdeaCategory> = [
  'Process Improvement',
  'Product Feature',
  'Cost Saving',
  'Workplace Wellness',
  'Technology/IT',
  'Other',
];

const toDateFromIso = (value: string): string | undefined => {
  if (!value) {
    return undefined;
  }

  return new Date(`${value}T00:00:00.000Z`).toISOString();
};

const toDateToIso = (value: string): string | undefined => {
  if (!value) {
    return undefined;
  }

  return new Date(`${value}T23:59:59.999Z`).toISOString();
};

export const DashboardPage = () => {
  const { session } = useAuth();
  const identityLabel = session?.fullName ?? session?.email ?? 'User';
  const [activeTab, setActiveTab] = useState<DashboardTab>('idea-list');
  const [myIdeasCount, setMyIdeasCount] = useState(0);
  const [ideaListItems, setIdeaListItems] = useState<IdeaListItem[]>([]);
  const [ideaListError, setIdeaListError] = useState('');
  const [drafts, setDrafts] = useState<Array<{ id: string; title: string; updatedAt: string }>>([]);
  const [evaluationQueueCount, setEvaluationQueueCount] = useState(0);
  const [recentDecisions, setRecentDecisions] = useState<IdeaListItem[]>([]);
  const [ideaStatusFilter, setIdeaStatusFilter] = useState<IdeaStatus | 'all'>('all');
  const [ideaCategoryFilter, setIdeaCategoryFilter] = useState<IdeaCategory | 'all'>('all');
  const [ideaSortDirection, setIdeaSortDirection] = useState<IdeaSortDirection>('Newest');
  const [ideaDateFrom, setIdeaDateFrom] = useState('');
  const [ideaDateTo, setIdeaDateTo] = useState('');

  useEffect(() => {
    if (!session) {
      return;
    }

    if (activeTab === 'recent-decisions' && session.role === 'submitter') {
      setActiveTab('idea-list');
    }
  }, [activeTab, session]);

  useEffect(() => {
    if (!session) {
      return;
    }

    setDrafts(loadDrafts(session.userId).map((draft) => ({ id: draft.id, title: draft.title || 'Untitled draft', updatedAt: draft.updatedAt })));

    if (session.role === 'submitter') {
      void ideaApi.list({ page: 1, pageSize: 1, visibilityScope: 'owner', sortBy: 'date', sortDirection: 'Newest' }).then((ownerIdeas) => {
        setMyIdeasCount(ownerIdeas.pagination.totalItems);
      }).catch(() => {
        setMyIdeasCount(0);
      });
      return;
    }

    void Promise.all([
      ideaApi.list({ page: 1, pageSize: 1, status: 'Submitted', sortBy: 'date', sortDirection: 'Newest' }),
      ideaApi.list({ page: 1, pageSize: 1, status: 'Under Review', sortBy: 'date', sortDirection: 'Newest' }),
    ]).then(([submittedQueue, underReviewQueue]) => {
      setEvaluationQueueCount(submittedQueue.pagination.totalItems + underReviewQueue.pagination.totalItems);
    }).catch(() => {
      setEvaluationQueueCount(0);
    });

    void Promise.all([
      ideaApi.list({ page: 1, pageSize: 3, status: 'Accepted', sortBy: 'date', sortDirection: 'Newest' }),
      ideaApi.list({ page: 1, pageSize: 3, status: 'Rejected', sortBy: 'date', sortDirection: 'Newest' }),
    ]).then(([accepted, rejected]) => {
      setRecentDecisions([...accepted.items, ...rejected.items].slice(0, 3));
    }).catch(() => {
      setRecentDecisions([]);
    });
  }, [session]);

  useEffect(() => {
    if (!session) {
      return;
    }

    let isMounted = true;
    setIdeaListError('');

    void ideaApi.list({
      page: 1,
      pageSize: 20,
      visibilityScope: 'all',
      status: ideaStatusFilter === 'all' ? undefined : ideaStatusFilter,
      category: ideaCategoryFilter === 'all' ? undefined : ideaCategoryFilter,
      dateFrom: toDateFromIso(ideaDateFrom),
      dateTo: toDateToIso(ideaDateTo),
      sortBy: 'date',
      sortDirection: ideaSortDirection,
    }).then((result) => {
      if (!isMounted) {
        return;
      }

      if (session.role === 'submitter') {
        setIdeaListItems(result.items.filter((item) => item.ownerUserId === session.userId || item.isShared));
        return;
      }

      setIdeaListItems(result.items);
    }).catch(() => {
      if (!isMounted) {
        return;
      }

      setIdeaListItems([]);
      setIdeaListError('Failed to load ideas.');
    });

    return () => {
      isMounted = false;
    };
  }, [ideaCategoryFilter, ideaDateFrom, ideaDateTo, ideaSortDirection, ideaStatusFilter, session]);

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
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-label="Show idea list"
              aria-pressed={activeTab === 'idea-list'}
              onClick={() => setActiveTab('idea-list')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition active:scale-[0.98] ${activeTab === 'idea-list' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border border-slate-300 text-slate-700 hover:bg-slate-100'}`}
            >
              Idea List
            </button>
            <button
              type="button"
              aria-label="Show working drafts"
              aria-pressed={activeTab === 'working-drafts'}
              onClick={() => setActiveTab('working-drafts')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition active:scale-[0.98] ${activeTab === 'working-drafts' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border border-slate-300 text-slate-700 hover:bg-slate-100'}`}
            >
              Working Drafts
            </button>
            {session?.role === 'admin' ? (
              <button
                type="button"
                aria-label="Show recent decisions"
                aria-pressed={activeTab === 'recent-decisions'}
                onClick={() => setActiveTab('recent-decisions')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition active:scale-[0.98] ${activeTab === 'recent-decisions' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border border-slate-300 text-slate-700 hover:bg-slate-100'}`}
              >
                Recent Decisions
              </button>
            ) : null}
          </div>

          {activeTab === 'idea-list' ? (
            <div className="space-y-4 rounded-lg border border-slate-200 p-4">
              <section className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
                <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-600">
                  Status
                  <Select
                    aria-label="Idea List Status Filter"
                    value={ideaStatusFilter}
                    onChange={(event) => setIdeaStatusFilter(event.target.value as IdeaStatus | 'all')}
                  >
                    <option value="all">All</option>
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </Select>
                </label>

                <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-600">
                  Category
                  <Select
                    aria-label="Idea List Category Filter"
                    value={ideaCategoryFilter}
                    onChange={(event) => setIdeaCategoryFilter(event.target.value as IdeaCategory | 'all')}
                  >
                    <option value="all">All</option>
                    {CATEGORY_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </Select>
                </label>

                <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-600">
                  Sort
                  <Select
                    aria-label="Idea List Sort Filter"
                    value={ideaSortDirection}
                    onChange={(event) => setIdeaSortDirection(event.target.value as IdeaSortDirection)}
                  >
                    <option value="Newest">Newest</option>
                    <option value="Oldest">Oldest</option>
                  </Select>
                </label>

                <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-600">
                  Date From
                  <input
                    aria-label="Idea List Date From"
                    type="date"
                    value={ideaDateFrom}
                    onChange={(event) => setIdeaDateFrom(event.target.value)}
                    className="rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </label>

                <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-600">
                  Date To
                  <input
                    aria-label="Idea List Date To"
                    type="date"
                    value={ideaDateTo}
                    onChange={(event) => setIdeaDateTo(event.target.value)}
                    className="rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </label>
              </section>

              {ideaListError ? <p className="text-sm text-red-700">{ideaListError}</p> : null}

              {ideaListItems.length === 0 ? (
                <p className="text-sm text-slate-600">No ideas available right now.</p>
              ) : (
                <ul className="space-y-3">
                  {ideaListItems.map((idea) => {
                    const submitterName = idea.ownerFullName
                      ?? (idea.ownerUserId === session?.userId ? identityLabel : 'Unknown submitter');
                    const createdAt = idea.createdAt ?? new Date().toISOString();

                    return (
                      <li key={idea.id}>
                        <Link to={`/ideas/${idea.id}`} className="block rounded-lg border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-slate-50">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-sm font-semibold text-slate-900">{idea.title}</h3>
                            <Badge data-status-pill="true" className={getStatusBadgeClassName(idea.status)}>{idea.status}</Badge>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                            <span>{idea.category}</span>
                            <span>Submitter: {submitterName}</span>
                            <span title={createdAt}>Submitted {formatRelativeTime(createdAt)}</span>
                            <span>Votes: {(idea.ideaVotesUp ?? 0) - (idea.ideaVotesDown ?? 0)}</span>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : null}

          {activeTab === 'working-drafts' ? (
            <div className="rounded-lg border border-slate-200 p-4">
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
          ) : null}

          {activeTab === 'recent-decisions' && session?.role === 'admin' ? (
            <div className="rounded-lg border border-slate-200 p-4">
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
