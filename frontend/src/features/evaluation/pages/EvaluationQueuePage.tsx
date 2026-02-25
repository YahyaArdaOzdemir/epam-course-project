import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IdeaListItem } from '../../../services/contracts';
import { ideaApi } from '../../ideas/services/idea-service';

export const EvaluationQueuePage = () => {
  const [ideas, setIdeas] = useState<IdeaListItem[]>([]);

  useEffect(() => {
    void ideaApi.list().then(setIdeas);
  }, []);

  return (
    <main className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Evaluation Queue</h1>
      {ideas.length === 0 ? (
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
              <Link to={`/evaluation/${idea.id}`} className="font-medium text-blue-700 transition hover:text-blue-800">
                {idea.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
};
