# MiniLedger

MiniLedger is a personal lending ledger mobile application built for Android that helps individuals track money lent and borrowed, monitor due dates, record repayments, discover registered counterparties, settle mutual balances with bilateral pairwise netting, export statement PDFs, and manage profile avatars.

This repository contains both the **Express + TypeScript REST API backend** (powered by Neon PostgreSQL and Neon S3-Compatible Object Storage with Prisma ORM) and the **Expo React Native TypeScript mobile client** (with Expo SecureStore and EAS build support).

---

## Current Project Status: Production Ready & Verified

- [x] **Core Lending & Ledger Engine**:
  - Full support for both **LENT** and **BORROWED** loan types.
  - Decimal-safe financial arithmetic for portfolio aggregates: `totalLent`, `totalBorrowed`, `totalRepaid`, `outstandingLent`, `outstandingBorrowed`, `overdueReceivable`, and `overduePayable`.
  - Atomic repayment marking with concurrency control: prevents double repayments using isolated database updates.
  - Query parameter validation: strictly validates status and direction filters, rejecting malformed input with HTTP 400.
- [x] **Authentication & Identity Security**:
  - Phone normalization to E.164 and Indian 10-digit mobile number parsing.
  - Cryptographically secure 6-digit OTP generation with SHA-256 hash storage, 5-minute expiry, 60-second cooldown, and 3-attempt lockout.
  - Password-based authentication for verified users; secure legacy OTP setup flow for existing accounts.
  - Timing-safe verification using `crypto.timingSafeEqual` to prevent timing attacks.
  - JWT token issuance upon verification and Bearer authentication middleware.
- [x] **Registered Counterparties & Bilateral Pairwise Netting**:
  - Counterparty discovery via `GET /api/users/search?q=...` with privacy-preserving phone number masking.
  - Bilateral mutual ledgers: loans linked between registered users automatically invert perspective (Lender sees Lent; Borrower sees Borrowed).
  - Pairwise netting calculation via `GET /api/users/:id/relationship` computing net receivable, net payable, or settled status.
- [x] **Profile Editing & Atomic Verification**:
  - Profile updates require phone OTP verification before committing changes.
  - Atomic verification and update token consumption to prevent token reuse or tampering.
- [x] **Server-Generated PDF Statements**:
  - Authoritative PDF ledger generation via `POST /api/ledger/export/pdf`.
  - Filter by direction (All, Lent, Borrowed), status (Outstanding, Overdue, Repaid), date range, or counterparty.
  - Base64 JSON and direct binary PDF delivery with native device sharing (`expo-sharing`).
- [x] **Profile Picture Avatar Upload & Neon Object Storage**:
  - Native gallery image picker (`expo-image-picker`) with 1:1 square crop preview, replacement, and removal.
  - Neon S3-compatible object storage via AWS SDK v3 with private bucket architecture.
  - Cryptographic magic byte detection supporting JPEG (`0xFFD8FF`), PNG (`0x89504E47`), and WebP (`RIFF...WEBP`).
  - 5MB file-size limit enforced with HTTP 413 handling.
  - Short-lived presigned URLs (1 hour) and authenticated streaming endpoints (`/api/account/avatar` and `/api/users/:id/avatar`).
  - Safe replacement logic: existing avatar is never deleted before the new image upload succeeds.
- [x] **Cloud Deployment & Production Mobile Architecture**:
  - **Render Backend**: Deployed at `https://miniledger-api-14ch.onrender.com` with active health check at `/api/health`.
  - **Mobile Production Config**: Driven by `EXPO_PUBLIC_API_URL="https://miniledger-api-14ch.onrender.com"`.
  - **Canonical URL Resolution**: `buildApiUrl` guarantees single `/api` prefixes with 0 duplicate `/api/api/` occurrences.
  - **EAS Build Configuration**: `eas.json` configured for Android preview APK (`android.buildType: "apk"`).
- [x] **Comprehensive Test Coverage**:
  - **85/85 automated backend integration tests passing** with Vitest against live Neon PostgreSQL and Neon Object Storage.
  - Strict TypeScript check (`tsc --noEmit`) passing with 0 errors across backend and mobile.

---

## Repository Structure

```text
MiniLedger/
├── backend/                  # Express + TypeScript + Prisma REST API
│   ├── prisma/
│   │   ├── schema.prisma     # Prisma schema (User, Loan, OtpChallenge)
│   │   └── migrations/       # SQL migrations (additive, production-safe)
│   ├── src/
│   │   ├── config/           # Environment validation (PORT, DATABASE_URL, JWT_SECRET, AWS S3)
│   │   ├── lib/              # Prisma singleton, crypto, storage (AWS S3), PDF generator
│   │   ├── middleware/       # JWT Bearer authentication & role verification
│   │   ├── modules/
│   │   │   ├── auth/         # Phone OTP, password signup/login, legacy setup
│   │   │   ├── account/      # Profile update with OTP, avatar upload/delete/stream
│   │   │   ├── loans/        # Loan CRUD, concurrency-safe repayments, filters
│   │   │   ├── summary/      # Decimal-safe summary aggregates
│   │   │   ├── users/        # Counterparty discovery & pairwise netting
│   │   │   └── ledger/       # PDF ledger export endpoint
│   │   ├── routes/           # Health check routes (/api/health and /health)
│   │   ├── app.ts            # Express setup and router registration
│   │   └── index.ts          # Server entry point
│   ├── tests/                # 9 integration test suites (85 tests passing)
│   ├── .env.example          # Backend environment variable template
│   └── package.json          # Dependencies and scripts
├── mobile/                   # React Native + Expo + TypeScript Client
│   ├── src/
│   │   ├── api/              # Typed HTTP client with canonical URL resolution
│   │   ├── components/       # SummaryCards, LoanCard, AvatarPickerModal, ExportPdfModal, etc.
│   │   ├── features/
│   │   │   ├── auth/         # LoginScreen, SignupScreen, OtpScreen
│   │   │   ├── dashboard/    # Bento dashboard with avatar and quick stats
│   │   │   ├── loans/        # LentLoansScreen, BorrowedLoansScreen, AllLoansScreen
│   │   │   └── account/      # Account profile, avatar management, PDF export
│   │   ├── types/            # Shared interfaces (User, Loan, Summary, Counterparty)
│   │   ├── utils/            # Config, formatters (₹ INR), secure storage
│   │   └── theme/            # Theme tokens, colors, and shadows
│   ├── App.tsx               # Root session coordinator and tab navigation
│   ├── app.json              # Expo application configuration (com.credsetu.miniledger)
│   ├── eas.json              # EAS Build profiles (preview APK & production)
│   ├── .env.example          # Mobile environment template (EXPO_PUBLIC_API_URL)
│   └── package.json          # Dependencies and scripts
└── README.md                 # Project documentation and quickstart
```

---

## Production API Endpoints

### Base URL: `https://miniledger-api-14ch.onrender.com`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | No | System health and database connectivity |
| `POST` | `/api/auth/register/send-otp` | No | Initiates registration OTP challenge |
| `POST` | `/api/auth/register/verify-otp` | No | Verifies registration OTP and returns signup token |
| `POST` | `/api/auth/register/complete` | No | Finalizes registration with name, email, password |
| `POST` | `/api/auth/login` | No | Password authentication for existing users |
| `POST` | `/api/auth/send-otp` | No | Passwordless OTP challenge (logged to terminal in non-prod) |
| `POST` | `/api/auth/verify-otp` | No | Validates OTP and issues JWT |
| `GET` | `/api/account` | Bearer | Fetches current user profile including avatar URL |
| `PATCH` | `/api/account` | Bearer | Proposes profile edits and sends OTP challenge |
| `POST` | `/api/account/verify-update`| Bearer | Verifies OTP and atomically applies profile changes |
| `POST` | `/api/account/avatar` | Bearer | Uploads profile avatar (binary buffer or JSON base64) |
| `DELETE` | `/api/account/avatar` | Bearer | Deletes avatar and reverts to initials avatar |
| `GET` | `/api/account/avatar` | Bearer | Streams authenticated user's avatar image directly |
| `GET` | `/api/users/search` | Bearer | Discovers registered users by name or phone prefix |
| `GET` | `/api/users/:id/relationship`| Bearer | Bilateral ledger and pairwise netting calculations |
| `GET` | `/api/users/:id/avatar` | Bearer | Streams counterparty's avatar image directly |
| `POST` | `/api/loans` | Bearer | Creates loan (`friendName`, `amount`, `dueDate`, `type`, counterparty) |
| `GET` | `/api/loans` | Bearer | Lists user loans with optional filters (`type`, `status`, `search`) |
| `PATCH` | `/api/loans/:id/repay` | Bearer | Atomically marks loan repaid (concurrency-safe) |
| `GET` | `/api/summary` | Bearer | Returns decimal-safe lending aggregates |
| `POST` | `/api/ledger/export/pdf` | Bearer | Generates filtered PDF statement |

---

## Mobile Environment Configuration

The mobile app reads `EXPO_PUBLIC_API_URL` to connect to the backend.

### Production Environment (`mobile/.env`)
```bash
EXPO_PUBLIC_API_URL="https://miniledger-api-14ch.onrender.com"
```

### Local Development (`mobile/.env.local` or defaults)
If `EXPO_PUBLIC_API_URL` is omitted in development mode (`__DEV__`), the app automatically resolves:
- **Android Emulator**: `http://10.0.2.2:4000/api`
- **iOS Simulator / Web**: `http://localhost:4000/api`
- **Physical Device**: Set `EXPO_PUBLIC_DEV_HOST="192.168.x.x"` for local Wi-Fi testing.

All endpoint requests use `buildApiUrl` in `mobile/src/api/client.ts`, which normalizes any base URL to prevent missing prefixes or duplicate `/api/api` paths.

---

## Android APK Build (Expo EAS)

The project includes an `eas.json` build configuration with an installable APK profile:

```bash
cd mobile

# 1. Login to Expo EAS (if not already authenticated)
npx eas-cli login

# 2. Build the Android Preview APK using the production Render API
npx eas-cli build --platform android --profile preview
```

The `preview` profile builds a standalone `.apk` package (`android.buildType: "apk"`) pre-configured with `EXPO_PUBLIC_API_URL="https://miniledger-api-14ch.onrender.com"`.

---

## Verification & Test Results

```text
Backend Integration Test Suite (Vitest v5.0.5):
 ✓ tests/loans.test.ts (8 tests)
 ✓ tests/accounts-netting.test.ts (15 tests)
 ✓ tests/cross-account-visibility.test.ts (8 tests)
 ✓ tests/auth.test.ts (12 tests)
 ✓ tests/account-and-pdf.test.ts (15 tests)
 ✓ tests/avatar.test.ts (14 tests)
 ✓ tests/neon.test.ts (3 tests)
 ✓ tests/password.test.ts (4 tests)
 ✓ tests/health.test.ts (3 tests)

 Test Files  9 passed (9)
      Tests  85 passed (85)
   Duration  306.32s

Mobile Strict Typecheck:
 > mobile@1.0.0 typecheck
 > tsc --noEmit
 Clean (0 errors)

Backend TypeScript Build:
 > miniledger-backend@0.1.0 build
 > tsc -p tsconfig.build.json
 Clean (0 errors)

Production Render Health Check:
 curl https://miniledger-api-14ch.onrender.com/api/health
 HTTP 200 OK: {"status":"ok","service":"MiniLedger API"}
```

---

## License

ISC License.
