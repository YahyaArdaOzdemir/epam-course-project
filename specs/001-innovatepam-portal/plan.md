# Implementation Plan: InnovatEPAM Portal

**Branch**: `001-innovatepam-portal` | **Date**: 2026-02-24 | **Spec**: `/specs/001-innovatepam-portal/spec.md`
**Input**: Feature specification from `/specs/001-innovatepam-portal/spec.md`

## Summary

Build an internal innovation portal where employees register/login, submit ideas (with one optional attachment), and evaluators/admins review ideas through a status workflow (`Submitted` → `Under Review` → `Accepted/Rejected`) with comments. Solution uses a TypeScript monorepo layout with React+Vite frontend, Express MVC backend, SQLite persistence, and local `/uploads` storage, with TDD-first workflow and test pyramid targets.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode enabled for frontend and backend)  
**Primary Dependencies**: React (latest), Vite, TailwindCSS, Node.js, Express.js, sqlite3/better-sqlite3, multer (upload handling), zod (runtime validation), Playwright, Jest  
**Storage**: SQLite database for app data; local filesystem for attachments in `/uploads`  
**Testing**: Jest for unit/integration, Playwright for E2E  
**Target Platform**: Linux-hosted internal web application  
**Project Type**: Web application (frontend + backend)  
**Performance Goals**: p95 API response under 300ms for list/detail/evaluation operations with up to 200 concurrent internal users  
**Constraints**: TypeScript strict mode, JSDoc on exported APIs, TDD-first, 80% line coverage minimum on changed production code, no business-logic mocking  
**Scale/Scope**: Internal MVP (single organization), two roles (submitter/evaluator-admin), attachment max 10 MB, moderate traffic

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Story/Spec Traceability**: PASS. Scope maps to US1-US3 in `/specs/001-innovatepam-portal/spec.md`.
- **Strict TypeScript**: PASS. Plan enforces TypeScript strict mode for all app packages.
- **Documentation Discipline**: PASS. Exported frontend hooks/services and backend controllers/services/repositories require JSDoc.
- **TDD First**: PASS. Tasks will be generated with failing tests before implementation per story.
- **Testing Strategy**: PASS. Target split preserved at Unit 70%, Integration 20%, E2E 10%; business logic remains unmocked.
- **Coverage Gate**: PASS. CI gate requires >=80% line coverage for changed production modules.

## Project Structure

### Documentation (this feature)

```text
specs/001-innovatepam-portal/
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
│   ├── models/
│   ├── repositories/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   ├── validators/
│   └── app.ts
├── uploads/
└── tests/
    ├── integration/
    └── unit/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── features/
│   │   ├── auth/
│   │   ├── ideas/
│   │   └── evaluation/
│   ├── services/
│   ├── hooks/
│   └── main.tsx
└── tests/
    ├── integration/
    └── unit/

e2e/
└── tests/
```

**Structure Decision**: Use explicit frontend/backend split to match requested stack and MVC backend architecture while keeping test layers aligned to constitution quality gates.

## Phase 0: Research Focus

- Confirm secure local-auth patterns for internal-only corporate-domain registration.
- Confirm pragmatic Express MVC layering and validation pattern with strict TypeScript.
- Confirm SQLite + filesystem upload best practices for consistency and atomic behavior.
- Confirm Jest + Playwright workflow supporting TDD and target test distribution.

## Phase 1: Design Outputs

- Produce data model entities, relationships, and state transitions.
- Define REST contracts for auth, idea submission/listing/sharing, and evaluation flow.
- Produce quickstart for local setup, test execution, and validation paths.

## Post-Design Constitution Re-Check

- **Story/Spec Traceability**: PASS. `data-model.md`, `contracts/openapi.yaml`, and `quickstart.md` map directly to US1-US3 and FR-001..FR-023.
- **Strict TypeScript**: PASS. Design keeps all interfaces/contracts typed and ready for strict compilation.
- **Documentation Discipline**: PASS. Public API surfaces in contract are designated for JSDoc during implementation.
- **TDD First**: PASS. Quickstart and plan require tests-first sequence prior to code implementation.
- **Testing Strategy**: PASS. Jest (unit/integration) + Playwright (E2E) maintained with target 70/20/10 split.
- **Coverage Gate**: PASS. Quickstart includes coverage validation step and threshold expectation (>=80%).
- **Violations/Exceptions**: None.

## Complexity Tracking

No constitutional violations identified at planning stage.
