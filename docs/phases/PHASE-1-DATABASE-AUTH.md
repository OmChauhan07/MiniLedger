# Phase 1 — PostgreSQL, Prisma and Authentication

Purpose: Implement persistence and a safe development mock-OTP flow before loan endpoints depend on user identity.

## Tasks
- [ ] Add PostgreSQL connection configuration.
- [ ] Install/configure Prisma using a version compatible with project setup.
- [ ] Implement User and Loan schema per `SCHEMA.md`.
- [ ] Run schema validation, migration and Prisma Client generation.
- [ ] Add phone normalization and Zod validation.
- [ ] Implement short-lived OTP challenges with attempt limits.
- [ ] Log OTP only on the backend development console.
- [ ] Verify OTP, consume challenge once and issue JWT.
- [ ] Add JWT authentication middleware.
- [ ] Add tests for correct/wrong/expired/reused OTP and missing/invalid JWT.
- [ ] Verify user identity is derived only from the token.

## Verification
- [ ] `npx prisma validate` passes.
- [ ] Migration succeeds against a development database.
- [ ] OTP never appears in API response.
- [ ] Invalid and expired OTPs fail.
- [ ] OTP reuse fails.
- [ ] Protected route rejects missing/invalid token.
- [ ] All relevant tests and backend build pass.

## End-of-phase loop
Code → test → fix until checks pass → review authorization and secrets → improve and repeat if needed → update progress → focused commits → push only after verification and approved remote. Never force-push.
