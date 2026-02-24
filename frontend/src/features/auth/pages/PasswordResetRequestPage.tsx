import { FormEvent, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export const PasswordResetRequestPage = () => {
  const { passwordResetRequest, message } = useAuth();
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      await passwordResetRequest(email);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to request reset');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="mx-auto mt-12 max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="mb-6 text-center text-2xl font-semibold text-slate-900">Reset Password</h1>
      {errorMessage ? <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div> : null}
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          Email
          <input
            aria-label="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {isLoading ? 'Loading...' : 'Send reset link'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">{message}</p>
    </main>
  );
};
