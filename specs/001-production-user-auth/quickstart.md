# Quickstart: Production-Ready User Authentication (US1 Refinement)

## Prerequisites
- Node.js 20+
- npm 10+
- Existing monorepo dependencies installed

## 1) Install dependencies
```bash
npm install
```

## 2) Configure environment
Backend required settings:
- `JWT_SECRET` (strong random secret)
- `ALLOWED_EMAIL_DOMAINS` (comma-separated allowed domains)
- `DATABASE_PATH` (SQLite file path)
- `SESSION_COOKIE_NAME` (default `innovatepam_session`)
- `SESSION_TTL_HOURS` (`24`)
- `PASSWORD_RESET_TOKEN_TTL_MINUTES` (`30`)

Recommended backend `.env` example for local development:
```bash
JWT_SECRET=replace-with-64-char-random-secret
ALLOWED_EMAIL_DOMAINS=epam.com,example.com
DATABASE_PATH=./backend/data/app.db
SESSION_COOKIE_NAME=innovatepam_session
SESSION_TTL_HOURS=24
PASSWORD_RESET_TOKEN_TTL_MINUTES=30
```

Environment guidance:
- Use a high-entropy `JWT_SECRET` and never commit it to source control.
- Keep `SESSION_TTL_HOURS=24` unless the spec is explicitly revised.
- In production, require HTTPS so `Secure` cookie policy remains enforced.
- Keep `ALLOWED_EMAIL_DOMAINS` synchronized with approved business domains.

Frontend required settings:
- `VITE_API_BASE_URL` (e.g., `http://localhost:3000/api`)

Recommended frontend `.env` example:
```bash
VITE_API_BASE_URL=http://localhost:3000/api
```

## 3) Start development servers
```bash
npm run dev
```

Expected local endpoints:
- Backend API: `http://localhost:3000`
- Frontend UI: `http://localhost:5173`

## 4) TDD-first implementation order
For each auth slice, write tests first, run them to observe failure, then implement:
1. Registration with bcrypt hash storage and duplicate email handling.
2. Login with cookie issuance, `/dashboard` redirect contract, and visible red alerts.
3. Protected route redirects to `/login` for invalid/missing session.
4. Session recovery on refresh via `/auth/session`.
5. CSRF token issuance and validation on state-changing authenticated requests.
6. Password reset request/confirm with one-time token lifecycle.
7. Throttling for login/reset failures (5 per 15 min per account + IP).

## 5) Run targeted test suites
```bash
npm run test:unit
npm run test:integration
npm run test:e2e
```

Auth-focused regression slice:
```bash
npx jest --selectProjects backend-integration --runTestsByPath backend/tests/integration/auth-routes.test.ts
npx jest --selectProjects frontend-unit --runTestsByPath frontend/tests/unit/auth-pages-alerts.test.tsx frontend/tests/unit/protected-route.test.tsx frontend/tests/unit/auth-session-recovery.test.tsx
npx playwright test e2e/tests/us1-auth.spec.ts
```

## 6) Validate critical acceptance flows manually
1. Register with compliant password; verify success.
2. Attempt duplicate registration; verify red alert.
3. Login with valid credentials; verify redirect to `/dashboard`.
4. Login with invalid credentials; verify red alert.
5. Refresh protected route; verify session persists.
6. Expire/invalidate session; verify immediate redirect to `/login`.
7. Request and complete password reset; verify old password rejected/new password accepted.
8. Exceed login/reset failure threshold; verify throttling alert and timed recovery.

## 7) Coverage and build gates
```bash
npm run test:coverage
npm run build
```

Pass criteria:
- Changed production code remains >=80% line coverage.
- Unit/integration/E2E distribution remains aligned with 70/20/10 target.
- No strict TypeScript regressions in backend or frontend builds.

## 8) Session refresh validation procedure (E2E)
1. Navigate directly to `/dashboard` while signed out and verify immediate redirect to `/login`.
2. Sign in with a valid account and verify browser route changes to `/dashboard`.
3. Refresh browser tab and verify user remains on `/dashboard` with active session content.
4. Trigger logout and verify subsequent `/dashboard` access redirects to `/login`.

## 9) Password reset UAT timing checklist (SC-004 support)
Track full completion time for at least 10 UAT runs and store results in test evidence:
- Start timestamp: user clicks “Send reset link”.
- End timestamp: successful login with the new password after reset confirmation.
- Capture outliers with notes (network delay, test account issues, token retries).
- Compute median and 95th percentile completion time.

Script-style guidance for test log collection:
```bash
# Example CSV header for UAT timing records
echo "run_id,start_iso,end_iso,duration_seconds,notes" > test-results/reset-uat-timing.csv
```

## 10) Post-release auth support KPI collection plan (SC-006)
For the first 30 days after release, collect support data for auth flows:
- KPI target: support tickets for login/reset/session issues decrease by at least 50% versus the prior 30-day baseline.
- Tag taxonomy: `auth-login`, `auth-session`, `auth-reset`, `auth-throttle`.
- Weekly review cadence: aggregate total count, category split, and top 3 root causes.
- Exit criteria: KPI trend confirmed and no unresolved Sev-1/Sev-2 auth incidents.
