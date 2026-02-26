import { isValidTransition } from '../../src/services/evaluation-service';

describe('evaluation status transitions', () => {
  it('allows Submitted -> Under Review', () => {
    expect(isValidTransition('Submitted', 'Under Review')).toBe(true);
  });

  it('allows Submitted -> Accepted/Rejected', () => {
    expect(isValidTransition('Submitted', 'Accepted')).toBe(true);
    expect(isValidTransition('Submitted', 'Rejected')).toBe(true);
  });

  it('allows Under Review -> Accepted/Rejected', () => {
    expect(isValidTransition('Under Review', 'Accepted')).toBe(true);
    expect(isValidTransition('Under Review', 'Rejected')).toBe(true);
  });

  it('allows reevaluation for finalized ideas to Accepted/Rejected', () => {
    expect(isValidTransition('Accepted', 'Accepted')).toBe(true);
    expect(isValidTransition('Accepted', 'Rejected')).toBe(true);
    expect(isValidTransition('Rejected', 'Accepted')).toBe(true);
    expect(isValidTransition('Rejected', 'Rejected')).toBe(true);
  });

  it('allows reevaluation for finalized ideas back to Under Review', () => {
    expect(isValidTransition('Accepted', 'Under Review')).toBe(true);
    expect(isValidTransition('Rejected', 'Under Review')).toBe(true);
  });

  it('rejects invalid transitions', () => {
    expect(isValidTransition('Under Review', 'Under Review')).toBe(false);
    expect(isValidTransition('Submitted', 'Submitted')).toBe(false);
  });
});
