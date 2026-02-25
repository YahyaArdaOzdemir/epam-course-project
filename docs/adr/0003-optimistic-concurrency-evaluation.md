# ADR 0003: Optimistic Concurrency for Evaluation Updates

- Status: Accepted
- Date: 2026-02-25
- Related initiative: `specs/002-innovateepam-portal`

## Context

Evaluator/admin users may attempt concurrent updates on the same idea status. Lost updates must be prevented without introducing heavy lock coordination overhead for MVP.

## Decision

Use optimistic concurrency for share/status update endpoints, with version checks and stale-write rejection requiring client refresh and retry.

## Consequences

### Positive
- Prevents silent overwrite of another evaluator decision.
- Avoids complexity and throughput cost of pessimistic locking for MVP scale.

### Tradeoffs
- Client UX must handle conflict responses explicitly.
- API contract/tests must include conflict-path coverage.
