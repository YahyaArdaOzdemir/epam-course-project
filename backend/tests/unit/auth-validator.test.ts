import {
  parseLoginPayload,
  parsePasswordResetConfirmPayload,
  parsePasswordResetRequestPayload,
  parseRegisterPayload,
} from '../../src/validators/auth-validator';

describe('auth validator', () => {
  it('parses and normalizes valid register payload', () => {
    const parsed = parseRegisterPayload({
      fullName: '  Alice Employee  ',
      email: 'ALICE@EPAM.COM',
      password: 'StrongPass123!',
      confirmPassword: 'StrongPass123!',
    });

    expect(parsed.fullName).toBe('Alice Employee');
    expect(parsed.email).toBe('alice@epam.com');
    expect(parsed.password).toBe('StrongPass123!');
  });

  it('rejects register payload when confirm password mismatches', () => {
    expect(() => {
      parseRegisterPayload({
        fullName: 'Alice Employee',
        email: 'alice@epam.com',
        password: 'StrongPass123!',
        confirmPassword: 'WrongPass123!',
      });
    }).toThrow('Password confirmation does not match');
  });

  it('parses and normalizes valid login payload', () => {
    const parsed = parseLoginPayload({
      email: 'USER@EPAM.COM',
      password: 'StrongPass123!',
    });

    expect(parsed.email).toBe('user@epam.com');
    expect(parsed.password).toBe('StrongPass123!');
  });

  it('parses password reset request and confirm payloads', () => {
    const request = parsePasswordResetRequestPayload({ email: 'reset@epam.com' });
    const confirm = parsePasswordResetConfirmPayload({ token: 'token-1', newPassword: 'StrongPass123!', confirmPassword: 'StrongPass123!' });

    expect(request.email).toBe('reset@epam.com');
    expect(confirm.token).toBe('token-1');
    expect(confirm.newPassword).toBe('StrongPass123!');
  });

  it('rejects password reset confirm when confirm password mismatches', () => {
    expect(() => {
      parsePasswordResetConfirmPayload({ token: 'token-1', newPassword: 'StrongPass123!', confirmPassword: 'WrongPass123!' });
    }).toThrow('Password confirmation does not match');
  });
});
