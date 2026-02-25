import { act } from 'react-dom/test-utils';
import { createRoot, Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PasswordResetRequestPage } from '../../src/features/auth/pages/PasswordResetRequestPage';
import { PasswordResetConfirmPage } from '../../src/features/auth/pages/PasswordResetConfirmPage';
import { useAuth } from '../../src/features/auth/hooks/useAuth';

jest.mock('../../src/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('password reset pages red alerts', () => {
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

  it('shows red alert on reset request failure', async () => {
    mockedUseAuth.mockReturnValue({
      session: null,
      csrfToken: null,
      message: '',
      isLoading: false,
      register: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      refreshSession: jest.fn(),
      passwordResetRequest: jest.fn().mockRejectedValue(new Error('Too many attempts. Please wait and try again.')),
      passwordResetConfirm: jest.fn(),
    });

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/reset-password']}>
          <Routes>
            <Route path="/reset-password" element={<PasswordResetRequestPage />} />
          </Routes>
        </MemoryRouter>,
      );
    });

    const emailInput = container.querySelector('input[aria-label="Email"]') as HTMLInputElement;
    await act(async () => {
      emailInput.value = 'employee@epam.com';
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const form = container.querySelector('form') as HTMLFormElement;
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(container.querySelector('.text-red-700')?.textContent).toContain('Too many attempts. Please wait and try again.');
  });

  it('shows green popup on reset request success', async () => {
    mockedUseAuth.mockReturnValue({
      session: null,
      csrfToken: null,
      message: '',
      isLoading: false,
      register: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      refreshSession: jest.fn(),
      passwordResetRequest: jest.fn().mockResolvedValue({ message: 'If an account exists, a reset link has been sent.' }),
      passwordResetConfirm: jest.fn(),
    });

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/reset-password']}>
          <Routes>
            <Route path="/reset-password" element={<PasswordResetRequestPage />} />
          </Routes>
        </MemoryRouter>,
      );
    });

    const emailInput = container.querySelector('input[aria-label="Email"]') as HTMLInputElement;
    await act(async () => {
      emailInput.value = 'employee@epam.com';
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const form = container.querySelector('form') as HTMLFormElement;
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(container.querySelector('.text-green-700')?.textContent).toContain('If an account exists, a reset link has been sent.');
  });

  it('shows red alert on reset confirm invalid token', async () => {
    mockedUseAuth.mockReturnValue({
      session: null,
      csrfToken: null,
      message: '',
      isLoading: false,
      register: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      refreshSession: jest.fn(),
      passwordResetRequest: jest.fn(),
      passwordResetConfirm: jest.fn().mockRejectedValue(new Error('Reset link is invalid or expired. Request a new one.')),
    });

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/reset-password/confirm?token=bad-token']}>
          <Routes>
            <Route path="/reset-password/confirm" element={<PasswordResetConfirmPage />} />
          </Routes>
        </MemoryRouter>,
      );
    });

    const passwordInput = container.querySelector('input[aria-label="New Password"]') as HTMLInputElement;
    const confirmPasswordInput = container.querySelector('input[aria-label="Confirm Password"]') as HTMLInputElement;
    await act(async () => {
      passwordInput.value = 'StrongPass123!';
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
      confirmPasswordInput.value = 'StrongPass123!';
      confirmPasswordInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const form = container.querySelector('form') as HTMLFormElement;
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(container.querySelector('.text-red-700')?.textContent).toContain('Reset link is invalid or expired. Request a new one.');
  });

  it('shows green popup on reset confirm success', async () => {
    mockedUseAuth.mockReturnValue({
      session: null,
      csrfToken: null,
      message: '',
      isLoading: false,
      register: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      refreshSession: jest.fn(),
      passwordResetRequest: jest.fn(),
      passwordResetConfirm: jest.fn().mockResolvedValue({ message: 'Password reset completed' }),
    });

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/reset-password/confirm?token=token-1']}>
          <Routes>
            <Route path="/reset-password/confirm" element={<PasswordResetConfirmPage />} />
          </Routes>
        </MemoryRouter>,
      );
    });

    const passwordInput = container.querySelector('input[aria-label="New Password"]') as HTMLInputElement;
    const confirmPasswordInput = container.querySelector('input[aria-label="Confirm Password"]') as HTMLInputElement;
    await act(async () => {
      passwordInput.value = 'StrongPass123!';
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
      confirmPasswordInput.value = 'StrongPass123!';
      confirmPasswordInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const form = container.querySelector('form') as HTMLFormElement;
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(container.querySelector('.text-green-700')?.textContent).toContain('Password reset completed');
  });

});
