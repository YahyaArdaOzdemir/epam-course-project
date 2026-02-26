import { FormEvent, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert } from '../../../components/ui/Alert';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Select } from '../../../components/ui/Select';
import { IdeaDetails } from '../../../services/contracts';
import { useAuth } from '../../auth/hooks/useAuth';
import {
  formatAttachmentSize,
  formatRelativeTime,
  getStatusBadgeClassName,
  hasImageAttachmentPreview,
} from '../utils/idea-display';
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
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState<'Process Improvement' | 'Product Feature' | 'Cost Saving' | 'Other'>('Other');
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
        setEditTitle(nextIdea.title);
        setEditDescription(nextIdea.description);
        setEditCategory(nextIdea.category);
        if (nextIdea.status === 'Submitted') {
          setToStatus('Under Review');
        }

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

  const onSaveEdit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (!idea || !csrfToken) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');

    try {
      const updated = await runGuarded(() => ideaApi.update(
        idea.id,
        {
          title: editTitle,
          description: editDescription,
          category: editCategory,
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
          title: updated.title,
          description: editDescription,
          category: editCategory,
          rowVersion: updated.rowVersion,
          updatedAt: updated.updatedAt ?? current.updatedAt,
        };
      });
      setIsEditing(false);
      setSuccessMessage('Idea updated');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update idea');
    }
  };

  const onDeleteIdea = async (): Promise<void> => {
    if (!idea || !csrfToken) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');

    try {
      await runGuarded(() => ideaApi.delete(idea.id, csrfToken));
      setIdea(null);
      setSuccessMessage('Idea deleted');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete idea');
    }
  };

  const onSubmitComment = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (!idea || !csrfToken || !commentBody.trim()) {
      return;
    }

    try {
      const created = await runGuarded(() => ideaApi.createComment(
        idea.id,
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
  const isOwner = session?.userId === idea.ownerUserId;
  const canEditOrDeleteAsOwner = isOwner && idea.status === 'Submitted';
  const canDelete = isAdmin || canEditOrDeleteAsOwner;
  const submittedAtAbsolute = new Date(idea.createdAt).toLocaleString();
  const submittedAtRelative = formatRelativeTime(idea.createdAt);
  const hasImagePreview = hasImageAttachmentPreview(idea);

  return (
    <main className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Idea Details</h1>
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
          severity="error"
          message={errorMessage}
          className="mt-4"
        />
      ) : null}
      {successMessage ? <Alert severity="success" message={successMessage} className="mt-4" /> : null}

      <section className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <h2 className="font-semibold text-slate-900">Description</h2>
        <p className="mt-2 whitespace-pre-wrap">{idea.description}</p>
      </section>

      {(canEditOrDeleteAsOwner || isAdmin) ? (
        <section className="mt-4 flex flex-wrap items-center gap-3">
          {canEditOrDeleteAsOwner ? (
            <button
              type="button"
              onClick={() => setIsEditing((current) => !current)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              {isEditing ? 'Cancel Edit' : 'Edit Idea'}
            </button>
          ) : null}
          {canDelete ? (
            <button
              type="button"
              onClick={() => { void onDeleteIdea(); }}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50"
            >
              Delete Idea
            </button>
          ) : null}
        </section>
      ) : null}

      {isEditing ? (
        <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-base font-semibold text-slate-900">Edit Idea</h2>
          <form className="mt-3 space-y-3" onSubmit={onSaveEdit}>
            <label className="block text-sm font-medium text-slate-700">
              Title
              <input
                value={editTitle}
                onChange={(event) => setEditTitle(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Description
              <textarea
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
                className="mt-1 min-h-28 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Category
              <Select value={editCategory} onChange={(event) => setEditCategory(event.target.value as 'Process Improvement' | 'Product Feature' | 'Cost Saving' | 'Other')}>
                <option value="Process Improvement">Process Improvement</option>
                <option value="Product Feature">Product Feature</option>
                <option value="Cost Saving">Cost Saving</option>
                <option value="Other">Other</option>
              </Select>
            </label>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Loading...' : 'Save Changes'}
            </Button>
          </form>
        </section>
      ) : null}

      {idea.attachment ? (
        <section className="mt-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Attachments</h2>
          <Card className="flex max-w-md items-center justify-between gap-3 p-3">
            <a href={idea.attachment.url} target="_blank" rel="noreferrer" className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md bg-slate-100 text-slate-500">
                {hasImagePreview ? (
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

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
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
            <Button type="submit" variant="primary" disabled={isSubmitting || !commentBody.trim()}>
              {isSubmitting ? 'Loading...' : replyToCommentId ? 'Reply' : 'Add Comment'}
            </Button>
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

      <hr className="my-6 border-gray-200" />

      {isAdmin ? (
        <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h2 className="text-base font-semibold text-slate-900">Evaluation Action</h2>

          <form onSubmit={onSubmitEvaluation} className="mt-4 space-y-4">
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
        </section>
      ) : (
        <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
          This idea is read-only for submitter role.
        </section>
      )}
    </main>
  );
};
