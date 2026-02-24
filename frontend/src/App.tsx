import { Link, Route, Routes } from 'react-router-dom';
import { RegisterPage } from './features/auth/pages/RegisterPage';
import { LoginPage } from './features/auth/pages/LoginPage';
import { IdeaSubmitPage } from './features/ideas/pages/IdeaSubmitPage';
import { IdeaListPage } from './features/ideas/pages/IdeaListPage';
import { EvaluationQueuePage, EvaluationDetailPage } from './features/evaluation/pages';

export const App = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold text-slate-900">InnovatEPAM Portal</h1>
          <nav className="flex items-center gap-4 text-sm font-medium text-slate-700">
            <Link to="/register" className="transition hover:text-blue-600">Register</Link>
            <Link to="/login" className="transition hover:text-blue-600">Login</Link>
            <Link to="/ideas/new" className="transition hover:text-blue-600">Submit Idea</Link>
            <Link to="/ideas" className="transition hover:text-blue-600">My Ideas</Link>
            <Link to="/evaluation" className="transition hover:text-blue-600">Evaluation Queue</Link>
          </nav>
        </div>
      </header>
      <div className="px-6 py-8">
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/ideas/new" element={<IdeaSubmitPage />} />
          <Route path="/ideas" element={<IdeaListPage />} />
          <Route path="/evaluation" element={<EvaluationQueuePage />} />
          <Route path="/evaluation/:ideaId" element={<EvaluationDetailPage />} />
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </div>
    </div>
  );
};
