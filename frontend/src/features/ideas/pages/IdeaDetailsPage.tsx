import { FormEvent, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { IdeaDetails } from '../../../services/contracts';
import { useAuth } from '../../auth/hooks/useAuth';
import { useSubmissionGuard } from '../../shared/useSubmissionGuard';
import { evaluationApi } from '../../evaluation/services/evaluation-service';
import { ideaApi } from '../services/idea-service';

export const IdeaDetailsPage = () => {
  const { ideaId = '' } = useParams();
  const { session, csrfToken } = useAuth();
  const [idea, setIdea] = useState<IdeaDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toStatus, setToStatus] = useState<'Under Review' | 'Accepted' | 'Rejected'>('Under Review');
  const [comment, setComment] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { isSubmitting, runGuarded } = useSubmissionGuard();
  const errorAlertRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async (): Promise<void> => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const nextIdea = await ideaApi.getById(ideaId);
        if (!isMounted) {
          return;
        }

        setIdea(nextIdea);
        if (nextIdea.status === 'Submitted') {
          setToStatus('Under Review');
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : 'Failed to load idea details');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [ideaId]);

  useEffect(() => {
    if (!errorMessage) {
      return;
    }

    errorAlertRef.current?.focus();
  }, [errorMessage]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSuccessMessage('');
    }, 3500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [successMessage]);

  const onSubmitEvaluation = async (event: FormEvent): Promise<void> => {
    event.preventDefault();

    if (!idea || !csrfToken) {
      setErrorMessage('Please login first');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');

    try {
      const updated = await runGuarded(() => evaluationApi.updateStatus(
        idea.id,
        {
          toStatus,
          comment,
          rowVersion: idea.rowVersion,
        },
        csrfToken,
      ));

      setIdea((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          status: updated.status,
          rowVersion: updated.rowVersion,
          latestEvaluationComment: updated.latestEvaluationComment,
          updatedAt: new Date().toISOString(),
        };
      });
      setSuccessMessage('Status updated');
      if (toStatus === 'Accepted' || toStatus === 'Rejected') {
        setComment('');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update status');
    }
  };

  if (isLoading) {
    return (
      <main className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Loading idea details...</p>
      </main>
    );
  }

  if (!idea) {
    return (
      <main className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Alert severity="error" message={errorMessage || 'Idea not found'} />
      </main>
    );
  }

  const isAdmin = session?.role === 'admin';

  return (
    <main className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Idea Details</h1>

      {errorMessage ? (
        <Alert
          ref={errorAlertRef}
          severity="error"
          message={errorMessage}
          className="mt-4"
        />
      ) : null}
      {successMessage ? <Alert severity="success" message={successMessage} className="mt-4" /> : null}

      <section className="mt-6 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <div>
          <span className="font-semibold text-slate-900">Title:</span> {idea.title}
        </div>
        <div>
          <span className="font-semibold text-slate-900">Description:</span> {idea.description}
        </div>
        <div>
          <span className="font-semibold text-slate-900">Category:</span> {idea.category}
        </div>
        <div>
          <span className="font-semibold text-slate-900">Status:</span> {idea.status}
        </div>
      </section>

      {isAdmin ? (
        <form onSubmit={onSubmitEvaluation} className="mt-6 space-y-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Next Status
            <Select value={toStatus} onChange={(event) => setToStatus(event.target.value as 'Under Review' | 'Accepted' | 'Rejected')}>
              <option value="Under Review">Under Review</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
            </Select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Evaluation Comment
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              className="mt-1 min-h-28 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </label>

          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Loading...' : 'Update Evaluation'}
          </Button>
        </form>
      ) : (
        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
          This idea is read-only for submitter role.
        </section>
      )}
    </main>
  );
};
