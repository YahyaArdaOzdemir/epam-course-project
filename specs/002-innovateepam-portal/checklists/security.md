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

- [ ] Define JWT/session secret rotation policy and operational cadence.
- [ ] Define audit logging schema for auth failures, CSRF denials, reset misuse, and throttling.
- [ ] Define trusted proxy/IP attribution policy for production infrastructure.
- [ ] Define standardized secure error taxonomy precedence where user guidance and information minimization conflict.

## Notes

- Items above are tracked as post-baseline hardening and do not invalidate current consolidated functional scope.