import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';
import { useAuth } from './features/auth/hooks/useAuth';
import { RegisterPage } from './features/auth/pages/RegisterPage';
import { LoginPage } from './features/auth/pages/LoginPage';
import { DashboardPage } from './features/auth/pages/DashboardPage';
import { PasswordResetRequestPage } from './features/auth/pages/PasswordResetRequestPage';
import { PasswordResetConfirmPage } from './features/auth/pages/PasswordResetConfirmPage';
import { IdeaSubmitPage } from './features/ideas/pages/IdeaSubmitPage';
import { IdeaListPage } from './features/ideas/pages/IdeaListPage';
import { EvaluationQueuePage, EvaluationDetailPage } from './features/evaluation/pages';

export const App = () => {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async (): Promise<void> => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold text-slate-900">InnovatEPAM Portal</h1>
          <nav className="flex items-center gap-4 text-sm font-medium text-slate-700">
            <Link to="/register" className="transition hover:text-blue-600">Register</Link>
            <Link to="/login" className="transition hover:text-blue-600">Login</Link>
            <Link to="/dashboard" className="transition hover:text-blue-600">Dashboard</Link>
            <Link to="/ideas/new" className="transition hover:text-blue-600">Submit Idea</Link>
            <Link to="/ideas" className="transition hover:text-blue-600">My Ideas</Link>
            <Link to="/evaluation" className="transition hover:text-blue-600">Evaluation Queue</Link>
            {session ? (
              <button type="button" onClick={handleLogout} className="transition hover:text-blue-600">Logout</button>
            ) : null}
          </nav>
        </div>
      </header>
      <div className="px-6 py-8">
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<PasswordResetRequestPage />} />
          <Route path="/reset-password/confirm" element={<PasswordResetConfirmPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/ideas/new" element={<IdeaSubmitPage />} />
            <Route path="/ideas" element={<IdeaListPage />} />
            <Route path="/evaluation" element={<EvaluationQueuePage />} />
            <Route path="/evaluation/:ideaId" element={<EvaluationDetailPage />} />
          </Route>

          <Route path="*" element={<LoginPage />} />
        </Routes>
      </div>
    </div>
  );
};
