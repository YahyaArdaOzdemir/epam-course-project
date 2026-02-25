# ADR 0002: Idea Visibility and Sharing Policy

- Status: Accepted
- Date: 2026-02-25
- Related initiative: `specs/002-innovateepam-portal`

## Context

The portal requires privacy for submitters by default, while also allowing optional transparency and guaranteed evaluator/admin access for review operations.

## Decision

Adopt the following visibility rules:
- Submitter sees own ideas by default.
- Submitter may opt-in to share individual ideas with all authenticated employees.
- Evaluator/admin can view all ideas regardless of share status.
- Evaluation comments are broadly visible only when idea is shared.

## Consequences

### Positive
- Preserves privacy-by-default behavior for submissions.
- Supports collaboration/transparency when submitter explicitly shares.
- Keeps evaluator workflow unblocked.

### Tradeoffs
- Additional policy checks are required across list/detail/query layers.
- UI must clearly communicate private vs shared states.
