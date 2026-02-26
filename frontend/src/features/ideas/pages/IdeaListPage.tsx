import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert } from '../../../components/ui/Alert';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { IdeaCategory, IdeaListItem, IdeaStatus, IdeaSortDirection, PaginationMeta } from '../../../services/contracts';
import { ideaApi } from '../services/idea-service';
import { getStatusBadgeClassName } from '../utils/idea-display';

const statusOptions: Array<IdeaStatus> = ['Submitted', 'Under Review', 'Accepted', 'Rejected'];
const categoryOptions: Array<IdeaCategory> = ['Process Improvement', 'Product Feature', 'Cost Saving', 'Other'];

export const IdeaListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [ideas, setIdeas] = useState<IdeaListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, pageSize: 10, totalItems: 0, totalPages: 1 });

  const pageParam = Number(searchParams.get('page') ?? '1');
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

  const statusParam = searchParams.get('status');
  const status = statusParam && statusOptions.includes(statusParam as IdeaStatus) ? statusParam as IdeaStatus : 'all';

  const categoryParam = searchParams.get('category');
  const category = categoryParam && categoryOptions.includes(categoryParam as IdeaCategory) ? categoryParam as IdeaCategory : 'all';

  const sortDirectionParam = searchParams.get('sortDirection');
  const sortDirection = sortDirectionParam === 'Oldest' ? 'Oldest' : 'Newest';

  const updateSearch = (next: {
    page?: number;
    status?: IdeaStatus | 'all';
    category?: IdeaCategory | 'all';
    sortDirection?: IdeaSortDirection;
  }): void => {
    const updated = new URLSearchParams(searchParams);

    const nextPage = next.page ?? page;
    const nextStatus = next.status ?? status;
    const nextCategory = next.category ?? category;
    const nextSortDirection = next.sortDirection ?? sortDirection;

    updated.set('page', String(nextPage));

    if (nextStatus === 'all') {
      updated.delete('status');
    } else {
      updated.set('status', nextStatus);
    }

    if (nextCategory === 'all') {
      updated.delete('category');
    } else {
      updated.set('category', nextCategory);
    }

    updated.set('sortDirection', nextSortDirection);
    setSearchParams(updated);
  };

  useEffect(() => {
    let isMounted = true;

    const loadIdeas = async (): Promise<void> => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const result = await ideaApi.list({
          page,
          pageSize: 10,
          visibilityScope: 'owner',
          status: status === 'all' ? undefined : status,
          category: category === 'all' ? undefined : category,
          sortBy: 'date',
          sortDirection,
        });

        if (!isMounted) {
          return;
        }

        setIdeas(result.items);
        setPagination(result.pagination);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : 'Failed to load ideas');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadIdeas();

    return () => {
      isMounted = false;
    };
  }, [page, status, category, sortDirection]);

  const hasPreviousPage = pagination.page > 1;
  const hasNextPage = pagination.page < pagination.totalPages;

  return (
    <main className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">My Ideas</h1>
      <section className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-600">
          Status
          <Select
            value={status}
            onChange={(event) => updateSearch({ status: event.target.value as IdeaStatus | 'all', page: 1 })}
          >
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
          <Select
            value={category}
            onChange={(event) => updateSearch({ category: event.target.value as IdeaCategory | 'all', page: 1 })}
          >
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
          <Select
            value={sortDirection}
            onChange={(event) => updateSearch({ sortDirection: event.target.value as IdeaSortDirection, page: 1 })}
          >
            <option value="Newest">Newest</option>
            <option value="Oldest">Oldest</option>
          </Select>
        </label>
      </section>

      {errorMessage ? <Alert severity="error" message={errorMessage} className="mt-4" /> : null}

      {isLoading ? <p className="mt-6 text-sm text-slate-600">Loading ideas...</p> : null}

      {!isLoading && ideas.length === 0 ? (
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
              <Link to={`/ideas/${idea.id}`} className="font-medium text-slate-900 transition hover:text-blue-700">
                {idea.title}
              </Link>
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                <Badge data-status-pill="true" className={getStatusBadgeClassName(idea.status)}>{idea.status}</Badge>
                <span>{idea.category}</span>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Votes: {(idea.ideaVotesUp ?? 0) - (idea.ideaVotesDown ?? 0)}
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
          onClick={() => updateSearch({ page: Math.max(1, pagination.page - 1) })}
          disabled={!hasPreviousPage}
        >
          Previous
        </Button>
        <span className="text-sm text-slate-600">
          Page {pagination.page} of {pagination.totalPages} ({pagination.totalItems} total)
        </span>
        <Button
          onClick={() => updateSearch({ page: pagination.page + 1 })}
          disabled={!hasNextPage}
        >
          Next
        </Button>
      </div>
    </main>
  );
};
