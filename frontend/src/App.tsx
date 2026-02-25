import { FormEvent, useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';
import { useAuth } from './features/auth/hooks/useAuth';
import {
  DashboardPage,
  LoginPage,
  PasswordResetConfirmPage,
  PasswordResetRequestPage,
  ProfilePage,
  RegisterPage,
} from './features/auth/pages';
import { IdeaSubmitPage } from './features/ideas/pages/IdeaSubmitPage';
import { IdeaListPage } from './features/ideas/pages/IdeaListPage';
import { IdeaDetailsPage } from './features/ideas/pages/IdeaDetailsPage';
import { EvaluationQueuePage, EvaluationDetailPage } from './features/evaluation/pages';
import { ProtectedLayout } from './features/layout/ProtectedLayout';
import { Alert } from './components/ui/Alert';

export const App = () => {
  const { session } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      {!session ? (
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link to={session ? '/dashboard' : '/'} className="text-lg font-semibold text-slate-900 transition hover:text-blue-600">
              InnovatEPAM Portal
            </Link>
          </div>
        </header>
      ) : null}
      <div className="px-6 py-8">
        <Routes>
          <Route
            path="/"
            element={session ? <Navigate to="/dashboard" replace /> : <PublicLandingPage />}
          />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<PasswordResetRequestPage />} />
          <Route path="/reset-password/confirm" element={<PasswordResetConfirmPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/ideas/new" element={<IdeaSubmitPage />} />
              <Route path="/submit" element={<IdeaSubmitPage />} />
              <Route path="/ideas" element={<IdeaListPage />} />
              <Route path="/ideas/:ideaId" element={<IdeaDetailsPage />} />
              <Route path="/evaluation" element={<EvaluationQueuePage />} />
              <Route path="/evaluate" element={<EvaluationQueuePage />} />
              <Route path="/evaluation/:ideaId" element={<EvaluationDetailPage />} />
              <Route path="/evaluate/:ideaId" element={<EvaluationDetailPage />} />
            </Route>
          </Route>

          <Route path="*" element={<LoginPage />} />
        </Routes>
      </div>
    </div>
  );
};

const PublicLandingPage = () => {
  const { register, login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const submitLogin = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const result = await login({ email, password });
      navigate(result.redirectTo);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  const submitRegister = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const result = await register({ fullName, email, password, confirmPassword });
      setSuccessMessage(result.message);
      setMode('login');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to register');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="mx-auto grid max-w-6xl gap-8 rounded-xl border border-slate-200 bg-white p-8 shadow-sm md:grid-cols-2">
      <section>
        <h1 className="text-3xl font-semibold text-slate-900">Welcome to InnovatEPAM Portal</h1>
        <p className="mt-4 text-base text-slate-700">
          InnovatEPAM Portal is the internal space for employees to propose ideas and collaborate on innovation outcomes.
        </p>
        <p className="mt-2 text-base text-slate-700">
          Sign in to access your dashboard, submit ideas, and track evaluation progress.
        </p>
      </section>

      <section className="relative rounded-xl border border-slate-200 p-6">
        {successMessage ? (
          <Alert severity="success" message={successMessage} className="fixed right-6 top-6 z-50" />
        ) : null}

        <div className="mb-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition active:scale-[0.98] ${mode === 'register' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border border-slate-300 text-slate-700 hover:bg-slate-100'}`}
          >
            Register
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition active:scale-[0.98] ${mode === 'login' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border border-slate-300 text-slate-700 hover:bg-slate-100'}`}
          >
            Login
          </button>
        </div>

        {errorMessage ? (
          <Alert severity="error" message={errorMessage} className="mb-4" />
        ) : null}

        {mode === 'register' ? (
          <form onSubmit={submitRegister} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Full Name
              <input
                aria-label="Full Name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Email
              <input
                aria-label="Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Password
              <input
                aria-label="Password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Confirm Password
              <input
                aria-label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {isLoading ? 'Loading...' : 'Register'}
            </button>
          </form>
        ) : (
          <form onSubmit={submitLogin} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Email
              <input
                aria-label="Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Password
              <input
                aria-label="Password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {isLoading ? 'Loading...' : 'Login'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
};
