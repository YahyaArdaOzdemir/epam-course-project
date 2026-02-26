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
  const [comments, setComments] = useState<Array<{
    id: string;
    ideaId: string;
    authorUserId: string;
    parentCommentId: string | null;
    depth: number;
    body: string;
    createdAt: string;
    updatedAt: string;
    authorEmail: string;
    authorFullName: string;
  }>>([]);
  const [commentBody, setCommentBody] = useState('');
  const [replyToCommentId, setReplyToCommentId] = useState<string | undefined>(undefined);
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
        const commentResult = await ideaApi.listComments(ideaId);
        if (isMounted) {
          setComments(commentResult.items);
        }
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

  const onSubmitComment = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (!csrfToken || !commentBody.trim()) {
      return;
    }

    try {
      const created = await runGuarded(() => ideaApi.createComment(
        ideaId,
        {
          body: commentBody.trim(),
          parentCommentId: replyToCommentId,
        },
        csrfToken,
      ));
      setComments((current) => [...current, created]);
      setCommentBody('');
      setReplyToCommentId(undefined);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to add comment');
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
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Evaluation Detail</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span className="font-medium text-slate-900">{idea.title}</span>
            <span className="font-semibold text-slate-700">Category: {idea.category}</span>
            <span title={submittedAtAbsolute}>Submitted {submittedAtRelative}</span>
          </div>
        </div>
        <Badge className={getStatusBadgeClassName(idea.status)}>{idea.status}</Badge>
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

      <section className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <h2 className="font-semibold text-slate-900">Description</h2>
        <p className="mt-2 whitespace-pre-wrap">{idea.description}</p>
      </section>

      {idea.attachment ? (
        <section className="mt-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Attachments</h2>
          <Card className="flex max-w-md items-center justify-between gap-3 p-3">
            <a href={idea.attachment.url} target="_blank" rel="noreferrer" className="flex min-w-0 flex-1 items-center gap-3">
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
            </a>
            <a
              href={idea.attachment.url}
              download={idea.attachment.originalFileName}
              aria-label={`Download ${idea.attachment.originalFileName}`}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700 transition hover:bg-slate-100"
            >
              ↓
            </a>
          </Card>
        </section>
      ) : null}

      <hr className="my-6 border-gray-200" />

      <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-base font-semibold text-slate-900">Comments</h2>
        <form className="mt-3 space-y-3" onSubmit={onSubmitComment}>
          <label className="block text-sm font-medium text-slate-700">
            {replyToCommentId ? 'Reply' : 'Comment'}
            <textarea
              value={commentBody}
              onChange={(event) => setCommentBody(event.target.value)}
              className="mt-1 min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isSubmitting || !commentBody.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? 'Loading...' : replyToCommentId ? 'Reply' : 'Add Comment'}
            </button>
            {replyToCommentId ? (
              <button
                type="button"
                onClick={() => setReplyToCommentId(undefined)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
              >
                Cancel reply
              </button>
            ) : null}
          </div>
        </form>

        {comments.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">No comments yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {comments.map((commentItem) => (
              <li key={commentItem.id} className="rounded-md border border-slate-200 p-3" style={{ marginLeft: `${(commentItem.depth - 1) * 16}px` }}>
                <p className="text-xs font-semibold text-slate-700">{commentItem.authorFullName} · {new Date(commentItem.createdAt).toLocaleString()}</p>
                <p className="mt-1 text-sm text-slate-800">{commentItem.body}</p>
                {commentItem.depth < 5 ? (
                  <button
                    type="button"
                    onClick={() => setReplyToCommentId(commentItem.id)}
                    className="mt-2 text-xs font-medium text-blue-700 transition hover:text-blue-800"
                  >
                    Reply
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

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
