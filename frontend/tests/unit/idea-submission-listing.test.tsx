import { formatAttachmentSize, formatRelativeTime } from '../../src/features/ideas/utils/idea-display';

describe('idea submission listing utilities', () => {
	it('formats attachment size in KB and MB units', () => {
		expect(formatAttachmentSize(512)).toBe('1 KB');
		expect(formatAttachmentSize(2 * 1024 * 1024)).toBe('2.0 MB');
		expect(formatAttachmentSize(12 * 1024 * 1024)).toBe('12 MB');
	});

	it('formats relative time strings for recent timestamps', () => {
		const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
		const formatted = formatRelativeTime(tenMinutesAgo).toLowerCase();
		expect(formatted).toContain('minute');
	});
});
