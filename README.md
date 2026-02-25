# InnovatEPAM Portal

InnovatEPAM Portal is an internal employee innovation management platform.

Core MVP goals (Phase 1):
- User management (register/login/logout, role distinction)
- Idea submission (title/description/category + optional single attachment)
- Idea listing and viewing
- Evaluation workflow (status updates and accept/reject with comments)

This repository follows a spec-driven workflow defined by your constitution and active initiative docs.

## Repository Structure

- `backend/` — Express + TypeScript API + SQLite access
- `frontend/` — React + TypeScript UI (Vite)
- `e2e/` — Playwright test specs
- `specs/` — initiative specs (`001-*`, active consolidated baseline `002-*`)
- `docs/adr/` — architecture decision records
- `.specify/memory/constitution.md` — engineering governance and quality gates

## Active Initiative Baseline

Use `specs/002-innovateepam-portal/` as your active scope source:
- `spec.md` — business requirements and acceptance criteria
- `plan.md` — technical approach and constraints
- `tasks.md` — TDD-first execution order
- `contracts/openapi.yaml` — API contract baseline
- `checklists/` — evidence and readiness tracking

## Workflow (What to do each feature slice)

1. Review requirements and active story in `specs/002-innovateepam-portal/spec.md`
2. Update `spec.md` / `plan.md` / `tasks.md` as needed
3. Write tests first and verify RED
4. Implement code (minimal, traceable to tasks)
5. Run tests to GREEN and verify coverage
6. Commit with meaningful message and push

Detailed guide: `WORKFLOW_EXPECTATIONS.md`.

## Setup

### Prerequisites
- Node.js 20+
- npm 10+

### Install dependencies
```bash
npm install
```

### Start backend + frontend in development
```bash
npm run dev
```

Default endpoints:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

## Testing

### Unit tests
```bash
npm run test:unit
```

### Integration tests
```bash
npm run test:integration
```

### Combined test command
```bash
npm test
```

### E2E tests
```bash
npm run test:e2e
```

### Coverage
```bash
npm run test:coverage
```

## Build

```bash
npm run build
```

## ADR Guidance

Document architecture decisions in `docs/adr/` whenever you:
- choose or change technical direction,
- accept tradeoffs,
- or introduce constraints that affect future implementation.

Start with the ADR index: `docs/adr/README.md`.

## Current Known Focus Areas

From active `002` tasks, the main remaining focus is:
- US4 dashboard/global shell/error-feedback completion
- Cross-cutting quality/hardening checks

See: `specs/002-innovateepam-portal/tasks.md`.
