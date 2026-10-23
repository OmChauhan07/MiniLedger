# MiniLedger Progress Log

Purpose: Preserve verified project state between agent sessions. Update this file at the end of every phase and before handing work to another agent/session.

## Current status
- [x] Repository initialized
- [x] Backend health endpoint
- [x] Database schema/migrations
- [x] Mock OTP + JWT
- [x] Loan APIs + summary
- [x] Mobile login/dashboard/forms
- [x] Tests and code review
- [x] GitHub README verified
- [ ] Demo recording shared

## Session log
### Initial planning
- Requirements captured in `SPEC.md`.
- Stack selected: Expo React Native TypeScript, Express TypeScript, PostgreSQL, Prisma, Zod, JWT.
- Deadline: within 24 hours.
- Android testing target: physical Android phone or emulator.
- No implementation or tests should be reported as complete until verified in the working repository.

### Phase 0 — Foundation and Local Development (2026-10-22)
- **Phase/tasks worked on**: Phase 0 — Foundation and Local Development
- **Files created/changed**:
  - Root: `.gitignore`, `README.md`, `docs/TASKS.md`, `docs/PROGRESS.md`
  - Backend: `backend/package.json`, `backend/tsconfig.json`, `backend/.gitignore`, `backend/.env.example`, `backend/src/config/env.ts`, `backend/src/routes/health.routes.ts`, `backend/src/app.ts`, `backend/src/index.ts`, `backend/tests/health.test.ts`, `backend/vitest.config.ts`
  - Mobile: `mobile/package.json`, `mobile/app.json`, `mobile/tsconfig.json`, `mobile/.gitignore`, `mobile/App.tsx`, `mobile/index.ts`
- **Commands run**:
  - `npm install` in `backend/`: Passed (0 vulnerabilities).
  - `npm test` in `backend/`: Passed (2 tests passed: `GET /api/health` 200 OK and 404 handler).
  - `npm run build` in `backend/`: Passed (`tsc` compiled `dist/` cleanly).
  - `npm run dev` & `GET http://localhost:4000/api/health`: Passed (`{"status":"ok","service":"MiniLedger API"}`).
  - `npm install` in `mobile/`: Passed.
  - `npx tsc --noEmit` in `mobile/`: Passed (strict TypeScript check passed with 0 errors).
  - `npx expo start` & Metro status check (`http://localhost:8081/status`): Passed (`packager-status:running`).
- **Review findings and fixes**: Added `"type": "module"` in `backend/package.json` for native ESM compatibility with NodeNext; added `.env` ignore rules to `mobile/.gitignore`; verified headers and comments per `CONVENTIONS.md`.
- **Commit hashes**:
  - `8eac548`: `docs: organize documentation and establish master task checklists`
  - `362c666`: `chore: configure repository gitignore and add root README`
  - `194255f`: `feat(backend): initialize Express TypeScript backend with health endpoint`
  - `d72326f`: `feat(mobile): initialize Expo React Native TypeScript project`
  - `33d0015`: `docs: record Phase 0 verification and commit hashes in PROGRESS.md`
- **Remote/push status**: Remote `origin` points to `https://github.com/OmChauhan07/MiniLedger.git`.
- **Known limitations**: Phase 0 scope only; database models, mock OTP, loan APIs, and mobile UI screens are scheduled for Phase 1–3.

### Phase 1 — Database and Authentication (2026-10-23)
- **Phase/tasks worked on**: PostgreSQL, Prisma models, migrations, phone validation/normalization, development mock OTP flow, JWT issue, and JWT auth middleware.
- **Files created/changed**:
  - `backend/prisma/schema.prisma`: User, Loan, and OtpChallenge models.
  - `backend/prisma/migrations/20261023000000_init/migration.sql`: Initial migration SQL.
  - `backend/src/lib/prisma.ts`: PrismaClient singleton.
  - `backend/src/lib/crypto.ts`: Cryptographic OTP generator, SHA-256 hasher, and timing-safe equality verifier.
  - `backend/src/modules/auth/phone.utils.ts`: Phone normalization and E.164 validation.
  - `backend/src/modules/auth/auth.schema.ts`: Zod validation schemas for send-otp and verify-otp.
  - `backend/src/modules/auth/auth.service.ts`: OTP challenge lifecycle, attempt limits, user upsert, and JWT signing.
  - `backend/src/modules/auth/auth.controller.ts`: Route handlers for /api/auth endpoints.
  - `backend/src/modules/auth/auth.routes.ts`: Router mounting /send-otp and /verify-otp.
  - `backend/src/middleware/auth.middleware.ts`: Bearer token validation and req.user attachment.
  - `backend/src/types/express.d.ts`: Request user type declaration.
  - `backend/src/config/env.ts`: DATABASE_URL and JWT_SECRET configuration.
  - `backend/tests/auth.test.ts`: 10 integration tests covering OTP lifecycle, invalid inputs, expiry, reuse prevention, attempt lockout, and JWT middleware.
- **Commands run**:
  - `npx prisma validate`: Passed.
  - `npx prisma db push`: Synchronized schema with Neon PostgreSQL; generated Prisma Client.
  - `npm test`: Passed (12/12 tests passing across health and auth suites).
  - `npm run build`: Passed (clean compilation to dist/).
- **Review findings and fixes**: Removed foreign key from OtpChallenge to User so new phone numbers can request OTPs before account creation; set Vitest timeout to 20s to accommodate cloud DB roundtrips; verified OTP is never returned in API response.
- **Commit hashes**:
  - `fa5d99c`: `feat(auth): implement PostgreSQL Prisma models, mock OTP flow, and JWT auth`
- **Remote/push status**: Pushed to `origin/main`.
- **Known limitations**: Loan APIs and mobile screens to follow.

### Phase 2 — Loan APIs and Summary (2026-10-23)
- **Phase/tasks worked on**: Loan creation, authenticated list endpoint, ownership-scoped repayment, decimal-safe summary aggregates, and date-only overdue calculations.
- **Files created/changed**:
  - `backend/src/lib/date.ts`: Date-only formatting (`YYYY-MM-DD`), UTC midnight parsing, and calendar-based `isOverdue` evaluation.
  - `backend/src/lib/money.ts`: Two-decimal string formatting and Prisma.Decimal accumulation without float drift.
  - `backend/src/modules/loans/loan.schema.ts`: Zod validation for loan creation (friendName, positive amount <=2 decimals, YYYY-MM-DD date) and loan ID param.
  - `backend/src/modules/loans/loan.service.ts`: `createLoan`, `listLoans` (newest first), and `markLoanRepaid` (with 409 conflict on already-repaid and 404 for non-owned).
  - `backend/src/modules/loans/loan.controller.ts`: Express controllers for /api/loans endpoints.
  - `backend/src/modules/loans/loan.routes.ts`: Router mounted with `requireAuth`.
  - `backend/src/modules/summary/summary.service.ts`: `getUserSummary` calculating totalLent, totalRepaid, outstanding, and overdue amounts with decimal safety.
  - `backend/src/modules/summary/summary.controller.ts`: Express controller for /api/summary.
  - `backend/src/modules/summary/summary.routes.ts`: Router mounted with `requireAuth`.
  - `backend/src/app.ts`: Mounted `/api/loans` and `/api/summary`.
  - `backend/tests/loans.test.ts`: 8 integration tests covering loan creation, input validation, user isolation, repayment conflict handling, cross-user privacy, overdue updates, and zero-state summary.
  - `docs/TASKS.md` & `docs/PROGRESS.md`: Updated checklist and execution evidence.
- **Commands run**:
  - `npm test`: Passed (20/20 tests passing across health, auth, and loans/summary suites).
  - `npm run build`: Passed (clean compilation to dist/).
- **Review findings and fixes**: Verified cross-user isolation: User B attempting to repay User A's loan returns generic 404; duplicate repayment returns 409 conflict; repaid loans are immediately deducted from overdue amount and added to totalRepaid.
- **Commit hashes**:
  - `2b69abf`: `feat(loans): implement validated loan CRUD, repayment logic, and decimal-safe summary`
- **Remote/push status**: Pushed to `origin/main`.

### Phase 3 — Mobile Screens and Integration (2026-10-23)
- **Phase/tasks worked on**: React Native mobile app with Expo, phone authentication flow, secure token persistence, dashboard with summary cards, loan list with overdue highlighting, loan creation modal, mark-repaid interaction, and physical Android device network configuration.
- **Files created/changed**:
  - `mobile/package.json`: Added `expo-secure-store` dependency and `"typecheck": "tsc --noEmit"` script.
  - `mobile/src/types/index.ts`: Shared TypeScript models for User, Loan, Summary, CreateLoanPayload, and ApiError.
  - `mobile/src/utils/config.ts`: Environment-aware API base URL resolver (LAN IP `10.246.135.16` for physical devices, `10.0.2.2` for emulator, `localhost` for web).
  - `mobile/src/utils/storage.ts`: Secure JWT token and user profile persistence using `expo-secure-store` with memory fallback.
  - `mobile/src/utils/format.ts`: Indian Rupee formatting (`₹`), date formatting, and overdue date checking.
  - `mobile/src/api/client.ts`: Centralized HTTP fetch client with Bearer token injection and normalized AppApiError.
  - `mobile/src/api/auth.api.ts`: API endpoints for `sendOtpApi` and `verifyOtpApi`.
  - `mobile/src/api/loan.api.ts`: API endpoints for `fetchLoansApi`, `createLoanApi`, and `markLoanRepaidApi`.
  - `mobile/src/api/summary.api.ts`: API endpoint for `fetchSummaryApi`.
  - `mobile/src/components/ErrorBanner.tsx`: Reusable alert banner with retry and dismiss controls.
  - `mobile/src/components/SummaryCards.tsx`: 2x2 grid displaying Outstanding, Overdue, Total Lent, and Total Repaid balances with alert/settled styling.
  - `mobile/src/components/LoanCard.tsx`: Individual loan card with friend name, ₹ amount, due date, status badge (Overdue/Pending/Repaid), and "Mark Repaid" action.
  - `mobile/src/components/AddLoanModal.tsx`: Modal form with friend name, amount, date input, quick date chips (+7d, +14d, +30d), and input validation.
  - `mobile/src/features/auth/LoginScreen.tsx`: Phone number entry screen with +91 prefix, validation, and mock OTP trigger.
  - `mobile/src/features/auth/OtpScreen.tsx`: 6-digit verification screen with masked phone display, resend link, and dev terminal hint.
  - `mobile/src/features/dashboard/DashboardScreen.tsx`: Complete dashboard coordinating summary cards, loan flat list, pull-to-refresh, empty state, loan repayment, and add loan modal.
  - `mobile/App.tsx`: Root application coordinator managing session restoration, authentication gates, and screen transitions.
  - `docs/TASKS.md` & `docs/PROGRESS.md`: Updated checklist and execution logs.
- **Commands run**:
  - `npm run typecheck` in `mobile/`: Passed with 0 errors (strict TypeScript).
  - `npm test` in `backend/`: 20/20 tests passed across all suites.
  - `npm run build` in `backend/`: Clean TypeScript compilation.
  - `npx prisma validate`: Schema is valid.
- **Review findings and fixes**: Ensured status badges use both icon/text and color (e.g. `⚠ Overdue`, `✓ Repaid`); implemented immediate optimistic/local list updates on repayment followed by fresh summary refresh; verified error normalization in `client.ts` to surface clear network failure instructions for physical device connectivity.
- **Commit hashes**:
  - `73e7fb7`: `feat(mobile): implement authentication, dashboard summary, and loan management UI`
- **Remote/push status**: Pushed to `origin/main`.

### Phase 4 — Final Quality, Documentation and Delivery (2026-10-23)
- **Phase/tasks worked on**: Quality audit, comprehensive end-to-end verification, strict typing audits, secrets review, documentation alignment, and delivery preparation.
- **Files created/changed**:
  - `README.md`: Updated from Phase 0 placeholder to full assignment quickstart, architecture map, API table, verification commands, and Android setup instructions.
  - `backend/.env.example`: Updated with clear local development connection string and JWT placeholders.
  - `docs/SPEC.md`: Completed verification of all 11 acceptance criteria.
  - `docs/TASKS.md`: Updated master checklist with all core requirements marked complete.
  - `docs/PROGRESS.md`: Recorded final audit commands, verification evidence, and repository status.
- **Commands run**:
  - `npm test` in `backend/`: 20/20 tests passing across all suites (`health.test.ts`, `auth.test.ts`, `loans.test.ts`).
  - `npm run build` in `backend/`: Clean TypeScript compilation with 0 errors.
  - `npx prisma validate`: Schema validated successfully against Neon PostgreSQL target.
  - `npm run typecheck` in `mobile/`: Strict TypeScript check passed with 0 errors.
- **Verification findings**:
  - Authentication: Mock OTP flow works end-to-end; OTP never exposed in response; brute-force locked after 3 attempts; 5-minute expiry enforced.
  - Loan Management: Validated loan creation (friend name, positive amounts <=2 decimals, YYYY-MM-DD); authenticated listing in newest-first order.
  - Repayment: Ownership-scoped; duplicate repayment returns 409 Conflict; cross-user mutation returns 404 Not Found without leaking data.
  - Summaries: Decimal-safe calculations (total lent, repaid, outstanding, overdue); date-only calendar evaluation.
  - Mobile UI: Overdue items highlighted with alert badges and colors; INR currency display; Add Loan modal with quick dates; immediate repayment update.
  - Security: Zero secrets in git; `.env` strictly ignored; timing-safe OTP verification.
### Phase 5 — Borrowed Loans & Direction Awareness (2026-10-23)
- **Phase/tasks worked on**: End-to-end implementation of LENT and BORROWED loan directions per `docs/FEATURE-LOAN-DIRECTIONS.md`, non-destructive database migration, direction-aware APIs, separate summary metrics, mobile UI enhancements, and full test suite verification.
- **Files created/changed**:
  - `backend/prisma/schema.prisma`: Added `enum LoanType { LENT, BORROWED }`, `type LoanType @default(LENT)`, and compound index `[userId, type, isRepaid]`.
  - `backend/prisma/migrations/20261023150000_add_loan_type/migration.sql`: Non-destructive migration SQL defaulting existing rows to `LENT`.
  - `backend/src/modules/loans/loan.schema.ts`: Added loan type validation and query filter schemas (`type`, `status`, `search`).
  - `backend/src/modules/loans/loan.service.ts`: Updated `createLoan`, added query filters to `listLoans`, and implemented `getLoanById`.
  - `backend/src/modules/loans/loan.controller.ts`: Added query parameters to `listLoansHandler` and added `getLoanHandler`.
  - `backend/src/modules/loans/loan.routes.ts`: Mounted `GET /api/loans/:id`.
  - `backend/src/modules/summary/summary.service.ts`: Split summary into `totalLent`, `totalBorrowed`, `outstandingLent`, `outstandingBorrowed`, `overdueReceivable`, `overduePayable`, while preserving backwards-compatible aliases.
  - `backend/tests/loans.test.ts`: Added test cases for LENT and BORROWED creation, retrieval, filtering, repayment, and separate summary metrics.
  - `mobile/src/types/index.ts`: Added `LoanDirection = 'LENT' | 'BORROWED'`, updated `Loan`, `CreateLoanPayload`, and `Summary`.
  - `mobile/src/api/loan.api.ts`: Added query filtering parameters to `fetchLoansApi`.
  - `mobile/src/components/AddLoanModal.tsx`: Added segmented direction selector ("I've Lent" vs "I've Borrowed") with dynamic counterparty prompts and helper text.
  - `mobile/src/components/LoanCard.tsx`: Added direction indicator badges ("THEY OWE YOU" vs "YOU OWE THEM"), status labels, and direction-specific button copy.
  - `mobile/src/components/LoanDetailsModal.tsx`: Added direction banners, dynamic field labels, and direction-specific confirmation dialogues.
  - `mobile/src/components/SummaryCards.tsx`: Redesigned Bento metrics to clearly separate Lent Outstanding from Borrowed Outstanding.
  - `mobile/src/features/dashboard/DashboardScreen.tsx`: Updated toast notifications with direction awareness.
  - `mobile/src/features/loans/AllLoansScreen.tsx`: Added direction tabs (`All | Lent | Borrowed`), direction-filtered status chip counts, and dynamic totals banner.
  - `mobile/src/features/account/AccountScreen.tsx`: Added separate Lent/Borrowed portfolio breakdown and direction column in CSV export.
  - `mobile/src/components/Icons.tsx`: Added crisp vector arrow icons (`ArrowUpRightIcon`, `ArrowDownLeftIcon`).
  - `mobile/App.tsx`: Updated toast handlers and passed loans to AccountScreen.
- **Commands run**:
  - `npm test` in `backend/`: 25/25 tests passed across all 4 suites.
  - `npx tsc --noEmit` in `mobile/`: Strict TypeScript check passed with 0 errors.
  - `npx prisma db push`: Applied safely; verified 9 existing rows retained `type = 'LENT'`.
- **Commit hashes**:
  - `7879a78`: `feat(backend): add LENT and BORROWED loan direction support, query filters, and separate summary metrics`
- **Remote/push status**: Pushed to `origin/main`.

### Phase 6 — Account, Counterparties & Netting (Completed)
- **Phase/tasks worked on**: Complete end-to-end implementation of Phase 6:
  - Non-destructive Prisma migration (`User` profile fields + `Loan` counterparty fields).
  - Secure `scrypt` password hashing and `timingSafeEqual` verification utility.
  - Multi-step signup flow: Phone -> OTP verification (short-lived `signupToken`) -> Profile setup (Full Name, optional Email, Password & Confirm Password).
  - Dedicated password login endpoint with generic 401 error and 403 `PASSWORD_NOT_SET` legacy user upgrade path.
  - Registered user search endpoint (`GET /api/users/search?q=...`) returning only public fields (`id`, `name`, `maskedPhone`) with caller exclusion.
  - Loan counterparty linking (`counterpartyUserId`, `counterpartyPhone`) with external contact fallback.
  - Pairwise netting calculations between registered counterparties (`RECEIVABLE`, `PAYABLE`, `SETTLED`) in `GET /api/loans/:id` preserving original records immutably.
  - Portfolio-level net balance calculations in `GET /api/summary` (`netReceivable`, `netPayable`, `netBalance`, `netStatus`).
  - Mobile UI updates: `SignupScreen.tsx`, updated `LoginScreen.tsx` (phone + password + legacy setup), `AddLoanModal.tsx` (registered user search + outside contact fallback), `LoanDetailsModal.tsx` (counterparty identity + Pairwise Netting Card), `SummaryCards.tsx` (Net Position Bento Card), `LoanCard.tsx` (registered badge), `AccountScreen.tsx` (name and email display), and `App.tsx` (session persistence).
- **Files created/changed**:
  - `backend/prisma/schema.prisma`
  - `backend/prisma/migrations/20261023170000_account_and_counterparties/migration.sql`
  - `backend/src/lib/password.ts`
  - `backend/src/modules/auth/phone.utils.ts`
  - `backend/src/modules/auth/auth.schema.ts`
  - `backend/src/modules/auth/auth.service.ts`
  - `backend/src/modules/auth/auth.controller.ts`
  - `backend/src/modules/auth/auth.routes.ts`
  - `backend/src/modules/users/users.service.ts`
  - `backend/src/modules/users/users.controller.ts`
  - `backend/src/modules/users/users.routes.ts`
  - `backend/src/modules/loans/loan.schema.ts`
  - `backend/src/modules/loans/loan.service.ts`
  - `backend/src/modules/loans/loan.controller.ts`
  - `backend/src/modules/summary/summary.service.ts`
  - `backend/src/app.ts`
  - `backend/tests/password.test.ts`
  - `backend/tests/accounts-netting.test.ts`
  - `mobile/src/types/index.ts`
  - `mobile/src/api/auth.api.ts`
  - `mobile/src/api/loan.api.ts`
  - `mobile/src/api/users.api.ts`
  - `mobile/src/features/auth/SignupScreen.tsx`
  - `mobile/src/features/auth/LoginScreen.tsx`
  - `mobile/src/components/AddLoanModal.tsx`
  - `mobile/src/components/LoanDetailsModal.tsx`
  - `mobile/src/components/LoanCard.tsx`
  - `mobile/src/components/SummaryCards.tsx`
  - `mobile/src/features/account/AccountScreen.tsx`
  - `mobile/src/features/dashboard/DashboardScreen.tsx`
  - `mobile/App.tsx`
- **Commands run & Exact Results**:
  - `npx prisma validate`: Schema is valid.
  - `npx prisma db push`: Synchronized with Neon PostgreSQL Lakebase with 0 errors.
  - `npx prisma generate`: Generated Prisma Client cleanly.
  - `npm run build` in `backend/`: 0 errors.
  - `npx tsc --noEmit` in `mobile/`: 0 errors (strict TypeScript check passed).
  - `npm test` in `backend/`: 44/44 tests passed across all 6 test suites (`health.test.ts`, `neon.test.ts`, `password.test.ts`, `auth.test.ts`, `loans.test.ts`, `accounts-netting.test.ts`).
- **Remote/push status**: Ready to commit and push to `origin/main`.

## Handoff rule
At the start of each session, inspect `git status`, this file, `TASKS.md`, and the active phase document. Confirm actual repository state instead of trusting stale checkboxes.
