import { FormEvent, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert } from '../../../components/ui/Alert';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { Select } from '../../../components/ui/Select';
import { IdeaDetails } from '../../../services/contracts';
import { useAuth } from '../../auth/hooks/useAuth';
import { ideaApi } from '../../ideas/services/idea-service';
import {
  formatAttachmentSize,
  formatRelativeTime,
  getStatusBadgeClassName,
  hasImageAttachmentPreview,
} from '../../ideas/utils/idea-display';
import { useSubmissionGuard } from '../../shared/useSubmissionGuard';
import { evaluationApi } from '../services/evaluation-service';

export const EvaluationDetailPage = () => {
  const { ideaId = '' } = useParams();
  const [idea, setIdea] = useState<IdeaDetails | null>(null);
  const [isLoadingIdea, setIsLoadingIdea] = useState(true);
  const [toStatus, setToStatus] = useState<'Under Review' | 'Accepted' | 'Rejected'>('Under Review');
  const [comment, setComment] = useState('');
  const [rowVersion, setRowVersion] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { csrfToken } = useAuth();
  const { isSubmitting, runGuarded } = useSubmissionGuard();
  const errorAlertRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadIdeaDetails = async (): Promise<void> => {
      setIsLoadingIdea(true);
      setErrorMessage('');

      try {
        const currentIdea = await ideaApi.getById(ideaId);
        if (!isMounted) {
          return;
        }

        setIdea(currentIdea);
        setRowVersion(currentIdea.rowVersion);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : 'Failed to load idea details');
      } finally {
        if (isMounted) {
          setIsLoadingIdea(false);
        }
      }
    };

    void loadIdeaDetails();

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

      setRowVersion(result.rowVersion);
      setIdea((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          status: result.status,
          rowVersion: result.rowVersion,
          latestEvaluationComment: result.latestEvaluationComment,
          updatedAt: new Date().toISOString(),
        };
      });

      setSuccessMessage('Status updated');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Update failed');
    }
  };

  if (isLoadingIdea) {
    return (
      <main className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Loading evaluation detail...</p>
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

  const submittedAtAbsolute = new Date(idea.createdAt).toLocaleString();
  const submittedAtRelative = formatRelativeTime(idea.createdAt);
  const hasImageThumbnail = hasImageAttachmentPreview(idea);

  return (
    <main className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Evaluation Detail</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <span className="font-medium text-slate-900">{idea.title}</span>
          <Badge className={getStatusBadgeClassName(idea.status)}>{idea.status}</Badge>
          <span title={submittedAtAbsolute}>Submitted {submittedAtRelative}</span>
        </div>
      </header>

      {errorMessage ? (
        <Alert
          ref={errorAlertRef}
          variant="destructive"
          message={errorMessage}
          className="mt-4"
        />
      ) : null}
      {successMessage ? <Alert variant="success" message={successMessage} className="mt-4" /> : null}

      <section className="mt-6 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <div>
          <span className="font-semibold text-slate-900">Description:</span> {idea.description}
        </div>
        <div>
          <span className="font-semibold text-slate-900">Category:</span> {idea.category}
        </div>
      </section>

      {idea.attachment ? (
        <section className="mt-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Attachments</h2>
          <a href={idea.attachment.url} download={idea.attachment.originalFileName} className="inline-block">
            <Card className="flex max-w-[200px] cursor-pointer items-center gap-3 p-2 transition hover:bg-slate-50">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md bg-slate-100 text-slate-500">
                {hasImageThumbnail ? (
                  <img
                    src={idea.attachment.url}
                    alt={idea.attachment.originalFileName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span aria-hidden="true">📎</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{idea.attachment.originalFileName}</p>
                <p className="text-xs text-slate-500">{formatAttachmentSize(idea.attachment.sizeBytes)}</p>
              </div>
            </Card>
          </a>
        </section>
      ) : null}

      <hr className="my-6 border-gray-200" />

      <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h2 className="text-base font-semibold text-slate-900">Evaluation Action</h2>

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Status
            <Select
              value={toStatus}
              onChange={(event) => setToStatus(event.target.value as 'Under Review' | 'Accepted' | 'Rejected')}
            >
              <option value="Under Review">Under Review</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
            </Select>
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
      </section>
    </main>
  );
};
