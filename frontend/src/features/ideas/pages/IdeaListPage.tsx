import { useEffect, useState } from 'react';
import { IdeaListItem } from '../../../services/contracts';
import { ideaApi } from '../services/idea-service';

export const IdeaListPage = () => {
  const [ideas, setIdeas] = useState<IdeaListItem[]>([]);

  useEffect(() => {
    const token = JSON.parse(localStorage.getItem('innovatepam.session') ?? 'null')?.token as string | undefined;
    if (!token) {
      return;
    }

    void ideaApi.list(token).then(setIdeas);
  }, []);

  return (
    <main>
      <h1>Ideas</h1>
      <ul>
        {ideas.map((idea) => (
          <li key={idea.id}>
            {idea.title} - {idea.status} - shared: {String(idea.isShared)}
          </li>
        ))}
      </ul>
    </main>
  );
};
