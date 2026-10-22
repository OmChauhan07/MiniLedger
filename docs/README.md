# MiniLedger

MiniLedger is a small mobile app for recording money lent to friends, tracking due dates, marking loans as repaid, and seeing a summary of lending and overdue amounts.

## Features
- Phone-number login with a development-only mock OTP printed in the backend terminal.
- JWT-protected API routes.
- Add and list loan entries.
- Mark a loan as fully repaid.
- Dashboard summary: total lent, total repaid, outstanding amount, and overdue amount.
- Overdue entries highlighted in the mobile UI.
- Input validation and automated tests.
- Optional receipt upload only after all required functionality is complete.

> The OTP is mocked for this assignment. It does not send an SMS and is not suitable for production authentication.

## Stack
- React Native + Expo + TypeScript
- Node.js + Express + TypeScript
- PostgreSQL + Prisma
- Zod validation
- JWT authentication
- Vitest/Jest + Supertest (choose and configure one test stack)

## Repository structure
```text
MiniLedger/
├── AGENTS.md
├── README.md
├── SPEC.md
├── ARCHITECTURE.md
├── TASKS.md
├── CONVENTIONS.md
├── TESTING.md
├── API.md
├── SCHEMA.md
├── DECISIONS.md
├── PROGRESS.md
├── SECURITY.md
├── PROMPTS.md
├── CONTRIBUTING.md
├── Design.md
├── phases/
├── backend/
└── mobile/
```

## Prerequisites
- Node.js LTS compatible with the selected Expo SDK.
- npm and Git.
- PostgreSQL database (local or hosted).
- Expo Go on an Android phone, or Android Studio with an emulator.
- VS Code or another editor.

## Environment setup
1. Clone the repository.
2. Install backend and mobile dependencies in their respective directories.
3. Create `backend/.env` from `backend/.env.example`.
4. Fill in the database URL and JWT secret locally. Never commit `.env`.
5. Generate Prisma Client and run migrations.
6. Start the API and verify `GET /api/health`.
7. Start Expo and open the app on Android.
8. Configure the mobile API base URL to use the development machine's LAN IP when using a physical phone. `localhost` on the phone refers to the phone itself, not the computer.

The exact commands and environment variable names must be kept aligned with `ARCHITECTURE.md`, `SECURITY.md`, and the actual implementation.

## Development commands

### Backend
```bash
cd backend
npm install
npm run dev
npm run build
npm test
npx prisma generate
npx prisma migrate dev
```

### Mobile
```bash
cd mobile
npm install
npx expo start
npx tsc --noEmit
npm test
```

If a script is not configured yet, add it during the relevant phase and document its actual availability. Do not report tests as passing unless they were run.

## Mock OTP flow
1. Enter a phone number in the app.
2. The API generates a short-lived OTP and prints it in the backend terminal.
3. Enter the OTP in the app.
4. The API verifies it and returns a JWT.
5. The app uses the JWT as a Bearer token for protected requests.

The OTP must expire, have an attempt limit, and be invalidated after successful verification. Mock OTP values must not be returned by the API response.

## API overview
See [`API.md`](./API.md) for the contract and [`SCHEMA.md`](./SCHEMA.md) for data models.

## Testing
See [`TESTING.md`](./TESTING.md). Minimum coverage includes authentication, ownership checks, loan creation, repayment, and summary calculations.

## Submission checklist
- [ ] Core flow works on Android.
- [ ] Tests and build/type checks pass.
- [ ] `.env.example` contains placeholders only.
- [ ] README setup steps were verified from a clean clone where feasible.
- [ ] GitHub repository contains all source and docs.
- [ ] 2–3 minute screen recording demonstrates login, adding a loan, overdue highlighting, repayment and updated summary.
- [ ] Shareable recording link is included in the final submission.

## Known limitations
- Mock OTP does not send SMS.
- Initial scope supports full repayment only, not partial repayments.
- Receipt uploads are optional and must not delay core requirements.
