import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IdeaListItem, PaginationMeta } from '../../../services/contracts';
import { ideaApi } from '../services/idea-service';

export const IdeaListPage = () => {
  const [ideas, setIdeas] = useState<IdeaListItem[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, pageSize: 10, totalItems: 0, totalPages: 1 });

  useEffect(() => {
    void ideaApi.list({ page, pageSize: 10, sortBy: 'date', sortDirection: 'Newest' }).then((result) => {
      setIdeas(result.items);
      setPagination(result.pagination);
    });
  }, [page]);

  const hasPreviousPage = pagination.page > 1;
  const hasNextPage = pagination.page < pagination.totalPages;

  return (
    <main className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">My Ideas</h1>
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
              {idea.title} - {idea.status} - shared: {String(idea.isShared)}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          disabled={!hasPreviousPage}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm text-slate-600">
          Page {pagination.page} of {pagination.totalPages} ({pagination.totalItems} total)
        </span>
        <button
          type="button"
          onClick={() => setPage((current) => current + 1)}
          disabled={!hasNextPage}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </main>
  );
};
