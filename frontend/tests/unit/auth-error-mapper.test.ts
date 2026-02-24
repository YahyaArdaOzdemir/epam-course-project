import { mapAuthError } from '../../src/features/auth/services/auth-error-mapper';

describe('mapAuthError', () => {
  it('returns fallback message for non-Error values', () => {
    expect(mapAuthError({ message: 'x' })).toBe('Request failed. Please try again.');
  });

  it('maps invalid credentials', () => {
    expect(mapAuthError(new Error('Invalid credentials'))).toBe('Email or password is incorrect.');
  });

  it('maps duplicate/conflict errors', () => {
    expect(mapAuthError(new Error('Already exists'))).toBe('An account with this email already exists.');
    expect(mapAuthError(new Error('CONFLICT'))).toBe('An account with this email already exists.');
  });

  it('maps password policy error', () => {
    expect(mapAuthError(new Error('Password must include uppercase')))
      .toBe('Password must include uppercase, lowercase, number, and special character.');
  });

  it('maps throttling error', () => {
    expect(mapAuthError(new Error('Too many attempts. Please try again later.')))
      .toBe('Too many attempts. Please wait and try again.');
  });

  it('maps invalid session/unauthorized errors', () => {
    expect(mapAuthError(new Error('Session is invalid'))).toBe('Your session has expired. Please login again.');
    expect(mapAuthError(new Error('Unauthorized'))).toBe('Your session has expired. Please login again.');
  });

  it('maps reset token invalid/expired errors', () => {
    expect(mapAuthError(new Error('Reset token is invalid'))).toBe('Reset link is invalid or expired. Request a new one.');
    expect(mapAuthError(new Error('Expired token'))).toBe('Reset link is invalid or expired. Request a new one.');
  });

  it('returns original message for unmapped errors', () => {
    expect(mapAuthError(new Error('custom backend error'))).toBe('custom backend error');
  });
});
