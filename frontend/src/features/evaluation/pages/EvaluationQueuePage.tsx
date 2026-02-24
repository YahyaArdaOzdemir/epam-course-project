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
    <main>
      <h1>Evaluation Queue</h1>
      <ul>
        {ideas.map((idea) => (
          <li key={idea.id}>
            <Link to={`/evaluation/${idea.id}`}>{idea.title}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
};
