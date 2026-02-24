# Implementation Plan: Production-Ready User Authentication (US1 Refinement)

**Branch**: `001-production-user-auth` | **Date**: 2026-02-24 | **Spec**: `/specs/001-production-user-auth/spec.md`
**Input**: Feature specification from `/specs/001-production-user-auth/spec.md`

## Summary

Replace remaining placeholder authentication behavior with production-ready credential and session handling based on the existing SQLite user model and current React/Express architecture. The implementation introduces bcrypt-backed password hashing, JWT-backed cookie sessions (HttpOnly+Secure+SameSite=Lax) with CSRF protection, strict protected-route redirects to `/login`, successful login redirect to `/dashboard`, visible red auth error alerts, refresh persistence, and one-time email-link password reset with throttling.

## Technical Context

**Language/Version**: TypeScript 5.8.x in strict mode (backend + frontend)  
**Primary Dependencies**: Express 4, React 18, React Router 6, better-sqlite3, bcryptjs, jsonwebtoken, zod  
**Storage**: SQLite (`better-sqlite3`) for user/session/reset data; server-set HttpOnly cookie session transport (frontend uses session endpoints, not direct token reads); existing filesystem for ancillary storage  
**Testing**: Jest (unit/integration) and Playwright (E2E)  
**Target Platform**: Linux-hosted internal web application (Node.js backend + browser frontend)  
**Project Type**: Web application (monorepo with `backend/`, `frontend/`, `e2e/`)  
**Performance Goals**: Meet spec outcomes: successful login-to-dashboard in under 2 seconds for 95% of valid attempts  
**Constraints**: 24-hour absolute session lifetime; HttpOnly Secure cookie with SameSite=Lax; CSRF token validation on state-changing requests; throttling at 5 failed attempts/15 minutes/account+IP; TDD-first; >=80% changed-code coverage  
**Scale/Scope**: Internal employee portal scope focused on US1 auth refinement and related route/session UX

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Story/Spec Traceability**: PASS. Plan maps to US1-US3 refinement scope in `/specs/001-production-user-auth/spec.md`.
- **Strict TypeScript**: PASS. All new auth/session/route-guard contracts remain strict-typed with no ungoverned unsafe typing shortcuts.
- **Documentation Discipline**: PASS. Exported auth services, guards, hooks, and API client surfaces are planned for JSDoc updates.
- **TDD First**: PASS. Execution sequence in quickstart/tasks will require failing tests before implementation.
- **Testing Strategy**: PASS. Plan remains aligned to Unit 70% / Integration 20% / E2E 10%, with no business-logic mocking.
- **Coverage Gate**: PASS. Validation flow includes coverage verification for changed production code at >=80%.

## Project Structure

### Documentation (this feature)

```text
specs/001-production-user-auth/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── openapi.yaml
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
    ├── unit/
    └── integration/

frontend/
├── src/
│   ├── features/
│   │   ├── auth/
│   │   ├── ideas/
│   │   └── evaluation/
│   ├── services/
│   ├── App.tsx
│   └── main.tsx
└── tests/
    └── unit/

e2e/
└── tests/
```

**Structure Decision**: Use the existing frontend/backend split and extend current auth routes/services/hooks instead of introducing new architecture, to keep scope tightly aligned with US1 refinement.

## Phase 0: Research Focus

- Confirm secure bcrypt and JWT usage patterns compatible with existing dependencies.
- Confirm robust cookie-session and CSRF strategy for React + Express.
- Confirm one-time reset-link token handling and invalidation semantics.
- Confirm throttle strategy implementation boundary (account+IP) and testability.

## Phase 1: Design Outputs

- Define auth/session/reset entities and lifecycle transitions.
- Define API contracts for register/login/logout/session check/CSRF/reset flows.
- Define quickstart validation path for TDD-first auth hardening workflow.

## Post-Design Constitution Re-Check

- **Story/Spec Traceability**: PASS. `research.md`, `data-model.md`, `contracts/openapi.yaml`, and `quickstart.md` map directly to clarified FR-001..FR-020.
- **Strict TypeScript**: PASS. Design surfaces are typed and compatible with strict TS settings in both packages.
- **Documentation Discipline**: PASS. Public/exported auth interfaces are identified for JSDoc updates during implementation.
- **TDD First**: PASS. Quickstart explicitly sequences tests-before-code.
- **Testing Strategy**: PASS. Planned verification keeps 70/20/10 distribution target and business-logic non-mocking.
- **Coverage Gate**: PASS. Coverage verification step remains mandatory at >=80% changed-code threshold.
- **Violations/Exceptions**: None.

## Complexity Tracking

No constitutional violations identified at planning stage.
