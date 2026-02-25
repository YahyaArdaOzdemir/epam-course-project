# ADR 0001: Cookie Session + CSRF Auth Model

- Status: Accepted
- Date: 2026-02-25
- Related initiative: `specs/002-innovateepam-portal`

## Context

The portal requires secure authentication with session persistence across refreshes, role-safe protected routes, and defense against state-changing request forgery.

## Decision

Use server-managed authenticated sessions delivered via HttpOnly, Secure, SameSite=Lax cookie, with CSRF token validation for authenticated state-changing routes.

## Consequences

### Positive
- Better resistance to token exfiltration via XSS compared to localStorage bearer tokens.
- Predictable protected-route behavior with server-validated session state.
- Explicit anti-CSRF control aligned with constitution quality/security expectations.

### Tradeoffs
- CSRF token lifecycle handling is required in frontend API client and backend middleware.
- Local development setup must account for secure-cookie behavior and environment consistency.

## Notes

Password reset flow and auth throttling remain part of the same security baseline and must stay traceable to active specs/tasks.
