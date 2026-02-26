import { act } from 'react-dom/test-utils';
import { createRoot, Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedLayout } from '../../src/features/layout/ProtectedLayout';
import { IdeaDetailsPage } from '../../src/features/ideas/pages/IdeaDetailsPage';
import { useAuth } from '../../src/features/auth/hooks/useAuth';
import { ideaApi } from '../../src/features/ideas/services/idea-service';

jest.mock('../../src/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

const useAuthMock = useAuth as jest.MockedFunction<typeof useAuth>;
let getByIdSpy: jest.SpiedFunction<typeof ideaApi.getById>;
let listCommentsSpy: jest.SpiedFunction<typeof ideaApi.listComments>;

describe('idea details UX regression', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    useAuthMock.mockReturnValue({
      session: {
        authenticated: true,
        userId: 'u-1',
        role: 'submitter',
        fullName: 'User',
        email: 'user@epam.com',
        expiresAt: new Date().toISOString(),
      },
      csrfToken: 'csrf',
      logout: jest.fn(),
      message: '',
      isLoading: false,
      register: jest.fn(),
      login: jest.fn(),
      refreshSession: jest.fn(),
      passwordResetRequest: jest.fn(),
      passwordResetConfirm: jest.fn(),
    });

    getByIdSpy = jest.spyOn(ideaApi, 'getById');
    listCommentsSpy = jest.spyOn(ideaApi, 'listComments');
    listCommentsSpy.mockResolvedValue({ items: [] });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    getByIdSpy?.mockRestore();
    listCommentsSpy?.mockRestore();
    jest.clearAllMocks();
  });

  it('marks only Submit Idea nav link active on /ideas/new route', async () => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/ideas/new']}>
          <Routes>
            <Route element={<ProtectedLayout />}>
              <Route path="/ideas/new" element={<div>Submit Page</div>} />
            </Route>
          </Routes>
        </MemoryRouter>,
      );
    });

    const submitLink = Array.from(container.querySelectorAll('a')).find((link) => link.textContent === 'Submit Idea');
    const myIdeasLink = Array.from(container.querySelectorAll('a')).find((link) => link.textContent === 'My Ideas');

    expect(submitLink?.className).toContain('font-semibold');
    expect(myIdeasLink?.className ?? '').not.toContain('font-semibold');
  });

  it('renders separate metadata + attachment preview/download controls', async () => {
    getByIdSpy.mockResolvedValue({
      id: 'idea-1',
      title: 'Pizza sundays?',
      description: 'Longer description body.',
      category: 'Other',
      status: 'Submitted',
      rowVersion: 0,
      ownerUserId: 'u-1',
      isShared: true,
      latestEvaluationComment: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attachment: {
        originalFileName: 'pitch.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1024,
        uploadedAt: new Date().toISOString(),
        url: '/uploads/pitch.pdf',
      },
    });

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/ideas/idea-1']}>
          <Routes>
            <Route path="/ideas/:ideaId" element={<IdeaDetailsPage />} />
          </Routes>
        </MemoryRouter>,
      );
    });

    expect(container.textContent).toContain('Category');
    expect(container.textContent ?? '').not.toContain('Description');

    const previewLink = container.querySelector('a[href="/uploads/pitch.pdf"][target="_blank"]') as HTMLAnchorElement | null;
    const downloadButton = container.querySelector('a[download="pitch.pdf"]') as HTMLAnchorElement | null;
    expect(previewLink).not.toBeNull();
    expect(downloadButton).not.toBeNull();
    expect(downloadButton?.textContent).toContain('⤓');
  });
});
