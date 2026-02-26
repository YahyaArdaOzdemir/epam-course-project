import { FormEvent, useEffect, useState } from 'react';
import { Alert } from '../../../components/ui/Alert';
import { useAuth } from '../../auth/hooks/useAuth';
import { IdeaCategory } from '../../shared/domain-types';
import { focusErrorAlert } from '../../shared/focus-error-alert';
import { useSubmissionGuard } from '../../shared/useSubmissionGuard';
import { ideaApi } from '../services/idea-service';

const IDEA_CATEGORIES: IdeaCategory[] = ['Process Improvement', 'Product Feature', 'Cost Saving', 'Other'];
const IDEA_SUBMIT_ERROR_ALERT_ID = 'idea-submit-error-alert';

export const IdeaSubmitPage = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IdeaCategory | ''>('');
  const [isShared, setIsShared] = useState(false);
  const [file, setFile] = useState<File | undefined>();
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { csrfToken } = useAuth();
  const { isSubmitting, runGuarded } = useSubmissionGuard();

  useEffect(() => {
    if (errorMessage) {
      focusErrorAlert(IDEA_SUBMIT_ERROR_ALERT_ID);
    }
  }, [errorMessage]);

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

    try {
      await runGuarded(async () => {
        await ideaApi.create({ title, description, category: validatedCategory, isShared, file }, csrfToken);
      });

      setTitle('');
      setDescription('');
      setCategory('');
      setIsShared(false);
      setFile(undefined);
      setSuccessMessage('Idea submitted successfully.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to submit idea.');
    }
  };

  return (
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
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            required
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Description
          <textarea
            aria-label="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-1 min-h-32 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            required
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Category
          <select
            aria-label="Category"
            value={category}
            onChange={(event) => setCategory(event.target.value as IdeaCategory | '')}
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
  );
};
