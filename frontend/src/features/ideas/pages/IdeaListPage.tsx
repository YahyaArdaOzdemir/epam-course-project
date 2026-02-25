import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IdeaListItem } from '../../../services/contracts';
import { ideaApi } from '../services/idea-service';

export const IdeaListPage = () => {
  const [ideas, setIdeas] = useState<IdeaListItem[]>([]);

  useEffect(() => {
    void ideaApi.list().then(setIdeas);
  }, []);

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
    </main>
  );
};
