import { useEffect, useState } from 'react';
import { IdeaListItem } from '../../../services/contracts';
import { ideaApi } from '../services/idea-service';

export const IdeaListPage = () => {
  const [ideas, setIdeas] = useState<IdeaListItem[]>([]);

  useEffect(() => {
    void ideaApi.list().then(setIdeas);
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
