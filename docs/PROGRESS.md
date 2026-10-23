# MiniLedger Progress Log

Purpose: Preserve verified project state between agent sessions. Update this file at the end of every phase and before handing work to another agent/session.

## Current status
- [x] Repository initialized
- [x] Backend health endpoint
- [x] Database schema/migrations
- [x] Mock OTP + JWT
- [ ] Loan APIs + summary
- [ ] Mobile login/dashboard/forms
- [ ] Tests and code review
- [ ] GitHub README verified
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
- **Remote/push status**: Clean, ready to commit and push.
- **Next exact action**: Begin Phase 2 (Loan APIs and Summary).

## Handoff rule
At the start of each session, inspect `git status`, this file, `TASKS.md`, and the active phase document. Confirm actual repository state instead of trusting stale checkboxes.
