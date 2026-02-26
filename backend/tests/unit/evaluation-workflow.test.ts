jest.mock('../../src/repositories/idea-repository', () => ({
	ideaRepository: {
		findById: jest.fn(),
		updateStatus: jest.fn(),
	},
}));

jest.mock('../../src/repositories/status-history-repository', () => ({
	statusHistoryRepository: {
		addEntry: jest.fn(),
	},
}));

jest.mock('../../src/repositories/evaluation-repository', () => ({
	evaluationRepository: {
		create: jest.fn(),
	},
}));

import { ConflictError, ForbiddenError, ValidationError } from '../../src/lib/errors';
import { evaluationService } from '../../src/services/evaluation-service';
import { ideaRepository } from '../../src/repositories/idea-repository';
import { statusHistoryRepository } from '../../src/repositories/status-history-repository';
import { evaluationRepository } from '../../src/repositories/evaluation-repository';

const mockedIdeaRepository = ideaRepository as jest.Mocked<typeof ideaRepository>;
const mockedHistoryRepository = statusHistoryRepository as jest.Mocked<typeof statusHistoryRepository>;
const mockedEvaluationRepository = evaluationRepository as jest.Mocked<typeof evaluationRepository>;

describe('evaluation workflow service', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('rejects non-admin evaluator role', () => {
		expect(() => {
			evaluationService.updateIdeaStatus({
				ideaId: 'idea-1',
				evaluatorUserId: 'u-1',
				evaluatorRole: 'submitter',
				toStatus: 'Under Review',
				expectedRowVersion: 0,
			});
		}).toThrow(ForbiddenError);
	});

	it('rejects when idea does not exist', () => {
		mockedIdeaRepository.findById.mockReturnValue(null);

		expect(() => {
			evaluationService.updateIdeaStatus({
				ideaId: 'missing',
				evaluatorUserId: 'admin-1',
				evaluatorRole: 'admin',
				toStatus: 'Under Review',
				expectedRowVersion: 0,
			});
		}).toThrow(ValidationError);
	});

	it('allows status transition to Under Review for finalized idea reevaluation', () => {
		mockedIdeaRepository.findById.mockReturnValue({
			id: 'idea-1',
			ownerUserId: 'u-1',
			title: 'Idea',
			description: 'Desc',
			category: 'Other',
			status: 'Accepted',
			isShared: false,
			rowVersion: 0,
			latestEvaluationComment: null,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
		mockedIdeaRepository.updateStatus.mockReturnValue({
			id: 'idea-1',
			ownerUserId: 'u-1',
			title: 'Idea',
			description: 'Desc',
			category: 'Other',
			status: 'Under Review',
			isShared: false,
			rowVersion: 1,
			latestEvaluationComment: null,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});

		evaluationService.updateIdeaStatus({
			ideaId: 'idea-1',
			evaluatorUserId: 'admin-1',
			evaluatorRole: 'admin',
			toStatus: 'Under Review',
			expectedRowVersion: 0,
		});

		expect(mockedEvaluationRepository.create).not.toHaveBeenCalled();
	});

	it('allows reevaluation from Accepted to Rejected with comment', () => {
		mockedIdeaRepository.findById.mockReturnValue({
			id: 'idea-accept-1',
			ownerUserId: 'u-1',
			title: 'Accepted Idea',
			description: 'Desc',
			category: 'Other',
			status: 'Accepted',
			isShared: true,
			rowVersion: 2,
			latestEvaluationComment: 'Initially accepted',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});

		mockedIdeaRepository.updateStatus.mockReturnValue({
			id: 'idea-accept-1',
			ownerUserId: 'u-1',
			title: 'Accepted Idea',
			description: 'Desc',
			category: 'Other',
			status: 'Rejected',
			isShared: true,
			rowVersion: 3,
			latestEvaluationComment: 'Re-evaluated after review',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});

		evaluationService.updateIdeaStatus({
			ideaId: 'idea-accept-1',
			evaluatorUserId: 'admin-1',
			evaluatorRole: 'admin',
			toStatus: 'Rejected',
			comment: 'Re-evaluated after review',
			expectedRowVersion: 2,
		});

		expect(mockedEvaluationRepository.create).toHaveBeenCalledWith({
			ideaId: 'idea-accept-1',
			evaluatorUserId: 'admin-1',
			decision: 'Rejected',
			comment: 'Re-evaluated after review',
		});
	});

	it('requires comment for final decision', () => {
		mockedIdeaRepository.findById.mockReturnValue({
			id: 'idea-1',
			ownerUserId: 'u-1',
			title: 'Idea',
			description: 'Desc',
			category: 'Other',
			status: 'Under Review',
			isShared: false,
			rowVersion: 2,
			latestEvaluationComment: null,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});

		expect(() => {
			evaluationService.updateIdeaStatus({
				ideaId: 'idea-1',
				evaluatorUserId: 'admin-1',
				evaluatorRole: 'admin',
				toStatus: 'Accepted',
				comment: '   ',
				expectedRowVersion: 2,
			});
		}).toThrow(ValidationError);
	});

	it('throws conflict when row version is stale', () => {
		mockedIdeaRepository.findById.mockReturnValue({
			id: 'idea-1',
			ownerUserId: 'u-1',
			title: 'Idea',
			description: 'Desc',
			category: 'Other',
			status: 'Submitted',
			isShared: false,
			rowVersion: 1,
			latestEvaluationComment: null,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
		mockedIdeaRepository.updateStatus.mockReturnValue(null);

		expect(() => {
			evaluationService.updateIdeaStatus({
				ideaId: 'idea-1',
				evaluatorUserId: 'admin-1',
				evaluatorRole: 'admin',
				toStatus: 'Under Review',
				expectedRowVersion: 1,
			});
		}).toThrow(ConflictError);
	});

	it('adds status history and skips decision record for Under Review transition', () => {
		mockedIdeaRepository.findById.mockReturnValue({
			id: 'idea-1',
			ownerUserId: 'u-1',
			title: 'Idea',
			description: 'Desc',
			category: 'Other',
			status: 'Submitted',
			isShared: false,
			rowVersion: 3,
			latestEvaluationComment: null,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
		mockedIdeaRepository.updateStatus.mockReturnValue({
			id: 'idea-1',
			ownerUserId: 'u-1',
			title: 'Idea',
			description: 'Desc',
			category: 'Other',
			status: 'Under Review',
			isShared: false,
			rowVersion: 4,
			latestEvaluationComment: null,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});

		const updated = evaluationService.updateIdeaStatus({
			ideaId: 'idea-1',
			evaluatorUserId: 'admin-1',
			evaluatorRole: 'admin',
			toStatus: 'Under Review',
			expectedRowVersion: 3,
		});

		expect(updated.status).toBe('Under Review');
		expect(mockedHistoryRepository.addEntry).toHaveBeenCalled();
		expect(mockedEvaluationRepository.create).not.toHaveBeenCalled();
	});

	it('creates decision record for final accepted transition', () => {
		mockedIdeaRepository.findById.mockReturnValue({
			id: 'idea-1',
			ownerUserId: 'u-1',
			title: 'Idea',
			description: 'Desc',
			category: 'Other',
			status: 'Under Review',
			isShared: true,
			rowVersion: 5,
			latestEvaluationComment: null,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
		mockedIdeaRepository.updateStatus.mockReturnValue({
			id: 'idea-1',
			ownerUserId: 'u-1',
			title: 'Idea',
			description: 'Desc',
			category: 'Other',
			status: 'Accepted',
			isShared: true,
			rowVersion: 6,
			latestEvaluationComment: 'Great idea',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});

		evaluationService.updateIdeaStatus({
			ideaId: 'idea-1',
			evaluatorUserId: 'admin-1',
			evaluatorRole: 'admin',
			toStatus: 'Accepted',
			comment: 'Great idea',
			expectedRowVersion: 5,
		});

		expect(mockedEvaluationRepository.create).toHaveBeenCalledWith({
			ideaId: 'idea-1',
			evaluatorUserId: 'admin-1',
			decision: 'Accepted',
			comment: 'Great idea',
		});
	});

	it('allows direct Submitted to Rejected transition with required decision comment', () => {
		mockedIdeaRepository.findById.mockReturnValue({
			id: 'idea-2',
			ownerUserId: 'u-2',
			title: 'Idea 2',
			description: 'Desc 2',
			category: 'Other',
			status: 'Submitted',
			isShared: true,
			rowVersion: 1,
			latestEvaluationComment: null,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});

		mockedIdeaRepository.updateStatus.mockReturnValue({
			id: 'idea-2',
			ownerUserId: 'u-2',
			title: 'Idea 2',
			description: 'Desc 2',
			category: 'Other',
			status: 'Rejected',
			isShared: true,
			rowVersion: 2,
			latestEvaluationComment: 'Not feasible',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});

		evaluationService.updateIdeaStatus({
			ideaId: 'idea-2',
			evaluatorUserId: 'admin-1',
			evaluatorRole: 'admin',
			toStatus: 'Rejected',
			comment: 'Not feasible',
			expectedRowVersion: 1,
		});

		expect(mockedEvaluationRepository.create).toHaveBeenCalledWith({
			ideaId: 'idea-2',
			evaluatorUserId: 'admin-1',
			decision: 'Rejected',
			comment: 'Not feasible',
		});
	});
});
