import { getStatusBadgeClassName, hasImageAttachmentPreview } from '../../src/features/ideas/utils/idea-display';

describe('protected shell dashboard utility contracts', () => {
	it('returns expected status badge classes', () => {
		expect(getStatusBadgeClassName('Submitted')).toContain('blue');
		expect(getStatusBadgeClassName('Accepted')).toContain('green');
		expect(getStatusBadgeClassName('Rejected')).toContain('red');
		expect(getStatusBadgeClassName('Under Review')).toContain('yellow');
	});

	it('detects image attachment preview eligibility', () => {
		expect(
			hasImageAttachmentPreview({
				id: 'idea-1',
				title: 'Idea',
				description: 'Desc',
				category: 'Other',
				status: 'Submitted',
				rowVersion: 0,
				ownerUserId: 'u-1',
				isShared: false,
				latestEvaluationComment: null,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				evaluationDecisions: [],
				attachment: {
					originalFileName: 'image.png',
					mimeType: 'image/png',
					sizeBytes: 1024,
					uploadedAt: new Date().toISOString(),
					url: '/uploads/image.png',
				},
			}),
		).toBe(true);

		expect(
			hasImageAttachmentPreview({
				id: 'idea-2',
				title: 'Idea',
				description: 'Desc',
				category: 'Other',
				status: 'Submitted',
				rowVersion: 0,
				ownerUserId: 'u-1',
				isShared: false,
				latestEvaluationComment: null,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				evaluationDecisions: [],
				attachment: null,
			}),
		).toBe(false);
	});
});
