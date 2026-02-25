import { canSeeEvaluationComment } from '../../src/services/idea-service';

describe('comment visibility policy', () => {
  it('shows comments for shared ideas', () => {
    expect(canSeeEvaluationComment({ isShared: true }, 'submitter')).toBe(true);
  });

  it('hides comments for private ideas from submitter', () => {
    expect(canSeeEvaluationComment({ isShared: false }, 'submitter')).toBe(false);
  });

  it('shows comments for evaluator/admin regardless of share', () => {
    expect(canSeeEvaluationComment({ isShared: false }, 'admin')).toBe(true);
  });
});
