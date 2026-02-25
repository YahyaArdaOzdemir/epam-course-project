import { createRoot, Root } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { Alert } from '../../src/features/shared/Alert';

describe('Alert aria semantics', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  test('uses assertive alert semantics for error messages', () => {
    act(() => {
      root.render(<Alert severity="error" message="Something failed" />);
    });

    const node = container.querySelector('[role="alert"]');
    expect(node).not.toBeNull();
    expect(node?.getAttribute('aria-live')).toBe('assertive');
  });

  test('uses polite status semantics for success messages', () => {
    act(() => {
      root.render(<Alert severity="success" message="Saved" />);
    });

    const node = container.querySelector('[role="status"]');
    expect(node).not.toBeNull();
    expect(node?.getAttribute('aria-live')).toBe('polite');
  });
});
