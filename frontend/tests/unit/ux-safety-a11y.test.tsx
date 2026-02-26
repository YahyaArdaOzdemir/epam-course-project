import { focusErrorAlert } from '../../src/features/shared/focus-error-alert';

describe('ux safety and a11y helpers', () => {
	it('focuses the target error alert and sets tabindex for keyboard access', () => {
		const element = document.createElement('div');
		element.id = 'error-alert';
		document.body.appendChild(element);

		focusErrorAlert('error-alert');

		expect(element.getAttribute('tabindex')).toBe('-1');
		expect(document.activeElement).toBe(element);

		document.body.removeChild(element);
	});

	it('is a no-op for missing target element', () => {
		expect(() => focusErrorAlert('missing-alert')).not.toThrow();
	});
});
