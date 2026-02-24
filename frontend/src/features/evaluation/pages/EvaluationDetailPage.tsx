import { FormEvent, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { evaluationApi } from '../services/evaluation-service';

export const EvaluationDetailPage = () => {
  const { ideaId = '' } = useParams();
  const [toStatus, setToStatus] = useState<'Under Review' | 'Accepted' | 'Rejected'>('Under Review');
  const [comment, setComment] = useState('');
  const [rowVersion, setRowVersion] = useState(0);
  const [message, setMessage] = useState('');
  const { csrfToken } = useAuth();

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!csrfToken) {
      setMessage('Please login first');
      return;
    }

    try {
      const result = await evaluationApi.updateStatus(ideaId, {
        toStatus,
        comment,
        rowVersion,
      }, csrfToken);
      setRowVersion(result.rowVersion + 1);
      setMessage('Status updated');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Update failed');
    }
  };

  return (
    <main>
      <h1>Evaluation Detail</h1>
      <form onSubmit={onSubmit}>
        <label>
          Status
          <select value={toStatus} onChange={(event) => setToStatus(event.target.value as 'Under Review' | 'Accepted' | 'Rejected')}>
            <option value="Under Review">Under Review</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
          </select>
        </label>
        <label>
          Comment
          <textarea value={comment} onChange={(event) => setComment(event.target.value)} />
        </label>
        <button type="submit">Update Status</button>
      </form>
      <p>{message}</p>
    </main>
  );
};
