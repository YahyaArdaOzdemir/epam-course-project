# ADR 0008: Accessibility Baseline for Keyboard, ARIA, and Focus Management

- Status: Accepted
- Date: 2026-02-25
- Related initiative: `specs/002-innovateepam-portal`

## Context

Primary workflows must be usable beyond pointer interactions. Without explicit accessibility rules, keyboard and assistive-technology users can be blocked during submission and error recovery.

## Decision

Establish an accessibility baseline requiring keyboard operability (Tab/Enter/Space) for Login, Register, Submit Idea, and Evaluate flows; proper ARIA roles/labels for form controls and alerts; and focus management that moves focus to the visible error alert after failed submission. Use alert announcement semantics with assertive behavior for errors and polite behavior for success.

## Consequences

### Positive
- Improves usability and recoverability for keyboard and screen-reader users.
- Enables deterministic accessibility testing in CI and E2E suites.
- Reduces accessibility regressions in core workflows.

### Tradeoffs
- Requires ongoing semantic QA and focus-order maintenance as UI evolves.
- Some custom components may need refactoring to preserve native accessibility behaviors.

## Alternatives Considered

- Accessibility as best-effort without explicit requirements:
  - Rejected due to high regression risk and inconsistent UX.
- Post-release accessibility retrofit:
  - Rejected because remediation cost and user impact are significantly higher.
