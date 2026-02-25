# Quickstart: InnovatEPAM Portal (Consolidated)

## Prerequisites
- Node.js 20+
- npm 10+

## 1) Install dependencies
```bash
npm install
```

## 2) Configure environment

Backend required settings:
- `PORT`
- `DATABASE_PATH` (e.g., `./backend/data/app.db`)
- `UPLOAD_DIR` (e.g., `./backend/uploads`)
- `JWT_SECRET`
- `ALLOWED_EMAIL_DOMAINS` (comma-separated)
- `SESSION_COOKIE_NAME` (default `innovatepam_session`)
- `SESSION_TTL_HOURS` (`24`)
- `PASSWORD_RESET_TOKEN_TTL_MINUTES` (`30`)

Frontend required settings:
- `VITE_API_BASE_URL` (e.g., `http://localhost:3000/api`)

## 3) Initialize storage
```bash
mkdir -p backend/uploads backend/data
```

## 4) Run in development
```bash
npm run dev
```

Expected local endpoints:
- Backend API: `http://localhost:3000`
- Frontend UI: `http://localhost:5173`

## 5) TDD-first workflow
For each story, write tests first, run to confirm failure, then implement:
1. US1 secure auth/session/reset/throttling behavior.
2. US2 idea submission/list/share with attachment policy and server-side pagination/filter/sort.
3. US3 admin workflow, timeline visibility, and optimistic concurrency handling.
4. US4 dashboard/global-shell/error-feedback/a11y hardening.

## 6) Run test suites
```bash
npm run test:unit
npm run test:integration
npm run test:e2e
```

Optional targeted auth regression:
```bash
npx jest --selectProjects backend-integration --runTestsByPath backend/tests/integration/auth-routes.test.ts
npx playwright test e2e/tests/us1-auth.spec.ts
```

## 7) Validate core acceptance flows
1. Register with approved corporate email domain.
2. Login and verify redirect to `/dashboard`.
3. Refresh a protected page and verify session recovery.
4. Logout and verify protected routes require login.
5. Request and complete password reset; confirm old password fails/new password works.
6. Trigger login/reset throttling and verify visible user feedback.
7. Submit idea with optional attachment (PDF/DOCX/PPTX/PNG/JPG, <=10 MiB).
8. Confirm owner-default listing, pagination, filters (status/category/date), and sorting (date/status).
9. Confirm share toggle behavior and employee visibility rules for shared ideas.
10. Evaluate idea through `Submitted -> Under Review -> Accepted/Rejected` with required comment as admin.
11. Validate stale admin updates are rejected with refresh/retry guidance.
12. Open idea details as admin and verify timeline/history rows include status change, actor, and timestamp.
13. Validate protected shell header (product name, email, role badge, logout) and active-nav indicator.
14. Validate keyboard-only flow completion and focus-to-error-alert behavior on failed submissions.

## 8) Coverage and build gates
```bash
npm run test:coverage
npm run build
```

Pass criteria:
- Changed production code >=80% line coverage.
- Unit/Integration/E2E distribution aligned with 70/20/10 target.
- No strict TypeScript regressions.

## 9) Post-release KPI tracking
- Track auth-related support ticket trend for first 30 days.
- Track password reset completion timing in UAT sample runs.
- Track dashboard navigation success and alert clarity scores in usability review.