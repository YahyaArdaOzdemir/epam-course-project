# Phase 0 Research: InnovatEPAM Portal (Consolidated)

## 1) Authentication model and account scope

- Decision: Use local email/password authentication with approved corporate-domain allowlist and role model `submitter|admin`.
- Rationale: Satisfies MVP internal-access needs without adding IdP/OAuth operational complexity.
- Alternatives considered:
	- External SSO/OIDC integration: deferred to post-MVP due to setup and environment coupling.
	- Open self-signup without domain policy: rejected for security/compliance risk.

## 2) Credential and password lifecycle

- Decision: Store passwords as bcrypt hashes (`bcryptjs`); require confirm-password matching on registration and reset-confirm; enforce policy (min 8 + upper/lower/digit/special).
- Rationale: Meets FR security baseline with explicit anti-mismatch checks and predictable validation.
- Alternatives considered:
	- Plain hash without adaptive cost: rejected as insufficient hardening.
	- Password policy at UI only: rejected because server-side enforcement is mandatory.

## 3) Session and CSRF model

- Decision: Use HttpOnly Secure SameSite=Lax cookie session with absolute 24-hour lifetime + session-bound CSRF tokens for authenticated state-changing routes.
- Rationale: Enables refresh persistence and robust web security with cookie-based auth.
- Alternatives considered:
	- localStorage bearer tokens: rejected due to stronger XSS exposure.
	- SameSite-only without CSRF token: rejected as incomplete defense for state-changing endpoints.

## 4) Password reset mechanism

- Decision: One-time email reset link token with 30-minute TTL; token hash storage; invalidate all active reset tokens after successful reset.
- Rationale: Reduces replay window and ensures account recovery consistency.
- Alternatives considered:
	- Reusable reset token: rejected due to replay risk.
	- OTP-only reset: deferred; link-token flow is already established in API/UI.

## 5) Abuse throttling strategy

- Decision: Throttle login and password-reset failures to 5 attempts per 15 minutes by account and source IP.
- Rationale: Practical brute-force mitigation for MVP while avoiding lockout support overhead.
- Alternatives considered:
	- Permanent account lockouts: rejected due to high operational burden.
	- IP-only throttling: rejected because account-level abuse remains possible.

## 6) Submission storage and upload policy

- Decision: Store metadata in SQLite and files in local uploads directory; enforce one attachment max, MIME+extension allowlist, and inclusive 10 MiB limit.
- Rationale: Keeps infrastructure simple while satisfying strict file safety constraints.
- Alternatives considered:
	- Object storage (S3/Blob) now: deferred for MVP complexity reasons.
	- Extension-only validation: rejected due to spoofing risk.

## 7) Listing query model (pagination/filter/sort)

- Decision: Use server-side pagination for idea listings; support filter by `status`, `category`, and date range; support sort by date (`Newest|Oldest`) and status.
- Rationale: Prevents unbounded list rendering and yields deterministic query behavior for large datasets.
- Alternatives considered:
	- Client-side full-list sorting/filtering: rejected for scale and authorization concerns.
	- Infinite scroll without explicit pagination contract: rejected for predictability and accessibility reasons.

## 8) Evaluation concurrency and traceability

- Decision: Keep optimistic concurrency for share/status updates (stale-write rejection) and expose admin-visible timeline/history entries (status change, actor, timestamp).
- Rationale: Prevents lost updates and provides auditable UI traceability for evaluation actions.
- Alternatives considered:
	- Pessimistic locking: rejected due to operational and UX overhead.
	- Backend-only audit with no timeline UI: rejected because admins need in-flow traceability.

## 9) Protected shell and dashboard role behavior

- Decision: Require shared protected layout across dashboard/submit/details with fixed header content and active-nav state; dashboard widgets are role-specific.
- Rationale: Reduces page drift and keeps role context consistently visible.
- Alternatives considered:
	- Page-local duplicated headers/nav: rejected for consistency and maintenance risk.
	- Single generic dashboard for all roles: rejected because it weakens task focus.

## 10) UX feedback safety model

- Decision: Standardize on shared Alert component: red persistent errors (UI-visible, not console-only), green success auto-dismiss within 3–5s, disable-submit/loading/re-enable-on-failure on primary forms.
- Rationale: Improves recoverability and prevents duplicate submissions.
- Alternatives considered:
	- Mixed bespoke alert/toast approaches: rejected for inconsistency.
	- Console logging as primary error channel: rejected as insufficient UX feedback.

## 11) Accessibility baseline

- Decision: Enforce keyboard-operable primary flows (Tab/Enter/Space), ARIA labels/roles for forms+alerts, and focus transfer to error alert on submit failure.
- Rationale: Ensures core workflows are accessible and testable in CI/E2E.
- Alternatives considered:
	- Best-effort accessibility without explicit requirements: rejected due to high regression risk.
	- Post-release remediation: rejected due to higher cost and user impact.

## 12) Verification strategy

- Decision: Maintain TDD-first workflow and pyramid target (70/20/10) with >=80% changed-code line coverage.
- Rationale: Aligns with constitution and existing repository test harness.
- Alternatives considered:
	- E2E-heavy strategy: rejected due to speed/maintenance tradeoffs.
	- Relaxed coverage gate: rejected because it weakens release confidence.