<!--
Sync Impact Report
- Version change: N/A (template) → 1.0.0
- Modified principles:
	- Principle 1 placeholder → I. Clean Code First
	- Principle 2 placeholder → II. Strict TypeScript and Mandatory JSDoc
	- Principle 3 placeholder → III. Test-Driven Development (NON-NEGOTIABLE)
	- Principle 4 placeholder → IV. Testing Pyramid and Quality Gates
	- Principle 5 placeholder → V. Story- and Spec-Gated Delivery
- Added sections:
	- Engineering Standards
	- Delivery Workflow and Quality Gates
- Removed sections:
	- None
- Templates requiring updates:
	- ✅ updated: .specify/templates/plan-template.md
	- ✅ updated: .specify/templates/spec-template.md
	- ✅ updated: .specify/templates/tasks-template.md
	- ⚠ pending: .specify/templates/commands/*.md (directory not present in repository)
- Deferred items:
	- TODO(RATIFICATION_DATE): Original ratification date is unknown and must be confirmed from project history.
-->

# EPAM Course Project Constitution

## Core Principles

### I. Clean Code First
All production code MUST be readable, cohesive, and intentionally simple. Functions and
modules MUST have a single clear responsibility, avoid hidden side effects, and use
domain-meaningful names. Duplicated logic MUST be refactored at first safe opportunity.
Rationale: maintainability and defect prevention depend on clarity, not accidental
complexity.

### II. Strict TypeScript and Mandatory JSDoc
All TypeScript code MUST compile with strict mode enabled and MUST avoid unsafe escape
hatches (`any`, non-null assertions, and unchecked casts) unless explicitly justified in
the spec and code review. Every exported symbol (function, class, interface, type alias,
and constant used as API surface) MUST include JSDoc describing purpose, parameters,
return values, thrown errors, and side effects where applicable. Rationale: strict typing
and explicit documentation reduce ambiguity and integration risk.

### III. Test-Driven Development (NON-NEGOTIABLE)
TDD is mandatory for all feature work and bug fixes: tests MUST be written before
implementation, MUST fail for the expected reason, and only then implementation may
begin. The red-green-refactor cycle MUST be visible in task ordering and review artifacts.
Rationale: writing tests first validates intent and prevents unverified implementation.

### IV. Testing Pyramid and Quality Gates
The project test portfolio MUST target the pyramid distribution: 70% unit tests,
20% integration tests, and 10% end-to-end tests, measured per feature set over time.
Business logic MUST NOT be mocked; only external I/O boundaries (network, filesystem,
databases, queues, clocks, and third-party services) may be substituted. Minimum line
coverage for changed production code is 80%. Rationale: fast feedback with realistic
verification balances speed and confidence.

### V. Story- and Spec-Gated Delivery
Implementation code MUST NOT be started or generated without a referenced User Story and
an approved spec artifact. Every implementation task MUST trace to a specific story and
acceptance criteria. Rationale: traceability ensures the team builds validated scope
instead of assumptions.

## Engineering Standards

- Language baseline is TypeScript with strict compiler settings enforced in CI.
- Linting and formatting MUST run pre-commit or in CI for every pull request.
- Public and shared internal APIs MUST remain documented with JSDoc as code evolves.
- Architectural decisions that relax these standards MUST be documented in the spec with
	explicit risk and rollback plan.

## Delivery Workflow and Quality Gates

- Work sequence is mandatory: User Story → Spec → Plan → Tasks → Tests (failing) →
	Implementation → Refactor → Validation.
- Pull requests MUST include links to the governing story/spec and evidence that tests
	were authored before implementation.
- Reviews MUST reject changes that violate strict typing, JSDoc requirements, TDD order,
	mocking policy, or minimum coverage.
- Release readiness requires passing automated checks and explicit confirmation that the
	test mix trend remains aligned with the pyramid target.

## Governance

This constitution is the highest-priority engineering policy for this repository.
Amendments MUST be proposed in a pull request that includes rationale, impacted
templates/docs, migration actions, and version bump justification.

Versioning policy for this constitution follows semantic versioning:
- MAJOR: incompatible governance changes or principle removal/redefinition.
- MINOR: new principle/section or materially expanded mandatory guidance.
- PATCH: wording clarifications, typo fixes, and non-semantic refinements.

Compliance review expectations:
- Every feature plan MUST include a Constitution Check against all principles.
- Every task list MUST encode TDD-first sequencing and story traceability.
- Reviewers and maintainers MUST block merge until constitutional violations are resolved
	or an approved exception is documented.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): Original adoption date unknown. | **Last Amended**: 2026-02-24
