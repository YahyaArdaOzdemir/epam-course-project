import { NextFunction, Request, Response } from 'express';

jest.mock('../../src/services/auth-service', () => ({
  authService: {
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    getSession: jest.fn(),
    issueCsrf: jest.fn(),
    requestPasswordReset: jest.fn(),
    confirmPasswordReset: jest.fn(),
  },
}));

jest.mock('../../src/validators/auth-validator', () => ({
  parseLoginPayload: jest.fn(),
  parseRegisterPayload: jest.fn(),
  parsePasswordResetRequestPayload: jest.fn(),
  parsePasswordResetConfirmPayload: jest.fn(),
}));

import { authController } from '../../src/controllers/auth-controller';
import { authService } from '../../src/services/auth-service';
import {
  parseLoginPayload,
  parsePasswordResetConfirmPayload,
  parsePasswordResetRequestPayload,
  parseRegisterPayload,
} from '../../src/validators/auth-validator';

const mockedAuthService = authService as jest.Mocked<typeof authService>;
const mockedParseLoginPayload = parseLoginPayload as jest.MockedFunction<typeof parseLoginPayload>;
const mockedParseRegisterPayload = parseRegisterPayload as jest.MockedFunction<typeof parseRegisterPayload>;
const mockedParseResetRequest = parsePasswordResetRequestPayload as jest.MockedFunction<typeof parsePasswordResetRequestPayload>;
const mockedParseResetConfirm = parsePasswordResetConfirmPayload as jest.MockedFunction<typeof parsePasswordResetConfirmPayload>;

const makeResponse = (): Response => {
  const response = {
    status: jest.fn(),
    json: jest.fn(),
    send: jest.fn(),
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;

  (response.status as unknown as jest.Mock).mockReturnValue(response);
  (response.json as unknown as jest.Mock).mockReturnValue(response);
  (response.send as unknown as jest.Mock).mockReturnValue(response);
  (response.cookie as unknown as jest.Mock).mockReturnValue(response);
  (response.clearCookie as unknown as jest.Mock).mockReturnValue(response);

  return response;
};

const makeRequest = (input?: {
  body?: unknown;
  headers?: Record<string, string>;
  ip?: string | undefined;
}): Request => {
  const headers = Object.fromEntries(
    Object.entries(input?.headers ?? {}).map(([key, value]) => [key.toLowerCase(), value]),
  );

  return {
    body: input?.body,
    ip: input?.ip,
    header: jest.fn((name: string) => headers[name.toLowerCase()] ?? undefined),
  } as unknown as Request;
};

describe('authController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers user and returns 201', async () => {
    const request = makeRequest({ body: { fullName: 'Alice Employee', email: 'a@epam.com', password: 'StrongPass123!', confirmPassword: 'StrongPass123!' } });
    const response = makeResponse();
    const next = jest.fn() as NextFunction;

    mockedParseRegisterPayload.mockReturnValue({
      fullName: 'Alice Employee',
      email: 'a@epam.com',
      password: 'StrongPass123!',
      confirmPassword: 'StrongPass123!',
    });
    mockedAuthService.register.mockResolvedValue({ userId: 'u1' });

    await authController.register(request, response, next);

    expect(mockedParseRegisterPayload).toHaveBeenCalledWith(request.body);
    expect(mockedAuthService.register).toHaveBeenCalledWith({
      fullName: 'Alice Employee',
      email: 'a@epam.com',
      password: 'StrongPass123!',
    });
    expect(response.status).toHaveBeenCalledWith(201);
    expect(response.json).toHaveBeenCalledWith({ userId: 'u1' });
    expect(next).not.toHaveBeenCalled();
  });

  it('forwards register errors to next', async () => {
    const request = makeRequest({ body: { email: 'bad' } });
    const response = makeResponse();
    const next = jest.fn() as NextFunction;

    const err = new Error('validation failed');
    mockedParseRegisterPayload.mockImplementation(() => {
      throw err;
    });

    await authController.register(request, response, next);

    expect(next).toHaveBeenCalledWith(err);
  });

  it('logs in user, sets cookie, and returns redirect payload', async () => {
    const request = makeRequest({
      body: { email: 'a@epam.com', password: 'StrongPass123!' },
      headers: { 'user-agent': 'jest-agent' },
      ip: undefined,
    });
    const response = makeResponse();
    const next = jest.fn() as NextFunction;

    mockedParseLoginPayload.mockReturnValue({ email: 'a@epam.com', password: 'StrongPass123!' });
    mockedAuthService.login.mockResolvedValue({
      token: 'jwt-token',
      userId: 'u1',
      role: 'submitter',
      redirectTo: '/dashboard',
      expiresAt: new Date().toISOString(),
    });

    await authController.login(request, response, next);

    expect(mockedAuthService.login).toHaveBeenCalledWith({
      email: 'a@epam.com',
      password: 'StrongPass123!',
      sourceIp: '0.0.0.0',
      userAgent: 'jest-agent',
    });
    expect(response.cookie).toHaveBeenCalledWith(
      'innovatepam_session',
      'jwt-token',
      expect.objectContaining({ httpOnly: true, secure: true, sameSite: 'lax', path: '/' }),
    );
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({ userId: 'u1', role: 'submitter', redirectTo: '/dashboard' });
    expect(next).not.toHaveBeenCalled();
  });

  it('forwards login errors to next', async () => {
    const request = makeRequest({ body: { email: 'a@epam.com', password: 'StrongPass123!' } });
    const response = makeResponse();
    const next = jest.fn() as NextFunction;

    const err = new Error('invalid');
    mockedParseLoginPayload.mockImplementation(() => {
      throw err;
    });

    await authController.login(request, response, next);

    expect(next).toHaveBeenCalledWith(err);
  });

  it('logs out with bearer token', () => {
    const request = makeRequest({ headers: { authorization: 'Bearer token-1' } });
    const response = makeResponse();
    const next = jest.fn() as NextFunction;

    authController.logout(request as any, response, next);

    expect(mockedAuthService.logout).toHaveBeenCalledWith('token-1');
    expect(response.clearCookie).toHaveBeenCalledWith(
      'innovatepam_session',
      expect.objectContaining({ httpOnly: true, secure: true, sameSite: 'lax', path: '/' }),
    );
    expect(response.status).toHaveBeenCalledWith(204);
    expect(response.send).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('logs out with cookie token and decodes value', () => {
    const request = makeRequest({ headers: { cookie: 'x=1; innovatepam_session=cookie%20token; y=2' } });
    const response = makeResponse();
    const next = jest.fn() as NextFunction;

    authController.logout(request as any, response, next);

    expect(mockedAuthService.logout).toHaveBeenCalledWith('cookie token');
    expect(response.status).toHaveBeenCalledWith(204);
    expect(next).not.toHaveBeenCalled();
  });

  it('forwards unauthorized on logout when token is missing', () => {
    const request = makeRequest({ headers: {} });
    const response = makeResponse();
    const next = jest.fn() as NextFunction;

    authController.logout(request as any, response, next);

    expect(mockedAuthService.logout).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('returns current session for valid token', () => {
    const request = makeRequest({ headers: { authorization: 'Bearer session-token' } });
    const response = makeResponse();
    const next = jest.fn() as NextFunction;

    mockedAuthService.getSession.mockReturnValue({
      authenticated: true,
      userId: 'u1',
      role: 'submitter',
      expiresAt: new Date().toISOString(),
    });

    authController.session(request, response, next);

    expect(mockedAuthService.getSession).toHaveBeenCalledWith('session-token');
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ authenticated: true, userId: 'u1' }));
    expect(next).not.toHaveBeenCalled();
  });

  it('forwards unauthorized for session when token is missing', () => {
    const request = makeRequest();
    const response = makeResponse();
    const next = jest.fn() as NextFunction;

    authController.session(request, response, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('issues csrf for valid token and returns payload', () => {
    const request = makeRequest({ headers: { cookie: 'innovatepam_session=csrf-token' } });
    const response = makeResponse();
    const next = jest.fn() as NextFunction;

    mockedAuthService.issueCsrf.mockReturnValue({ csrfToken: 'csrf-1' });

    authController.csrf(request, response, next);

    expect(mockedAuthService.issueCsrf).toHaveBeenCalledWith('csrf-token');
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({ csrfToken: 'csrf-1' });
    expect(next).not.toHaveBeenCalled();
  });

  it('forwards unauthorized for csrf when token is missing', () => {
    const request = makeRequest();
    const response = makeResponse();
    const next = jest.fn() as NextFunction;

    authController.csrf(request, response, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('handles password reset request', () => {
    const request = makeRequest({ body: { email: 'a@epam.com' }, ip: undefined });
    const response = makeResponse();
    const next = jest.fn() as NextFunction;

    mockedParseResetRequest.mockReturnValue({ email: 'a@epam.com' });
    mockedAuthService.requestPasswordReset.mockReturnValue({ message: 'If an account exists, a reset link has been sent.' });

    authController.passwordResetRequest(request, response, next);

    expect(mockedParseResetRequest).toHaveBeenCalledWith(request.body);
    expect(mockedAuthService.requestPasswordReset).toHaveBeenCalledWith({
      email: 'a@epam.com',
      sourceIp: '0.0.0.0',
    });
    expect(response.status).toHaveBeenCalledWith(202);
    expect(next).not.toHaveBeenCalled();
  });

  it('forwards reset request errors', () => {
    const request = makeRequest({ body: { email: 'bad' } });
    const response = makeResponse();
    const next = jest.fn() as NextFunction;

    const err = new Error('bad request');
    mockedParseResetRequest.mockImplementation(() => {
      throw err;
    });

    authController.passwordResetRequest(request, response, next);

    expect(next).toHaveBeenCalledWith(err);
  });

  it('handles password reset confirm', async () => {
    const request = makeRequest({ body: { token: 'token-1', newPassword: 'StrongPass123!' } });
    const response = makeResponse();
    const next = jest.fn() as NextFunction;

    mockedParseResetConfirm.mockReturnValue({ token: 'token-1', newPassword: 'StrongPass123!' });
    mockedAuthService.confirmPasswordReset.mockResolvedValue({ message: 'Password reset completed' });

    await authController.passwordResetConfirm(request, response, next);

    expect(mockedParseResetConfirm).toHaveBeenCalledWith(request.body);
    expect(mockedAuthService.confirmPasswordReset).toHaveBeenCalledWith({
      token: 'token-1',
      newPassword: 'StrongPass123!',
      sourceIp: '0.0.0.0',
    });
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({ message: 'Password reset completed' });
    expect(next).not.toHaveBeenCalled();
  });

  it('forwards reset confirm errors', async () => {
    const request = makeRequest({ body: { token: 'token-1', newPassword: 'StrongPass123!' } });
    const response = makeResponse();
    const next = jest.fn() as NextFunction;

    const err = new Error('bad token');
    mockedParseResetConfirm.mockImplementation(() => {
      throw err;
    });

    await authController.passwordResetConfirm(request, response, next);

    expect(next).toHaveBeenCalledWith(err);
  });
});
