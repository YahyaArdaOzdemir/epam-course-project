# Phase 0 Research: InnovatEPAM Portal

## Decision 1: Authentication model for internal MVP
- Decision: Use local email/password authentication restricted to approved corporate email domains, with role-based authorization middleware.
- Rationale: Matches clarified scope and avoids external IdP dependency while preserving internal-only access control.
- Alternatives considered:
  - Corporate SSO only: rejected for MVP due to external dependency and setup overhead.
  - Invite-only account creation: rejected because spec requires employee self-registration.

## Decision 2: Backend architecture and validation approach
- Decision: Use Express.js MVC with explicit route → controller → service → repository flow and shared Zod validation layer.
- Rationale: Keeps business logic isolated/testable, supports strict TypeScript typing, and cleanly maps to constitution mandates.
- Alternatives considered:
  - Fat-route handlers: rejected for lower maintainability and harder testing boundaries.
  - Full DDD/CQRS: rejected as over-engineered for MVP scope.

## Decision 3: Data persistence strategy
- Decision: Use SQLite for relational persistence and a local filesystem `/uploads` directory for attachment binaries; store attachment metadata in DB.
- Rationale: Minimal ops overhead, sufficient for internal MVP scale, simple local dev setup.
- Alternatives considered:
  - PostgreSQL + object storage: rejected for unnecessary infrastructure complexity at MVP stage.
  - Store file BLOBs in SQLite: rejected due to DB bloat and backup inefficiency.

## Decision 4: Upload constraints and integrity behavior
- Decision: Enforce upload policy of single attachment, allowed formats (PDF/DOCX/PPTX/PNG/JPG), and max size 10 MB at API boundary with validated MIME/extension checks.
- Rationale: Directly satisfies clarified requirements and reduces unsafe file ingestion risk.
- Alternatives considered:
  - Extension-only validation: rejected as too weak.
  - Antivirus/content scanning in MVP: deferred to post-MVP hardening.

## Decision 5: Concurrency handling in evaluation workflow
- Decision: Use optimistic concurrency via version field (`rowVersion`) and reject stale update attempts with refresh/retry message.
- Rationale: Satisfies clarified requirement while avoiding heavy lock management.
- Alternatives considered:
  - Pessimistic locking: rejected as complex and poor UX for short review operations.
  - Last-write-wins: rejected due to auditability and lost-update risk.

## Decision 6: Test strategy and toolchain
- Decision: Use Jest for unit/integration and Playwright for E2E; enforce TDD-first sequencing with failing tests before implementation.
- Rationale: Aligns with constitution and requested stack; enables fast local test cycles and browser-level verification.
- Alternatives considered:
  - Vitest for frontend only + Jest backend: rejected to avoid split testing standards in MVP.
  - Cypress for E2E: rejected because Playwright requested explicitly.

## Decision 7: Frontend architecture and styling
- Decision: Use React + Vite + TailwindCSS with feature-oriented modules (`auth`, `ideas`, `evaluation`) and typed service layer.
- Rationale: Fast iteration, clear separation by user capability, supports strict TS and testability.
- Alternatives considered:
  - Global monolithic state-first architecture: rejected due to unnecessary upfront complexity.
  - Server-rendered frontend: rejected as outside requested stack.
