import { isValidTransition } from '../../src/services/evaluation-service';

describe('evaluation status transitions', () => {
  it('allows Submitted -> Under Review', () => {
    expect(isValidTransition('Submitted', 'Under Review')).toBe(true);
  });

  it('allows Under Review -> Accepted/Rejected', () => {
    expect(isValidTransition('Under Review', 'Accepted')).toBe(true);
    expect(isValidTransition('Under Review', 'Rejected')).toBe(true);
  });

  it('rejects invalid transitions', () => {
    expect(isValidTransition('Submitted', 'Accepted')).toBe(false);
    expect(isValidTransition('Accepted', 'Rejected')).toBe(false);
  });
});
