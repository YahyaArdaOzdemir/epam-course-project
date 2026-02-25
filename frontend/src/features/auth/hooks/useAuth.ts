import { createContext, createElement, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { AuthSession, LoginRequest, RegisterRequest } from '../../../services/contracts';
import { authApi } from '../services/auth-service';
import { mapAuthError } from '../services/auth-error-mapper';

/** Public auth context contract consumed by pages, route guards, and feature components. */
type AuthContextValue = {
  session: AuthSession | null;
  csrfToken: string | null;
  message: string;
  isLoading: boolean;
  register: (payload: RegisterRequest) => Promise<{ message: string }>;
  login: (payload: LoginRequest) => Promise<{ redirectTo: '/dashboard' }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  passwordResetRequest: (email: string) => Promise<{ message: string }>;
  passwordResetConfirm: (token: string, newPassword: string, confirmPassword: string) => Promise<{ message: string }>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Provides shared cookie-session auth state, CSRF token state, and auth action methods.
 * Also enforces forced logout + message propagation when session recovery fails.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const forceLogout = (nextMessage: string): void => {
    setSession(null);
    setCsrfToken(null);
    setMessage(nextMessage);
  };

  const refreshSession = async (): Promise<void> => {
    try {
      const nextSession = await authApi.session();
      setSession(nextSession);
      const csrf = await authApi.csrf();
      setCsrfToken(csrf.csrfToken);
    } catch {
      if (session) {
        forceLogout('Your session has expired. Please login again.');
        return;
      }

      setSession(null);
      setCsrfToken(null);
    }
  };

  const register = async (payload: RegisterRequest): Promise<{ message: string }> => {
    try {
      await authApi.register(payload);
      return { message: 'Registered successfully. You can now login.' };
    } catch (error) {
      throw new Error(mapAuthError(error));
    }
  };

  const login = async (payload: LoginRequest): Promise<{ redirectTo: '/dashboard' }> => {
    try {
      const next = await authApi.login(payload);
      await refreshSession();
      return { redirectTo: next.redirectTo };
    } catch (error) {
      throw new Error(mapAuthError(error));
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (csrfToken) {
        await authApi.logout(csrfToken);
      }
    } finally {
      forceLogout('');
    }
  };

  const passwordResetRequest = async (email: string): Promise<{ message: string }> => {
    try {
      const result = await authApi.passwordResetRequest(email);
      return result;
    } catch (error) {
      throw new Error(mapAuthError(error));
    }
  };

  const passwordResetConfirm = async (token: string, newPassword: string, confirmPassword: string): Promise<{ message: string }> => {
    try {
      const result = await authApi.passwordResetConfirm(token, newPassword, confirmPassword);
      return result;
    } catch (error) {
      throw new Error(mapAuthError(error));
    }
  };

  useEffect(() => {
    void (async () => {
      await refreshSession();
      setIsLoading(false);
    })();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      csrfToken,
      message,
      isLoading,
      register,
      login,
      logout,
      refreshSession,
      passwordResetRequest,
      passwordResetConfirm,
    }),
    [session, csrfToken, message, isLoading],
  );

  return createElement(AuthContext.Provider, { value }, children);
};

/** Accesses the current auth context and throws if used outside AuthProvider. */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};
