# ADR 0006: Idea Details Audit Timeline for Evaluation Traceability

- Status: Accepted
- Date: 2026-02-25
- Related initiative: `specs/002-innovateepam-portal`

## Context

Evaluation decisions must be traceable for governance and operational review. Existing status history persistence needs a clear UI policy and role visibility boundary.

## Decision

Expose an Idea Details timeline/history log for evaluator/admin users showing each status transition with actor identity and timestamp. Enforce access control so evaluator/admin-only timeline data is not exposed to unauthorized roles.

## Consequences

### Positive
- Stronger decision traceability and easier review of evaluation lifecycle.
- Clear alignment between persisted status history and user-visible audit information.
- Supports conflict-resolution and accountability workflows.

### Tradeoffs
- Adds UI complexity and permission checks to details view.
- Requires careful formatting/timezone consistency for timestamps.

## Alternatives Considered

- Keep timeline data backend-only with no UI surface:
  - Rejected because operational users need direct traceability during evaluation.
- Show timeline to all authenticated users by default:
  - Rejected due to role-bound visibility and least-privilege requirements.
