# Tasks: InnovatEPAM Portal (Consolidated Baseline)

**Input**: `/specs/002-innovateepam-portal/` design documents  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/openapi.yaml`, `quickstart.md`

**Tests are mandatory**: For each story, tests are authored first and verified failing before implementation updates.

## Phase 1: Setup & Foundation (Consolidated)

- [X] T001 Establish monorepo scripts/workspaces and strict TypeScript baselines.
- [X] T002 Configure Jest + Playwright + coverage gate wiring.
- [X] T003 Establish backend app bootstrap, DB migration, shared errors, validation, and router composition.
- [X] T004 Establish frontend API client + typed contract layer.
- [X] T005 Establish upload policy enforcement scaffolding for ideas.

## Phase 2: User Story 1 — Production-Ready Access (P1)

### Tests
- [X] T006 Add backend unit tests for password/hash/token utilities.
- [X] T007 Add backend integration tests for register/login/logout/session/csrf/reset/throttle behavior.
- [X] T008 Add frontend unit tests for auth alerts, protected-route redirects, and session recovery.
- [X] T009 Add E2E auth regression flow (login/logout/refresh/reset).

### Implementation
- [X] T010 Implement secure auth validators and password policy enforcement.
- [X] T011 Implement bcrypt-backed register/login and cookie-session issuance.
- [X] T012 Implement session recovery + CSRF issuance/validation flow.
- [X] T013 Implement password reset request/confirm token lifecycle.
- [X] T014 Implement login/reset throttling per account + IP window.
- [X] T015 Ensure visible red error alerts for auth failure states.

## Phase 3: User Story 2 — Submit and View Ideas (P2)

### Tests
- [X] T016 Add unit tests for attachment policy and visibility rules.
- [X] T017 Add integration tests for idea create/list/share routes.
- [X] T018 Add E2E submit/list visibility flow.

### Implementation
- [X] T019 Implement idea/attachment repositories and owner-visible listing logic.
- [X] T020 Implement idea create/list/share service + validators.
- [X] T021 Implement API endpoints for idea create/list/share.
- [X] T022 Implement frontend idea form/list and service integration.

## Phase 4: User Story 3 — Evaluate and Decide (P3)

### Tests
- [X] T023 Add unit tests for evaluation transition/concurrency rules.
- [X] T024 Add integration tests for evaluation status endpoint and conflict responses.
- [X] T025 Add E2E evaluator workflow including stale-update rejection.

### Implementation
- [X] T026 Implement evaluation and status-history repositories.
- [X] T027 Implement evaluation workflow service with optimistic concurrency checks.
- [X] T028 Implement evaluation validators/controllers/routes.
- [X] T029 Implement frontend evaluator queue/detail and conflict UX mapping.

## Phase 5: User Story 4 — Dashboard and UX Completion (P2)

### Tests
- [ ] T030 Add unit tests for global in-page alert behavior.
- [ ] T031 Add integration tests for post-login dashboard redirect and shared shell.
- [ ] T032 Add E2E dashboard/header/error-feedback scenario.

### Implementation
- [ ] T033 Implement role-aware dashboard page.
- [ ] T034 Implement authenticated app shell with persistent email + logout.
- [ ] T035 Standardize visible red alerts and loading/disable-submit behavior across forms.

## Phase 6: Cross-Cutting Quality & Hardening

- [ ] T036 Refresh API contract conformance checks against consolidated openapi.
- [ ] T037 Re-run and record coverage/report/readiness checklists under `specs/002-innovateepam-portal/checklists/`.
- [ ] T038 Confirm unit/integration/E2E distribution remains aligned to 70/20/10.
- [ ] T039 Address deferred security hardening items (secret rotation policy, security event auditability, proxy IP trust boundary).

## Dependencies

- Foundation (Phase 1) precedes all story work.
- US1 precedes protected-route-dependent UX behavior in US4.
- US2 and US3 depend on foundation and auth baseline.
- Quality phase runs after selected story increments.

## Delivery Guidance

- Use incremental release slices: US1 -> US2 -> US3 -> US4 -> quality hardening.
- Keep checklist evidence in `checklists/` synchronized as each phase advances.