# Implementation Plan: InnovatEPAM Portal (Consolidated Baseline)

**Branch**: `002-innovateepam-portal` | **Date**: 2026-02-25 | **Spec**: `/specs/002-innovateepam-portal/spec.md`
**Input**: Feature specification from `/specs/002-innovateepam-portal/spec.md`

## Summary

Deliver MVP in four story slices with quality/safety built in: secure local auth and recovery (US1), idea submission and listing with server-side query controls (US2), admin evaluation with optimistic concurrency and timeline auditability (US3), and protected app shell plus robust UX/a11y behavior (US4). Implementation continues test-first under strict TypeScript with explicit API contracts and >=80% changed-code coverage.

## Technical Context

**Language/Version**: TypeScript 5.x strict mode (backend + frontend)  
**Primary Dependencies**: Express 4, React 18, React Router 6, Zod, bcryptjs, jsonwebtoken, better-sqlite3, multer, Jest, Playwright  
**Storage**: SQLite database + local filesystem uploads directory (`/uploads`)  
**Testing**: Jest unit/integration + Playwright E2E (target 70/20/10)  
**Target Platform**: Linux-hosted internal web application  
**Project Type**: Monorepo web application (`backend`, `frontend`, `e2e`)  
**Performance Goals**: Protected-route auth/session checks and list responses return within practical UAT thresholds; pagination required for large listings  
**Constraints**: TDD-first, strict TS + JSDoc on exported surfaces, no business-logic mocking, 10 MiB attachment cap, CSRF for authenticated writes, 5/15min auth throttles  
**Scale/Scope**: Internal employee MVP with two roles (`submitter`, `admin`), four user stories, API + web UI

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Design Gate

- **Story/Spec Traceability**: PASS — Plan is anchored to US1-US4 and FR-001..FR-075.
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

- **Story/Spec Traceability**: PASS — design artifacts map back to US1-US4 and acceptance scenarios.
- **Strict TypeScript**: PASS — contracts and model names retain strict-typing compatibility.
- **Documentation Discipline**: PASS — API schema surfaces provide explicit contract definitions for generated docs/types.
- **TDD First**: PASS — no implementation sequencing change; tasks remain fail-first.
- **Testing Strategy**: PASS — design includes contract/integration/e2e-verifiable behavior across the pyramid.
- **Coverage Gate**: PASS — no waiver introduced.

## Complexity Tracking

No constitution violations or justified exceptions required at plan stage.
