# Feature Specification: InnovatEPAM Portal

**Feature Branch**: `001-innovatepam-portal`  
**Created**: 2026-02-24  
**Status**: Draft  
**Input**: User description: "Create the InnovatEPAM Portal (internal employee innovation management platform where employees submit ideas and admins evaluate them) with User Management, Idea Submission System, and Evaluation Workflow."

## Clarifications

### Session 2026-02-24

- Q: Which authentication model should be used for MVP? → A: Local account auth with email/password registration restricted to approved corporate email domains.
- Q: What should idea listing visibility be for submitters? → A: Submitters see their own ideas by default and can optionally share idea visibility with all employees.
- Q: How should concurrent evaluator updates be handled? → A: Use optimistic concurrency checks and reject stale updates with refresh/retry guidance.
- Q: What attachment formats and size limit should MVP support? → A: Allow PDF, DOCX, PPTX, PNG, and JPG files up to 10 MiB (10,485,760 bytes), inclusive.
- Q: Who can view evaluation comments? → A: When an idea is shared, evaluation comments are visible to all authenticated employees.

## Constitution Alignment *(mandatory)*

- **Referenced User Story IDs**: US1, US2, US3
- **Spec Approval Evidence**: This specification is the authoritative scope artifact for `001-innovatepam-portal`; implementation starts only after explicit approval in project workflow.
- **TypeScript Strictness Impact**: Feature behavior and data rules must be expressible under strict typing, with no ungoverned unsafe typing shortcuts.
- **JSDoc Impact**: All exported APIs introduced for authentication, idea submission, listing, status updates, and evaluation actions require complete JSDoc.
- **Test-First Plan**: For each story, tests are authored first, executed to fail for expected reasons, then implementation begins.
- **Test Distribution Plan**: This feature targets Unit 70%, Integration 20%, E2E 10%.
- **Coverage Plan**: Changed production code must maintain at least 80% line coverage before merge.
- **Mocking Boundaries**: Only external I/O boundaries may be mocked/faked; business logic evaluation and status rules remain unmocked in tests.

## User Scenarios & Testing *(mandatory)*


### User Story 1 - Access and Role-Safe Sign-In (Priority: P1)

As an employee, I can register, log in, and log out so I can securely access the portal and see capabilities appropriate to my role (submitter or evaluator/admin).

**Why this priority**: Authentication and role distinction are prerequisites for trusted idea ownership and controlled evaluation actions.

**Independent Test**: Can be fully tested by creating accounts for each role, confirming successful login/logout, and verifying role-specific access boundaries without requiring idea workflows.

**Acceptance Scenarios**:

1. **Given** a new employee without an account, **When** they submit valid registration details, **Then** an account is created with a default submitter role and they can log in.
2. **Given** an authenticated submitter, **When** they attempt to open evaluator-only actions, **Then** access is denied and no evaluator action is performed.
3. **Given** an authenticated evaluator/admin, **When** they log out, **Then** their session is terminated and protected pages require login again.

---

### User Story 2 - Submit and View Ideas (Priority: P2)

As a submitter, I can create ideas with title, description, category, and one attachment, and I can view the list of submitted ideas.

**Why this priority**: This is the core business flow that captures employee innovation proposals.

**Independent Test**: Can be fully tested by logging in as submitter, submitting ideas with and without an attachment, and verifying they appear in listing views with correct metadata and initial status.

**Acceptance Scenarios**:

1. **Given** an authenticated submitter on the idea form, **When** they provide title, description, category, and optionally one file, **Then** the idea is saved with status `Submitted` and appears in the list.
2. **Given** an authenticated submitter, **When** they upload more than one file for a single idea, **Then** submission is rejected with a clear validation message.
3. **Given** an authenticated submitter, **When** they upload an unsupported file type or a file larger than 10 MiB (10,485,760 bytes), **Then** submission is rejected with a clear validation message.

---

### User Story 3 - Evaluate and Decide Ideas (Priority: P3)

As an evaluator/admin, I can review submitted ideas, move them through review states, and issue accept/reject decisions with comments.

**Why this priority**: Evaluation workflow converts submissions into actionable outcomes and closes the innovation loop.

**Independent Test**: Can be fully tested by logging in as evaluator/admin, selecting submitted ideas, updating status to `Under Review`, then `Accepted` or `Rejected` with comments, and confirming updates are visible in listings.

**Acceptance Scenarios**:

1. **Given** an evaluator/admin viewing a `Submitted` idea, **When** they start evaluation, **Then** status changes to `Under Review`.
2. **Given** an evaluator/admin reviewing an idea, **When** they choose `Accepted` or `Rejected` and provide comments, **Then** the decision and comments are saved and visible to relevant users.
3. **Given** two evaluators/admins update the same idea concurrently, **When** one update becomes stale, **Then** the stale update is rejected and the user is prompted to refresh and retry.
4. **Given** an idea is shared by its submitter, **When** an evaluator/admin finalizes with comments, **Then** all authenticated employees can view those evaluation comments in the shared view.

---

### Edge Cases


- Registration is attempted with an email already used by another account.
- Login is attempted with invalid credentials repeatedly.
- A submitter tries to submit an idea missing one or more required fields.
- A submitter attempts to upload an empty, unsupported, or oversized file (greater than 10 MiB / 10,485,760 bytes).
- An evaluator/admin tries to evaluate an idea that was already finalized.
- Concurrent evaluator actions occur on the same idea.
- A non-admin user attempts to call evaluator-only actions directly.
- Session expires during idea submission or evaluation.

## Requirements *(mandatory)*


### Functional Requirements

- **FR-001**: System MUST allow employees to register new local accounts using email/password credentials with unique corporate email identity, where email uniqueness is enforced on normalized lowercase address.
- **FR-002**: System MUST allow registration only for approved corporate email domains sourced from a centrally managed allowlist configured by platform administrators.
- **FR-003**: System MUST allow registered users to log in and log out securely.
- **FR-004**: System MUST support at least two roles: submitter and evaluator/admin.
- **FR-005**: System MUST restrict evaluator/admin actions to evaluator/admin role only.
- **FR-006**: System MUST provide an idea submission form containing title, description, and category as required fields.
- **FR-007**: System MUST allow attaching zero or one file per idea submission.
- **FR-008**: System MUST reject idea submissions that exceed the single-file attachment limit.
- **FR-009**: System MUST accept only PDF, DOCX, PPTX, PNG, and JPG attachment formats using combined MIME-type and extension validation on the server.
- **FR-010**: System MUST enforce a maximum attachment size of 10 MiB (10,485,760 bytes), inclusive.
- **FR-011**: System MUST persist each submitted idea with creator identity, submission timestamp, and initial status `Submitted`.
- **FR-012**: System MUST provide a listing view of submitted ideas with current status and key metadata.
- **FR-013**: System MUST make submitter idea listings private by default (owner-visible only).
- **FR-014**: System MUST allow submitters to optionally share individual ideas for visibility to all authenticated employees.
- **FR-015**: System MUST allow evaluator/admin users to view all ideas regardless of sharing setting.
- **FR-016**: System MUST support idea statuses `Submitted`, `Under Review`, `Accepted`, and `Rejected`.
- **FR-017**: System MUST allow evaluator/admin users to change status from `Submitted` to `Under Review`.
- **FR-018**: System MUST allow evaluator/admin users to finalize ideas as `Accepted` or `Rejected` with a required evaluation comment.
- **FR-019**: System MUST preserve status history including decision comments and decision timestamps.
- **FR-020**: System MUST prevent unauthorized users from creating, modifying, or finalizing evaluation decisions.
- **FR-021**: System MUST show validation and permission errors in user-friendly language.
- **FR-022**: System MUST enforce optimistic concurrency for evaluation updates by rejecting stale status/decision writes and requiring client refresh before retry.
- **FR-023**: System MUST make evaluation comments visible to all authenticated employees for ideas that the submitter has shared.
- **FR-024**: System MUST treat "authenticated employees" as active human employee accounts only (excluding service accounts, suspended users, and non-employee external identities).

### Assumptions

- The portal serves internal employees and enforces corporate-domain registration to ensure internal-only access.
- Approved corporate domains are maintained in an administrator-owned configuration allowlist and changed through operational change control.
- Self-registration is allowed for employees with approved corporate email domains, and newly registered users default to submitter role unless elevated by authorized administrators.
- One attachment per idea is sufficient for initial release.
- Evaluator/admin users can view and evaluate all submitted ideas.
- Submitters can choose per idea whether it remains private (default) or becomes visible to all authenticated employees.
- Finalized ideas (`Accepted` or `Rejected`) are not re-opened in this release.

### Key Entities *(include if feature involves data)*

- **User**: Internal employee account with identity fields, role assignment (submitter or evaluator/admin), and account status.
- **Session**: Authenticated access context linked to a user and bounded by login/logout lifecycle.
- **Idea**: Innovation proposal containing title, description, category, optional single attachment reference, owner, and status.
- **Attachment**: File metadata linked one-to-one with an idea submission when provided.
- **Evaluation Decision**: Admin/evaluator action record containing decision status (`Accepted` or `Rejected`), required comment, evaluator identity, and timestamp.
- **Status History Entry**: Immutable audit event capturing each idea status transition and actor.

## Success Criteria *(mandatory)*


### Measurable Outcomes

- **SC-001**: 95% of employees complete registration and first login in under 3 minutes.
- **SC-002**: 95% of submitters successfully submit an idea (including optional file) on first attempt.
- **SC-003**: 100% of finalized ideas contain an evaluator/admin decision (`Accepted` or `Rejected`) and a non-empty decision comment.
- **SC-004**: 95% of status updates are visible in idea listings to authorized users within 5 seconds.
- **SC-005**: In user acceptance testing, at least 85% of submitters and evaluators rate the submission/evaluation flow as clear and easy to complete.
