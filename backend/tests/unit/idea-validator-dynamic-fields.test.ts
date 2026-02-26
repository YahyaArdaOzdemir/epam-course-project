import { parseCreateIdeaPayload } from '../../src/validators/idea-validator';
import { parseIdeaListQuery } from '../../src/validators/idea-query-validator';

describe('idea validator dynamic fields', () => {
  it('accepts new category options for create payload', () => {
    expect(() => {
      parseCreateIdeaPayload({
        title: 'Improve office ergonomics',
        description: 'Adjust desks and chairs by team needs',
        category: 'Workplace Wellness',
        isShared: true,
        dynamicFields: {
          targetDepartment: 'Engineering',
        },
      });
    }).not.toThrow();

    expect(() => {
      parseCreateIdeaPayload({
        title: 'Replace legacy tools',
        description: 'Move to managed endpoint tooling',
        category: 'Technology/IT',
        dynamicFields: {
          proposedSoftwareHardware: 'MDM suite',
        },
      });
    }).not.toThrow();
  });

  it('accepts category-specific dynamic fields and rejects mismatched combinations', () => {
    expect(() => {
      parseCreateIdeaPayload({
        title: 'Streamline release gate',
        description: 'Automate approvals',
        category: 'Process Improvement',
        dynamicFields: {
          currentPainPoints: 'Manual gatekeeping',
        },
      });
    }).not.toThrow();

    expect(() => {
      parseCreateIdeaPayload({
        title: 'Trim infrastructure bills',
        description: 'Power scheduling for non-prod',
        category: 'Cost Saving',
        dynamicFields: {
          estimatedAnnualSavings: 35000,
        },
      });
    }).not.toThrow();

    expect(() => {
      parseCreateIdeaPayload({
        title: 'Invalid pairing',
        description: 'Wrong field for category',
        category: 'Cost Saving',
        dynamicFields: {
          currentPainPoints: 'This should not pass',
        },
      });
    }).toThrow();
  });

  it('accepts new categories in list query filter', () => {
    const query = parseIdeaListQuery({ category: 'Technology/IT' });
    expect(query.category).toBe('Technology/IT');
  });
});