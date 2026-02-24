import { act } from 'react-dom/test-utils';
import { createRoot, Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '../../src/features/auth/pages/LoginPage';
import { RegisterPage } from '../../src/features/auth/pages/RegisterPage';
import { useAuth } from '../../src/features/auth/hooks/useAuth';

jest.mock('../../src/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('auth pages red alerts', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    jest.clearAllMocks();
  });

  it('renders red alert when login fails', async () => {
    mockedUseAuth.mockReturnValue({
      session: null,
      csrfToken: null,
      message: '',
      isLoading: false,
      register: jest.fn(),
      login: jest.fn().mockRejectedValue(new Error('Email or password is incorrect.')),
      logout: jest.fn(),
      refreshSession: jest.fn(),
      passwordResetRequest: jest.fn(),
      passwordResetConfirm: jest.fn(),
    });

    await act(async () => {
      root.render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>,
      );
    });

    const emailInput = container.querySelector('input[aria-label="Email"]') as HTMLInputElement;
    const passwordInput = container.querySelector('input[aria-label="Password"]') as HTMLInputElement;

    await act(async () => {
      emailInput.value = 'employee@epam.com';
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      passwordInput.value = 'WrongPass123!';
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const form = container.querySelector('form') as HTMLFormElement;
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    const alert = container.querySelector('.text-red-700');
    expect(alert?.textContent).toContain('Email or password is incorrect.');
  });

  it('renders red alert when register fails for duplicate email', async () => {
    mockedUseAuth.mockReturnValue({
      session: null,
      csrfToken: null,
      message: '',
      isLoading: false,
      register: jest.fn().mockRejectedValue(new Error('An account with this email already exists.')),
      login: jest.fn(),
      logout: jest.fn(),
      refreshSession: jest.fn(),
      passwordResetRequest: jest.fn(),
      passwordResetConfirm: jest.fn(),
    });

    await act(async () => {
      root.render(
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>,
      );
    });

    const emailInput = container.querySelector('input[aria-label="Email"]') as HTMLInputElement;
    const passwordInput = container.querySelector('input[aria-label="Password"]') as HTMLInputElement;

    await act(async () => {
      emailInput.value = 'employee@epam.com';
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      passwordInput.value = 'StrongPass123!';
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const form = container.querySelector('form') as HTMLFormElement;
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    const alert = container.querySelector('.text-red-700');
    expect(alert?.textContent).toContain('An account with this email already exists.');
  });
});
