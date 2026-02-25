# ADR 0007: Standardized Alerts and Interaction Safety Controls

- Status: Accepted
- Date: 2026-02-25
- Related initiative: `specs/002-innovateepam-portal`

## Context

Inconsistent feedback patterns can make workflows brittle: users may miss failures, trigger duplicate actions, or lose confidence when only console logs capture errors.

## Decision

Use a shared Alert component for user feedback across protected flows. Error conditions (including API/auth/4xx/5xx) are rendered as visible red in-page alerts and remain persistent until dismissal/retry/successful follow-up. Success feedback uses green alerts with auto-dismiss behavior (target window: 3-5 seconds). All key forms (Login, Register, Submit Idea, Evaluate) must disable submit on request start, show a loading indicator, prevent duplicate in-flight submissions, and re-enable controls on failure.

## Consequences

### Positive
- Predictable, testable feedback behavior with reduced duplicate-submit risk.
- Better error discoverability and recovery speed.
- Improved UX consistency across flows.

### Tradeoffs
- Shared component contract must support varied message lifecycles and severities.
- Requires strict async state handling to avoid stale loading/disabled states.

## Alternatives Considered

- Per-feature custom toasts/alerts:
  - Rejected due to inconsistent behavior and maintenance burden.
- Console-only error logging plus minimal UI hints:
  - Rejected as insufficient for production usability.
