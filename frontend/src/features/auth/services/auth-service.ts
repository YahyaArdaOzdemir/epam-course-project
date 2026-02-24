import { apiClient } from '../../../services/api-client';
import {
  AuthSession,
  CsrfResponse,
  LoginRequest,
  LoginResponse,
  NeutralResponse,
  RegisterRequest,
} from '../../../services/contracts';

export const authApi = {
  register(payload: RegisterRequest): Promise<{ userId: string }> {
    return apiClient.post('/auth/register', payload);
  },
  login(payload: LoginRequest): Promise<LoginResponse> {
    return apiClient.post('/auth/login', payload);
  },
  logout(csrfToken: string): Promise<void> {
    return apiClient.post('/auth/logout', undefined, false, csrfToken);
  },
  session(): Promise<AuthSession> {
    return apiClient.get('/auth/session');
  },
  csrf(): Promise<CsrfResponse> {
    return apiClient.get('/auth/csrf');
  },
  /** Requests a password reset for the provided email and returns neutral confirmation. */
  passwordResetRequest(email: string): Promise<NeutralResponse> {
    return apiClient.post('/auth/password-reset/request', { email });
  },
  /** Confirms a password reset using one-time token and next password payload. */
  passwordResetConfirm(token: string, newPassword: string): Promise<NeutralResponse> {
    return apiClient.post('/auth/password-reset/confirm', { token, newPassword });
  },
};
