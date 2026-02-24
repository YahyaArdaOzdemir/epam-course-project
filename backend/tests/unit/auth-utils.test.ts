import { hashToken, signAuthToken, verifyAuthToken } from '../../src/lib/auth-tokens';
import { hashPassword, verifyPassword } from '../../src/lib/passwords';

describe('auth utilities', () => {
  it('hashes and verifies password', async () => {
    const password = 'StrongPass123!';
    const digest = await hashPassword(password);
    await expect(verifyPassword(password, digest)).resolves.toBe(true);
    await expect(verifyPassword('wrong', digest)).resolves.toBe(false);
  });

  it('signs and verifies auth token', () => {
    const signed = signAuthToken({ userId: 'u1', role: 'submitter' });
    const payload = verifyAuthToken(signed.token);
    expect(payload.userId).toBe('u1');
    expect(payload.role).toBe('submitter');
    expect(payload.jti).toBeTruthy();
  });

  it('hashes token deterministically', () => {
    expect(hashToken('abc')).toBe(hashToken('abc'));
    expect(hashToken('abc')).not.toBe(hashToken('abcd'));
  });
});
