import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../../../components/ui/Alert';
import { IdeaListItem } from '../../../services/contracts';
import { ideaApi } from '../../ideas/services/idea-service';

export const EvaluationQueuePage = () => {
  const [ideas, setIdeas] = useState<IdeaListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadQueue = async (): Promise<void> => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const result = await ideaApi.list({ page: 1, pageSize: 20, sortBy: 'date', sortDirection: 'Newest' });
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

  return (
    <main className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Evaluation Queue</h1>
      {errorMessage ? <Alert severity="error" message={errorMessage} className="mt-4" /> : null}
      {isLoading ? <p className="mt-6 text-sm text-slate-600">Loading evaluation queue...</p> : null}

      {!isLoading && ideas.length === 0 ? (
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
          {ideas.map((idea) => (
            <li key={idea.id} className="rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
              <Link to={`/ideas/${idea.id}`} className="font-medium text-blue-700 transition hover:text-blue-800">
                {idea.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
};
