# Tasks: InnovatEPAM Portal (Consolidated Baseline)

**Input**: Design documents from `/specs/002-innovateepam-portal/`  
**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/openapi.yaml`, `quickstart.md`

**Tests**: Tests are MANDATORY. Write tests before implementation and verify they fail before writing production code.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested independently.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Ensure build/test/tooling baseline for this feature is aligned and reproducible.

- [X] T001 [US1-US6] Align feature test commands and coverage gate in package.json
- [X] T002 [US1-US6] Configure backend environment variable templates in backend/.env.example
- [X] T003 [P] [US1-US6] Add shared backend domain constants in backend/src/lib/domain-constants.ts
- [X] T004 [P] [US1-US6] Add shared frontend domain types in frontend/src/features/shared/domain-types.ts
- [X] T005 [US1-US6] Add API contract validation script wiring (`npm run lint:openapi`) in package.json for specs/002-innovateepam-portal/contracts/openapi.yaml with non-zero exit on schema or reference errors

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data + framework prerequisites that block all user stories.

**⚠️ CRITICAL**: No user story implementation starts before this phase is complete.

- [X] T006 [US1-US6] Add/refresh baseline migrations for auth and ideas in backend/src/lib/migrations/20260225_core_baseline.ts
- [X] T007 [P] [US1-US6] Implement central auth/session guard utilities in backend/src/middleware/auth-guard.ts
- [X] T008 [P] [US1-US6] Implement shared API error mapping in backend/src/middleware/error-handler.ts
- [X] T009 [US1-US6] Implement CSRF middleware baseline in backend/src/middleware/csrf-guard.ts
- [X] T010 [P] [US1-US6] Implement request validation helpers in backend/src/validators/common.ts
- [X] T011 [US1-US6] Define backend repository contracts for core entities in backend/src/repositories/index.ts
- [X] T012 [US1-US6] Record failing-proof checklist scaffolding in specs/002-innovateepam-portal/checklists/requirements.md

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

## Phase 6: User Stories 4-6 - Post-Login Workspace, Feedback Safety, and Accessibility (Priority: P2/P3)

**Goal**: Deliver three independently testable slices for protected shell/dashboard (US4), standardized feedback + submission safety (US5), and accessibility/interaction quality (US6).

**Acceptance References**: US4 scenarios 1-11, US5 scenarios 1-5, US6 scenarios 1-4, FR-038..FR-042, FR-048..FR-053, FR-059..FR-062, FR-071..FR-075

**Independent Test**: Validate US4 shell/dashboard/profile flows independently, validate US5 alert and duplicate-submit safety independently, and validate US6 keyboard/focus/ARIA/interaction states independently.

### Tests for User Stories 4-6 (MANDATORY) ✅

- [X] T048 [P] [US4-US6] Add shell/dashboard unit tests in frontend/tests/unit/protected-shell-dashboard.test.tsx
- [X] T049 [P] [US4-US6] Add alert/loading/a11y unit tests in frontend/tests/unit/ux-safety-a11y.test.tsx
- [X] T050 [P] [US4-US6] Add end-to-end shell/ux regression in e2e/tests/us4-shell-ux.spec.ts
- [X] T051 [US4-US6] Capture failing test evidence for workspace UX slices in specs/002-innovateepam-portal/checklists/us4-test-proof.md
- [X] T068 [P] [US4-US6] Add unit tests for ARIA announcement behavior (assertive error, polite success) in frontend/tests/unit/alert-aria-announcement.test.tsx
- [X] T075 [P] [US4-US6] Add unit tests for profile-view identity rendering and clickable header email navigation in frontend/tests/unit/app-public-entry-navigation.test.tsx
- [X] T076 [P] [US4-US6] Add unit tests for `My Ideas` and `Evaluation Queue` empty-state CTA rendering in frontend/tests/unit/idea-list-empty-states.test.tsx
- [X] T077 [P] [US4-US6] Add E2E assertion for logout redirect destination `/` in e2e/tests/us1-auth.spec.ts

### Implementation for User Stories 4-6

- [X] T052 [P] [US4-US6] Implement shared protected layout with active nav in frontend/src/features/layout/ProtectedLayout.tsx
- [X] T053 [US4-US6] Implement role-aware dashboard widgets in frontend/src/features/dashboard/DashboardPage.tsx
- [X] T054 [US4-US6] Implement standardized alert component with severity semantics in frontend/src/features/shared/Alert.tsx
- [X] T055 [US4-US6] Implement form loading/disable/re-enable behavior in frontend/src/features/shared/useSubmissionGuard.ts
- [X] T056 [US4-US6] Implement focus-to-error-alert helper in frontend/src/features/shared/focus-error-alert.ts
- [X] T057 [US4-US6] Apply ARIA labels/roles to auth forms in frontend/src/features/auth/AuthPage.tsx
- [X] T069 [US4-US6] Apply ARIA labels/roles to idea submission/listing forms in frontend/src/features/ideas/IdeaSubmissionForm.tsx
- [X] T070 [US4-US6] Apply ARIA labels/roles to evaluation forms in frontend/src/features/evaluation/AdminEvaluationPage.tsx
- [X] T058 [US4-US6] Add/Update JSDoc for exported workspace UX APIs in frontend/src/features/layout/ProtectedLayout.tsx
- [X] T071 [US4-US6] Implement alert live-region behavior (`role="alert"` assertive errors, `role="status"` polite success) in frontend/src/features/shared/Alert.tsx
- [X] T078 [US4-US6] Implement protected profile view, header email-link routing, and logout redirect to public landing in frontend/src/App.tsx and frontend/src/features/auth/pages/ProfilePage.tsx
- [X] T079 [US4-US6] Implement `My Ideas` and `Evaluation Queue` empty-state components and CTA actions in frontend/src/features/ideas/pages/IdeaListPage.tsx and frontend/src/features/evaluation/pages/EvaluationQueuePage.tsx
- [X] T080 [US4-US6] Apply visible hover/active feedback styling to primary/secondary controls in frontend/src/styles.css and protected-shell surfaces
- [X] T081 [US4-US6] Formalize evaluation-detail UI constraints for status badges, Outlook-style attachment cards, relative/absolute submission timestamps, and read-vs-write section separation in frontend/src/features/evaluation/pages/EvaluationDetailPage.tsx
- [X] T082 [US4-US6] Align idea-details visual treatment with evaluation detail and enhance evaluation queue with status/category filter bar, wait-time metadata, and high-latency visual cues in frontend/src/features/ideas/pages/IdeaDetailsPage.tsx and frontend/src/features/evaluation/pages/EvaluationQueuePage.tsx

**Checkpoint**: US4-US6 slices are independently functional and testable.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening, conformance, and release evidence.

- [X] T059 [P] [US1-US6] Validate OpenAPI conformance updates in specs/002-innovateepam-portal/contracts/openapi.yaml
- [X] T060 [US1-US6] Run quickstart acceptance validation and record results in specs/002-innovateepam-portal/checklists/quickstart-validation.md
- [X] T061 [P] [US1-US6] Verify coverage/report gates and update evidence in specs/002-innovateepam-portal/checklists/coverage-report.md
- [X] T062 [US1-US6] Verify test-distribution balance and record in specs/002-innovateepam-portal/checklists/release-readiness.md
- [X] T063 [US1-US6] Refresh ADR/spec traceability notes in docs/adr/README.md

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
- **US4 (P2)**: depends on US1 for protected shell and role-dashboard baseline.
- **US5 (P2)**: depends on US4 shell/component baseline and integrates with US1/US2/US3 form and API error surfaces.
- **US6 (P3)**: depends on US4 shell and US5 feedback mechanics for complete keyboard/ARIA/focus validation.

### Completion Order Graph

`US1 -> US2 -> US3 -> US4 -> US5 -> US6`

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

### US4-US6

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
5. Add US5 and validate independently.
6. Add US6 and validate independently.
7. Run Phase 7 polish before release cut.

### Team Parallelization

1. Team completes Phases 1-2 together.
2. Then split by story ownership:
	- Dev A: US1/US2 backend threads
	- Dev B: US2/US4-US6 frontend threads
	- Dev C: US3 evaluation and timeline threads

---

## Notes

- `[P]` tasks indicate independent files and no blocking dependency.
- Every story phase includes tests first, then implementation.
- Do not mock business logic; mock/fake only external I/O boundaries.
- Keep task evidence up to date in `specs/002-innovateepam-portal/checklists/`.
- Shared tasks tagged `[US1-US6]` explicitly trace to all story scopes per constitution traceability requirements.

---

## Phase 8: Change Request 2026-02-26 (UX, Permissions, Collaboration)

**Purpose**: Address post-baseline UX correctness, permissions expansion, collaboration comments, and test-data hygiene.

### Tests for Change Request (MANDATORY) ✅

- [X] T083 [P] [US2-US6] Add backend unit tests for owner/admin edit-delete authorization and status guards in backend/tests/unit/idea-permissions.test.ts
- [X] T084 [P] [US3-US6] Add backend unit tests for threaded comments depth/visibility in backend/tests/unit/idea-comments.test.ts
- [X] T085 [P] [US2-US6] Add backend integration tests for edit/delete/comment routes in backend/tests/integration/idea-mutation-comments.test.ts
- [X] T086 [P] [US4-US6] Add frontend unit tests for nav exact-active behavior, detail metadata layout, and attachment preview/download controls in frontend/tests/unit/idea-details-ux-regression.test.tsx
- [X] T087 [P] [US4-US6] Add frontend unit tests for dashboard shared-ideas panel and personalized welcome copy in frontend/tests/unit/dashboard-shared-ideas.test.tsx
- [X] T088 [P] [US1-US6] Add E2E/integration test-data cleanup assertions preventing persistent `Idea A` artifacts in e2e/tests/us2-idea-submission.spec.ts

### Implementation for Change Request

- [X] T089 [US2-US6] Implement backend idea update/delete service/controller/routes with owner/admin policy enforcement
- [X] T090 [US3-US6] Implement threaded comments repository/service/controller/routes with max depth 5 and visibility guards
- [X] T091 [US4-US6] Implement protected navigation exact-active matching for sibling routes in frontend/src/features/layout/ProtectedLayout.tsx
- [X] T092 [US2-US6] Implement submit-time sharing control and persistence in frontend/src/features/ideas/pages/IdeaSubmitPage.tsx and backend idea create flow
- [X] T093 [US4-US6] Implement details-page metadata separation, top-right status badge, and attachment preview/download split controls
- [X] T094 [US4-US6] Implement dashboard purpose copy and shared-ideas panel in frontend/src/features/auth/pages/DashboardPage.tsx
- [X] T095 [US1-US6] Implement automated test-data cleanup for E2E/integration runs

---

## Phase 9: Change Request 2026-02-26 (Wave 2 - Unified Details, Voting, Redirect UX)

**Purpose**: Resolve detail-page duplication, add collaboration voting/rating, and correct deletion/reply interaction behavior.

### Tests for Change Request (MANDATORY) ✅

- [X] T096 [P] [US3-US6] Add backend unit tests for expanded evaluation transitions and vote aggregation in backend/tests/unit/evaluation-workflow.test.ts and backend/tests/unit/idea-voting.test.ts
- [X] T097 [P] [US2-US6] Add backend integration tests for idea/comment voting and comment-delete permissions in backend/tests/integration/idea-voting-comments.test.ts
- [X] T098 [P] [US4-US6] Add frontend unit tests for unified detail routing, delete redirect behavior, inline reply composer, and idea/comment voting UI in frontend/tests/unit/idea-details-voting-ux.test.tsx

### Implementation for Change Request

- [X] T099 [US3-US6] Implement backend vote persistence and aggregate projection for ideas/comments in repositories/services/controllers/routes
- [X] T100 [US3-US6] Implement expanded admin status transition support for direct `Submitted -> Accepted/Rejected` decisions in backend/src/services/evaluation-service.ts
- [X] T101 [US4-US6] Consolidate detail routes to one page and remove separate evaluation detail route usage in frontend/src/App.tsx and evaluation queue/list links
- [X] T102 [US4-US6] Implement detail-page UX updates (title/category hierarchy, inline edit swap, inline reply form, attachment download affordance/hover states, star rating and vote counts)
- [X] T103 [US3-US6] Implement comment delete actions with owner/admin guards and frontend controls

---

## Phase 10: Change Request 2026-02-26 (Wave 3 - Detail UX Tightening and Role Gating)

**Purpose**: Apply final UX/policy corrections for vote summaries, dashboard copy, comment locking on rejected ideas, compact attachment layout, and navigation visibility.

### Tests for Change Request (MANDATORY)

- [X] T104 [P] [US4-US6] Add/update frontend unit tests for dashboard copy cleanup and submitter-hidden evaluation queue navigation in frontend/tests/unit/app-public-entry-navigation.test.tsx and frontend/tests/unit/dashboard-shared-ideas.test.tsx
- [X] T105 [P] [US2-US6] Add/update frontend unit tests for post-submit redirect-to-detail behavior in frontend/tests/unit/idea-submit-page-refactor.test.tsx
- [X] T106 [P] [US3-US6] Add/update frontend unit tests for rejected-status comment lock and highlighted non-repliable evaluation comment rendering in frontend/tests/unit/idea-details-voting-ux.test.tsx
- [X] T107 [P] [US4-US6] Add/update frontend unit tests for attachment card behavior, removed description heading, status pill in `My Ideas`, and net-vote summary display in frontend/tests/unit/idea-details-ux-regression.test.tsx and frontend/tests/unit/idea-list-empty-states.test.tsx

### Implementation for Change Request

- [X] T108 [US4-US6] Update protected layout and dashboard copy/visibility rules for role-gated navigation and welcome text in frontend/src/features/layout/ProtectedLayout.tsx and frontend/src/features/auth/pages/DashboardPage.tsx
- [X] T109 [US2-US6] Update idea submit flow to redirect to created idea details after successful creation in frontend/src/features/ideas/pages/IdeaSubmitPage.tsx
- [X] T110 [US3-US6] Update idea details comment/evaluation rendering for highlighted decision block, rejected-status comment lock, submitter read-only message removal, and retained attachment card behavior in frontend/src/features/ideas/pages/IdeaDetailsPage.tsx
- [X] T111 [US4-US6] Update idea list and evaluation queue vote/status presentation to net-vote + status-pill parity in frontend/src/features/ideas/pages/IdeaListPage.tsx and frontend/src/features/evaluation/pages/EvaluationQueuePage.tsx
- [X] T112 [US4-US6] Remove unused evaluation detail page artifact and related exports/tests references in frontend/src/features/evaluation/pages/EvaluationDetailPage.tsx and frontend/src/features/evaluation/pages/index.ts

---

## Phase 11: Change Request 2026-02-26 (Wave 4 - Dynamic Submission Forms and Draft Continuation)

**Purpose**: Add category-driven dynamic submission fields, persisted drafts with dashboard resume affordance, and left-aligned dashboard layout split.

### Tests for Change Request (MANDATORY)

- [X] T113 [P] [US2-US6] Add/update frontend unit tests for category enum expansion, dynamic field visibility, stale-value clearing, and create payload integration in frontend/tests/unit/idea-submit-page-refactor.test.tsx
- [X] T114 [P] [US2-US6] Add backend validator unit tests for dynamic field/category validation and expanded query categories in backend/tests/unit/idea-validator-dynamic-fields.test.ts
- [X] T115 [P] [US4-US6] Add/update dashboard unit tests for left/middle panel layout, draft pill visibility, and draft resume link behavior in frontend/tests/unit/dashboard-shared-ideas.test.tsx

### Implementation for Change Request

- [X] T116 [US2-US6] Implement submission form dynamic fields and stale-state reset behavior in frontend/src/features/ideas/pages/IdeaSubmitPage.tsx
- [X] T117 [US2-US6] Implement dynamic follow-up payload contract + backend validation for create requests in frontend/src/services/contracts.ts, frontend/src/features/ideas/services/idea-service.ts, backend/src/validators/idea-validator.ts, and backend/src/validators/idea-query-validator.ts
- [X] T118 [US4-US6] Implement per-user draft persistence and resume flow in frontend/src/features/ideas/services/idea-draft-storage.ts and frontend/src/features/ideas/pages/IdeaSubmitPage.tsx
- [X] T119 [US4-US6] Refactor dashboard to left-aligned split layout with combined own/shared idea list and draft pill rendering in frontend/src/features/auth/pages/DashboardPage.tsx