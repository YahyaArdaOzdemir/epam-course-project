# Feature Specification: Production-Ready User Authentication (US1 Refinement)

**Feature Branch**: `001-production-user-auth`  
**Created**: 2026-02-24  
**Status**: Draft  
**Input**: User description: "Implement Production-Ready User Authentication (Refining US1) with real security, protected routes, login success redirect, visible error handling, auth persistence, and password reset."

## Clarifications

### Session 2026-02-24

- Q: Which password reset proof mechanism is required for this feature? → A: One-time, time-limited email link token flow.
- Q: Which session model should be used for persisted authentication? → A: HttpOnly Secure same-site constrained cookie session.
- Q: What absolute authenticated session lifetime is required? → A: 24 hours.
- Q: Which CSRF protection approach is required for cookie-based sessions? → A: SameSite=Lax cookie plus CSRF token validation for state-changing requests.
- Q: What abuse throttling policy is required for failed login/reset attempts? → A: 5 failures per 15 minutes per account and per IP.
- Q: What reset-link token lifetime is required? → A: 30 minutes from issuance.
- Q: Which endpoints are explicitly in CSRF scope for this feature? → A: All authenticated state-changing endpoints, including at minimum `/auth/logout` and authenticated write endpoints under `/ideas` and `/evaluation`.

## Constitution Alignment *(mandatory)*

- **Referenced User Story IDs**: US1, US2, US3
- **Spec Approval Evidence**: This specification is the scope authority for `001-production-user-auth`; implementation starts after workflow approval.
- **TypeScript Strictness Impact**: Authentication domain objects, route guards, and error payloads must remain fully strict-typed with no unsafe typing shortcuts.
- **JSDoc Impact**: Exported authentication services, session guards, and password reset entry points require JSDoc updates.
- **Test-First Plan**: Add failing tests first for login/register/reset flows, protected route redirection, persisted session recovery, and auth error display before implementation.
- **Test Distribution Plan**: Unit 70%, Integration 20%, E2E 10%.
- **Coverage Plan**: All changed production auth code must keep at least 80% line coverage before merge.
- **Mocking Boundaries**: Only external I/O boundaries (database, clock, email delivery boundary) may be faked; credential/session decision logic remains unmocked.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Secure Registration and Login (Priority: P1)

As an employee, I can register and log in with secure credential handling so my account is protected and unauthorized access is prevented.

**Why this priority**: Reliable and secure sign-in is the entry point for all portal value and must be trustworthy before any downstream workflow.

**Independent Test**: Can be fully tested by registering a new account, logging in with valid credentials, and confirming invalid credentials are denied with clear visible errors.

**Acceptance Scenarios**:

1. **Given** a new employee with a valid email and compliant password, **When** they complete registration, **Then** an account is created and they can authenticate.
2. **Given** an existing user with correct credentials, **When** they submit login, **Then** authentication succeeds and they are redirected to `/dashboard`.
3. **Given** an existing user enters a wrong password, **When** they submit login, **Then** access is denied and a visible red error alert explains the failure.
4. **Given** a new user attempts registration with an existing email, **When** they submit the form, **Then** registration is denied and a visible red error alert explains the conflict.

---

### User Story 2 - Guarded Access and Session Persistence (Priority: P2)

As an authenticated user, I can stay signed in across refreshes and be redirected to login immediately if my session is invalid.

**Why this priority**: Users must not re-authenticate unnecessarily, and unauthorized users must not access protected pages.

**Independent Test**: Can be fully tested by logging in, refreshing protected pages, and then invalidating the session to confirm immediate redirection to `/login`.

**Acceptance Scenarios**:

1. **Given** an authenticated user refreshes a protected page, **When** the app reloads with a valid session cookie, **Then** session state is recovered and the user remains on protected content.
2. **Given** a user without a valid session navigates to a protected route, **When** route evaluation occurs, **Then** they are immediately redirected to `/login`.
3. **Given** a user whose session expires while browsing, **When** they attempt to access protected content, **Then** they are redirected to `/login` and shown an error alert indicating session invalidation.

---

### User Story 3 - Password Reset Recovery (Priority: P3)

As a user who cannot sign in, I can reset my password so I can recover account access without manual administrator intervention.

**Why this priority**: Password reset reduces account lockout friction and support burden while preserving account ownership.

**Independent Test**: Can be fully tested by requesting a reset, completing reset with a valid recovery flow, and logging in successfully with the new password while the old password no longer works.

**Acceptance Scenarios**:

1. **Given** a registered user requests password reset, **When** they provide their account email, **Then** a one-time, time-limited email reset link flow is initiated and the user receives neutral confirmation feedback.
2. **Given** a valid, unused reset link is opened and completed with a compliant new password, **When** password reset is submitted, **Then** the user can log in with the new password and not with the old password.
3. **Given** an invalid, expired, or previously used reset link, **When** reset submission occurs, **Then** the reset is denied and a visible red error alert explains that recovery must be retried.

### Edge Cases

- Registration password fails policy checks (minimum length, complexity, or confirmation mismatch).
- Login is attempted with empty credentials or malformed email input.
- Multiple failed login or reset attempts occur in a short time window and trigger throttling.
- Session cookie is missing, expired, tampered, or otherwise invalid.
- User opens a protected route directly in a new tab with no valid active session.
- Password reset is requested for an unknown email and must not reveal account existence.
- User tries to reuse the current password during reset.
- User initiates multiple reset requests and only the latest valid recovery attempt is honored.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST authenticate users using the existing user account records as the single source of identity.
- **FR-002**: System MUST store user passwords only as one-way cryptographic hashes and MUST never store or return plaintext passwords.
- **FR-003**: System MUST verify submitted credentials against stored password hashes during login.
- **FR-004**: System MUST reject registration when the normalized email already exists.
- **FR-005**: System MUST enforce password policy at registration and reset: at least 8 characters, at least one uppercase letter, at least one lowercase letter, at least one digit, and at least one special character.
- **FR-006**: System MUST issue a signed, time-bounded session credential after successful login.
- **FR-006a**: System MUST transmit and persist the session credential as an HttpOnly, Secure, same-site constrained cookie.
- **FR-006b**: System MUST enforce an absolute session lifetime of 24 hours from login issuance.
- **FR-006c**: System MUST require re-authentication once the 24-hour absolute session lifetime expires.
- **FR-006d**: System MUST set authenticated session cookies with SameSite=Lax.
- **FR-007**: System MUST validate session credentials on protected API requests and reject invalid or expired sessions.
- **FR-007a**: System MUST require a valid CSRF token on all state-changing authenticated requests and reject requests with missing or invalid CSRF tokens.
- **FR-007b**: System MUST enforce CSRF token validation for authenticated state-changing endpoints, including at minimum `/auth/logout` and authenticated write operations under `/ideas` and `/evaluation`.
- **FR-008**: System MUST provide route-guard behavior that immediately redirects unauthenticated or invalid sessions to `/login`.
- **FR-009**: System MUST automatically redirect successful login attempts to `/dashboard`.
- **FR-010**: System MUST persist authentication state across page refresh by recovering an active valid session cookie during app initialization.
- **FR-011**: System MUST clear persisted authentication state on logout or on confirmed session invalidation.
- **FR-012**: System MUST display failed login, failed registration, and failed password-reset outcomes as visible red error alerts in the UI.
- **FR-013**: System MUST display user-facing error messages that are specific enough to guide correction without exposing sensitive security details.
- **FR-014**: System MUST provide a password reset request flow that issues a one-time email reset link token with a 30-minute lifetime for users who forgot credentials.
- **FR-015**: System MUST provide a password reset completion flow that accepts new passwords only with a valid, unexpired, unused reset link token.
- **FR-016**: System MUST invalidate all active reset link tokens for that account after a successful password reset.
- **FR-017**: System MUST prevent reuse of invalid, expired, or already consumed reset link tokens.
- **FR-018**: System MUST throttle failed login attempts to a maximum of 5 failures per 15-minute window per account and per source IP.
- **FR-019**: System MUST throttle failed password reset attempts to a maximum of 5 failures per 15-minute window per account and per source IP.
- **FR-020**: System MUST return a user-visible throttling error alert when limits are exceeded and allow retry after the window elapses.

### Assumptions

- Existing user identity is email-based and backed by the current user datastore.
- Session persistence uses HttpOnly Secure cookies supported by browser and backend infrastructure.
- Cookie-session security uses SameSite=Lax and CSRF token validation for state-changing requests.
- Failed login and reset attempts are throttled at 5 per 15 minutes per account and per source IP.
- Session lifetime is absolute 24 hours per login and does not extend beyond that limit.
- Password reset delivery uses project-supported transactional email.
- Account lockout and MFA are out of scope for this refinement and may be covered in a future hardening phase.
- Existing role model and post-login dashboard route remain unchanged beyond authentication reliability improvements.

### Key Entities *(include if feature involves data)*

- **User Account**: Employee identity record with email, password hash, role, and lifecycle status.
- **Session Credential**: Signed, time-bounded proof of authenticated state linked to a user account and persisted via HttpOnly Secure same-site constrained cookie.
- **Password Reset Request**: One-time email reset link token tied to a user, issuance time, expiration, and consumption status.
- **Authentication Error Alert**: User-visible error state containing failure reason category and actionable guidance.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of valid login attempts complete and land on `/dashboard` in under 2 seconds.
- **SC-002**: 100% of unauthorized attempts to access protected routes are redirected to `/login` before protected content is rendered.
- **SC-003**: 95% of active users remain authenticated after a standard page refresh without manual re-login.
- **SC-004**: 100% of invalid login, registration, and reset attempts produce a visible red error alert in the relevant screen.
- **SC-005**: 90% of users who start password reset complete account recovery within 10 minutes in user acceptance testing.
- **SC-006**: Authentication-related support tickets for "cannot log in" decrease by at least 30% in the first release cycle after rollout.
- **SC-007**: In security integration testing, 100% of CSRF-missing or CSRF-invalid requests to scoped authenticated write endpoints are rejected.
- **SC-008**: In security integration testing, 100% of attempts beyond the 5-failures-per-15-minutes threshold return throttling responses and visible UI throttling alerts.
