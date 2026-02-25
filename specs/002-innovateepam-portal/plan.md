# Implementation Plan: InnovatEPAM Portal (Consolidated Baseline)

**Branch**: `specs/002-innovateepam-portal` | **Date**: 2026-02-25 | **Spec**: `/specs/002-innovateepam-portal/spec.md`  
**Input**: Consolidated specification from `/specs/002-innovateepam-portal/spec.md`

## Summary

This plan consolidates all previously split planning threads into one execution baseline: production-ready authentication (secure cookie sessions, CSRF, throttling, password reset), idea submission and visibility rules, evaluator/admin decision workflow with optimistic concurrency, and dashboard/global UX hardening.

## Technical Context

**Language/Version**: TypeScript 5.8.x strict mode (frontend and backend)  
**Primary Dependencies**: Express 4, React 18, React Router 6, better-sqlite3, bcryptjs, jsonwebtoken, zod, multer, Jest, Playwright  
**Storage**: SQLite for app data + local `/uploads` filesystem storage for attachments + HttpOnly cookie session transport  
**Testing**: Jest unit/integration + Playwright E2E  
**Target Platform**: Linux-hosted internal web application  
**Project Type**: Monorepo web app (`backend`, `frontend`, `e2e`)  
**Constraints**: TDD-first, strict TypeScript, JSDoc on exported APIs, 80% changed-code coverage gate, business logic non-mocking  
**Scale/Scope**: Internal employee MVP with submitter and evaluator/admin roles

## Constitution Check

*GATE: Must pass before active implementation updates.*

- **Story/Spec Traceability**: PASS. All merged requirements map to US1-US4 in `spec.md`.
- **Strict TypeScript**: PASS. All new contracts remain strict-typed.
- **Documentation Discipline**: PASS. Exported APIs are tracked for JSDoc updates.
- **TDD First**: PASS. Tasks preserve fail-first sequencing per story.
- **Testing Strategy**: PASS. Unit/Integration/E2E target remains 70/20/10.
- **Coverage Gate**: PASS. Changed production code coverage minimum remains >=80%.

## Delivery Phases

### Phase 1 — Foundation (already established)
- Core monorepo tooling, strict TS, DB migration baseline, API wiring, shared validation/errors.

### Phase 2 — US1 Security Baseline (auth hardening)
- Secure register/login/logout with hashed passwords.
- Cookie session issuance with 24-hour absolute expiry.
- Session recovery, protected-route denial for invalid sessions.
- CSRF token issuance/validation for state-changing authenticated routes.
- Password reset request/confirm lifecycle with one-time 30-minute token.
- Login/reset throttling at account+IP boundary.

### Phase 3 — US2 Submission Baseline
- Idea create/list/share with owner-default visibility.
- Attachment policy enforcement (single file, allowed types, 10 MiB inclusive).

### Phase 4 — US3 Evaluation Baseline
- Evaluator/admin queue and decision workflow.
- Status transitions and immutable status history.
- Optimistic concurrency conflict handling and retry guidance.

### Phase 5 — US4 UX Completion
- Dashboard redirect and role-aware quick actions.
- Global protected-route shell (email + logout).
- Visible red alerts + loading/duplicate-submit protections across flows.

### Phase 6 — Quality Gates
- Coverage, test pyramid balance, contract conformance, release readiness, and regression validation.

## Complexity Tracking

No constitutional violations identified in consolidated plan baseline.