jest.mock('../../src/services/api-client', () => ({
	apiClient: {
		patch: jest.fn(),
	},
}));

import { evaluationApi } from '../../src/features/evaluation/services/evaluation-service';
import { apiClient } from '../../src/services/api-client';

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('admin evaluation api', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('maps conflict errors to refresh/retry guidance', async () => {
		mockedApiClient.patch.mockRejectedValue(new Error('Conflict while updating status'));

		await expect(
			evaluationApi.updateStatus('idea-1', { toStatus: 'Under Review', rowVersion: 1 }, 'csrf-token'),
		).rejects.toThrow('This idea was updated by someone else. Refresh and retry.');
	});

	it('passes through non-conflict errors unchanged', async () => {
		mockedApiClient.patch.mockRejectedValue(new Error('Network down'));

		await expect(
			evaluationApi.updateStatus('idea-1', { toStatus: 'Under Review', rowVersion: 1 }, 'csrf-token'),
		).rejects.toThrow('Network down');
	});
});
