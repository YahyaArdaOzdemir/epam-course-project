import { FormEvent, useEffect, useState } from 'react';
import { useBlocker, useNavigate, useSearchParams } from 'react-router-dom';
import { Alert } from '../../../components/ui/Alert';
import { useAuth } from '../../auth/hooks/useAuth';
import { IdeaCategory } from '../../shared/domain-types';
import { focusErrorAlert } from '../../shared/focus-error-alert';
import { useSubmissionGuard } from '../../shared/useSubmissionGuard';
import { ideaApi } from '../services/idea-service';
import { loadDraftById, removeDraft, upsertDraft } from '../services/idea-draft-storage';
import { appendBoldToken, appendBulletToken, appendItalicToken } from '../utils/idea-markdown';

const IDEA_CATEGORIES: IdeaCategory[] = [
  'Process Improvement',
  'Product Feature',
  'Cost Saving',
  'Workplace Wellness',
  'Technology/IT',
  'Other',
];
const IDEA_SUBMIT_ERROR_ALERT_ID = 'idea-submit-error-alert';

const buildDynamicPayload = (
  category: IdeaCategory,
  fields: {
    currentPainPoints: string;
    targetUserPersona: string;
    estimatedAnnualSavings: string;
    targetDepartment: string;
    proposedSoftwareHardware: string;
  },
) => {
  if (category === 'Process Improvement' && fields.currentPainPoints.trim()) {
    return { currentPainPoints: fields.currentPainPoints.trim() };
  }

  if (category === 'Product Feature' && fields.targetUserPersona.trim()) {
    return { targetUserPersona: fields.targetUserPersona.trim() };
  }

  if (category === 'Cost Saving' && fields.estimatedAnnualSavings.trim()) {
    return { estimatedAnnualSavings: Number(fields.estimatedAnnualSavings) };
  }

  if (category === 'Workplace Wellness' && fields.targetDepartment.trim()) {
    return { targetDepartment: fields.targetDepartment.trim() };
  }

  if (category === 'Technology/IT' && fields.proposedSoftwareHardware.trim()) {
    return { proposedSoftwareHardware: fields.proposedSoftwareHardware.trim() };
  }

  return undefined;
};

const createDraftId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `draft-${Date.now()}`;
};

export const IdeaSubmitPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IdeaCategory | ''>('');
  const [dynamicFields, setDynamicFields] = useState({
    currentPainPoints: '',
    targetUserPersona: '',
    estimatedAnnualSavings: '',
    targetDepartment: '',
    proposedSoftwareHardware: '',
  });
  const [isShared, setIsShared] = useState(false);
  const [file, setFile] = useState<File | undefined>();
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeDraftId, setActiveDraftId] = useState(() => searchParams.get('draftId') ?? createDraftId());
  const [submitted, setSubmitted] = useState(false);
  const { csrfToken, session } = useAuth();

  const hasContent = Boolean(
    title.trim()
    || description.trim()
    || category
    || dynamicFields.currentPainPoints.trim()
    || dynamicFields.targetUserPersona.trim()
    || dynamicFields.estimatedAnnualSavings.trim()
    || dynamicFields.targetDepartment.trim()
    || dynamicFields.proposedSoftwareHardware.trim()
    || isShared,
  );

  const blocker = useBlocker(hasContent && !submitted);
  const { isSubmitting, runGuarded } = useSubmissionGuard();

  useEffect(() => {
    if (errorMessage) {
      focusErrorAlert(IDEA_SUBMIT_ERROR_ALERT_ID);
    }
  }, [errorMessage]);

  useEffect(() => {
    const draftIdFromQuery = searchParams.get('draftId');
    if (!session || !draftIdFromQuery) {
      return;
    }

    const draft = loadDraftById(session.userId, draftIdFromQuery);
    if (!draft) {
      return;
    }

    setActiveDraftId(draft.id);
    setTitle(draft.title);
    setDescription(draft.description);
    setCategory(draft.category);
    setDynamicFields({
      currentPainPoints: draft.dynamicFields.currentPainPoints ?? '',
      targetUserPersona: draft.dynamicFields.targetUserPersona ?? '',
      estimatedAnnualSavings: draft.dynamicFields.estimatedAnnualSavings ?? '',
      targetDepartment: draft.dynamicFields.targetDepartment ?? '',
      proposedSoftwareHardware: draft.dynamicFields.proposedSoftwareHardware ?? '',
    });
    setIsShared(draft.isShared);
  }, [searchParams, session]);

  useEffect(() => {
    if (!session) {
      return;
    }

    if (!hasContent) {
      removeDraft(session.userId, activeDraftId);
      return;
    }

    upsertDraft({
      id: activeDraftId,
      userId: session.userId,
      title,
      description,
      category,
      dynamicFields,
      isShared,
      updatedAt: new Date().toISOString(),
    });
  }, [activeDraftId, category, description, dynamicFields, hasContent, isShared, session, title]);

  const onCategoryChange = (nextCategory: IdeaCategory | ''): void => {
    setCategory(nextCategory);
    setDynamicFields({
      currentPainPoints: '',
      targetUserPersona: '',
      estimatedAnnualSavings: '',
      targetDepartment: '',
      proposedSoftwareHardware: '',
    });
  };

  const applyDescriptionFormat = (type: 'bold' | 'italic' | 'bullet'): void => {
    setDescription((current) => {
      if (type === 'bold') {
        return appendBoldToken(current);
      }

      if (type === 'italic') {
        return appendItalicToken(current);
      }

      return appendBulletToken(current);
    });
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    setErrorMessage('');
    setSuccessMessage('');

    if (!csrfToken) {
      setErrorMessage('Please login first');
      return;
    }

    if (!IDEA_CATEGORIES.includes(category as IdeaCategory)) {
      setErrorMessage('Please select a valid category from the dropdown.');
      return;
    }

    const validatedCategory = category as IdeaCategory;
    const payloadDynamicFields = buildDynamicPayload(validatedCategory, dynamicFields);

    try {
      const createdIdea =
      await runGuarded(async () => {
        return ideaApi.create(
          {
            title,
            description,
            category: validatedCategory,
            dynamicFields: payloadDynamicFields,
            isShared,
            file,
          },
          csrfToken,
        );
      });
      if (session) {
        removeDraft(session.userId, activeDraftId);
      }
      setSubmitted(true);
      setActiveDraftId(createDraftId());
      navigate(`/ideas/${createdIdea.id}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to submit idea.');
    }
  };

  return (
    <>
      {blocker.state === 'blocked' ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="draft-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        >
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h2 id="draft-dialog-title" className="text-lg font-semibold text-slate-900">Leave page?</h2>
            <p className="mt-2 text-sm text-slate-600">You have an unsaved draft. Would you like to save it before leaving?</p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => { blocker.proceed?.(); }}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => {
                  if (session) {
                    removeDraft(session.userId, activeDraftId);
                  }
                  blocker.proceed?.();
                }}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Discard Draft
              </button>
              <button
                type="button"
                onClick={() => { blocker.reset?.(); }}
                className="w-full rounded-lg px-4 py-2 text-sm text-slate-500 transition hover:text-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    <main className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Submit Idea</h1>
      <p className="mt-2 text-sm text-slate-600">Provide a clear idea summary and choose a valid category before submitting.</p>

      {errorMessage ? <Alert id={IDEA_SUBMIT_ERROR_ALERT_ID} className="mt-4" variant="destructive" message={errorMessage} /> : null}
      {successMessage ? <Alert className="mt-4" variant="success" message={successMessage} /> : null}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          Title
          <input
            aria-label="Title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onInput={(event) => setTitle((event.target as HTMLInputElement).value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            required
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Description
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              aria-label="Format bold"
              onClick={() => applyDescriptionFormat('bold')}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Bold
            </button>
            <button
              type="button"
              aria-label="Format italic"
              onClick={() => applyDescriptionFormat('italic')}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Italic
            </button>
            <button
              type="button"
              aria-label="Format bullet list"
              onClick={() => applyDescriptionFormat('bullet')}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Bullets
            </button>
          </div>
          <textarea
            aria-label="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            onInput={(event) => setDescription((event.target as HTMLTextAreaElement).value)}
            className="mt-1 min-h-32 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            required
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Category
          <select
            aria-label="Category"
            value={category}
            onChange={(event) => onCategoryChange(event.target.value as IdeaCategory | '')}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            required
          >
            <option value="" disabled>
              Select category
            </option>
            {IDEA_CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        {category === 'Process Improvement' ? (
          <label className="block text-sm font-medium text-slate-700">
            Current Pain Points
            <textarea
              aria-label="Current Pain Points"
              value={dynamicFields.currentPainPoints}
              onChange={(event) => setDynamicFields((current) => ({ ...current, currentPainPoints: event.target.value }))}
              onInput={(event) => setDynamicFields((current) => ({ ...current, currentPainPoints: (event.target as HTMLTextAreaElement).value }))}
              className="mt-1 min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </label>
        ) : null}
        {category === 'Product Feature' ? (
          <label className="block text-sm font-medium text-slate-700">
            Target User Persona
            <input
              aria-label="Target User Persona"
              value={dynamicFields.targetUserPersona}
              onChange={(event) => setDynamicFields((current) => ({ ...current, targetUserPersona: event.target.value }))}
              onInput={(event) => setDynamicFields((current) => ({ ...current, targetUserPersona: (event.target as HTMLInputElement).value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </label>
        ) : null}
        {category === 'Cost Saving' ? (
          <label className="block text-sm font-medium text-slate-700">
            Estimated Annual Savings ($)
            <input
              aria-label="Estimated Annual Savings ($)"
              type="number"
              min="0"
              value={dynamicFields.estimatedAnnualSavings}
              onChange={(event) => setDynamicFields((current) => ({ ...current, estimatedAnnualSavings: event.target.value }))}
              onInput={(event) => setDynamicFields((current) => ({ ...current, estimatedAnnualSavings: (event.target as HTMLInputElement).value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </label>
        ) : null}
        {category === 'Workplace Wellness' ? (
          <label className="block text-sm font-medium text-slate-700">
            Target Department
            <input
              aria-label="Target Department"
              value={dynamicFields.targetDepartment}
              onChange={(event) => setDynamicFields((current) => ({ ...current, targetDepartment: event.target.value }))}
              onInput={(event) => setDynamicFields((current) => ({ ...current, targetDepartment: (event.target as HTMLInputElement).value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </label>
        ) : null}
        {category === 'Technology/IT' ? (
          <label className="block text-sm font-medium text-slate-700">
            Proposed Software/Hardware
            <input
              aria-label="Proposed Software/Hardware"
              value={dynamicFields.proposedSoftwareHardware}
              onChange={(event) => setDynamicFields((current) => ({ ...current, proposedSoftwareHardware: event.target.value }))}
              onInput={(event) => setDynamicFields((current) => ({ ...current, proposedSoftwareHardware: (event.target as HTMLInputElement).value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </label>
        ) : null}
        <label className="block text-sm font-medium text-slate-700">
          Attachment
          <input
            type="file"
            accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,image/png,image/jpeg"
            onChange={(event) => setFile(event.target.files?.[0])}
            className="mt-1 block w-full text-sm text-slate-700"
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            aria-label="Share with all employees"
            checked={isShared}
            onChange={(event) => setIsShared(event.target.checked)}
          />
          Share with all employees
        </label>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {isSubmitting ? 'Loading...' : 'Submit Idea'}
        </button>
      </form>
    </main>
    </>
  );
};
