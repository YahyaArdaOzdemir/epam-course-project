# Data Model: InnovatEPAM Portal

## Entity: User
- Fields:
  - `id` (UUID/string, primary key)
  - `email` (string, unique, normalized lowercase)
  - `passwordHash` (string)
  - `role` (enum: `submitter` | `evaluator_admin`)
  - `status` (enum: `active` | `suspended`)
  - `createdAt` (datetime)
  - `updatedAt` (datetime)
- Validation:
  - Email must belong to approved corporate domains.
  - Password must satisfy organization baseline policy.
- Relationships:
  - One-to-many with `Session`.
  - One-to-many with `Idea` as owner.
  - One-to-many with `EvaluationDecision` as evaluator.

## Entity: Session
- Fields:
  - `id` (UUID/string, primary key)
  - `userId` (FK → User.id)
  - `tokenHash` (string)
  - `expiresAt` (datetime)
  - `createdAt` (datetime)
  - `revokedAt` (datetime, nullable)
- Validation:
  - Session only valid for active users.
- Relationships:
  - Many-to-one with `User`.

## Entity: Idea
- Fields:
  - `id` (UUID/string, primary key)
  - `ownerUserId` (FK → User.id)
  - `title` (string, required)
  - `description` (text, required)
  - `category` (string, required)
  - `status` (enum: `Submitted` | `Under Review` | `Accepted` | `Rejected`)
  - `isShared` (boolean, default `false`)
  - `rowVersion` (integer, optimistic concurrency token)
  - `createdAt` (datetime)
  - `updatedAt` (datetime)
- Validation:
  - Required fields cannot be empty.
  - `status` transitions must follow workflow rules.
- Relationships:
  - Many-to-one with `User` (owner).
  - One-to-one optional with `Attachment`.
  - One-to-many with `StatusHistoryEntry`.
  - One-to-many with `EvaluationDecision`.

## Entity: Attachment
- Fields:
  - `id` (UUID/string, primary key)
  - `ideaId` (FK unique → Idea.id)
  - `originalFileName` (string)
  - `storedFileName` (string)
  - `mimeType` (string)
  - `sizeBytes` (integer, max 10485760)
  - `storagePath` (string, under `/uploads`)
  - `uploadedAt` (datetime)
- Validation:
  - Allowed MIME/extensions: PDF, DOCX, PPTX, PNG, JPG/JPEG.
  - Maximum size 10 MB.
- Relationships:
  - One-to-one with `Idea`.

## Entity: EvaluationDecision
- Fields:
  - `id` (UUID/string, primary key)
  - `ideaId` (FK → Idea.id)
  - `evaluatorUserId` (FK → User.id)
  - `decision` (enum: `Accepted` | `Rejected`)
  - `comment` (text, required)
  - `createdAt` (datetime)
- Validation:
  - Only evaluator/admin role may create decision.
  - Decision allowed only after idea is `Under Review` (or transition path handled atomically).
- Relationships:
  - Many-to-one with `Idea`.
  - Many-to-one with `User`.

## Entity: StatusHistoryEntry
- Fields:
  - `id` (UUID/string, primary key)
  - `ideaId` (FK → Idea.id)
  - `fromStatus` (enum, nullable for initial creation)
  - `toStatus` (enum)
  - `changedByUserId` (FK → User.id)
  - `commentSnapshot` (text, nullable)
  - `createdAt` (datetime)
- Validation:
  - Immutable append-only record.
- Relationships:
  - Many-to-one with `Idea`.
  - Many-to-one with `User`.

## State Transitions
- `Submitted` → `Under Review` (evaluator/admin only)
- `Under Review` → `Accepted` (evaluator/admin only, requires comment)
- `Under Review` → `Rejected` (evaluator/admin only, requires comment)
- Terminal states: `Accepted`, `Rejected` (no reopen in MVP)

## Visibility Rules (derived constraints)
- Submitter sees own ideas always.
- Shared ideas (`isShared=true`) visible to all authenticated employees.
- Evaluator/admin sees all ideas regardless of share flag.
- Evaluation comments visible to all authenticated employees only when idea is shared.
