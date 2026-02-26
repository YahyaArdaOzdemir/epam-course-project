import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert } from '../../../components/ui/Alert';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Select } from '../../../components/ui/Select';
import { IdeaCategory, IdeaDetails } from '../../../services/contracts';
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
  const navigate = useNavigate();
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
  const [editCategory, setEditCategory] = useState<IdeaCategory>('Other');
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
    upvotes?: number;
    downvotes?: number;
    score?: number;
  }>>([]);
  const [commentBody, setCommentBody] = useState('');
  const [replyToCommentId, setReplyToCommentId] = useState<string | undefined>(undefined);
  const [replyBody, setReplyBody] = useState('');
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
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate('/dashboard');
      }
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
        },
        csrfToken,
      ));

      setComments((current) => [...current, created]);
      setCommentBody('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to add comment');
    }
  };

  const onSubmitReply = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (!idea || !csrfToken || !replyToCommentId || !replyBody.trim()) {
      return;
    }

    try {
      const created = await runGuarded(() => ideaApi.createComment(
        idea.id,
        {
          body: replyBody.trim(),
          parentCommentId: replyToCommentId,
        },
        csrfToken,
      ));

      setComments((current) => [...current, created]);
      setReplyBody('');
      setReplyToCommentId(undefined);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to add reply');
    }
  };

  const onVoteIdea = async (value: -1 | 1): Promise<void> => {
    if (!idea || !csrfToken) {
      return;
    }

    try {
      const summary = await runGuarded(() => ideaApi.voteIdea(idea.id, value, csrfToken));
      setIdea((current) => (current
        ? {
            ...current,
            ideaVotesUp: summary.upvotes,
            ideaVotesDown: summary.downvotes,
            ideaVotesTotal: summary.totalVotes ?? (summary.upvotes + summary.downvotes),
          }
        : current));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to vote on idea');
    }
  };

  const onVoteComment = async (commentId: string, value: -1 | 1): Promise<void> => {
    if (!idea || !csrfToken) {
      return;
    }

    try {
      const summary = await runGuarded(() => ideaApi.voteComment(idea.id, commentId, value, csrfToken));
      setComments((current) => current.map((item) => {
        if (item.id !== commentId) {
          return item;
        }

        return {
          ...item,
          upvotes: summary.upvotes,
          downvotes: summary.downvotes,
          score: summary.score ?? (summary.upvotes - summary.downvotes),
        };
      }));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to vote on comment');
    }
  };

  const onDeleteComment = async (commentId: string): Promise<void> => {
    if (!idea || !csrfToken) {
      return;
    }

    try {
      await runGuarded(() => ideaApi.deleteComment(idea.id, commentId, csrfToken));
      setComments((current) => current.filter((item) => item.id !== commentId));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete comment');
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
  const isCommentLockedForUser = !isAdmin && idea.status === 'Rejected';
  const submittedAtAbsolute = new Date(idea.createdAt).toLocaleString();
  const submittedAtRelative = formatRelativeTime(idea.createdAt);
  const hasImagePreview = hasImageAttachmentPreview(idea);
  const ideaVotesUp = idea.ideaVotesUp ?? 0;
  const ideaVotesDown = idea.ideaVotesDown ?? 0;
  const totalIdeaVotes = idea.ideaVotesTotal ?? (ideaVotesUp + ideaVotesDown);
  const netIdeaVotes = ideaVotesUp - ideaVotesDown;
  const filledStars = totalIdeaVotes > 0 ? Math.round((ideaVotesUp / totalIdeaVotes) * 5) : 0;

  return (
    <main className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">{idea.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span className="rounded-md border border-slate-300 bg-slate-50 px-2 py-1 font-semibold text-slate-700">Category: {idea.category}</span>
            <span title={submittedAtAbsolute}>Submitted {submittedAtRelative}</span>
          </div>
          <div className="mt-3 flex items-center gap-3 text-sm text-slate-700">
            <span aria-label="Idea rating" className="text-amber-500">{'★'.repeat(filledStars)}{'☆'.repeat(5 - filledStars)}</span>
            <span>Total votes: {netIdeaVotes}</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => { void onVoteIdea(1); }}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700 transition hover:bg-slate-100"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => { void onVoteIdea(-1); }}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700 transition hover:bg-slate-100"
            >
              ↓
            </button>
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

      {isEditing ? (
        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
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
              <Select value={editCategory} onChange={(event) => setEditCategory(event.target.value as IdeaCategory)}>
                <option value="Process Improvement">Process Improvement</option>
                <option value="Product Feature">Product Feature</option>
                <option value="Cost Saving">Cost Saving</option>
                <option value="Workplace Wellness">Workplace Wellness</option>
                <option value="Technology/IT">Technology/IT</option>
                <option value="Other">Other</option>
              </Select>
            </label>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Loading...' : 'Save Changes'}
            </Button>
          </form>
        </section>
      ) : (
        <section className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="mt-2 whitespace-pre-wrap">{idea.description}</p>
        </section>
      )}

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

      {idea.attachment ? (
        <section className="mt-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Attachments</h2>
          <Card className="flex max-w-md items-center gap-2 p-3 transition hover:bg-slate-50">
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
              ⤓
            </a>
          </Card>
        </section>
      ) : null}

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-base font-semibold text-slate-900">Comments</h2>

        {idea.latestEvaluationComment && (idea.status === 'Accepted' || idea.status === 'Rejected') ? (
          <article
            data-evaluation-comment="true"
            className={`mt-3 rounded-md border p-3 ${idea.status === 'Accepted' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
          >
            <p className={`text-xs font-semibold uppercase tracking-wide ${idea.status === 'Accepted' ? 'text-green-800' : 'text-red-800'}`}>
              Evaluation Decision · {idea.status}
            </p>
            <p className="mt-1 text-sm text-slate-800">{idea.latestEvaluationComment}</p>
          </article>
        ) : null}

        {isCommentLockedForUser ? (
          <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Commenting is locked while this idea is Rejected.
          </p>
        ) : (
          <form className="mt-3 space-y-3" onSubmit={onSubmitComment}>
            <label className="block text-sm font-medium text-slate-700">
              Comment
              <textarea
                value={commentBody}
                onChange={(event) => setCommentBody(event.target.value)}
                className="mt-1 min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <div className="flex items-center gap-2">
              <Button type="submit" variant="primary" disabled={isSubmitting || !commentBody.trim()}>
                {isSubmitting ? 'Loading...' : 'Add Comment'}
              </Button>
            </div>
          </form>
        )}

        {comments.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">No comments yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {comments.map((commentItem) => (
              <li key={commentItem.id} className="rounded-md border border-slate-200 p-3" style={{ marginLeft: `${(commentItem.depth - 1) * 16}px` }}>
                <p className="text-xs font-semibold text-slate-700">{commentItem.authorFullName} · {new Date(commentItem.createdAt).toLocaleString()}</p>
                <p className="mt-1 text-sm text-slate-800">{commentItem.body}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                  <button
                    type="button"
                    onClick={() => { void onVoteComment(commentItem.id, 1); }}
                    className="rounded border border-slate-300 px-1.5 py-0.5 transition hover:bg-slate-100"
                  >
                    ↑
                  </button>
                  <span>{commentItem.score ?? ((commentItem.upvotes ?? 0) - (commentItem.downvotes ?? 0))}</span>
                  <button
                    type="button"
                    onClick={() => { void onVoteComment(commentItem.id, -1); }}
                    className="rounded border border-slate-300 px-1.5 py-0.5 transition hover:bg-slate-100"
                  >
                    ↓
                  </button>
                  <span>({commentItem.upvotes ?? 0}/{commentItem.downvotes ?? 0})</span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  {commentItem.depth < 5 && !isCommentLockedForUser ? (
                    <button
                      type="button"
                      onClick={() => {
                        setReplyToCommentId((current) => (current === commentItem.id ? undefined : commentItem.id));
                        setReplyBody('');
                      }}
                      className="text-xs font-medium text-blue-700 transition hover:text-blue-800"
                    >
                      Reply
                    </button>
                  ) : null}
                  {(session?.role === 'admin' || session?.userId === commentItem.authorUserId) ? (
                    <button
                      type="button"
                      onClick={() => { void onDeleteComment(commentItem.id); }}
                      className="text-xs font-medium text-red-700 transition hover:text-red-800"
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
                {replyToCommentId === commentItem.id ? (
                  <form className="mt-3 space-y-2" onSubmit={onSubmitReply}>
                    <textarea
                      aria-label="Reply to comment"
                      value={replyBody}
                      onChange={(event) => setReplyBody(event.target.value)}
                      className="min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                    <div className="flex items-center gap-2">
                      <Button type="submit" variant="primary" disabled={isSubmitting || !replyBody.trim()}>
                        {isSubmitting ? 'Loading...' : 'Reply'}
                      </Button>
                      <button
                        type="button"
                        onClick={() => {
                          setReplyToCommentId(undefined);
                          setReplyBody('');
                        }}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
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
      ) : null}
    </main>
  );
};
