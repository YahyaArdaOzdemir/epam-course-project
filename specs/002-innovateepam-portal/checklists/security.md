# Security Checklist: InnovatEPAM Portal (Consolidated)

**Purpose**: Track security requirement completeness and follow-up hardening work for consolidated scope.  
**Created**: 2026-02-25  
**Feature**: [spec.md](../spec.md)

## Baseline Coverage

- [x] Passwords are hashed and plaintext is never persisted/returned.
- [x] Secure cookie session model (HttpOnly + Secure + SameSite=Lax) is specified.
- [x] CSRF token validation scope is specified for authenticated state-changing routes.
- [x] Password reset token lifecycle (issue/expire/consume/invalidate-all-on-success) is specified.
- [x] Login and password-reset throttling thresholds are specified per account and per IP.
- [x] Protected-route redirect behavior for invalid sessions is specified.

## Follow-up Hardening Items

- [x] JWT/session secret rotation policy is deferred from MVP scope and tracked for implementation hardening.
- [x] Audit logging schema for auth failures, CSRF denials, reset misuse, and throttling is deferred from MVP scope and tracked for implementation hardening.
- [x] Trusted proxy/IP attribution policy is deferred from MVP scope and tracked for production hardening.
- [x] Secure error taxonomy precedence is deferred from MVP scope and tracked for implementation hardening.

## Notes

- Security baseline requirements are complete for current MVP scope.
- Deferred hardening items are explicitly captured for post-baseline delivery and do not block spec/planning completion.