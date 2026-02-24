import { apiClient } from '../../../services/api-client';
import { AuthSession, LoginRequest, RegisterRequest } from '../../../services/contracts';

export const authApi = {
  register(payload: RegisterRequest): Promise<{ userId: string }> {
    return apiClient.post('/auth/register', payload);
  },
  login(payload: LoginRequest): Promise<AuthSession> {
    return apiClient.post('/auth/login', payload);
  },
  logout(token: string): Promise<void> {
    return apiClient.post('/auth/logout', undefined, token);
  },
};
