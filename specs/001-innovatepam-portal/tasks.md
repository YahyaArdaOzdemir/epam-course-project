# Tasks: InnovatEPAM Portal

**Input**: Design documents from `/specs/001-innovatepam-portal/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Tests are mandatory. Write tests before implementation and verify they fail before writing production code.

**Organization**: Tasks are grouped by user story to enable independent implementation and independent validation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (`US1`, `US2`, `US3`)
- Every task includes an exact file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize monorepo, tooling, strict TypeScript, and baseline test infrastructure.

- [ ] T001 Initialize root workspace scripts and workspaces in package.json
- [ ] T002 Create backend package configuration in backend/package.json
- [ ] T003 Create frontend package configuration in frontend/package.json
- [ ] T004 [P] Configure strict TypeScript for backend in backend/tsconfig.json
- [ ] T005 [P] Configure strict TypeScript for frontend in frontend/tsconfig.json
- [ ] T006 [P] Configure Jest projects and coverage thresholds in jest.config.ts
- [ ] T007 [P] Configure Playwright E2E project in playwright.config.ts
- [ ] T008 [P] Configure Tailwind and PostCSS in frontend/tailwind.config.ts and frontend/postcss.config.js

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build shared architecture, persistence, auth/session plumbing, and common validation/error handling.

**⚠️ CRITICAL**: No user story implementation starts until this phase is complete.

- [ ] T009 Create Express app bootstrap and middleware wiring in backend/src/app.ts
- [ ] T010 [P] Create SQLite connection and migration runner in backend/src/lib/db.ts and backend/src/lib/migrate.ts
- [ ] T011 [P] Create base schema migrations for User/Session/Idea/Attachment/EvaluationDecision/StatusHistoryEntry in backend/src/lib/migrations/001_init.sql
- [ ] T012 [P] Implement shared error types and error middleware in backend/src/lib/errors.ts and backend/src/middleware/error-handler.ts
- [ ] T013 [P] Implement auth token utilities and password hashing utilities in backend/src/lib/auth-tokens.ts and backend/src/lib/passwords.ts
- [ ] T014 [P] Implement role/auth guards middleware in backend/src/middleware/auth-guard.ts
- [ ] T015 [P] Implement global request validation helpers (Zod) in backend/src/validators/common.ts
- [ ] T016 [P] Configure multer upload storage and file policy guard in backend/src/lib/upload-policy.ts
- [ ] T017 [P] Create API router composition in backend/src/routes/index.ts
- [ ] T018 Define shared API client and typed DTO contracts for frontend in frontend/src/services/api-client.ts and frontend/src/services/contracts.ts

**Checkpoint**: Foundation complete; user stories can now proceed.

---

## Phase 3: User Story 1 - Access and Role-Safe Sign-In (Priority: P1) 🎯 MVP

**Goal**: Employees can register/login/logout with corporate-domain restrictions and role-safe access boundaries.

**Independent Test**: Register with corporate domain, login/logout, verify submitter cannot access evaluator/admin endpoints.

### Tests for User Story 1 (MANDATORY)

- [ ] T019 [P] [US1] Add unit tests for auth domain/password/token utilities in backend/tests/unit/auth-utils.test.ts
- [ ] T020 [P] [US1] Add integration tests for register/login/logout and role denial in backend/tests/integration/auth-routes.test.ts
- [ ] T021 [US1] Add E2E auth journey test (register-login-logout + role restriction) in e2e/tests/us1-auth.spec.ts
- [ ] T022 [US1] Record failing-first evidence for US1 test set in specs/001-innovatepam-portal/checklists/us1-test-proof.md

### Implementation for User Story 1

- [ ] T023 [P] [US1] Implement User and Session repositories in backend/src/repositories/user-repository.ts and backend/src/repositories/session-repository.ts
- [ ] T024 [US1] Implement authentication service in backend/src/services/auth-service.ts
- [ ] T025 [US1] Implement auth validators for register/login in backend/src/validators/auth-validator.ts
- [ ] T026 [US1] Implement auth controller endpoints in backend/src/controllers/auth-controller.ts
- [ ] T027 [US1] Register auth routes in backend/src/routes/auth-routes.ts and backend/src/routes/index.ts
- [ ] T028 [US1] Implement frontend auth pages and forms in frontend/src/features/auth/pages/RegisterPage.tsx and frontend/src/features/auth/pages/LoginPage.tsx
- [ ] T029 [US1] Implement frontend auth state/session handling with JSDoc in frontend/src/features/auth/hooks/useAuth.ts and frontend/src/features/auth/services/auth-service.ts

**Checkpoint**: US1 is independently functional and testable.

---

## Phase 4: User Story 2 - Submit and View Ideas (Priority: P2)

**Goal**: Submitters create ideas with optional single attachment and view private-by-default listings with share toggle.

**Independent Test**: Logged-in submitter creates idea, validates attachment/type/size constraints, sees own list, toggles sharing visibility.

### Tests for User Story 2 (MANDATORY)

- [ ] T030 [P] [US2] Add unit tests for upload policy and idea visibility rules in backend/tests/unit/idea-policy.test.ts
- [ ] T031 [P] [US2] Add integration tests for create/list/share idea endpoints in backend/tests/integration/idea-routes.test.ts
- [ ] T032 [US2] Add E2E submit-and-list journey with attachment constraints in e2e/tests/us2-idea-submission.spec.ts
- [ ] T033 [US2] Record failing-first evidence for US2 test set in specs/001-innovatepam-portal/checklists/us2-test-proof.md

### Implementation for User Story 2

- [ ] T034 [P] [US2] Implement Idea and Attachment repositories in backend/src/repositories/idea-repository.ts and backend/src/repositories/attachment-repository.ts
- [ ] T035 [US2] Implement idea creation/list/share business service in backend/src/services/idea-service.ts
- [ ] T036 [US2] Implement idea validators (payload, upload constraints, share toggle) in backend/src/validators/idea-validator.ts
- [ ] T037 [US2] Implement idea controllers for create/list/share in backend/src/controllers/idea-controller.ts
- [ ] T038 [US2] Register idea routes in backend/src/routes/idea-routes.ts and backend/src/routes/index.ts
- [ ] T039 [US2] Implement submitter idea form and list pages in frontend/src/features/ideas/pages/IdeaSubmitPage.tsx and frontend/src/features/ideas/pages/IdeaListPage.tsx
- [ ] T040 [US2] Implement frontend idea API/service layer in frontend/src/features/ideas/services/idea-service.ts
- [ ] T041 [US2] Add/Update JSDoc for exported idea API interfaces in backend/src/services/idea-service.ts and frontend/src/features/ideas/services/idea-service.ts

**Checkpoint**: US2 is independently functional and testable.

---

## Phase 5: User Story 3 - Evaluate and Decide Ideas (Priority: P3)

**Goal**: Evaluator/admin users review ideas, perform status transitions, and finalize decisions with comment under optimistic concurrency.

**Independent Test**: Evaluator/admin updates `Submitted` → `Under Review` → `Accepted/Rejected` with comment; stale update receives conflict and retry guidance.

### Tests for User Story 3 (MANDATORY)

- [ ] T042 [P] [US3] Add unit tests for status transition and concurrency rules in backend/tests/unit/evaluation-rules.test.ts
- [ ] T043 [P] [US3] Add integration tests for evaluation status endpoint and conflict handling in backend/tests/integration/evaluation-routes.test.ts
- [ ] T044 [US3] Add E2E evaluator workflow including stale-update conflict in e2e/tests/us3-evaluation.spec.ts
- [ ] T045 [US3] Record failing-first evidence for US3 test set in specs/001-innovatepam-portal/checklists/us3-test-proof.md

### Implementation for User Story 3

- [ ] T046 [P] [US3] Implement EvaluationDecision and StatusHistory repositories in backend/src/repositories/evaluation-repository.ts and backend/src/repositories/status-history-repository.ts
- [ ] T047 [US3] Implement evaluation workflow service with optimistic concurrency in backend/src/services/evaluation-service.ts
- [ ] T048 [US3] Implement evaluation validators (status transition/comment requirements) in backend/src/validators/evaluation-validator.ts
- [ ] T049 [US3] Implement evaluation controller endpoint in backend/src/controllers/evaluation-controller.ts
- [ ] T050 [US3] Register evaluation route in backend/src/routes/evaluation-routes.ts and backend/src/routes/index.ts
- [ ] T051 [US3] Implement evaluator/admin review UI pages in frontend/src/features/evaluation/pages/EvaluationQueuePage.tsx and frontend/src/features/evaluation/pages/EvaluationDetailPage.tsx
- [ ] T052 [US3] Implement frontend evaluation API/service layer with conflict UX mapping in frontend/src/features/evaluation/services/evaluation-service.ts
- [ ] T053 [US3] Add/Update JSDoc for exported evaluation APIs in backend/src/services/evaluation-service.ts and frontend/src/features/evaluation/services/evaluation-service.ts

**Checkpoint**: US3 is independently functional and testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Enforce quality gates, documentation, and final validation across all stories.

- [ ] T054 [P] Add unit tests to maintain target test pyramid ratio in backend/tests/unit/pyramid-balance.test.ts and frontend/tests/unit/pyramid-balance.test.ts
- [ ] T055 [P] Add integration test coverage for end-to-end API contracts in backend/tests/integration/contracts-conformance.test.ts
- [ ] T056 [P] Add Playwright regression scenario for role/visibility matrix in e2e/tests/regression-role-visibility.spec.ts
- [ ] T057 Update API and environment docs in specs/001-innovatepam-portal/quickstart.md and specs/001-innovatepam-portal/contracts/openapi.yaml
- [ ] T058 Run and record quickstart validation results in specs/001-innovatepam-portal/checklists/quickstart-validation.md
- [ ] T059 Verify changed-code line coverage >=80% and document output in specs/001-innovatepam-portal/checklists/coverage-report.md
- [ ] T060 Run full lint/test/e2e gate and record final release checklist in specs/001-innovatepam-portal/checklists/release-readiness.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies; starts immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1; blocks all user stories.
- **Phase 3-5 (User Stories)**: Depend on Phase 2 completion.
- **Phase 6 (Polish)**: Depends on completion of selected user stories.

### User Story Dependencies

- **US1 (P1)**: Starts after Foundational; independent MVP slice.
- **US2 (P2)**: Starts after Foundational and can proceed after US1 for auth reuse.
- **US3 (P3)**: Starts after Foundational and after US2 data paths are available.

### Within Each User Story

- Tests MUST be authored and fail first.
- Repositories/models before services.
- Services before controllers/routes.
- Backend endpoints before frontend integration pages.
- JSDoc updates before story completion.

### Parallel Opportunities

- Setup tasks marked `[P]` can run concurrently.
- Foundational infra tasks marked `[P]` can run concurrently after app bootstrap exists.
- In each story, unit/integration tests can run in parallel before implementation.
- Repository tasks and frontend page tasks can run in parallel after service contracts stabilize.
- Polish verification tasks marked `[P]` can run concurrently.

---

## Parallel Example: User Story 2

```bash
# Parallel tests-first execution:
Task: "T030 [US2] Add unit tests for upload policy and idea visibility rules in backend/tests/unit/idea-policy.test.ts"
Task: "T031 [US2] Add integration tests for create/list/share idea endpoints in backend/tests/integration/idea-routes.test.ts"

# Parallel implementation execution after tests are red:
Task: "T034 [US2] Implement Idea and Attachment repositories in backend/src/repositories/idea-repository.ts and backend/src/repositories/attachment-repository.ts"
Task: "T039 [US2] Implement submitter idea form and list pages in frontend/src/features/ideas/pages/IdeaSubmitPage.tsx and frontend/src/features/ideas/pages/IdeaListPage.tsx"
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Complete Phase 1 (Setup).
2. Complete Phase 2 (Foundational).
3. Complete Phase 3 (US1).
4. Validate US1 independently as release-ready MVP.

### Incremental Delivery

1. Deliver US1 as secure access baseline.
2. Deliver US2 for core submission/listing value.
3. Deliver US3 for evaluator workflow completion.
4. Apply Phase 6 quality hardening and final validation.

### Parallel Team Strategy

1. Team completes Setup + Foundational together.
2. Then split ownership:
   - Developer A: backend service/repository tracks
   - Developer B: frontend feature modules
   - Developer C: tests/E2E and quality gates

---

## Notes

- All tasks follow strict checklist format with sequential IDs.
- Story-labeled tasks appear only in user-story phases.
- TDD-first ordering is enforced by explicit fail-first proof tasks.
- Business logic mocking is disallowed; only external I/O may be faked.
- Coverage and test-pyramid gates are validated in final phase.
