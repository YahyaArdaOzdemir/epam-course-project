# Feature Specification: InnovatEPAM Portal (Consolidated Baseline)

**Feature Branch**: `002-innovateepam-portal`  
**Created**: 2026-02-25  
**Status**: Draft  
**Input**: User description: "Create the InnovatEPAM Portal (internal employee innovation management platform where employees submit ideas and admins evaluate them) with User Management, Idea Submission System, and Evaluation Workflow."

## Clarifications

### Session 2026-02-24

- Q: Which authentication model should be used for MVP? → A: Local account auth with email/password registration restricted to approved corporate email domains.
- Q: What should idea listing visibility be for submitters? → A: Submitters see their own ideas by default and can optionally share idea visibility with all employees.
- Q: How should concurrent admin updates be handled? → A: Use optimistic concurrency checks and reject stale updates with refresh/retry guidance.
- Q: What attachment formats and size limit should MVP support? → A: Allow PDF, DOCX, PPTX, PNG, and JPG files up to 10 MiB (10,485,760 bytes), inclusive.
- Q: Who can view evaluation comments? → A: When an idea is shared, evaluation comments are visible to all authenticated employees.
- Q: Which session model should be used for persisted authentication? → A: HttpOnly Secure SameSite=Lax cookie session with absolute 24-hour lifetime.
- Q: Which CSRF policy applies? → A: SameSite=Lax cookie plus CSRF token validation for authenticated state-changing requests.
- Q: Which password reset mechanism is required? → A: One-time, time-limited email link token flow (30-minute lifetime).
- Q: Which abuse throttling policy applies? → A: 5 failed attempts per 15 minutes per account and per source IP for login and password reset.

## Constitution Alignment *(mandatory)*

- **Referenced User Story IDs**: US1, US2, US3, US4
- **Spec Approval Evidence**: This specification is the authoritative scope artifact for `002-innovateepam-portal`; new planning and implementation updates continue from this baseline.
- **TypeScript Strictness Impact**: Feature behavior and data rules must be expressible under strict typing, with no ungoverned unsafe typing shortcuts.
- **JSDoc Impact**: All exported APIs introduced for authentication, idea submission, listing, status updates, and evaluation actions require complete JSDoc.
- **Test-First Plan**: For each story, tests are authored first, executed to fail for expected reasons, then implementation begins.
- **Test Distribution Plan**: This feature targets Unit 70%, Integration 20%, E2E 10%.
- **Coverage Plan**: Changed production code must maintain at least 80% line coverage before merge.
- **Mocking Boundaries**: Only external I/O boundaries may be mocked/faked; business logic evaluation and status rules remain unmocked in tests.
- **Story Coverage Integrity**: Functional requirements map to existing stories with no orphan scope items (US1 auth/recovery, US2 submission/listing query, US3 evaluation/audit, US4 shell/ux/a11y).

## User Scenarios & Testing *(mandatory)*


### User Story 1 - Production-Ready Access and Account Recovery (Priority: P1)

As an employee, I can securely register, log in, recover my password, and stay authenticated across refreshes so I can reliably access role-appropriate portal capabilities.

**Why this priority**: Secure and reliable authentication is the foundation for all idea and evaluation workflows.

**Independent Test**: Can be fully tested by registering/logging in, validating role restrictions, refreshing protected routes with active session, verifying invalid-session redirects, and completing password reset.

**Acceptance Scenarios**:

1. **Given** a new employee without an account, **When** they submit valid approved-domain registration details, **Then** an account is created with default submitter role and they can authenticate.
2. **Given** a new employee without an account, **When** they submit registration details with `fullName`, approved-domain email, password, and matching confirm password, **Then** registration succeeds and the account stores the provided full name.
3. **Given** valid credentials, **When** login succeeds, **Then** a secure cookie session is issued and the user is redirected to `/dashboard`.
4. **Given** an authenticated submitter, **When** they attempt admin-only actions, **Then** access is denied and no admin action is performed.
5. **Given** an authenticated user refreshes a protected page, **When** the session remains valid, **Then** they remain authenticated without manual re-login.
6. **Given** a user with invalid or expired session, **When** they navigate to protected routes, **Then** they are redirected to `/login` before protected content renders.
7. **Given** a user requests password reset, **When** they complete reset with a valid one-time token, new password, and matching confirm password, **Then** they can log in with the new password and not the old password.

---

### User Story 2 - Submit and View Ideas (Priority: P2)

As a submitter, I can create ideas with title, description, category, and one optional attachment, and I can view my submitted ideas.

**Why this priority**: This is the core business flow that captures employee innovation proposals.

**Independent Test**: Can be fully tested by logging in as submitter, submitting ideas with and without an attachment, verifying listing metadata/status, and validating pagination/filter/sort behavior in list views.

**Acceptance Scenarios**:

1. **Given** an authenticated submitter on the idea form, **When** they provide title, description, category selected from the category dropdown, and optionally one file, **Then** the idea is saved with status `Submitted` and appears in the list.
2. **Given** an authenticated submitter, **When** they upload more than one file for a single idea, **Then** submission is rejected with a clear validation message.
3. **Given** an authenticated submitter, **When** they upload an unsupported file type or a file larger than 10 MiB (10,485,760 bytes), **Then** submission is rejected with a clear validation message.
4. **Given** an authenticated submitter, **When** they attempt to submit category input outside the allowed dropdown values (`Process Improvement`, `Product Feature`, `Cost Saving`, `Other`), **Then** submission is rejected with a clear validation message.
5. **Given** an authenticated submitter with many ideas, **When** they browse listing pages, **Then** results are returned via server-side pagination with deterministic page size and navigation controls.
6. **Given** an authenticated submitter on idea listing, **When** they apply filters for status, category, and date range, **Then** only matching ideas are returned.
7. **Given** an authenticated submitter on idea listing, **When** they sort by date (`Newest`/`Oldest`) or status, **Then** list order updates correctly and consistently.

---

### User Story 3 - Evaluate and Decide Ideas (Priority: P3)

As an admin, I can review submitted ideas, move them through review states, and issue accept/reject decisions with comments.

**Why this priority**: Evaluation workflow converts submissions into actionable outcomes and closes the innovation loop.

**Independent Test**: Can be fully tested by logging in as admin, selecting submitted ideas, updating status to `Under Review`, then `Accepted` or `Rejected` with comments, confirming updates are visible in listings, and validating idea-details timeline entries.

**Acceptance Scenarios**:

1. **Given** an admin viewing a `Submitted` idea, **When** they start evaluation, **Then** status changes to `Under Review`.
2. **Given** an admin reviewing an idea, **When** they choose `Accepted` or `Rejected` and provide comments, **Then** the decision and comments are saved and visible to relevant users.
3. **Given** two admins update the same idea concurrently, **When** one update becomes stale, **Then** the stale update is rejected and the user is prompted to refresh and retry.
4. **Given** an idea is shared by its submitter, **When** an admin finalizes with comments, **Then** all authenticated employees can view those evaluation comments in the shared view.
5. **Given** an admin opens idea details, **When** they view the timeline/history log, **Then** they can see status-change entries with actor identity and timestamp.
6. **Given** a non-admin user opens idea details, **When** timeline/history is permissioned for admins, **Then** admin-only timeline controls/data are not exposed.

---

### User Story 4 - Post-Login Workspace and Global UX Feedback (Priority: P2)

As an authenticated employee, I can land on a clear dashboard and navigate with persistent account context, while all form/API failures are shown as visible red UI alerts.

**Why this priority**: Functional workflows are complete, but usability and clarity are not sufficient for day-to-day adoption without a post-login home and explicit UI feedback.

**Independent Test**: Can be fully tested by logging in, verifying redirect to dashboard, confirming persistent header with signed-in email/logout, validating keyboard-only flow completion, and provoking validation failures to confirm visible red alerts with managed focus.

**Acceptance Scenarios**:

1. **Given** a user successfully authenticates, **When** login completes, **Then** they are redirected to a post-login dashboard with role-appropriate actions.
2. **Given** an authenticated user navigates between protected pages (`/dashboard`, idea submit, idea details), **When** each page renders, **Then** each page is wrapped in the same shared protected layout component.
3. **Given** an authenticated user is on any protected page, **When** page content loads, **Then** the global header displays product name, signed-in user email, user role badge (`Submitter` or `Admin`), and logout action.
4. **Given** an authenticated user navigates using protected-page navigation, **When** the current route is active, **Then** the matching navigation item is visually indicated as active.
5. **Given** an authenticated user with `submitter` role opens `/dashboard`, **When** dashboard widgets load, **Then** they see a prominent `Submit New Idea` CTA and a `My Ideas` summary widget showing counts for their own ideas.
6. **Given** an authenticated user with admin role opens `/dashboard`, **When** dashboard widgets load, **Then** they see an `Evaluation Queue` summary count and `Recent Decisions` quick links.
7. **Given** dashboard shell and role widgets are implemented in the frontend, **When** TypeScript strict mode checks component contracts, **Then** props for layout and dashboard widgets are defined with explicit strict TypeScript interfaces/types and pass compilation without unsafe typing shortcuts.
8. **Given** a form/API request fails validation or authorization, **When** the response returns an error, **Then** a visible red alert with actionable message is shown in-page (not console-only).
9. **Given** a user submits a form, **When** request is pending, **Then** submit action is disabled and loading state is visible to prevent duplicate submits.
10. **Given** a user double-clicks a form submit action, **When** the first click starts a pending request, **Then** only one network request is sent and no duplicate action is created.
11. **Given** a protected-page API call returns HTTP 500, **When** the UI receives the error response, **Then** a visible red error alert is rendered in-page and not only logged to browser console.
12. **Given** a state-changing action succeeds, **When** the success response is rendered, **Then** a green success alert is displayed using the shared alert component and may auto-dismiss.
13. **Given** a keyboard-only user (Tab/Enter/Space) executes Login, Submit Idea, or Evaluate flows, **When** controls are operated without mouse input, **Then** each flow is fully completable with correct focus order and actionable controls.
14. **Given** a form submission fails, **When** the error alert is rendered, **Then** keyboard focus moves to the visible alert region so screen-reader and keyboard users are notified immediately.
15. **Given** form inputs and alerts are rendered, **When** assistive technologies inspect semantics, **Then** inputs expose proper labels and alerts expose appropriate ARIA roles.
16. **Given** an authenticated user views protected-shell identity context, **When** dashboard and header identity labels render, **Then** user-facing identity uses account `fullName` (not raw internal GUID values) with fallback-safe formatting.
17. **Given** an authenticated user clicks their header email identity link, **When** profile view opens, **Then** the UI shows full name, email, and role plus a dedicated logout action.
18. **Given** an authenticated user logs out from shell header or profile view, **When** logout succeeds, **Then** the user is redirected to public landing page `/`.
19. **Given** `My Ideas` or `Evaluation Queue` has zero results, **When** page content renders, **Then** a visible empty-state message and a context-appropriate CTA are shown.
20. **Given** users interact with primary/secondary buttons, **When** pointer hover or active press occurs, **Then** controls show visible hover and active feedback states.

---

### Edge Cases


- Registration is attempted with an email already used by another account.
- Registration is attempted with an email outside approved corporate domains.
- Login is attempted with invalid credentials repeatedly.
- Throttle window is exceeded for login or password reset attempts.
- Password reset is requested for unknown emails and must not reveal account existence.
- Password reset token is expired, reused, or invalid.
- A submitter tries to submit an idea missing one or more required fields.
- A submitter attempts to upload an empty, unsupported, or oversized file (greater than 10 MiB / 10,485,760 bytes).
- A submitter uploads a file exactly 10 MiB and it is accepted.
- An admin tries to evaluate an idea that was already finalized.
- Concurrent admin actions occur on the same idea.
- A non-admin user attempts to call admin-only actions directly.
- Session expires during idea submission or evaluation.
- Session expires while user navigates from dashboard to feature pages.
- Global header data is stale after role/session changes and must refresh on re-authentication.
- Multiple rapid submits occur on the same form and should not create duplicate actions.
- Protected pages render without role badge in header and must fail shell acceptance checks.
- Protected-page navigation does not visually mark the active route and causes ambiguous location context.
- Dashboard widgets are shown to the wrong role (submitter sees admin widgets or admin misses queue/decision widgets).
- Listing requests bypass server-side pagination and attempt to render excessive unpaged result sets.
- Listing date-range filter uses invalid bounds (end before start) and must return actionable validation.
- Keyboard-only user cannot reach or trigger primary submit/evaluate controls.
- Failed form submission does not move focus to the error alert region, reducing recoverability for keyboard/screen-reader users.

## Requirements *(mandatory)*


### Functional Requirements

- **FR-001**: System MUST allow employees to register local accounts using required `fullName`, unique normalized-lowercase corporate email identity, password, and confirm-password credentials.
- **FR-002**: System MUST allow registration only for approved corporate email domains sourced from a centrally managed allowlist.
- **FR-003**: System MUST store passwords only as one-way cryptographic hashes and MUST never store or return plaintext passwords.
- **FR-004**: System MUST enforce password policy at registration and reset: minimum 8 chars with uppercase, lowercase, digit, and special character.
- **FR-005**: System MUST reject duplicate normalized email registration attempts.
- **FR-006**: System MUST authenticate users by validating submitted credentials against stored password hashes.
- **FR-007**: System MUST issue authenticated session credentials as HttpOnly, Secure, SameSite=Lax cookies.
- **FR-008**: System MUST enforce an absolute authenticated session lifetime of 24 hours from login.
- **FR-009**: System MUST provide logout that revokes current session and clears client-authenticated state.
- **FR-010**: System MUST provide `/auth/session`-equivalent session recovery behavior so valid sessions persist across browser refresh.
- **FR-011**: System MUST redirect successful login to `/dashboard`.
- **FR-012**: System MUST redirect unauthenticated or invalid-session users to `/login` before protected content renders.
- **FR-013**: System MUST require valid CSRF token for all authenticated state-changing requests, including at minimum logout, idea writes, idea sharing, and evaluation updates.
- **FR-014**: System MUST provide password reset request flow with one-time email reset link token valid for 30 minutes.
- **FR-015**: System MUST provide password reset completion flow requiring valid, unexpired, unused token, compliant new password, and a confirm-password field that exactly matches the new password.
- **FR-016**: System MUST invalidate all active reset tokens for the account after successful password reset.
- **FR-017**: System MUST reject invalid, expired, or already-used reset tokens.
- **FR-018**: System MUST throttle failed login attempts to 5 per 15 minutes per account and per source IP.
- **FR-019**: System MUST throttle failed password-reset attempts to 5 per 15 minutes per account and per source IP.
- **FR-020**: System MUST support at least two roles: `submitter` and `admin`.
- **FR-021**: System MUST restrict admin evaluation actions to admin role only.
- **FR-022**: System MUST provide idea submission form with required `title`, `description`, and `category` fields, where `category` is selected via dropdown menu only.
- **FR-023**: System MUST allow at most one optional attachment per idea submission.
- **FR-024**: System MUST reject submissions exceeding single-attachment limit.
- **FR-025**: System MUST accept only PDF, DOCX, PPTX, PNG, and JPG attachments via combined MIME + extension validation.
- **FR-026**: System MUST enforce attachment size limit of 10 MiB (10,485,760 bytes), inclusive.
- **FR-027**: System MUST persist each submitted idea with owner identity, submission time, and initial status `Submitted`.
- **FR-028**: System MUST provide idea listing with status and key metadata.
- **FR-029**: System MUST make submitter listings owner-visible by default.
- **FR-030**: System MUST allow submitters to share individual ideas for visibility to all authenticated employees.
- **FR-031**: System MUST allow admin users to view all ideas regardless of sharing setting.
- **FR-032**: System MUST support statuses `Submitted`, `Under Review`, `Accepted`, `Rejected`.
- **FR-033**: System MUST allow transition `Submitted -> Under Review` by admin.
- **FR-034**: System MUST allow finalization to `Accepted` or `Rejected` by admin with required comment.
- **FR-035**: System MUST preserve immutable status history including actor, timestamp, and decision comment snapshot.
- **FR-036**: System MUST enforce optimistic concurrency for share/status updates and reject stale writes with refresh/retry guidance.
- **FR-037**: System MUST make evaluation comments visible to all authenticated employees for shared ideas.
- **FR-038**: System MUST provide a post-login dashboard with role-appropriate primary actions and concise user-relevant summary.
- **FR-039**: System MUST render all protected pages (`/dashboard`, idea submit, idea details) inside a shared protected layout component (global app shell).
- **FR-040**: System MUST use a shared standardized Alert component for user feedback, and MUST render validation/auth/permission/conflict/throttle/API failures (including 4xx/5xx) as visible in-page red error alerts rather than console-only logging.
- **FR-041**: System MUST keep red error alerts persistent and actionable until dismissal, retry, or successful follow-up action, and MUST render success alerts using the same standardized Alert component in green with auto-dismiss support.
- **FR-042**: System MUST, for all Login/Register/Submit-Idea/Evaluate forms, disable submit immediately when request starts, show visible loading indicator (e.g., `Loading...` or spinner), prevent duplicate in-flight submits, and re-enable controls when request fails.
- **FR-043**: System MUST treat authenticated employees as active human employee accounts only (excluding service accounts, suspended users, external identities).
- **FR-044**: System MUST deny non-owners from accessing owner-only listing/detail routes in user-facing idea views.
- **FR-045**: System MUST preserve submitted title/description/category/owner/time and attachment metadata when attachment is present.
- **FR-046**: System MUST require registration confirm-password input to exactly match the password before account creation succeeds.
- **FR-047**: System MUST enforce category enumeration for idea submission as exactly: `Process Improvement`, `Product Feature`, `Cost Saving`, `Other`.
- **FR-048**: System MUST render a persistent protected-layout header containing product name, authenticated user email, role badge (`Submitter` or `Admin`), and logout action.
- **FR-049**: System MUST visually indicate the active protected-page navigation item corresponding to the current route.
- **FR-050**: System MUST provide submitter dashboard view with a prominent `Submit New Idea` CTA and a `My Ideas` summary widget scoped to the current user.
- **FR-051**: System MUST provide admin dashboard view with `Evaluation Queue` summary count and `Recent Decisions` quick links.
- **FR-052**: System MUST define strict TypeScript interfaces/types for props of protected layout and role-specific dashboard components, compatible with strict compiler settings and without ungoverned unsafe typing shortcuts.
- **FR-053**: System MUST ensure user double-click or repeated click on an in-flight submit action results in at most one network request for that action.
- **FR-054**: System MUST provide server-side pagination for idea listings and MUST NOT rely on unbounded infinite scrolling for large result sets.
- **FR-055**: System MUST support idea-list filters by `status`, `category`, and submission date range.
- **FR-056**: System MUST support idea-list sorting by date (`Newest`, `Oldest`) and by status, where status sort uses workflow order `Submitted`, `Under Review`, `Accepted`, `Rejected`.
- **FR-057**: System MUST provide admin-visible idea-details timeline/history showing status changes, actor identity (`userId` plus display email), and timestamp for each transition.
- **FR-058**: System MUST enforce access control for admin-only timeline/history visibility and MUST NOT expose restricted timeline data to unauthorized roles.
- **FR-059**: System MUST ensure primary flows (Login, Register, Submit Idea, Evaluate) are fully operable via keyboard using Tab/Enter/Space without pointer interaction.
- **FR-060**: System MUST provide accessible semantics for forms and alerts, including programmatic input labels and appropriate ARIA roles for alert/status messaging.
- **FR-061**: System MUST move focus to the visible error alert region when a form submission fails and preserve logical focus recovery for retry.
- **FR-062**: System MUST expose error alerts with assertive announcement behavior and success alerts with polite announcement behavior to improve assistive-technology feedback consistency.
- **FR-063**: System MUST provide a public landing page at `/` for unauthenticated users that introduces the InnovatEPAM Portal purpose.
- **FR-064**: System MUST make global header navigation authentication-aware: unauthenticated users MUST NOT see protected links (`Dashboard`, `Submit Idea`, and other protected workspace links), and the product logo link MUST target `/` when logged out and `/dashboard` when logged in.
- **FR-065**: System MUST provide unauthenticated landing-page authentication controls as a right-side panel with explicit `Register` and `Login` toggle buttons that switch the active form in place.
- **FR-066**: System MUST render registration and password-reset success confirmations as contextual green transient popups scoped to the initiating page/form, and MUST NOT persist or leak those confirmations across unrelated pages.
- **FR-067**: System MUST present authenticated user identity in protected-shell UI using human-readable account attributes (`fullName`, `email`) and MUST NOT surface raw internal user GUID as the primary visible identity label.
- **FR-068**: System MUST provide a protected profile view reachable from clickable header email that displays `fullName`, `email`, and role, and includes a dedicated logout action.
- **FR-069**: System MUST redirect users to public landing page `/` after successful logout.
- **FR-070**: System MUST render standardized empty-state content for zero-result `My Ideas` and `Evaluation Queue` views, each with a context-appropriate CTA.
- **FR-071**: System MUST provide visible hover and active interaction feedback for all primary and secondary button controls across authenticated workflows.

### Assumptions

- The portal serves internal employees and enforces corporate-domain registration to ensure internal-only access.
- Approved corporate domains are maintained in an administrator-owned configuration allowlist and changed through operational change control.
- Self-registration is allowed for employees with approved corporate email domains, and newly registered users default to submitter role unless elevated by authorized administrators.
- One attachment per idea is sufficient for initial release.
- Admin users can view and evaluate all submitted ideas.
- Submitters can choose per idea whether it remains private (default) or becomes visible to all authenticated employees.
- Finalized ideas (`Accepted` or `Rejected`) are not re-opened in this release.
- Dashboard summaries can use lightweight counts/status highlights and do not require advanced analytics in this release.
- Password reset delivery is provided through the project-supported transactional email boundary.

### Key Entities *(include if feature involves data)*

- **User**: Internal employee account with identity fields (including required `fullName`), role assignment, and account status.
- **Session**: Authenticated cookie-backed access context linked to a user and bounded by issuance/revocation/expiry lifecycle.
- **CSRF Token**: Session-bound anti-CSRF token required for authenticated state-changing requests.
- **Password Reset Token**: One-time, time-limited recovery token tied to a user and consumption lifecycle.
- **Auth Throttle Window**: Account/IP rate-limit window tracking failed login/reset attempts.
- **Idea**: Innovation proposal containing required fields, optional attachment reference, owner, sharing flag, and status.
- **Attachment**: Single optional metadata record linked one-to-one to an idea submission.
- **Evaluation Decision**: Admin decision record containing final status and required comment.
- **Status History Entry**: Immutable audit event for each idea status transition.
- **Dashboard Summary Item**: User-scoped status/count snippet shown on post-login dashboard.

## Success Criteria *(mandatory)*


### Measurable Outcomes

- **SC-001**: 95% of valid login attempts complete and land on `/dashboard` in under 2 seconds.
- **SC-002**: 100% of unauthorized attempts to protected routes are redirected to `/login` before protected content renders.
- **SC-003**: 95% of active users remain authenticated after standard page refresh.
- **SC-004**: 100% of invalid login/registration/reset attempts show visible red in-page alerts in auth flows.
- **SC-005**: 90% of users who start password reset complete recovery within 10 minutes in UAT.
- **SC-006**: 95% of submitters successfully submit an idea (optional file included) on first attempt.
- **SC-007**: 100% of attempts beyond login/reset throttle threshold return throttling responses and visible alerts.
- **SC-008**: 100% of finalized ideas contain admin decision (`Accepted`/`Rejected`) with non-empty comment.
- **SC-009**: 95% of status updates are visible to authorized users within 5 seconds.
- **SC-010**: At least 90% of authenticated users reach intended next action from dashboard in two clicks or fewer.
- **SC-011**: 100% of API 500/auth/validation failures in protected workflows render a visible in-page red alert (not console-only), and 95% render within 1 second of error response receipt.
- **SC-012**: 100% of tested rapid double-click submit attempts across Login, Register, Submit Idea, and Evaluate flows produce at most one network request per user action.
- **SC-013**: 95% of green success alerts in protected workflows auto-dismiss between 3 and 5 seconds after render while remaining visible long enough to be perceived by users.
- **SC-014**: 100% of keyboard-only test runs for Login/Register/Submit-Idea/Evaluate flows complete without mouse interaction.
- **SC-015**: 100% of failed form submissions move focus to the visible error alert region, and 100% of tested alerts expose valid ARIA role semantics.
