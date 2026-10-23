# MiniLedger

MiniLedger is a personal lending ledger mobile application built for Android that helps individuals track money lent to friends, monitor due dates, record full repayments, and view real-time lending summaries (total lent, total repaid, outstanding balance, and overdue amounts).

This repository contains both the **Express + TypeScript REST API backend** (with PostgreSQL and Prisma ORM) and the **Expo React Native TypeScript mobile client** (with Expo SecureStore).

---

## Project Status: All Phases Completed & Verified (Phases 0–4)

- [x] **Phase 0 — Foundation & Setup**: Express + TypeScript backend, Expo React Native mobile client, strict TypeScript configurations, health endpoints, environment guards.
- [x] **Phase 1 — PostgreSQL, Prisma & Authentication**:
  - PostgreSQL schema with Prisma ORM (`User`, `Loan`, `OtpChallenge` models).
  - Phone normalization to E.164 and Indian 10-digit mobile number parsing.
  - Development mock 6-digit OTP generation with cryptographic random numbers, SHA-256 hash storage, 5-minute expiry, and 3-attempt rate limiting.
  - OTP is logged solely to the backend terminal; **never exposed in API responses**.
  - JWT token issuance upon verification and Bearer authentication middleware.
- [x] **Phase 2 — Loan & Summary APIs**:
  - `POST /api/loans`: Validated loan creation (friend name, positive amount ≤2 decimals, ISO date).
  - `GET /api/loans`: Authenticated loan listing ordered newest first.
  - `PATCH /api/loans/:id/repay`: Ownership-scoped repayment marking `isRepaid: true` and recording `repaidAt` timestamp. Prevents duplicate repayments (409 Conflict) and isolates cross-user data (404 Not Found).
  - `GET /api/summary`: Decimal-safe financial aggregates (`totalLent`, `totalRepaid`, `outstandingAmount`, `overdueAmount`) using calendar-based date-only overdue policy.
- [x] **Phase 3 — React Native Mobile Application**:
  - Phone number login screen with country code support.
  - 6-digit OTP entry screen with masked phone display, resend option, and dev hints.
  - Secure session storage with `expo-secure-store`.
  - Dashboard featuring 2x2 summary cards with contextual color badges.
  - Loan list highlighting overdue entries (red badge & alert borders) and settled entries (green badges).
  - Add-loan modal form with quick date shortcuts (+7 days, +14 days, +30 days) and client-side validation.
  - Inline "Mark Repaid" action that updates ledger totals immediately.
  - Full support for physical Android devices over local Wi-Fi.
- [x] **Phase 4 — Quality & Delivery**:
  - 20/20 automated backend integration tests passing with Vitest.
  - Strict TypeScript check (`npx tsc --noEmit`) passing with 0 errors across backend and mobile.
  - Production TypeScript builds verified.
  - Zero secrets committed (`.env` ignored, mock OTP safe).

---

## Repository Structure

```text
MiniLedger/
├── backend/                  # Express + TypeScript + Prisma REST API
│   ├── prisma/
│   │   ├── schema.prisma     # Prisma schema (User, Loan, OtpChallenge)
│   │   └── migrations/       # SQL baseline migrations
│   ├── src/
│   │   ├── config/           # Environment validation (PORT, DATABASE_URL, JWT_SECRET)
│   │   ├── lib/              # Prisma singleton, crypto helpers, date & money arithmetic
│   │   ├── middleware/       # JWT Bearer authentication middleware
│   │   ├── modules/
│   │   │   ├── auth/         # Phone normalization, OTP service, controller, routes
│   │   │   ├── loans/        # Loan CRUD service, controller, routes
│   │   │   └── summary/      # Decimal-safe summary service, controller, routes
│   │   ├── routes/           # Health check routes
│   │   ├── app.ts            # Express setup and router registration
│   │   └── index.ts          # Server entry point
│   ├── tests/                # Automated integration tests (Vitest + Supertest)
│   ├── .env.example          # Environment variable template
│   ├── tsconfig.json         # Strict TypeScript configuration
│   └── package.json          # Dependencies and scripts
├── mobile/                   # React Native + Expo + TypeScript Client
│   ├── src/
│   │   ├── api/              # Typed HTTP client and API endpoints
│   │   ├── components/       # SummaryCards, LoanCard, AddLoanModal, ErrorBanner
│   │   ├── features/
│   │   │   ├── auth/         # LoginScreen and OtpScreen
│   │   │   └── dashboard/    # DashboardScreen
│   │   ├── types/            # Shared interfaces (User, Loan, Summary)
│   │   └── utils/            # Config, formatters (₹ INR), secure storage
│   ├── App.tsx               # Root session coordinator
│   ├── app.json              # Expo application configuration
│   ├── tsconfig.json         # Mobile TypeScript configuration
│   └── package.json          # Dependencies and scripts
├── docs/                     # Specifications and architectural documentation
│   ├── SPEC.md               # Product specification and acceptance criteria
│   ├── ARCHITECTURE.md       # System architecture and data flow
│   ├── API.md                # REST API contract
│   ├── SCHEMA.md             # Database schema design
│   ├── TASKS.md              # Master task execution checklist
│   ├── PROGRESS.md           # Verified progress log
│   ├── SECURITY.md           # Security and data protection rules
│   ├── CONVENTIONS.md        # Code style and header conventions
│   ├── TESTING.md            # Testing strategy and coverage
│   ├── DECISIONS.md          # Architectural decisions log
│   ├── Design.md             # Mobile UI design brief
│   └── phases/               # Phase execution guides (Phases 0–4)
├── .gitignore                # Root gitignore rules
└── README.md                 # Project documentation and quickstart
```

---

## Prerequisites

- **Node.js**: v20+ LTS (tested on Node v24.11.1)
- **npm**: v10+ (tested on npm 11.19.1)
- **PostgreSQL**: PostgreSQL 15+ (local instance or cloud database such as Neon)
- **Android Device / Emulator**:
  - Android phone with the [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) app, OR
  - Android Studio Emulator.

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/OmChauhan07/MiniLedger.git
cd MiniLedger
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env to set your DATABASE_URL and JWT_SECRET (must be >= 32 characters)

# Synchronize database schema and generate Prisma Client
npx prisma db push

# Run backend development server (default port: 4000)
npm run dev
```

In another terminal, run tests and build checks:
```bash
# Run 20 integration tests
npm test

# Build production bundle
npm run build
```

Verify backend health:
```bash
curl http://localhost:4000/api/health
# Response: {"status":"ok","service":"MiniLedger API"}
```

### 3. Mobile Setup

```bash
cd ../mobile

# Install dependencies
npm install

# Run TypeScript type check
npm run typecheck

# Start Expo development server
npx expo start
```

---

## Running on Android

### Using a Physical Android Phone (Expo Go)
1. Ensure your Android phone and development computer are connected to the **same Wi-Fi network**.
2. Note your development computer's LAN IP address (configured in `mobile/src/utils/config.ts`).
3. Run `npx expo start` in the `mobile/` directory.
4. Open the **Expo Go** app on your Android phone and scan the displayed QR code.
5. In the app:
   - Enter your phone number (e.g. `9876543210`) and tap **Continue with OTP**.
   - Check your **backend server terminal** where the 6-digit mock code is printed:
     ```text
     [MOCK OTP] Phone: +919876543210 | Code: 123456 (valid for 5 minutes)
     ```
   - Enter the 6-digit code on the phone to complete login.
   - Explore the dashboard: add loans, observe overdue indicators, mark loans repaid, and watch the totals update immediately!

### Using an Android Emulator
1. Start an Android Virtual Device (AVD) from Android Studio.
2. In the `mobile/` directory, run:
   ```bash
   npm run android
   ```
   Or press `a` in the Expo CLI terminal.

---

## API Summary

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | No | Health check |
| `POST` | `/api/auth/send-otp` | No | Generates mock OTP challenge (logged to server) |
| `POST` | `/api/auth/verify-otp` | No | Validates OTP and issues JWT |
| `POST` | `/api/loans` | Bearer | Creates loan (`friendName`, `amount`, `dueDate`) |
| `GET` | `/api/loans` | Bearer | Lists user's loans (newest first) |
| `PATCH` | `/api/loans/:id/repay` | Bearer | Marks loan as repaid (409 on duplicate, 404 for other users) |
| `GET` | `/api/summary` | Bearer | Returns decimal-safe lending aggregates |

---

## Verification & Testing Evidence

```text
Backend Test Suite (Vitest v5.0.5):
 ✓ tests/health.test.ts (2 tests)
 ✓ tests/auth.test.ts (10 tests: OTP lifecycle, expiry, invalid input, lockout, JWT middleware)
 ✓ tests/loans.test.ts (8 tests: loan CRUD, user isolation, repayment conflict, decimal summary)
 Test Files  3 passed (3)
      Tests  20 passed (20)

Mobile Strict Typecheck:
 > mobile@1.0.0 typecheck
 > tsc --noEmit
 Clean (0 errors)

Prisma Schema Validation:
 The schema at prisma\schema.prisma is valid 🚀
```

---

## Security

- **Strict User Isolation**: All read and write operations on loans and summaries filter strictly by `userId` derived from verified JWT.
- **Mock OTP Safety**: Mock OTP challenges are cryptographically hashed using SHA-256 before database insertion and never returned in API payloads.
- **No Committed Secrets**: `.env` is explicitly ignored across git.
- **Timing-Safe Verification**: OTP comparisons use `crypto.timingSafeEqual` to eliminate timing side-channels.

---

## License

ISC License.
