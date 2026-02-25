# Data Model: InnovatEPAM Portal (Consolidated)

## Entity: User
- Fields:
  - `id` (UUID/string, primary key)
  - `fullName` (string, required)
  - `email` (string, unique, normalized lowercase)
  - `passwordHash` (string, bcrypt hash)
  - `role` (enum: `submitter` | `admin`)
  - `status` (enum: `active` | `suspended`)
  - `createdAt` (datetime)
  - `updatedAt` (datetime)
- Validation:
  - Email must be valid and belong to approved corporate domains.
  - Password writes (register/reset) must satisfy policy from `spec.md`.

## Entity: Session
- Fields:
  - `id` (UUID/string, primary key)
  - `userId` (FK -> User.id)
  - `jwtId` (string, unique)
  - `tokenHash` (string)
  - `issuedAt` (datetime)
  - `expiresAt` (datetime, absolute +24h)
  - `revokedAt` (datetime, nullable)
  - `createdFromIp` (string)
  - `createdFromUserAgent` (string, nullable)
- Validation:
  - Valid only for active users, non-revoked, non-expired records.

## Entity: CsrfToken
- Fields:
  - `id` (UUID/string, primary key)
  - `sessionId` (FK -> Session.id)
  - `tokenHash` (string)
  - `issuedAt` (datetime)
  - `expiresAt` (datetime)
  - `revokedAt` (datetime, nullable)
- Validation:
  - Required for authenticated state-changing requests.
  - Must be session-bound, active, and unexpired.

## Entity: PasswordResetToken
- Fields:
  - `id` (UUID/string, primary key)
  - `userId` (FK -> User.id)
  - `tokenHash` (string)
  - `issuedAt` (datetime)
  - `expiresAt` (datetime, 30-minute lifetime)
  - `consumedAt` (datetime, nullable)
  - `requestedFromIp` (string)
- Validation:
  - Single-use token; only valid if unexpired and not consumed.
  - Successful reset consumes current token and invalidates all other active reset tokens for same user.

## Entity: AuthThrottleWindow
- Fields:
  - `id` (UUID/string, primary key)
  - `actionType` (enum: `login` | `password_reset`)
  - `accountKey` (string)
  - `sourceIp` (string)
  - `windowStart` (datetime)
  - `failureCountByAccount` (integer)
  - `failureCountByIp` (integer)
  - `updatedAt` (datetime)
- Validation:
  - Threshold: 5 failures/15 minutes by account and by IP.

## Entity: Idea
- Fields:
  - `id` (UUID/string, primary key)
  - `ownerUserId` (FK -> User.id)
  - `title` (string, required)
  - `description` (text, required)
  - `category` (enum: `Process Improvement` | `Product Feature` | `Cost Saving` | `Other`)
  - `status` (enum: `Submitted` | `Under Review` | `Accepted` | `Rejected`)
  - `isShared` (boolean, default `false`)
  - `rowVersion` (integer)
  - `createdAt` (datetime)
  - `updatedAt` (datetime)

## Entity: IdeaListQuery
- Fields:
  - `page` (integer, >=1)
  - `pageSize` (integer, bounded positive)
  - `status` (enum filter, optional)
  - `category` (enum filter, optional)
  - `dateFrom` (date, optional)
  - `dateTo` (date, optional)
  - `sortBy` (enum: `date` | `status`)
  - `sortDirection` (enum: `Newest` | `Oldest` for date, deterministic order for status)
- Validation:
  - `dateTo` must be greater than or equal to `dateFrom` when both are provided.
  - Requests without pagination parameters default to server-defined safe bounds.

## Entity: Attachment
- Fields:
  - `id` (UUID/string, primary key)
  - `ideaId` (FK unique -> Idea.id)
  - `originalFileName` (string)
  - `storedFileName` (string)
  - `mimeType` (string)
  - `sizeBytes` (integer, max 10485760 inclusive)
  - `storagePath` (string)
  - `uploadedAt` (datetime)
- Validation:
  - Exactly zero or one attachment per idea.
  - Allowed types: PDF, DOCX, PPTX, PNG, JPG/JPEG via MIME + extension checks.

## Entity: EvaluationDecision
- Fields:
  - `id` (UUID/string, primary key)
  - `ideaId` (FK -> Idea.id)
  - `adminUserId` (FK -> User.id)
  - `decision` (enum: `Accepted` | `Rejected`)
  - `comment` (text, required)
  - `createdAt` (datetime)

## Entity: StatusHistoryEntry
- Fields:
  - `id` (UUID/string, primary key)
  - `ideaId` (FK -> Idea.id)
  - `fromStatus` (enum, nullable)
  - `toStatus` (enum)
  - `changedByUserId` (FK -> User.id)
  - `commentSnapshot` (text, nullable)
  - `createdAt` (datetime)
- Validation:
  - Immutable append-only audit trail.

## State Transitions

### Auth/session lifecycle
- Login success: `issued` -> `active` session.
- Logout: `active` -> `revoked`.
- Timeout: `active` -> `expired` at absolute 24h.
- Invalid/expired state always maps to unauthorized and protected-route redirect.

### Password reset lifecycle
- `issued` -> `consumed` on successful reset.
- `issued` -> `expired` when TTL elapses.
- Reuse of `consumed`/`expired` tokens is denied.

### Idea status lifecycle
- `Submitted` -> `Under Review` (admin only).
- `Under Review` -> `Accepted` or `Rejected` (admin only, requires comment).
- `Accepted` and `Rejected` are terminal in this baseline.

## Visibility Rules
- Submitter sees own ideas by default.
- Shared ideas are visible to authenticated active employees.
- Admin sees all ideas regardless of share flag.
- Evaluation comments become globally visible only for shared ideas.

## Timeline/History Presentation Rules

- Idea details include timeline/history log for admin users.
- Timeline rows show `fromStatus`, `toStatus`, `changedByUserId` (or resolved actor identity), and `createdAt`.
- Timeline is derived from immutable `StatusHistoryEntry` records.