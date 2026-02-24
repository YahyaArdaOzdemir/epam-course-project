# Tasks: Production-Ready User Authentication (US1 Refinement)

**Input**: Design documents from `/specs/001-production-user-auth/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/openapi.yaml`, `quickstart.md`

**Tests**: Tests are MANDATORY. Write tests before implementation and verify they fail before writing production code.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested independently.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Align implementation artifacts and environment contracts before core auth work.

- [X] T001 [US1] Align auth API contract details with clarified session/csrf/reset decisions in specs/001-production-user-auth/contracts/openapi.yaml
- [X] T002 [US1] Add concrete auth environment configuration guidance in specs/001-production-user-auth/quickstart.md
- [X] T003 [US1] Add explicit story-to-requirement traceability notes for MVP scope in specs/001-production-user-auth/checklists/security.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure required before any user story implementation.

**⚠️ CRITICAL**: No user story work should start until this phase is complete.

- [X] T004 [US1] Add auth security schema migration for sessions/csrf/reset/throttle in backend/src/lib/migrations/002_auth_security.sql
- [X] T005 [US1] Wire new auth migration execution into backend/src/lib/migrate.ts
- [X] T006 [P] [US1] Extend session persistence operations for cookie sessions in backend/src/repositories/session-repository.ts
- [X] T007 [P] [US3] Add password reset token persistence in backend/src/repositories/password-reset-repository.ts
- [X] T008 [P] [US2] Add CSRF token persistence in backend/src/repositories/csrf-token-repository.ts
- [X] T009 [P] [US1] Add auth throttling persistence and counters in backend/src/repositories/auth-throttle-repository.ts
- [X] T010 [US1] Add cookie/JWT/CSRF shared token utilities in backend/src/lib/auth-tokens.ts
- [X] T011 [US2] Add cookie-based auth guard and CSRF middleware flow in backend/src/middleware/auth-guard.ts
- [X] T012 [US2] Add credentialed request + CSRF header support in frontend/src/services/api-client.ts
- [X] T013 [US1] Add auth session/csrf/reset/throttle contracts in frontend/src/services/contracts.ts
- [X] T014 [US1] Add shared auth error-to-alert mapping utility in frontend/src/features/auth/services/auth-error-mapper.ts

**Checkpoint**: Foundation complete — user stories can proceed independently.

---

## Phase 3: User Story 1 - Secure Registration and Login (Priority: P1) 🎯 MVP

**Goal**: Deliver secure register/login with bcrypt-backed credentials, cookie session issuance, `/dashboard` success redirect, and visible red auth errors.

**Independent Test**: Register a new account, log in successfully to `/dashboard`, then verify wrong-password and duplicate-email failures display visible red alerts.

### Tests for User Story 1 (MANDATORY)

- [X] T015 [P] [US1] Add password policy and hash/verify unit coverage in backend/tests/unit/auth-utils.test.ts
- [X] T016 [P] [US1] Add register/login integration coverage for duplicate email and cookie issuance in backend/tests/integration/auth-routes.test.ts
- [X] T017 [P] [US1] Add login/register red-alert rendering tests in frontend/tests/unit/auth-pages-alerts.test.tsx
- [X] T018 [US1] Add successful-login `/dashboard` redirect assertions in e2e/tests/us1-auth.spec.ts

### Implementation for User Story 1

- [X] T019 [US1] Implement normalized email and password policy validation rules in backend/src/validators/auth-validator.ts
- [X] T020 [US1] Implement bcrypt-backed register/login flows with throttle checks in backend/src/services/auth-service.ts
- [X] T021 [US1] Implement secure cookie session issue/clear behavior in backend/src/controllers/auth-controller.ts
- [X] T022 [US1] Update auth route handlers and response codes for login/register/logout in backend/src/routes/auth-routes.ts
- [X] T023 [US1] Update frontend auth service methods for cookie-session login/register/logout in frontend/src/features/auth/services/auth-service.ts
- [X] T024 [US1] Implement login success redirect and red error alerts in frontend/src/features/auth/pages/LoginPage.tsx
- [X] T025 [US1] Implement duplicate-email/password-policy red error alerts in frontend/src/features/auth/pages/RegisterPage.tsx
- [X] T026 [US1] Update session state management for cookie-backed auth context in frontend/src/features/auth/hooks/useAuth.ts
- [X] T027 [US1] Update exported auth API JSDoc in backend/src/services/auth-service.ts and frontend/src/features/auth/hooks/useAuth.ts

**Checkpoint**: User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - Guarded Access and Session Persistence (Priority: P2)

**Goal**: Enforce immediate protected-route redirects and reliable refresh-based session recovery with CSRF enforcement.

**Independent Test**: Access protected routes without valid session and verify immediate `/login` redirect; log in, refresh, and confirm authenticated state is recovered.

### Tests for User Story 2 (MANDATORY)

- [X] T028 [P] [US2] Add integration tests for `/auth/session` and `/auth/csrf` invalid/valid session handling in backend/tests/integration/auth-routes.test.ts
- [X] T029 [P] [US2] Add protected-route redirect behavior tests in frontend/tests/unit/protected-route.test.tsx
- [X] T030 [P] [US2] Add refresh session recovery tests for auth hook/app bootstrap in frontend/tests/unit/auth-session-recovery.test.tsx
- [X] T031 [US2] Add E2E checks for protected-route denial and refresh persistence in e2e/tests/us1-auth.spec.ts

### Implementation for User Story 2

- [X] T032 [US2] Implement `/auth/session` and `/auth/csrf` controller flows in backend/src/controllers/auth-controller.ts
- [X] T033 [US2] Enforce CSRF validation for state-changing authenticated endpoints in backend/src/routes/index.ts
- [X] T034 [US2] Implement centralized protected route component in frontend/src/features/auth/components/ProtectedRoute.tsx
- [X] T035 [US2] Apply protected routing and `/dashboard` access flow in frontend/src/App.tsx
- [X] T036 [US2] Replace page-local token reads with shared auth context in frontend/src/features/ideas/pages/IdeaSubmitPage.tsx and frontend/src/features/evaluation/pages/EvaluationQueuePage.tsx
- [X] T037 [US2] Ensure state-changing API calls include CSRF token header in frontend/src/services/api-client.ts
- [X] T038 [US2] Show visible red session-invalidated alert and force logout path in frontend/src/features/auth/hooks/useAuth.ts
- [X] T039 [US2] Update exported guard/protected-route JSDoc in backend/src/middleware/auth-guard.ts and frontend/src/features/auth/components/ProtectedRoute.tsx

**Checkpoint**: User Stories 1 and 2 are independently functional and testable.

---

## Phase 5: User Story 3 - Password Reset Recovery (Priority: P3)

**Goal**: Deliver one-time email-link password reset flow with token lifecycle guarantees, reset alerts, and throttling behavior.

**Independent Test**: Request reset, complete reset with valid token, confirm old password fails and new password succeeds, then verify reused/expired token failures show red alerts.

### Tests for User Story 3 (MANDATORY)

- [X] T040 [P] [US3] Add unit tests for reset token lifecycle/expiry/consumption logic in backend/tests/unit/auth-reset-token.test.ts
- [X] T041 [P] [US3] Add integration tests for reset request/confirm/reuse denial in backend/tests/integration/auth-routes.test.ts
- [X] T042 [P] [US3] Add frontend reset request/confirm red-alert tests in frontend/tests/unit/password-reset-pages.test.tsx
- [X] T043 [US3] Add E2E reset success + expired/reused token scenarios in e2e/tests/us1-auth.spec.ts

### Implementation for User Story 3

- [X] T044 [US3] Implement reset request/confirm validators in backend/src/validators/auth-validator.ts
- [X] T045 [US3] Implement reset token issuance/consumption/invalidation in backend/src/services/auth-service.ts
- [X] T046 [US3] Implement password reset request/confirm controller actions in backend/src/controllers/auth-controller.ts
- [X] T047 [US3] Register password reset endpoints in backend/src/routes/auth-routes.ts
- [X] T048 [US3] Add password reset API methods in frontend/src/features/auth/services/auth-service.ts
- [X] T049 [US3] Implement reset request UI with visible red alerts in frontend/src/features/auth/pages/PasswordResetRequestPage.tsx
- [X] T050 [US3] Implement reset confirm UI with token handling and red alerts in frontend/src/features/auth/pages/PasswordResetConfirmPage.tsx
- [X] T051 [US3] Wire password reset routes in frontend/src/App.tsx
- [X] T052 [US3] Update exported reset API JSDoc in backend/src/controllers/auth-controller.ts and frontend/src/features/auth/services/auth-service.ts

**Checkpoint**: All user stories are independently functional and testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final quality, conformance, and documentation hardening across stories.

- [X] T053 [P] [US1] Sync requirement traceability updates in specs/001-production-user-auth/checklists/security.md
- [X] T054 [US2] Validate and refresh end-to-end run instructions in specs/001-production-user-auth/quickstart.md
- [X] T055 [US1] Extend auth contract conformance assertions in backend/tests/integration/contracts-conformance.test.ts
- [X] T056 [P] [US1] Rebalance test pyramid checks for new auth suites in backend/tests/unit/pyramid-balance.test.ts and frontend/tests/unit/pyramid-balance.test.ts
- [X] T057 [US1] Validate changed-code coverage gate configuration in jest.config.ts
- [X] T058 [P] [US3] Sync final security implementation notes in specs/001-production-user-auth/research.md
- [X] T059 [US1] Add auth login latency benchmark assertions for SC-001 in backend/tests/integration/performance-benchmark.test.ts
- [X] T060 [US3] Add reset-flow completion-time UAT measurement checklist and script guidance in specs/001-production-user-auth/quickstart.md
- [X] T061 [US1] Add post-release support-ticket KPI collection plan for SC-006 in specs/001-production-user-auth/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies.
- **Phase 2 (Foundational)**: Depends on Phase 1; blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2 completion.
- **Phase 4 (US2)**: Depends on Phase 2 completion; can run independently of US1 after foundation.
- **Phase 5 (US3)**: Depends on Phase 2 completion; can run independently of US1/US2 after foundation.
- **Phase 6 (Polish)**: Depends on completion of selected user stories.

### User Story Dependencies

- **US1 (P1)**: No dependency on other stories; MVP candidate.
- **US2 (P2)**: No direct dependency on US1 business logic; uses shared auth foundation.
- **US3 (P3)**: No direct dependency on US2; uses shared auth foundation.

### Within Each User Story

- Tests first (must fail before implementation).
- Backend validation/domain logic before controller/route integration.
- Frontend service/hook updates before UI routing/pages.
- JSDoc updates before story sign-off.

---

## Parallel Execution Examples

### US1 Parallel Example

- Run T015 and T016 in parallel (unit + integration backend tests).
- Run T017 in parallel with backend tests (frontend alert tests).
- After T019-T022, run T023-T025 in parallel across frontend auth service/pages.

### US2 Parallel Example

- Run T028, T029, and T030 in parallel (integration + frontend unit test layers).
- Run T034 and T036 in parallel after T032-T033 backend session/csrf implementation.

### US3 Parallel Example

- Run T040, T041, and T042 in parallel (unit/integration/frontend tests).
- Run T049 and T050 in parallel after T048 reset API method implementation.

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 (US1).
3. Validate US1 independently via T015-T018 and acceptance scenario checks.
4. Demo/deploy MVP increment.

### Incremental Delivery

1. Foundation complete (Phases 1-2).
2. Deliver US1, validate, release.
3. Deliver US2, validate, release.
4. Deliver US3, validate, release.
5. Apply Phase 6 polish and final quality gates.

### Parallel Team Strategy

1. Team collaborates on Phases 1-2.
2. After Phase 2 completion:
   - Engineer A executes US1 tasks.
   - Engineer B executes US2 tasks.
   - Engineer C executes US3 tasks.
3. Integrate through shared conformance and polish tasks in Phase 6.
