# Implementation Plan: InnovatEPAM Portal (Consolidated Baseline)

**Branch**: `002-innovateepam-portal` | **Date**: 2026-02-25 | **Spec**: `/specs/002-innovateepam-portal/spec.md`
**Input**: Feature specification from `/specs/002-innovateepam-portal/spec.md`

## Summary

Deliver MVP in six INVEST-aligned story slices with quality/safety built in: secure local auth and recovery (US1), idea submission and listing with server-side query controls (US2), admin evaluation with optimistic concurrency and timeline auditability (US3), post-login shell and role dashboard (US4), standardized feedback and submission safety (US5), and accessibility/interaction baseline behaviors (US6). Implementation continues test-first under strict TypeScript with explicit API contracts and >=80% changed-code coverage.

## Technical Context

**Language/Version**: TypeScript 5.x strict mode (backend + frontend)  
**Primary Dependencies**: Express 4, React 18, React Router 6, Zod, bcryptjs, jsonwebtoken, better-sqlite3, multer, Jest, Playwright  
**Storage**: SQLite database + local filesystem uploads directory (`/uploads`)  
**Testing**: Jest unit/integration + Playwright E2E (target 70/20/10)  
**Target Platform**: Linux-hosted internal web application  
**Project Type**: Monorepo web application (`backend`, `frontend`, `e2e`)  
**Performance Goals**: Protected-route auth/session checks and list responses return within practical UAT thresholds; pagination required for large listings  
**Constraints**: TDD-first, strict TS + JSDoc on exported surfaces, no business-logic mocking, 10 MiB attachment cap, CSRF for authenticated writes, 5/15min auth throttles  
**Scale/Scope**: Internal employee MVP with two roles (`submitter`, `admin`), six user stories, API + web UI

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Design Gate

- **Story/Spec Traceability**: PASS — Plan is anchored to US1-US6 and FR-001..FR-075.
- **Strict TypeScript**: PASS — strict TS explicitly required for API/domain/frontend contracts.
- **Documentation Discipline**: PASS — exported APIs/types remain JSDoc-documented by constitution rule.
- **TDD First**: PASS — implementation sequencing remains tests-first per story.
- **Testing Strategy**: PASS — unit/integration/E2E split remains 70/20/10 with business-logic non-mocking.
- **Coverage Gate**: PASS — changed production code must maintain >=80% line coverage.

## Project Structure

### Documentation (this feature)

```text
specs/002-innovateepam-portal/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── controllers/
│   ├── middleware/
│   ├── repositories/
│   ├── routes/
│   ├── services/
│   ├── validators/
│   └── lib/
└── tests/

frontend/
├── src/
│   ├── features/
│   ├── services/
│   └── App.tsx
└── tests/

e2e/
└── tests/
```

**Structure Decision**: Use existing web monorepo boundaries; keep feature work incremental inside current backend/frontend/e2e layout to minimize churn and preserve test harness continuity.

## Phase 0: Research Plan

- Confirm best-practice choices for cookie-session+CSRF auth, reset token lifecycle, throttling, list pagination/filter/sort design, optimistic concurrency, alert behavior, and accessibility semantics.
- Resolve technical clarifications for role naming, category enum contract, timeline audit exposure, and anti-duplicate submit behavior.

## Phase 1: Design Plan

- Produce updated `data-model.md` with identity, auth, idea, query, audit, and UI-feedback-relevant entities.
- Refresh API contract in `contracts/openapi.yaml` to match current FR set (fullName/confirm password/category enum/pagination-filter-sort/timeline endpoints/admin role).
- Refresh `quickstart.md` with validation scenarios and quality checks for shell/a11y/alert behavior.
- Update agent context with `.specify/scripts/bash/update-agent-context.sh copilot`.

## Constitution Check (Post-Design Re-check)

- **Story/Spec Traceability**: PASS — design artifacts map back to US1-US6 and acceptance scenarios.
- **Strict TypeScript**: PASS — contracts and model names retain strict-typing compatibility.
- **Documentation Discipline**: PASS — API schema surfaces provide explicit contract definitions for generated docs/types.
- **TDD First**: PASS — no implementation sequencing change; tasks remain fail-first.
- **Testing Strategy**: PASS — design includes contract/integration/e2e-verifiable behavior across the pyramid.
- **Coverage Gate**: PASS — no waiver introduced.

## Complexity Tracking

No constitution violations or justified exceptions required at plan stage.

## Change Addendum (2026-02-26)

### Scope Propagation

- Extend US2/US4/US6 with explicit dashboard shared-ideas discoverability, navigation active-state exact matching, and submit-time sharing control.
- Extend US2/US3 with idea edit/delete authorization model (owner edit/delete only while `Submitted`, admin delete regardless of status).
- Extend US3/US6 with threaded comments visible to authorized viewers and reply nesting cap of 5.
- Refine idea/evaluation detail information architecture: category in top metadata row, description in separate body section, top-right status badge, and attachment preview/download split actions.
- Add test-data hygiene hardening for E2E/integration environments so seeded test records are removed post-run.

### Architecture Notes

- Introduce comment domain model (`idea_comments`) with adjacency-list threading (`parent_comment_id`) and server-enforced `depth <= 5`.
- Add idea mutation endpoints for update/delete with role-aware guards and status-aware owner checks.
- Keep attachment storage unchanged; only UI interaction changes (preview target and dedicated download control).
- Add dashboard shared-ideas query path that reuses existing list API visibility semantics with explicit `visibilityScope=all` for submitter discovery.

## Change Addendum (2026-02-26, Wave 2)

### Scope Propagation

- Consolidate idea/evaluation detail experiences into one route/component with role-gated admin controls.
- Add idea and comment voting domain behavior (upvote/downvote) with aggregated score metadata for list/detail/comment rendering.
- Add rating presentation model for idea details using vote-ratio-to-5-stars projection and total-vote count.
- Add redirect-on-delete UX for idea detail pages with back-navigation first and dashboard fallback.
- Add inline reply composer anchored under target comment and comment-level delete permissions (owner/admin).
- Resolve evaluation rejection failure by expanding allowed transition set for admin finalization from `Submitted`.

### Architecture Notes

- Introduce normalized vote tables for idea votes and comment votes with unique `(entity_id, user_id)` constraint and value domain `{-1, +1}`.
- Extend idea/comment query projections to include vote aggregates and current-viewer vote state without changing existing auth boundaries.
- Reuse existing idea details page as single source of truth for both `/ideas/:ideaId` and `/evaluation/:ideaId` routes.
- Keep repository/service layering unchanged; add narrowly scoped repository methods for vote upsert/delete and comment deletion authorization checks.

## Change Addendum (2026-02-26, Wave 3)

### Scope Propagation

- Refine vote presentation to user-facing net-total display (`upvotes - downvotes`) across dashboard-adjacent idea summaries, idea list rows, queue rows, and idea detail summary.
- Introduce highlighted non-threaded system rendering for evaluation decision comments, including decision label and status-dependent accent colors.
- Enforce role-aware shell/navigation visibility so submitters do not see evaluation queue entry points.
- Tighten idea detail visual density by removing redundant description heading while retaining attachment card behavior from prior baseline.
- Align dashboard onboarding copy to welcome-only body text; remove redundant signed-in line.
- Enforce submit-success redirect to created idea details route.
- Apply rejected-idea comment lock for regular users while preserving admin evaluation control path.

### Architecture Notes

- Keep unified detail route/component (`/ideas/:ideaId` and alias routes) and remove dead evaluation-detail page artifact from exports to avoid ghost imports.
- Implement comment-lock policy as UI capability gating derived from idea status + role, without altering existing comment data contracts.
- Reuse existing badge primitives for status-pill parity in `My Ideas` rows.
