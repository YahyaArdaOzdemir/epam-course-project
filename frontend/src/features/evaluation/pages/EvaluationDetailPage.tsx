import { FormEvent, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert } from '../../../components/ui/Alert';
import { useAuth } from '../../auth/hooks/useAuth';
import { useSubmissionGuard } from '../../shared/useSubmissionGuard';
import { evaluationApi } from '../services/evaluation-service';

export const EvaluationDetailPage = () => {
  const { ideaId = '' } = useParams();
  const [toStatus, setToStatus] = useState<'Under Review' | 'Accepted' | 'Rejected'>('Under Review');
  const [comment, setComment] = useState('');
  const [rowVersion, setRowVersion] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { csrfToken } = useAuth();
  const { isSubmitting, runGuarded } = useSubmissionGuard();
  const errorAlertRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!errorMessage) {
      return;
    }

    errorAlertRef.current?.focus();
  }, [errorMessage]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');

    if (!csrfToken) {
      setErrorMessage('Please login first');
      return;
    }

    try {
      const result = await runGuarded(() => evaluationApi.updateStatus(ideaId, {
        toStatus,
        comment,
        rowVersion,
      }, csrfToken));
      setRowVersion(result.rowVersion + 1);
      setSuccessMessage('Status updated');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Update failed');
    }
  };

  return (
    <main className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Evaluation Detail</h1>
      {errorMessage ? (
        <Alert
          ref={errorAlertRef}
          variant="destructive"
          message={errorMessage}
          className="mt-4"
        />
      ) : null}
      {successMessage ? <Alert variant="success" message={successMessage} className="mt-4" /> : null}
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          Status
          <select
            value={toStatus}
            onChange={(event) => setToStatus(event.target.value as 'Under Review' | 'Accepted' | 'Rejected')}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            <option value="Under Review">Under Review</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Comment
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            className="mt-1 min-h-28 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSubmitting ? 'Loading...' : 'Submit'}
        </button>
      </form>
    </main>
  );
};
