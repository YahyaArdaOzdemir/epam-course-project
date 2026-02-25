# Phase 0 Research: InnovatEPAM Portal (Consolidated)

## Decision 1: Authentication model and account scope
- Decision: Use local email/password auth restricted to approved corporate domains with role-based authorization.
- Rationale: Preserves internal-only access and supports self-service onboarding without external identity dependency.

## Decision 2: Credential security baseline
- Decision: Store passwords with bcrypt (`bcryptjs`) using adaptive cost policy and verify only against hashes.
- Rationale: Production-ready credential handling aligned to auth hardening scope.

## Decision 3: Session transport and persistence
- Decision: Use HttpOnly, Secure, SameSite=Lax cookie sessions with absolute 24-hour lifetime and explicit revoke on logout.
- Rationale: Refresh persistence is required while reducing XSS token exfiltration risk versus localStorage bearer tokens.

## Decision 4: CSRF protection
- Decision: Enforce session-bound CSRF token validation for authenticated state-changing routes.
- Rationale: Cookie auth requires explicit anti-CSRF defense depth beyond SameSite defaults.

## Decision 5: Password reset model
- Decision: Use one-time email reset link tokens with 30-minute expiration; store token hashes and invalidate all active reset tokens on successful reset.
- Rationale: Satisfies recovery requirements while limiting replay risk.

## Decision 6: Abuse throttling model
- Decision: Apply throttling at 5 failed attempts per 15-minute window per account and per source IP for login and reset actions.
- Rationale: Practical brute-force and abuse mitigation for MVP without hard lockout complexity.

## Decision 7: Backend architecture
- Decision: Keep route -> controller -> service -> repository layering with shared validation middleware.
- Rationale: Maintains strict type boundaries and testability under current codebase style.

## Decision 8: Submission storage and upload handling
- Decision: Persist metadata in SQLite and binaries in local `/uploads`; enforce single-file, MIME+extension, and 10 MiB inclusive boundary at API layer.
- Rationale: Minimal infrastructure complexity with explicit policy compliance.

## Decision 9: Evaluation concurrency strategy
- Decision: Use optimistic concurrency (`rowVersion`/If-Match style check) and reject stale writes with refresh/retry guidance.
- Rationale: Prevents lost updates without pessimistic lock overhead.

## Decision 10: Frontend protection and UX consistency
- Decision: Centralize protected-route guard, shared authenticated shell, and standardized visible red error alerts.
- Rationale: Eliminates per-page auth drift and enforces explicit feedback standards.

## Decision 11: Test and quality gate strategy
- Decision: Keep TDD-first with Jest + Playwright and enforce unit/integration/E2E balance plus changed-code >=80% coverage.
- Rationale: Aligns with project constitution and existing automation layout.

## Deferred/Follow-up Security Hardening
- Explicit secret rotation policy and security audit log schema remain tracked as post-baseline hardening items.
- IP attribution rules for proxied deployments remain an explicit environment assumption that requires operational policy lock.