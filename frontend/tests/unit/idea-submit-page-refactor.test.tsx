import { act } from 'react-dom/test-utils';
import { createRoot, Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
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
let latestBlockerArgument: unknown;
let blockerState: 'blocked' | 'unblocked' = 'unblocked';

const evaluateLatestBlockerArgument = (): boolean => {
  if (typeof latestBlockerArgument === 'function') {
    return Boolean(
      latestBlockerArgument({
        currentLocation: { pathname: '/ideas/new' },
        nextLocation: { pathname: '/ideas/idea-42' },
        historyAction: 'PUSH',
      }),
    );
  }

  return Boolean(latestBlockerArgument);
};

const navigateMock = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => navigateMock,
  useBlocker: (argument: unknown) => {
    latestBlockerArgument = argument;
    return {
      state: blockerState,
      proceed: jest.fn(),
      reset: jest.fn(),
    };
  },
}));

const renderSubmitPage = (root: Root): void => {
  root.render(
    <MemoryRouter>
      <IdeaSubmitPage />
    </MemoryRouter>,
  );
};

describe('idea submission page refactor', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    window.localStorage.clear();
    latestBlockerArgument = false;
    blockerState = 'unblocked';
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
      renderSubmitPage(root);
    });

    const select = container.querySelector('select[aria-label="Category"]');
    expect(select).not.toBeNull();

    const optionTexts = Array.from(select?.querySelectorAll('option') ?? []).map((option) => option.textContent?.trim());
    expect(optionTexts).toEqual([
      'Select category',
      'Process Improvement',
      'Product Feature',
      'Cost Saving',
      'Workplace Wellness',
      'Technology/IT',
      'Other',
    ]);
  });

  test('renders category-specific dynamic fields and clears stale values when switching to Other', async () => {
    await act(async () => {
      renderSubmitPage(root);
    });

    const categorySelect = container.querySelector('select[aria-label="Category"]') as HTMLSelectElement;

    await act(async () => {
      categorySelect.value = 'Process Improvement';
      categorySelect.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const painPointsInput = container.querySelector('textarea[aria-label="Current Pain Points"]') as HTMLTextAreaElement;
    expect(painPointsInput).not.toBeNull();

    await act(async () => {
      painPointsInput.value = 'Manual approvals delay releases';
      painPointsInput.dispatchEvent(new Event('input', { bubbles: true }));
      categorySelect.value = 'Other';
      categorySelect.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(container.querySelector('textarea[aria-label="Current Pain Points"]')).toBeNull();
  });

  test('provides markdown formatting controls for description', async () => {
    await act(async () => {
      renderSubmitPage(root);
    });

    const descriptionInput = container.querySelector('textarea[aria-label="Description"]') as HTMLTextAreaElement;
    const boldButton = container.querySelector('button[aria-label="Format bold"]') as HTMLButtonElement;
    const italicButton = container.querySelector('button[aria-label="Format italic"]') as HTMLButtonElement;
    const bulletsButton = container.querySelector('button[aria-label="Format bullet list"]') as HTMLButtonElement;

    expect(boldButton).not.toBeNull();
    expect(italicButton).not.toBeNull();
    expect(bulletsButton).not.toBeNull();

    await act(async () => {
      descriptionInput.value = 'Initial';
      descriptionInput.dispatchEvent(new Event('input', { bubbles: true }));
      boldButton.click();
      italicButton.click();
      bulletsButton.click();
    });

    expect(descriptionInput.value).toContain('**');
    expect(descriptionInput.value).toContain('*');
    expect(descriptionInput.value).toContain('- ');
  });

  test('submits dynamic field payload for cost saving category', async () => {
    mockedIdeaCreate.mockResolvedValue({
      id: 'idea-cost-1',
      title: 'Cut cloud spend',
      category: 'Cost Saving',
      status: 'Submitted',
      isShared: false,
      rowVersion: 0,
      ownerUserId: 'u-1',
      latestEvaluationComment: null,
    });

    await act(async () => {
      renderSubmitPage(root);
    });

    const titleInput = container.querySelector('input[aria-label="Title"]') as HTMLInputElement;
    const descriptionInput = container.querySelector('textarea[aria-label="Description"]') as HTMLTextAreaElement;
    const categorySelect = container.querySelector('select[aria-label="Category"]') as HTMLSelectElement;

    await act(async () => {
      titleInput.value = 'Cut cloud spend';
      titleInput.dispatchEvent(new Event('input', { bubbles: true }));
      descriptionInput.value = 'Autoscale non-prod clusters overnight.';
      descriptionInput.dispatchEvent(new Event('input', { bubbles: true }));
      categorySelect.value = 'Cost Saving';
      categorySelect.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const savingsInput = container.querySelector('input[aria-label="Estimated Annual Savings ($)"]') as HTMLInputElement;
    expect(savingsInput).not.toBeNull();

    await act(async () => {
      savingsInput.value = '50000';
      savingsInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const form = container.querySelector('form') as HTMLFormElement;
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(mockedIdeaCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'Cost Saving',
        dynamicFields: {
          estimatedAnnualSavings: 50000,
        },
      }),
      'csrf-token',
    );
  });

  test('supports technology and wellness follow-up fields', async () => {
    await act(async () => {
      renderSubmitPage(root);
    });

    const categorySelect = container.querySelector('select[aria-label="Category"]') as HTMLSelectElement;

    await act(async () => {
      categorySelect.value = 'Workplace Wellness';
      categorySelect.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(container.querySelector('input[aria-label="Target Department"]')).not.toBeNull();

    await act(async () => {
      categorySelect.value = 'Technology/IT';
      categorySelect.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(container.querySelector('input[aria-label="Proposed Software/Hardware"]')).not.toBeNull();
  });

  test('renders standardized red alert when submission fails', async () => {
    mockedIdeaCreate.mockRejectedValue(new Error('Validation failed'));

    await act(async () => {
      renderSubmitPage(root);
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
      renderSubmitPage(root);
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
      renderSubmitPage(root);
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

  test('redirects to created idea details after successful submit', async () => {
    let blockerStateAtNavigate: boolean | null = null;
    navigateMock.mockImplementation(() => {
      blockerStateAtNavigate = evaluateLatestBlockerArgument();
    });

    mockedIdeaCreate.mockResolvedValue({
      id: 'idea-42',
      title: 'Idea title',
      category: 'Cost Saving',
      status: 'Submitted',
      isShared: false,
      rowVersion: 0,
      ownerUserId: 'u-1',
      latestEvaluationComment: null,
    });

    await act(async () => {
      renderSubmitPage(root);
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
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(navigateMock).toHaveBeenCalledWith('/ideas/idea-42');
    expect(blockerStateAtNavigate).toBe(false);
  });

  test('keeps draft blocker disabled when form is pristine', async () => {
    await act(async () => {
      renderSubmitPage(root);
    });

    expect(evaluateLatestBlockerArgument()).toBe(false);
    const persistedDrafts = window.localStorage.getItem('innovateepam.ideaDrafts.u-1');
    expect(persistedDrafts === null || persistedDrafts === '[]').toBe(true);
  });
});
