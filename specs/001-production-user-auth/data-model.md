# Data Model: Production-Ready User Authentication (US1 Refinement)

## Entity: User
- Fields:
  - `id` (UUID/string, primary key)
  - `email` (string, unique, normalized lowercase)
  - `passwordHash` (string, bcrypt hash)
  - `role` (enum: `submitter` | `evaluator_admin`)
  - `status` (enum: `active` | `suspended`)
  - `createdAt` (datetime)
  - `updatedAt` (datetime)
- Validation rules:
  - Email must be syntactically valid and unique by normalized lowercase value.
  - Password writes (register/reset) must satisfy complexity policy from spec.
- Relationships:
  - One-to-many with `Session`.
  - One-to-many with `PasswordResetToken`.

## Entity: Session
- Fields:
  - `id` (UUID/string, primary key)
  - `userId` (FK → User.id)
  - `jwtId` (string, unique token identifier)
  - `tokenHash` (string, SHA-256 or equivalent digest of JWT)
  - `issuedAt` (datetime)
  - `expiresAt` (datetime, absolute lifetime at +24h)
  - `revokedAt` (datetime, nullable)
  - `createdFromIp` (string)
  - `createdFromUserAgent` (string, nullable)
- Validation rules:
  - Session valid only when user is active, `revokedAt` is null, and `expiresAt` is in the future.
  - Cookie flags enforced: HttpOnly, Secure, SameSite=Lax.
- Relationships:
  - Many-to-one with `User`.

## Entity: CsrfToken
- Fields:
  - `id` (UUID/string, primary key)
  - `sessionId` (FK → Session.id)
  - `tokenHash` (string)
  - `issuedAt` (datetime)
  - `expiresAt` (datetime)
  - `revokedAt` (datetime, nullable)
- Validation rules:
  - Required for state-changing authenticated requests.
  - Token must match active session context and be unexpired.
- Relationships:
  - Many-to-one with `Session`.

## Entity: PasswordResetToken
- Fields:
  - `id` (UUID/string, primary key)
  - `userId` (FK → User.id)
  - `tokenHash` (string)
  - `issuedAt` (datetime)
  - `expiresAt` (datetime)
  - `consumedAt` (datetime, nullable)
  - `requestedFromIp` (string)
- Validation rules:
  - Token is single-use and time-limited.
  - Reset completion requires unexpired token with `consumedAt = null`.
  - Successful reset consumes token and invalidates all other active reset tokens for the user.
- Relationships:
  - Many-to-one with `User`.

## Entity: AuthThrottleWindow
- Fields:
  - `id` (UUID/string, primary key)
  - `actionType` (enum: `login` | `password_reset`)
  - `accountKey` (string; normalized email or account identifier)
  - `sourceIp` (string)
  - `windowStart` (datetime)
  - `failureCountByAccount` (integer)
  - `failureCountByIp` (integer)
  - `updatedAt` (datetime)
- Validation rules:
  - Max failures: 5 within 15-minute rolling or bucketed window by account and by IP.
  - Exceeding threshold blocks further attempts until window elapses.
- Relationships:
  - Logical relation to `User` via `accountKey` when account exists.

## State Transitions

### Session lifecycle
- `issued` → `active` on successful login.
- `active` → `revoked` on logout.
- `active` → `expired` at absolute 24-hour timeout.
- Any invalid state must produce unauthorized outcome and force frontend redirect to `/login` on protected route access.

### Password reset lifecycle
- `issued` on reset request.
- `issued` → `consumed` on successful password reset.
- `issued` → `expired` when time limit passes.
- Reuse of `consumed` or `expired` token is rejected.

### Throttle lifecycle
- `open` while failure counts remain below threshold.
- `limited` when account or IP failures reach 5 in 15 minutes.
- `limited` → `open` automatically after window elapses.
