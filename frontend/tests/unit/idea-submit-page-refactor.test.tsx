import { act } from 'react-dom/test-utils';
import { createRoot, Root } from 'react-dom/client';
import { IdeaSubmitPage } from '../../src/features/ideas/pages/IdeaSubmitPage';
import { useAuth } from '../../src/features/auth/hooks/useAuth';
import { ideaApi } from '../../src/features/ideas/services/idea-service';

jest.mock('../../src/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../src/features/ideas/services/idea-service', () => ({
  ideaApi: {
    create: jest.fn(),
  },
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedIdeaCreate = ideaApi.create as jest.MockedFunction<typeof ideaApi.create>;

describe('idea submission page refactor', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    mockedUseAuth.mockReturnValue({
      session: { authenticated: true, userId: 'u-1', role: 'submitter', expiresAt: new Date().toISOString() },
      csrfToken: 'csrf-token',
      message: '',
      isLoading: false,
      register: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      refreshSession: jest.fn(),
      passwordResetRequest: jest.fn(),
      passwordResetConfirm: jest.fn(),
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    jest.clearAllMocks();
  });

  test('renders category as dropdown with exact enum values', async () => {
    await act(async () => {
      root.render(<IdeaSubmitPage />);
    });

    const select = container.querySelector('select[aria-label="Category"]');
    expect(select).not.toBeNull();

    const optionTexts = Array.from(select?.querySelectorAll('option') ?? []).map((option) => option.textContent?.trim());
    expect(optionTexts).toEqual(['Select category', 'Process Improvement', 'Product Feature', 'Cost Saving', 'Other']);
  });

  test('renders standardized red alert when submission fails', async () => {
    mockedIdeaCreate.mockRejectedValue(new Error('Validation failed'));

    await act(async () => {
      root.render(<IdeaSubmitPage />);
    });

    const titleInput = container.querySelector('input[aria-label="Title"]') as HTMLInputElement;
    const descriptionInput = container.querySelector('textarea[aria-label="Description"]') as HTMLTextAreaElement;
    const categorySelect = container.querySelector('select[aria-label="Category"]') as HTMLSelectElement;

    await act(async () => {
      titleInput.value = 'Idea title';
      titleInput.dispatchEvent(new Event('input', { bubbles: true }));
      descriptionInput.value = 'Idea description';
      descriptionInput.dispatchEvent(new Event('input', { bubbles: true }));
      categorySelect.value = 'Process Improvement';
      categorySelect.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const form = container.querySelector('form') as HTMLFormElement;
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    const alert = container.querySelector('[role="alert"]');
    expect(alert).not.toBeNull();
    expect(alert?.textContent).toContain('Validation failed');
    expect(alert?.className).toContain('bg-red-50');
    expect(alert?.className).toContain('text-red-700');
  });

  test('disables submit while request is in flight', async () => {
    let resolveCreate: ((value: unknown) => void) | null = null;
    const pendingCreate = new Promise((resolve) => {
      resolveCreate = resolve;
    });
    mockedIdeaCreate.mockReturnValue(pendingCreate as ReturnType<typeof ideaApi.create>);

    await act(async () => {
      root.render(<IdeaSubmitPage />);
    });

    const titleInput = container.querySelector('input[aria-label="Title"]') as HTMLInputElement;
    const descriptionInput = container.querySelector('textarea[aria-label="Description"]') as HTMLTextAreaElement;
    const categorySelect = container.querySelector('select[aria-label="Category"]') as HTMLSelectElement;

    await act(async () => {
      titleInput.value = 'Idea title';
      titleInput.dispatchEvent(new Event('input', { bubbles: true }));
      descriptionInput.value = 'Idea description';
      descriptionInput.dispatchEvent(new Event('input', { bubbles: true }));
      categorySelect.value = 'Cost Saving';
      categorySelect.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const form = container.querySelector('form') as HTMLFormElement;
    act(() => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    const submitButton = container.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submitButton.disabled).toBe(true);
    expect(submitButton.textContent).toContain('Loading...');

    await act(async () => {
      resolveCreate?.({ id: 'idea-1' });
      await pendingCreate;
    });

    expect(submitButton.disabled).toBe(false);
    expect(mockedIdeaCreate).toHaveBeenCalledTimes(1);
  });

  test('renders share checkbox and allows toggling selection', async () => {
    await act(async () => {
      root.render(<IdeaSubmitPage />);
    });

    const shareCheckbox = container.querySelector('input[aria-label="Share with all employees"]') as HTMLInputElement;
    expect(shareCheckbox).not.toBeNull();
    expect(shareCheckbox.checked).toBe(false);

    await act(async () => {
      shareCheckbox.checked = true;
      shareCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(shareCheckbox.checked).toBe(true);
  });
});
