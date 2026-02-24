import { canSeeEvaluationComment } from '../../src/services/idea-service';

describe('evaluation comment visibility', () => {
  it('private idea hides comments from submitter', () => {
    expect(canSeeEvaluationComment({ isShared: false }, 'submitter')).toBe(false);
  });

  it('shared idea reveals comments to submitter', () => {
    expect(canSeeEvaluationComment({ isShared: true }, 'submitter')).toBe(true);
  });
});
