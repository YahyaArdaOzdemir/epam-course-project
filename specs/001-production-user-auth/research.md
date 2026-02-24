# Phase 0 Research: Production-Ready User Authentication (US1 Refinement)

## Decision 1: Password hashing algorithm and cost policy
- Decision: Use `bcrypt` via existing `bcryptjs` with a cost factor of 12 for registration and password reset writes.
- Rationale: Meets the feature’s “real security” requirement with battle-tested adaptive hashing while staying compatible with current dependency set and runtime model.
- Alternatives considered:
  - Argon2: stronger modern default but not currently in dependency baseline and out-of-scope for this refinement.
  - PBKDF2: viable but less aligned with existing codebase direction and auth hardening request.

## Decision 2: Session transport and persistence model
- Decision: Issue JWT session credentials and persist them as HttpOnly, Secure, SameSite=Lax cookies with absolute 24-hour lifetime.
- Rationale: Satisfies clarified requirements for persistence across refresh, immediate protected-route denial when invalid, and reduced XSS token exposure versus localStorage bearer tokens.
- Alternatives considered:
  - Bearer token in localStorage: rejected due to higher XSS exfiltration risk.
  - In-memory only sessions: rejected because refresh persistence is a hard requirement.

## Decision 3: CSRF protection for cookie-authenticated state changes
- Decision: Enforce CSRF token validation on all state-changing authenticated endpoints using a server-issued token and client header echo.
- Rationale: SameSite=Lax reduces cross-site exposure but does not eliminate CSRF risk across all browser/navigation patterns; explicit token validation closes this gap.
- Alternatives considered:
  - SameSite-only protection: rejected as insufficient defense depth.
  - SameSite=None + CORS only: rejected as weaker and unnecessary for this internal app.

## Decision 4: Password reset token model
- Decision: Use one-time, time-limited email reset link tokens; persist only token hashes with status (`issued`, `consumed`, `expired`), and invalidate all active reset tokens on successful password change.
- Rationale: Aligns with clarified reset flow and limits blast radius if reset storage is exposed.
- Alternatives considered:
  - Reusable reset links: rejected for replay risk.
  - Numeric OTP-only flow: rejected by clarification outcome.

## Decision 5: Abuse throttling boundary
- Decision: Apply throttling at 5 failed attempts per 15-minute window per account and per source IP for login and reset attempts.
- Rationale: Matches clarification and creates practical protection against brute-force and reset abuse without introducing hard account lockout complexity.
- Alternatives considered:
  - No throttling: rejected as unacceptable for production security.
  - Hard lockout requiring admin unlock: rejected for high operational friction and recovery overhead.

## Decision 6: Protected route enforcement in frontend
- Decision: Introduce centralized `ProtectedRoute` gate that verifies active session state and redirects to `/login` immediately before rendering protected content.
- Rationale: Prevents duplicated page-level checks and ensures consistent unauthorized behavior across all protected routes.
- Alternatives considered:
  - Per-page inline checks: rejected due to drift risk and inconsistent UX.
  - Backend-only enforcement without frontend guards: rejected because immediate redirect behavior is a UX requirement.

## Decision 7: Error presentation contract
- Decision: Standardize auth failure payloads to map to visible red in-page alerts for login, registration, session invalidation, reset failures, and throttling.
- Rationale: Directly satisfies UI error requirement and improves correction clarity without leaking sensitive details.
- Alternatives considered:
  - Generic single error message for all failures: rejected for poor user guidance.
  - Console-only/client-silent failures: rejected by requirement.

## Final implementation sync notes (2026-02-24)
- Added integration conformance checks for `/auth/session`, `/auth/csrf`, and reset confirm error contract behavior.
- Added cookie-session regression coverage for duplicate registration, cookie issuance attributes, and protected-route denial after invalid session.
- Added frontend unit checks for red auth alerts (login/register/reset), protected-route redirects, and refresh recovery behavior.
- Added reset token lifecycle unit/integration checks to cover valid use, expiry denial, and reuse denial.
- Reinforced auth coverage gates in Jest with auth-focused threshold entries aligned to >=80% policy.
