# ADR Index

This directory stores Architecture Decision Records (ADRs) for InnovatEPAM Portal.

## How to use

- Add one ADR per meaningful technical decision.
- Keep ADRs immutable once accepted; create a new ADR to supersede old decisions.
- Use sequential numbering: `0001-...md`, `0002-...md`, etc.

## Status values

- Proposed
- Accepted
- Superseded
- Deprecated

## ADRs

- [0001 - Cookie Session + CSRF Auth Model](0001-cookie-session-csrf-auth-model.md) — Accepted
- [0002 - Idea Visibility and Sharing Policy](0002-idea-visibility-sharing-policy.md) — Accepted
- [0003 - Optimistic Concurrency for Evaluation Updates](0003-optimistic-concurrency-evaluation.md) — Accepted
- [0004 - Protected Layout Shell and Role-Aware Dashboard](0004-protected-layout-and-role-dashboard.md) — Accepted
- [0005 - Server-Side Idea Listing Query Model](0005-server-side-idea-list-query-model.md) — Accepted
- [0006 - Idea Details Audit Timeline for Evaluation Traceability](0006-idea-details-audit-timeline.md) — Accepted
- [0007 - Standardized Alerts and Interaction Safety Controls](0007-standardized-alerts-and-interaction-safety.md) — Accepted
- [0008 - Accessibility Baseline for Keyboard, ARIA, and Focus Management](0008-accessibility-baseline-keyboard-aria-focus.md) — Accepted

## Implementation Traceability (2026-02-25)

- Spec/task implementation evidence is tracked in [../../specs/002-innovateepam-portal/tasks.md](../../specs/002-innovateepam-portal/tasks.md) (all tasks marked complete).
- Release readiness evidence is tracked in [../../specs/002-innovateepam-portal/checklists/release-readiness.md](../../specs/002-innovateepam-portal/checklists/release-readiness.md).
- Coverage gate evidence is tracked in [../../specs/002-innovateepam-portal/checklists/coverage-report.md](../../specs/002-innovateepam-portal/checklists/coverage-report.md), with latest passing metrics: Statements `82.55%`, Lines `82.06%`.
