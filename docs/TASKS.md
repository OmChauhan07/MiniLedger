# MiniLedger Master Task Checklist

Purpose: This is the master execution checklist. Mark tasks only after completing and verifying them; detailed instructions are in `phases/`.

## Phase 0 — Foundation
- [x] Confirm Node/npm/Git and Android testing method.
- [x] Initialize root Git repository.
- [x] Initialize backend TypeScript/Express project.
- [x] Add health endpoint and environment loading.
- [x] Initialize Expo React Native TypeScript app.
- [x] Add `.gitignore` and safe `.env.example` placeholders.
- [x] Run backend health check and launch Expo on Android.
- [x] Review, test, commit in small logical units, and push only if remote is configured and approved.

## Phase 1 — Database and authentication
- [x] Add Prisma and PostgreSQL configuration.
- [x] Define User and Loan models.
- [x] Run migration and generate Prisma Client.
- [x] Add phone normalization and validation.
- [x] Implement mock OTP generation, server logging, expiry and attempt limit.
- [x] Verify OTP, invalidate after success and issue JWT.
- [x] Add auth middleware and protected-route tests.
- [x] Verify OTP is never returned by API and secrets are not committed.

## Phase 2 — Loan and summary APIs
- [ ] Create validated loan endpoint.
- [ ] List authenticated user's loans.
- [ ] Implement ownership-scoped repayment endpoint.
- [ ] Implement summary aggregates with decimal-safe handling.
- [ ] Add consistent error handling and status codes.
- [ ] Test overdue, repaid, empty and multi-user cases.
- [ ] Review, test, commit small units, and push only after checks pass.

## Phase 3 — Mobile screens and integration
- [ ] Set up API client and environment-specific base URL.
- [ ] Implement phone/OTP login screen.
- [ ] Persist JWT using an appropriate secure mobile storage solution.
- [ ] Implement dashboard summary card.
- [ ] Implement loan list and overdue/repaid states.
- [ ] Implement add-loan form and client-side validation.
- [ ] Implement mark-repaid action and refresh behavior.
- [ ] Add loading, empty, success and error states.
- [ ] Run on Android phone/emulator and test end-to-end.
- [ ] Review, test, commit small units, and push only after checks pass.

## Phase 4 — Quality and delivery
- [ ] Run all backend tests and build/type checks.
- [ ] Run mobile type checks and available tests.
- [ ] Manually verify every acceptance criterion in `SPEC.md`.
- [ ] Optional: implement receipt upload only if core requirements are complete.
- [ ] Complete README from a clean-clone perspective.
- [ ] Remove secrets, debug logs and unused dependencies.
- [ ] Prepare seed/demo data without personal information.
- [ ] Record 2–3 minute app demo and verify share permissions.
- [ ] Final code review and focused commits.
- [ ] Push to approved remote main branch after tests/review pass.
- [ ] Record final commit, test results, repository URL and recording URL.

## Required end-of-phase cycle
For every phase: code → run tests → fix until all relevant tests pass → code review → improve and repeat if needed → focused commits → push after verification. Resolve merge conflicts deliberately and rerun tests. Never force-push.
