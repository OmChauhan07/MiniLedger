# Phase 2 — Loan APIs and Summary

Purpose: Implement the required lending workflows and make server-side data/summary calculations authoritative.

## Tasks
- [ ] Add create-loan request schema and service.
- [ ] Add authenticated list-loans endpoint.
- [ ] Scope every query to the authenticated user.
- [ ] Add mark-repaid endpoint with clear repeat behavior.
- [ ] Add summary endpoint with decimal-safe aggregates.
- [ ] Implement and test the date-only overdue rule.
- [ ] Add consistent error middleware and response shape.
- [ ] Add integration tests for CRUD workflow, validation and cross-user access.

## Verification
- [ ] Invalid names, amounts and dates are rejected.
- [ ] User A cannot read or mutate User B's loans.
- [ ] Total lent, total repaid, outstanding and overdue match test fixtures.
- [ ] Repaid loan is excluded from overdue amount.
- [ ] Decimal values are preserved.
- [ ] Backend tests and build pass.

## End-of-phase loop
Code → test → fix until checks pass → review business rules/security/performance → improve and repeat if needed → update progress → focused commits → push only after verification and approved remote. Never force-push.
