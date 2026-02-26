import { getWaitTimeDays } from '../../src/features/ideas/utils/idea-display';

describe('auth flows support utilities', () => {
	it('calculates non-negative wait-time days for past and future timestamps', () => {
		const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
		const oneDayAhead = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

		expect(getWaitTimeDays(oneDayAgo)).toBeGreaterThanOrEqual(1);
		expect(getWaitTimeDays(oneDayAhead)).toBe(0);
	});
});
