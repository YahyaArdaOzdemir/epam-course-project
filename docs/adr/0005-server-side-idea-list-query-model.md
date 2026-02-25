# ADR 0005: Server-Side Idea Listing Query Model

- Status: Accepted
- Date: 2026-02-25
- Related initiative: `specs/002-innovateepam-portal`

## Context

Idea listing volume can grow significantly, and unbounded client rendering or ad hoc query behavior creates performance and consistency risks. The product also requires predictable filtering and sorting semantics.

## Decision

Use server-side pagination for idea listings and standardize query parameters for filtering and sorting. Supported filters are `status`, `category`, and submission date range. Supported sorts are date (`Newest`, `Oldest`) and status. Unbounded infinite scroll is not part of the baseline for large datasets.

## Consequences

### Positive
- Stable performance for large datasets.
- Deterministic, testable list behavior across submitter and evaluator/admin contexts.
- Better backend control over authorization and query validation.

### Tradeoffs
- Additional API/query-contract complexity and validation paths.
- Requires backend indexing and pagination metadata support.

## Alternatives Considered

- Client-side filtering/sorting over full dataset:
  - Rejected due to memory/performance and authorization leakage risks.
- Infinite scrolling without strict server pagination contract:
  - Rejected for predictability and accessibility concerns.
