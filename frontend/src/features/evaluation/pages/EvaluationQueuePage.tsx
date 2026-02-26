import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../../../components/ui/Alert';
import { Badge } from '../../../components/ui/Badge';
import { Select } from '../../../components/ui/Select';
import { IdeaCategory, IdeaStatus } from '../../../services/contracts';
import { IdeaListItem } from '../../../services/contracts';
import { ideaApi } from '../../ideas/services/idea-service';
import { formatRelativeTime, getStatusBadgeClassName, getWaitTimeDays } from '../../ideas/utils/idea-display';

const statusFilterOptions: Array<IdeaStatus> = ['Submitted', 'Under Review'];
const categoryFilterOptions: Array<IdeaCategory> = ['Process Improvement', 'Product Feature', 'Cost Saving', 'Other'];

export const EvaluationQueuePage = () => {
  const [ideas, setIdeas] = useState<IdeaListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState<IdeaStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<IdeaCategory | 'all'>('all');

  useEffect(() => {
    let isMounted = true;

    const loadQueue = async (): Promise<void> => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const result = await ideaApi.list({
          page: 1,
          pageSize: 20,
          visibilityScope: 'all',
          sortBy: 'date',
          sortDirection: 'Newest',
        });
        if (!isMounted) {
          return;
        }

        setIdeas(result.items);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : 'Failed to load evaluation queue');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadQueue();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredIdeas = ideas
    .filter((idea) => (statusFilter === 'all' ? true : idea.status === statusFilter))
    .filter((idea) => (categoryFilter === 'all' ? true : idea.category === categoryFilter))
    .sort((left, right) => getWaitTimeDays(right.createdAt ?? new Date().toISOString()) - getWaitTimeDays(left.createdAt ?? new Date().toISOString()));

  return (
    <main className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Evaluation Queue</h1>
      {errorMessage ? <Alert severity="error" message={errorMessage} className="mt-4" /> : null}
      {isLoading ? <p className="mt-6 text-sm text-slate-600">Loading evaluation queue...</p> : null}

      <section className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-600">
          Status
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as IdeaStatus | 'all')}>
            <option value="all">All</option>
            {statusFilterOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </Select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-600">
          Category
          <Select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as IdeaCategory | 'all')}>
            <option value="all">All</option>
            {categoryFilterOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </Select>
        </label>
      </section>

      {!isLoading && filteredIdeas.length === 0 ? (
        <section className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <p className="text-sm text-slate-700">No ideas found in the evaluation queue.</p>
          <Link
            to="/dashboard"
            className="mt-4 inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 active:scale-[0.98]"
          >
            Back to Dashboard
          </Link>
        </section>
      ) : (
        <ul className="mt-6 space-y-3">
          {filteredIdeas.map((idea) => {
            const createdAt = idea.createdAt ?? new Date().toISOString();
            const waitTimeDays = getWaitTimeDays(createdAt);
            const isHighLatency = waitTimeDays > 3;

            return (
            <li key={idea.id} className="rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
              <Link to={`/ideas/${idea.id}`} className="font-medium text-blue-700 transition hover:text-blue-800">
                {idea.title}
              </Link>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge className={getStatusBadgeClassName(idea.status)}>{idea.status}</Badge>
                <span className="text-xs text-slate-600" title={new Date(createdAt).toLocaleString()}>
                  Submitted {formatRelativeTime(createdAt)}
                </span>
                <span className={`text-xs font-medium ${isHighLatency ? 'text-red-700' : 'text-slate-600'}`}>
                  Wait time: {waitTimeDays} day{waitTimeDays === 1 ? '' : 's'}
                </span>
                <span className="text-xs text-slate-600">
                  Votes: {(idea.ideaVotesUp ?? 0) - (idea.ideaVotesDown ?? 0)}
                </span>
                {isHighLatency ? (
                  <Badge className="bg-red-100 text-red-800">High Latency</Badge>
                ) : null}
              </div>
            </li>
            );
          })}
        </ul>
      )}
    </main>
  );
};
