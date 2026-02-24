# Feature Specification: Idea Submission System (US2)

**Feature Branch**: `001-idea-submission-system`  
**Created**: 2026-02-24  
**Status**: Draft  
**Input**: User description: "Idea Submission System (US2) with a Title/Description/Category form, 10MB single-file attachment support (PDF/PNG/JPG), owner-only listing views, and role-based dashboard display."

## Constitution Alignment *(mandatory)*

- **Referenced User Story IDs**: US2
- **Spec Approval Evidence**: This document is the source of truth for feature scope and must be approved in product workflow before implementation.
- **TypeScript Strictness Impact**: All new domain contracts and UI/API payloads for submission, listing, and dashboard visibility must use strict typing with no unsafe typing shortcuts.
- **JSDoc Impact**: Exported/public APIs for idea submission, idea retrieval, attachment validation, and dashboard visibility rules require JSDoc updates.
- **Test-First Plan**: Write failing tests first for form validation, attachment rules, ownership visibility, and role-based dashboard behavior, then implement to pass.
- **Test Distribution Plan**: Unit 70%, Integration 20%, E2E 10%.
- **Coverage Plan**: Changed production code for this feature maintains at least 80% line coverage before merge.
- **Mocking Boundaries**: External boundaries (file storage, persistence, network) may be faked; core validation and authorization rules remain unmocked.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Submit Idea With Required Fields (Priority: P1)

As an authenticated employee, I can submit a new idea with title, description, category, and an optional single attachment so my proposal is formally captured.

**Why this priority**: Capturing ideas is the core value of US2 and is a prerequisite for all downstream review and visibility behavior.

**Independent Test**: Can be tested by logging in as an employee, completing the submission form, and confirming the new idea appears with correct details and initial status.

**Acceptance Scenarios**:

1. **Given** an authenticated employee on the idea form, **When** they provide title, description, and category and submit, **Then** a new idea is created and linked to that employee.
2. **Given** an authenticated employee on the idea form, **When** they omit any required field, **Then** submission is blocked and clear validation feedback is shown.
3. **Given** an authenticated employee on the idea form, **When** they attach one valid PDF/PNG/JPG file up to 10 MB and submit, **Then** the idea is created with that attachment.

---

### User Story 2 - Enforce Attachment Constraints (Priority: P1)

As an authenticated employee, I need clear attachment limits so I can submit files correctly and avoid invalid uploads.

**Why this priority**: Attachment validation is explicitly required in scope and directly impacts successful submissions.

**Independent Test**: Can be tested by attempting submissions with multiple files, unsupported file types, and files above 10 MB, then verifying each is rejected with a clear reason.

**Acceptance Scenarios**:

1. **Given** an authenticated employee on submission, **When** they attempt to attach more than one file, **Then** submission is rejected and the user is told only one file is allowed.
2. **Given** an authenticated employee on submission, **When** they attach a non-PDF/PNG/JPG file, **Then** submission is rejected and the user is told which file types are accepted.
3. **Given** an authenticated employee on submission, **When** they attach a file larger than 10 MB, **Then** submission is rejected and the user is told the size limit.

---

### User Story 3 - View Owned Ideas and Role-Specific Dashboard (Priority: P2)

As an authenticated user, I can see only my own submitted ideas in my listing view, and I see dashboard content that matches my role.

**Why this priority**: Ownership privacy and role-based display ensure correct access boundaries and relevant workspace context.

**Independent Test**: Can be tested by creating ideas under different users and roles, then confirming list visibility is owner-only and dashboard modules differ by role.

**Acceptance Scenarios**:

1. **Given** two employees have submitted ideas, **When** one employee opens their idea list, **Then** only ideas they own are shown.
2. **Given** a non-owner employee, **When** they attempt to access another employee’s idea details from listing routes, **Then** access is denied.
3. **Given** users with different roles sign in, **When** each opens the dashboard, **Then** each sees only the sections/actions intended for their role.

### Edge Cases

- A file is exactly 10 MB and should be accepted.
- A file is 10 MB + 1 byte and should be rejected.
- A file has an allowed extension but mismatched content type and should be rejected.
- The same user submits multiple ideas with identical titles; each submission is treated as a separate idea.
- An employee with no ideas opens the listing view and receives an empty-state message.
- A user changes role and then reopens the dashboard; displayed sections must reflect the latest role.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an idea submission form with required fields: title, description, and category.
- **FR-002**: System MUST allow an optional attachment on idea submission.
- **FR-003**: System MUST permit at most one attachment per idea submission.
- **FR-004**: System MUST accept attachment formats PDF, PNG, and JPG only.
- **FR-005**: System MUST reject attachments larger than 10 MB.
- **FR-006**: System MUST accept attachments that are exactly 10 MB.
- **FR-007**: System MUST create a new idea record only when all required fields pass validation.
- **FR-008**: System MUST associate each created idea with its submitting user as the owner.
- **FR-009**: System MUST provide each authenticated user an idea listing view containing only ideas they own.
- **FR-010**: System MUST block non-owners from viewing or listing another user’s ideas through standard application views.
- **FR-011**: System MUST present dashboard content based on the authenticated user’s role.
- **FR-012**: System MUST hide role-inapplicable dashboard sections and actions from the current user.
- **FR-013**: System MUST provide user-visible validation messages for missing required fields, unsupported file type, multi-file attempts, and oversized files.
- **FR-014**: System MUST preserve submitted title, description, category, owner identity, submission time, and attachment metadata (if present) for each idea.

### Assumptions

- The feature is available only to authenticated users.
- Role definitions already exist in the product and are available for dashboard display decisions.
- "Owner-only listing views" applies to standard user-facing routes and screens in scope for US2.
- The 10 MB limit is interpreted as 10,485,760 bytes.
- Category values are selected from an already-defined business category set.

### Key Entities *(include if feature involves data)*

- **Idea**: A submitted proposal with title, description, category, owner, submission time, and optional attachment metadata.
- **Attachment**: A single optional file associated with an idea, including file name, type, and size.
- **Owner Visibility Rule**: Access rule that limits idea listing/details visibility to the submitting user.
- **Dashboard Role View**: Mapping between user role and the set of dashboard sections/actions visible to that role.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of authenticated users complete an idea submission with required fields in under 2 minutes.
- **SC-002**: 100% of attempts to upload more than one file, unsupported file types, or files larger than 10 MB are rejected with a clear user-visible reason.
- **SC-003**: In access testing, 100% of users see only their own ideas in listing views.
- **SC-004**: In role-visibility testing, 100% of role-specific dashboard sections are shown only to intended roles.
- **SC-005**: At least 90% of test users report submission errors as understandable and actionable on first read.
