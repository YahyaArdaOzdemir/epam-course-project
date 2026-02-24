import { canViewIdea } from '../../src/services/idea-service';

describe('idea visibility rules', () => {
  const idea = { ownerUserId: 'owner-1', isShared: false };

  it('owner can view private idea', () => {
    expect(canViewIdea(idea, { userId: 'owner-1', role: 'submitter' })).toBe(true);
  });

  it('evaluator/admin can view private idea', () => {
    expect(canViewIdea(idea, { userId: 'other', role: 'evaluator_admin' })).toBe(true);
  });

  it('non-owner submitter cannot view private idea', () => {
    expect(canViewIdea(idea, { userId: 'other', role: 'submitter' })).toBe(false);
  });
});
