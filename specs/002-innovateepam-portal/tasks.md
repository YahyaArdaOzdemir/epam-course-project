# Tasks: InnovatEPAM Portal (Consolidated Baseline)

**Input**: Design documents from `/specs/002-innovateepam-portal/`  
**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/openapi.yaml`, `quickstart.md`

**Tests**: Tests are MANDATORY. Write tests before implementation and verify they fail before writing production code.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested independently.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Ensure build/test/tooling baseline for this feature is aligned and reproducible.

- [X] T001 [US1-US4] Align feature test commands and coverage gate in package.json
- [X] T002 [US1-US4] Configure backend environment variable templates in backend/.env.example
- [X] T003 [P] [US1-US4] Add shared backend domain constants in backend/src/lib/domain-constants.ts
- [X] T004 [P] [US1-US4] Add shared frontend domain types in frontend/src/features/shared/domain-types.ts
- [X] T005 [US1-US4] Add API contract validation script wiring (`npm run lint:openapi`) in package.json for specs/002-innovateepam-portal/contracts/openapi.yaml with non-zero exit on schema or reference errors

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data + framework prerequisites that block all user stories.

**⚠️ CRITICAL**: No user story implementation starts before this phase is complete.

- [X] T006 [US1-US4] Add/refresh baseline migrations for auth and ideas in backend/src/lib/migrations/20260225_core_baseline.ts
- [X] T007 [P] [US1-US4] Implement central auth/session guard utilities in backend/src/middleware/auth-guard.ts
- [X] T008 [P] [US1-US4] Implement shared API error mapping in backend/src/middleware/error-handler.ts
- [X] T009 [US1-US4] Implement CSRF middleware baseline in backend/src/middleware/csrf-guard.ts
- [X] T010 [P] [US1-US4] Implement request validation helpers in backend/src/validators/common.ts
- [X] T011 [US1-US4] Define backend repository contracts for core entities in backend/src/repositories/index.ts
- [X] T012 [US1-US4] Record failing-proof checklist scaffolding in specs/002-innovateepam-portal/checklists/requirements.md

**Checkpoint**: Foundation complete — user stories can proceed.

---

## Phase 3: User Story 1 - Production-Ready Access and Account Recovery (Priority: P1) 🎯 MVP

**Goal**: Secure registration/login/logout/session recovery/password reset with throttling and role-safe authorization.

**Acceptance References**: US1 scenarios 1-7, FR-001..FR-021, FR-046

**Independent Test**: Register with full name + confirm password, login/logout, refresh session recovery, run reset flow with confirm password, validate throttling and admin-only denial for submitter.

### Tests for User Story 1 (MANDATORY) ✅

- [X] T013 [P] [US1] Add auth utility unit tests in backend/tests/unit/auth-utils.test.ts
- [X] T014 [P] [US1] Add auth route integration tests in backend/tests/integration/auth-routes.test.ts
- [X] T015 [P] [US1] Add auth UI unit tests in frontend/tests/unit/auth-flows.test.tsx
- [X] T016 [US1] Capture failing test evidence for US1 in specs/002-innovateepam-portal/checklists/us1-test-proof.md
- [X] T064 [P] [US1] Add integration tests for active-human-account gating (exclude suspended/service/external) in backend/tests/integration/auth-account-policy.test.ts

### Implementation for User Story 1

- [X] T017 [P] [US1] Implement register/login/reset validators in backend/src/validators/auth-validator.ts
- [X] T018 [US1] Implement auth service with fullName and confirm-password rules in backend/src/services/auth-service.ts
- [X] T019 [US1] Implement reset token lifecycle and throttling logic in backend/src/services/password-reset-service.ts
- [X] T020 [US1] Implement auth controller/route behavior in backend/src/controllers/auth-controller.ts
- [X] T021 [US1] Implement session + csrf endpoints in backend/src/routes/auth-routes.ts
- [X] T022 [US1] Implement frontend auth screens and error/success feedback in frontend/src/features/auth/AuthPage.tsx
- [X] T023 [US1] Implement protected-route session restoration in frontend/src/features/auth/ProtectedRoute.tsx
- [X] T024 [US1] Add/Update JSDoc for exported US1 APIs in backend/src/controllers/auth-controller.ts
- [X] T065 [US1] Enforce active-human-account policy in auth/session middleware in backend/src/middleware/auth-guard.ts

**Checkpoint**: US1 is independently functional and testable.

---

## Phase 4: User Story 2 - Submit and View Ideas (Priority: P2)

**Goal**: Submit ideas with category enum and optional single attachment; support owner list with server-side pagination, filters, and sorting.

**Acceptance References**: US2 scenarios 1-7, FR-022..FR-031, FR-045, FR-047, FR-054..FR-056

**Independent Test**: Submit idea with valid/invalid attachment/category, verify owner list visibility, pagination, filter by status/category/date, and sorting by date/status.

### Tests for User Story 2 (MANDATORY) ✅

- [X] T025 [P] [US2] Add submission policy unit tests in backend/tests/unit/idea-submission-policy.test.ts
- [X] T026 [P] [US2] Add idea query integration tests in backend/tests/integration/idea-list-query.test.ts
- [X] T027 [P] [US2] Add submit/list UI unit tests in frontend/tests/unit/idea-submission-listing.test.tsx
- [X] T028 [US2] Capture failing test evidence for US2 in specs/002-innovateepam-portal/checklists/us2-test-proof.md
- [X] T066 [P] [US2] Add integration tests for owner-only access denial and metadata preservation in backend/tests/integration/idea-access-metadata.test.ts
- [X] T072 [P] [US2] Add unit tests for category dropdown enum enforcement and standardized red error alert behavior in frontend/tests/unit/idea-submit-page-refactor.test.tsx

### Implementation for User Story 2

- [X] T029 [P] [US2] Implement idea + attachment repository operations in backend/src/repositories/idea-repository.ts
- [X] T030 [US2] Implement idea list query parsing and validation in backend/src/validators/idea-query-validator.ts
- [X] T031 [US2] Implement idea service for create/list/share with pagination/filter/sort in backend/src/services/idea-service.ts
- [X] T032 [US2] Implement create/list/share endpoints in backend/src/controllers/idea-controller.ts
- [X] T033 [US2] Implement idea routes with query params in backend/src/routes/idea-routes.ts
- [X] T034 [US2] Implement submit form with category dropdown in frontend/src/features/ideas/IdeaSubmissionForm.tsx
- [X] T035 [US2] Implement paginated list UI with filter/sort controls in frontend/src/features/ideas/IdeaListPage.tsx
- [X] T036 [US2] Add/Update JSDoc for exported US2 APIs in backend/src/services/idea-service.ts
- [X] T067 [US2] Enforce owner-only listing/detail authorization and metadata persistence checks in backend/src/services/idea-service.ts
- [X] T073 [US2] Refactor idea submission category input to strict enum dropdown values (`Process Improvement`, `Product Feature`, `Cost Saving`, `Other`) in frontend/src/features/ideas/pages/IdeaSubmitPage.tsx
- [X] T074 [US2] Apply professional card styling and standardized Alert-component validation feedback to submission form in frontend/src/features/ideas/pages/IdeaSubmitPage.tsx and frontend/src/features/shared/Alert.tsx

**Checkpoint**: US2 is independently functional and testable.

---

## Phase 5: User Story 3 - Evaluate and Decide Ideas (Priority: P3)

**Goal**: Admin workflow for status transitions, decision comments, optimistic concurrency conflict handling, and timeline/history visibility.

**Acceptance References**: US3 scenarios 1-6, FR-032..FR-037, FR-057..FR-058

**Independent Test**: As admin, move idea through review/final status with comments; verify stale-write conflict handling; verify idea details timeline rows (status, actor, timestamp).

### Tests for User Story 3 (MANDATORY) ✅

- [X] T037 [P] [US3] Add evaluation domain unit tests in backend/tests/unit/evaluation-workflow.test.ts
- [X] T038 [P] [US3] Add status/timeline integration tests in backend/tests/integration/idea-evaluation.test.ts
- [X] T039 [P] [US3] Add admin evaluation UI unit tests in frontend/tests/unit/admin-evaluation.test.tsx
- [X] T040 [US3] Capture failing test evidence for US3 in specs/002-innovateepam-portal/checklists/us3-test-proof.md

### Implementation for User Story 3

- [X] T041 [P] [US3] Implement status-history repository and timeline reads in backend/src/repositories/status-history-repository.ts
- [X] T042 [US3] Implement admin evaluation service with optimistic concurrency in backend/src/services/evaluation-service.ts
- [X] T043 [US3] Implement status update endpoint logic in backend/src/controllers/evaluation-controller.ts
- [X] T044 [US3] Implement idea details timeline endpoint in backend/src/routes/idea-routes.ts
- [X] T045 [US3] Implement admin evaluation queue/detail UI in frontend/src/features/evaluation/AdminEvaluationPage.tsx
- [X] T046 [US3] Implement timeline/history panel UI in frontend/src/features/evaluation/IdeaTimelinePanel.tsx
- [X] T047 [US3] Add/Update JSDoc for exported US3 APIs in backend/src/services/evaluation-service.ts

**Checkpoint**: US3 is independently functional and testable.

---

## Phase 6: User Story 4 - Post-Login Workspace and Global UX Feedback (Priority: P2)

**Goal**: Shared protected shell, role-aware dashboard, standardized alerts, loading safety, and accessibility behaviors.

**Acceptance References**: US4 scenarios 1-15, FR-038..FR-042, FR-048..FR-053, FR-059..FR-062

**Independent Test**: Verify shell/header/nav across protected pages, role-specific dashboard widgets, red/green alert behavior, duplicate-submit prevention, keyboard operation, ARIA semantics, and focus-to-error alert.

### Tests for User Story 4 (MANDATORY) ✅

- [X] T048 [P] [US4] Add shell/dashboard unit tests in frontend/tests/unit/protected-shell-dashboard.test.tsx
- [X] T049 [P] [US4] Add alert/loading/a11y unit tests in frontend/tests/unit/ux-safety-a11y.test.tsx
- [X] T050 [P] [US4] Add end-to-end shell/ux regression in e2e/tests/us4-shell-ux.spec.ts
- [X] T051 [US4] Capture failing test evidence for US4 in specs/002-innovateepam-portal/checklists/us4-test-proof.md
- [X] T068 [P] [US4] Add unit tests for ARIA announcement behavior (assertive error, polite success) in frontend/tests/unit/alert-aria-announcement.test.tsx

### Implementation for User Story 4

- [X] T052 [P] [US4] Implement shared protected layout with active nav in frontend/src/features/layout/ProtectedLayout.tsx
- [X] T053 [US4] Implement role-aware dashboard widgets in frontend/src/features/dashboard/DashboardPage.tsx
- [X] T054 [US4] Implement standardized alert component with severity semantics in frontend/src/features/shared/Alert.tsx
- [X] T055 [US4] Implement form loading/disable/re-enable behavior in frontend/src/features/shared/useSubmissionGuard.ts
- [X] T056 [US4] Implement focus-to-error-alert helper in frontend/src/features/shared/focus-error-alert.ts
- [X] T057 [US4] Apply ARIA labels/roles to auth forms in frontend/src/features/auth/AuthPage.tsx
- [X] T069 [US4] Apply ARIA labels/roles to idea submission/listing forms in frontend/src/features/ideas/IdeaSubmissionForm.tsx
- [X] T070 [US4] Apply ARIA labels/roles to evaluation forms in frontend/src/features/evaluation/AdminEvaluationPage.tsx
- [X] T058 [US4] Add/Update JSDoc for exported US4 APIs in frontend/src/features/layout/ProtectedLayout.tsx
- [X] T071 [US4] Implement alert live-region behavior (`role="alert"` assertive errors, `role="status"` polite success) in frontend/src/features/shared/Alert.tsx

**Checkpoint**: US4 is independently functional and testable.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening, conformance, and release evidence.

- [X] T059 [P] [US1-US4] Validate OpenAPI conformance updates in specs/002-innovateepam-portal/contracts/openapi.yaml
- [X] T060 [US1-US4] Run quickstart acceptance validation and record results in specs/002-innovateepam-portal/checklists/quickstart-validation.md
- [X] T061 [P] [US1-US4] Verify coverage/report gates and update evidence in specs/002-innovateepam-portal/checklists/coverage-report.md
- [X] T062 [US1-US4] Verify test-distribution balance and record in specs/002-innovateepam-portal/checklists/release-readiness.md
- [X] T063 [US1-US4] Refresh ADR/spec traceability notes in docs/adr/README.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: starts immediately.
- **Phase 2 (Foundational)**: depends on Phase 1 and blocks all user stories.
- **Phases 3-6 (User Stories)**: all depend on Phase 2 completion.
- **Phase 7 (Polish)**: depends on completion of desired user stories.

### User Story Dependencies

- **US1 (P1)**: no dependency on other user stories; first MVP slice.
- **US2 (P2)**: depends on US1 auth/session baseline.
- **US3 (P3)**: depends on US1 auth baseline and US2 idea entities/routes.
- **US4 (P2)**: depends on US1 for protected shell; integrates with US2/US3 pages.

### Completion Order Graph

`US1 -> US2 -> US3 -> US4`

---

## Parallel Execution Examples

### US1

- T013 and T014 can run in parallel (unit + integration tests).
- T017 and T018 can run in parallel (validators + service scaffold).

### US2

- T025 and T026 can run in parallel (policy + query integration tests).
- T029 and T030 can run in parallel (repository + query validator).

### US3

- T037 and T038 can run in parallel (unit + integration tests).
- T041 and T042 can run in parallel after failing tests are captured.

### US4

- T048 and T049 can run in parallel (shell/dashboard + ux/a11y tests).
- T052 and T054 can run in parallel (layout + shared alerts).

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete US1 (Phase 3).
3. Validate US1 independently (tests + quick manual flow).
4. Demo/release MVP authentication baseline.

### Incremental Delivery

1. Ship US1.
2. Add US2 and validate independently.
3. Add US3 and validate independently.
4. Add US4 and validate independently.
5. Run Phase 7 polish before release cut.

### Team Parallelization

1. Team completes Phases 1-2 together.
2. Then split by story ownership:
	- Dev A: US1/US2 backend threads
	- Dev B: US2/US4 frontend threads
	- Dev C: US3 evaluation and timeline threads

---

## Notes

- `[P]` tasks indicate independent files and no blocking dependency.
- Every story phase includes tests first, then implementation.
- Do not mock business logic; mock/fake only external I/O boundaries.
- Keep task evidence up to date in `specs/002-innovateepam-portal/checklists/`.
- Shared tasks tagged `[US1-US4]` explicitly trace to all story scopes per constitution traceability requirements.