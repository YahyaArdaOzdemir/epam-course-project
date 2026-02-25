import { authService } from './auth-service';

export const passwordResetService = {
  request(input: { email: string; sourceIp: string }): { message: string } {
    return authService.requestPasswordReset(input);
  },
  confirm(input: { token: string; newPassword: string; sourceIp: string }): Promise<{ message: string }> {
    return authService.confirmPasswordReset(input);
  },
};
