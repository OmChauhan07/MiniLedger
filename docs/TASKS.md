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
- [x] Create validated loan endpoint.
- [x] List authenticated user's loans.
- [x] Implement ownership-scoped repayment endpoint.
- [x] Implement summary aggregates with decimal-safe handling.
- [x] Add consistent error handling and status codes.
- [x] Test overdue, repaid, empty and multi-user cases.
- [x] Review, test, commit small units, and push only after checks pass.

## Phase 3 — Mobile screens and integration
- [x] Set up API client and environment-specific base URL.
- [x] Implement phone/OTP login screen.
- [x] Persist JWT using an appropriate secure mobile storage solution.
- [x] Implement dashboard summary card.
- [x] Implement loan list and overdue/repaid states.
- [x] Implement add-loan form and client-side validation.
- [x] Implement mark-repaid action and refresh behavior.
- [x] Add loading, empty, success and error states.
- [x] Run on Android phone/emulator and test end-to-end.
- [x] Review, test, commit small units, and push only after checks pass.

## Phase 4 — Quality and delivery
- [x] Run all backend tests and build/type checks.
- [x] Run mobile type checks and available tests.
- [x] Manually verify every acceptance criterion in `SPEC.md`.
- [ ] Optional: implement receipt upload only if core requirements are complete (core requirements prioritized).
- [x] Complete README from a clean-clone perspective.
- [x] Remove secrets, debug logs and unused dependencies.
- [x] Prepare seed/demo data without personal information.
- [ ] Record 2–3 minute app demo and verify share permissions.
- [x] Final code review and focused commits.
- [x] Push to approved remote main branch after tests/review pass.
- [x] Record final commit, test results, repository URL and recording URL.

## Phase 5 — Borrowed Loans & Direction Awareness
- [x] Extend Prisma schema with `enum LoanType { LENT, BORROWED }` and non-destructive migration defaulting to `LENT`.
- [x] Apply schema push/migration preserving all existing user records safely as `LENT`.
- [x] Update backend schemas and loan service to support loan `type`, direction/search filtering, and `getLoanById`.
- [x] Separate summary calculations into `totalLent`, `totalBorrowed`, `outstandingLent`, `outstandingBorrowed`, `overdueReceivable`, `overduePayable`.
- [x] Write backend tests for `LENT` and `BORROWED` creation, filtering, repayments, cross-user isolation, and direction summaries.
- [x] Update mobile types and API client with query filters and direction attributes.
- [x] Add Lent/Borrowed selector with dynamic hints to Add Loan modal.
- [x] Update Loan Card and Loan Details with direction-specific badges ("THEY OWE YOU" vs "YOU OWE THEM"), indicators, and settlement confirmations.
- [x] Redesign Dashboard summary metrics to distinctly present Lent Outstanding and Borrowed Outstanding.
- [x] Update All Loans screen with Direction tabs (`All | Lent | Borrowed`), direction-aware status chip counts, and dynamic totals banner.
- [x] Update Account screen with separate Lent/Borrowed balances, loan counts, and direction-aware CSV export.
- [x] Run backend test suite (25/25 passed) and mobile TypeScript check (`npx tsc --noEmit` passed with 0 errors).
- [x] Commit and push changes incrementally to remote repository.

## Phase 6 — Account, Counterparties & Netting
- [x] Non-destructive Prisma migration: add `name`, `email`, `passwordHash`, `phoneVerifiedAt`, `updatedAt` to `User`; add `counterpartyUserId`, `counterpartyPhone`, `updatedAt` to `Loan`.
- [x] Safe password hashing and timing-safe verification utility (`crypto.scrypt`).
- [x] New user signup flow: `POST /api/auth/register/send-otp`, `verify-otp` (returning short-lived `signupToken`), and `complete` (name, email, password).
- [x] Existing user login: `POST /api/auth/login` (phone + password) with rate limiting and timing attack protection.
- [x] Legacy passwordless user upgrade flow (`PASSWORD_NOT_SET` -> OTP -> set password).
- [x] Registered user search: `GET /api/users/search?q=...` returning only public safe fields (`id`, `name`, `maskedPhone`).
- [x] Counterparty linking on loan creation (`POST /api/loans`) with external fallback (name/optional phone).
- [x] Pairwise netting calculation between registered counterparties on `GET /api/loans/:id` (`RECEIVABLE`, `PAYABLE`, `SETTLED`).
- [x] Global net receivable/payable calculations on `GET /api/summary`.
- [x] Backend test suite updates covering auth, login, search, counterparty linking, and pairwise netting.
- [x] Mobile Login screen: phone + password, validation, error handling, link to Signup.
- [x] Mobile Signup screen: phone entry -> OTP verification -> profile setup (name, email, password) -> dashboard.
- [x] Mobile Add Loan: registered user search dropdown with masked phone, and "Add someone outside MiniLedger" option.
- [x] Mobile Loan Details: counterparty identity badges and derived net balance card with explanation.
- [x] Mobile Dashboard: updated summary cards with net receivable/payable metrics.
- [x] Mobile Account screen: user display name, email, phone, and password security status.
- [x] Verification and end-to-end tests passing without regressions.

## Phase 6 — Registered-User Loan Relationships and Cross-Account Visibility
- [x] Inspect existing implementation and write Root Cause Report.
- [x] Establish conceptual data model and participant perspective derivation rules.
- [x] Update `docs/SPEC.md`, `docs/API.md`, and create `docs/phases/PHASE-6-CROSS-ACCOUNT-RELATIONSHIPS.md`.
- [x] Backend: Refactor `loan.service.ts` to include counterparty loans (`where: { OR: [ { userId }, { counterpartyUserId } ] }`).
- [x] Backend: Invert participant perspective for counterparty viewer (`type`, `counterpartyUser`, `isCreator`, `recordedByName`).
- [x] Backend: Enable counterparty viewing (`getLoanById`) and bilateral repayment (`markLoanRepaid`).
- [x] Backend: Refactor `summary.service.ts` to aggregate bilateral receivables/payables accurately.
- [x] Backend: Implement `GET /api/users/:counterpartyId/relationship` endpoint and controller.
- [x] Backend: Add comprehensive Vitest suite in `tests/cross-account-visibility.test.ts`.
- [x] Mobile: Create `CounterpartyLedgerModal.tsx` displaying mutual balances, breakdown, and shared transactions.
- [x] Mobile: Integrate relationship access points into `AddLoanModal`, `LoanDetailsModal`, and `AccountScreen`.
- [x] Mobile: Display provenance badge ("Recorded by [Name]") and inverted perspective on loan cards.
- [x] Verification: Run all backend tests and mobile TypeScript compilation.

## Phase 7 — Account Editing, OTP-Protected Changes, and PDF Ledger Export
- [x] Inspect existing implementation, verify schema, route conventions, and dependencies.
- [x] Create `docs/phases/PHASE-7-PROFILE-OTP-PDF-EXPORT.md` and update `docs/SPEC.md`, `docs/API.md`, `docs/Design.md`.
- [x] Backend: Install `pdfkit` and `@types/pdfkit`.
- [x] Backend: Implement `account.service.ts` for profile fetching, OTP challenge generation, signed `updateToken`, and verification.
- [x] Backend: Implement `account.controller.ts` and `account.routes.ts` (`GET /api/account`, `PATCH /api/account`, `POST /api/account/verify-update`).
- [x] Backend: Implement `ledger-export.service.ts` generating bank-statement styled PDF with caller perspective, filters, and gross summary.
- [x] Backend: Implement `ledger.routes.ts` (`POST /api/ledger/export/pdf`).
- [x] Backend: Mount `/api/account` and `/api/ledger` in `app.ts`.
- [x] Mobile: Remove Screen Lock / Biometrics toggle row and state from `AccountScreen.tsx`.
- [x] Mobile: Install `expo-file-system` and `expo-sharing` (SDK 58 compatible).
- [x] Mobile: Create `EditProfileModal.tsx` with prefilled values, read-only phone, validation, and OTP verification step.
- [x] Mobile: Create `ExportPdfModal.tsx` with filters (Direction, Status, Date Range), progress indicator, and native share sheet integration.
- [x] Mobile: Update `AccountScreen.tsx` with "Edit Profile" and "Export Ledger as PDF" triggers.
- [x] Backend Tests: Add `tests/account-and-pdf.test.ts` verifying profile updates, OTP security, cross-account protection, and PDF generation.
- [x] Verification: Run all tests (65/65 passing), verify mobile TypeScript (0 errors), and check local user experience.

## Required end-of-phase cycle
For every phase: code → run tests → fix until all relevant tests pass → code review → improve and repeat if needed → focused commits → push after verification. Resolve merge conflicts deliberately and rerun tests. Never force-push.

