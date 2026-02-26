jest.mock('../../src/repositories/idea-repository', () => ({
	ideaRepository: {
		create: jest.fn(),
		listVisible: jest.fn(),
		findById: jest.fn(),
		updateShare: jest.fn(),
	},
}));

jest.mock('../../src/repositories/attachment-repository', () => ({
	attachmentRepository: {
		create: jest.fn(),
		findByIdeaId: jest.fn(),
	},
}));

import { ConflictError, ForbiddenError, ValidationError } from '../../src/lib/errors';
import { ideaService } from '../../src/services/idea-service';
import { ideaRepository } from '../../src/repositories/idea-repository';
import { attachmentRepository } from '../../src/repositories/attachment-repository';

const mockedIdeaRepository = ideaRepository as jest.Mocked<typeof ideaRepository>;
const mockedAttachmentRepository = attachmentRepository as jest.Mocked<typeof attachmentRepository>;

describe('idea submission/listing policy', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('creates idea without attachment when no file provided', () => {
		mockedIdeaRepository.create.mockReturnValue({
			id: 'idea-1',
			ownerUserId: 'u-1',
			title: 'Idea',
			description: 'Desc',
			category: 'Other',
			status: 'Submitted',
			isShared: false,
			rowVersion: 0,
			latestEvaluationComment: null,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});

		const idea = ideaService.createIdea({
			ownerUserId: 'u-1',
			title: 'Idea',
			description: 'Desc',
			category: 'Other',
		});

		expect(idea.id).toBe('idea-1');
		expect(mockedAttachmentRepository.create).not.toHaveBeenCalled();
	});

	it('stores attachment metadata when file is provided', () => {
		mockedIdeaRepository.create.mockReturnValue({
			id: 'idea-2',
			ownerUserId: 'u-1',
			title: 'Idea',
			description: 'Desc',
			category: 'Other',
			status: 'Submitted',
			isShared: false,
			rowVersion: 0,
			latestEvaluationComment: null,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});

		ideaService.createIdea({
			ownerUserId: 'u-1',
			title: 'Idea',
			description: 'Desc',
			category: 'Other',
			file: {
				originalname: 'deck.pdf',
				filename: 'stored.pdf',
				mimetype: 'application/pdf',
				size: 1024,
				path: '/tmp/stored.pdf',
			} as Express.Multer.File,
		});

		expect(mockedAttachmentRepository.create).toHaveBeenCalledWith({
			ideaId: 'idea-2',
			originalFileName: 'deck.pdf',
			storedFileName: 'stored.pdf',
			mimeType: 'application/pdf',
			sizeBytes: 1024,
			storagePath: '/tmp/stored.pdf',
		});
	});

	it('throws validation error when idea details requested for unknown id', () => {
		mockedIdeaRepository.findById.mockReturnValue(null);
		expect(() => {
			ideaService.getIdeaById({
				ideaId: 'missing',
				viewerUserId: 'u-1',
				viewerRole: 'submitter',
			});
		}).toThrow(ValidationError);
	});

	it('throws forbidden error for non-owner submitter on idea details', () => {
		mockedIdeaRepository.findById.mockReturnValue({
			id: 'idea-3',
			ownerUserId: 'owner-1',
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

		expect(() => {
			ideaService.getIdeaById({
				ideaId: 'idea-3',
				viewerUserId: 'other-user',
				viewerRole: 'submitter',
			});
		}).toThrow(ForbiddenError);
	});

	it('returns idea details including attachment URL when attachment exists', () => {
		mockedIdeaRepository.findById.mockReturnValue({
			id: 'idea-4',
			ownerUserId: 'owner-1',
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
		mockedAttachmentRepository.findByIdeaId.mockReturnValue({
			id: 'att-1',
			ideaId: 'idea-4',
			originalFileName: 'deck.pdf',
			storedFileName: 'stored.pdf',
			mimeType: 'application/pdf',
			sizeBytes: 2048,
			storagePath: '/tmp/stored.pdf',
			uploadedAt: new Date().toISOString(),
		});

		const details = ideaService.getIdeaById({
			ideaId: 'idea-4',
			viewerUserId: 'owner-1',
			viewerRole: 'submitter',
		});

		expect(details.attachment?.url).toBe('/uploads/stored.pdf');
		expect(details.attachment?.sizeBytes).toBe(2048);
	});

	it('throws validation error when sharing unknown idea', () => {
		mockedIdeaRepository.findById.mockReturnValue(null);

		expect(() => {
			ideaService.toggleShare({
				ideaId: 'missing',
				ownerUserId: 'owner-1',
				isShared: true,
				expectedRowVersion: 0,
			});
		}).toThrow(ValidationError);
	});

	it('throws forbidden error when non-owner attempts to share', () => {
		mockedIdeaRepository.findById.mockReturnValue({
			id: 'idea-5',
			ownerUserId: 'owner-1',
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

		expect(() => {
			ideaService.toggleShare({
				ideaId: 'idea-5',
				ownerUserId: 'not-owner',
				isShared: true,
				expectedRowVersion: 1,
			});
		}).toThrow(ForbiddenError);
	});

	it('throws conflict error when share update is stale', () => {
		mockedIdeaRepository.findById.mockReturnValue({
			id: 'idea-6',
			ownerUserId: 'owner-1',
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
		mockedIdeaRepository.updateShare.mockReturnValue(null);

		expect(() => {
			ideaService.toggleShare({
				ideaId: 'idea-6',
				ownerUserId: 'owner-1',
				isShared: true,
				expectedRowVersion: 1,
			});
		}).toThrow(ConflictError);
	});
});
