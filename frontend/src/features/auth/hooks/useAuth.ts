import { useMemo, useState } from 'react';
import { AuthSession, LoginRequest, RegisterRequest } from '../../../services/contracts';
import { authApi } from '../services/auth-service';

const STORAGE_KEY = 'innovatepam.session';

const readStoredSession = (): AuthSession | null => {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as AuthSession) : null;
};

/** Manages auth session state and API interactions. */
export const useAuth = () => {
  const [session, setSession] = useState<AuthSession | null>(() => readStoredSession());
  const [message, setMessage] = useState('');

  const persist = (value: AuthSession | null): void => {
    if (value) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    setSession(value);
  };

  const register = async (payload: RegisterRequest): Promise<void> => {
    await authApi.register(payload);
    setMessage('Registered successfully');
  };

  const login = async (payload: LoginRequest): Promise<void> => {
    const next = await authApi.login(payload);
    persist(next);
    setMessage('Logged in');
  };

  const logout = async (): Promise<void> => {
    if (session?.token) {
      await authApi.logout(session.token);
    }
    persist(null);
    setMessage('Logged out');
  };

  return useMemo(
    () => ({
      session,
      message,
      register,
      login,
      logout,
    }),
    [session, message],
  );
};
