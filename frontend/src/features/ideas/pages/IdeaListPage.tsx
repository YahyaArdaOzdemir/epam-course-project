import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { IdeaCategory, IdeaListItem, IdeaStatus, IdeaSortDirection, PaginationMeta } from '../../../services/contracts';
import { ideaApi } from '../services/idea-service';

const statusOptions: Array<IdeaStatus> = ['Submitted', 'Under Review', 'Accepted', 'Rejected'];
const categoryOptions: Array<IdeaCategory> = ['Process Improvement', 'Product Feature', 'Cost Saving', 'Other'];

export const IdeaListPage = () => {
  const [ideas, setIdeas] = useState<IdeaListItem[]>([]);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<IdeaStatus | 'all'>('all');
  const [category, setCategory] = useState<IdeaCategory | 'all'>('all');
  const [sortDirection, setSortDirection] = useState<IdeaSortDirection>('Newest');
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, pageSize: 10, totalItems: 0, totalPages: 1 });

  useEffect(() => {
    void ideaApi.list({
      page,
      pageSize: 10,
      status: status === 'all' ? undefined : status,
      category: category === 'all' ? undefined : category,
      sortBy: 'date',
      sortDirection,
    }).then((result) => {
      setIdeas(result.items);
      setPagination(result.pagination);
    });
  }, [page, status, category, sortDirection]);

  useEffect(() => {
    setPage(1);
  }, [status, category, sortDirection]);

  const hasPreviousPage = pagination.page > 1;
  const hasNextPage = pagination.page < pagination.totalPages;

  return (
    <main className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">My Ideas</h1>
      <section className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-600">
          Status
          <Select value={status} onChange={(event) => setStatus(event.target.value as IdeaStatus | 'all')}>
            <option value="all">All</option>
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-600">
          Category
          <Select value={category} onChange={(event) => setCategory(event.target.value as IdeaCategory | 'all')}>
            <option value="all">All</option>
            {categoryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-600">
          Sort
          <Select value={sortDirection} onChange={(event) => setSortDirection(event.target.value as IdeaSortDirection)}>
            <option value="Newest">Newest</option>
            <option value="Oldest">Oldest</option>
          </Select>
        </label>
      </section>

      {ideas.length === 0 ? (
        <section className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <p className="text-sm text-slate-700">No ideas found. Submit your first one!</p>
          <Link
            to="/ideas/new"
            className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 active:scale-[0.98]"
          >
            Submit New Idea
          </Link>
        </section>
      ) : (
        <ul className="mt-6 space-y-3">
          {ideas.map((idea) => (
            <li key={idea.id} className="rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
              <p className="font-medium text-slate-900">{idea.title}</p>
              <p className="mt-1 text-xs text-slate-600">
                {idea.status} · {idea.category} · shared: {String(idea.isShared)}
              </p>
              {idea.latestEvaluationComment ? (
                <p className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700">
                  Latest evaluation comment: {idea.latestEvaluationComment}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 flex items-center justify-between">
        <Button
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          disabled={!hasPreviousPage}
        >
          Previous
        </Button>
        <span className="text-sm text-slate-600">
          Page {pagination.page} of {pagination.totalPages} ({pagination.totalItems} total)
        </span>
        <Button
          onClick={() => setPage((current) => current + 1)}
          disabled={!hasNextPage}
        >
          Next
        </Button>
      </div>
    </main>
  );
};
