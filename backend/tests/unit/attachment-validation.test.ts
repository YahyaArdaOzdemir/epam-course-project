import { ALLOWED_MIME_TYPES, MAX_UPLOAD_BYTES } from '../../src/lib/upload-policy';

describe('attachment validation policy', () => {
  it('supports approved mime types', () => {
    expect(ALLOWED_MIME_TYPES.has('application/pdf')).toBe(true);
    expect(ALLOWED_MIME_TYPES.has('text/plain')).toBe(false);
  });

  it('enforces 10 MiB limit', () => {
    expect(MAX_UPLOAD_BYTES).toBe(10 * 1024 * 1024);
  });
});
