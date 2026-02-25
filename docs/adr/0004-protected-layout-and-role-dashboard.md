# ADR 0004: Protected Layout Shell and Role-Aware Dashboard

- Status: Accepted
- Date: 2026-02-25
- Related initiative: `specs/002-innovateepam-portal`

## Context

Protected routes currently depend on page-level composition, which risks inconsistent headers/navigation and weak role context across Dashboard, Submit, and Idea Details screens.

## Decision

Adopt a shared protected layout component (app shell) for all protected pages. The shell must render a persistent header with product name, authenticated user email, role badge (`Submitter` or `Admin`), logout action, and active-route navigation indication. Dashboard content is role-aware: submitter sees `Submit New Idea` CTA + `My Ideas` summary; evaluator/admin sees `Evaluation Queue` summary + `Recent Decisions` quick links.

## Consequences

### Positive
- Consistent protected-page UX and lower risk of missing critical account controls.
- Clear role context on every protected screen.
- Reusable layout contract simplifies route additions and testing.

### Tradeoffs
- Requires coordinated route composition and shared prop contracts across protected views.
- Header/nav regressions become cross-cutting and require centralized test coverage.

## Alternatives Considered

- Per-page header implementation:
  - Rejected due to duplication and drift risk.
- Role-aware dashboard implemented via ad hoc conditional fragments:
  - Rejected due to weaker type safety and maintainability.
