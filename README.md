# MiniLedger

MiniLedger is a personal lending ledger mobile application built for Android that helps individuals track money lent and borrowed, monitor due dates, record repayments, discover registered counterparties, settle mutual balances with bilateral pairwise netting, export statement PDFs, and manage profile avatars.

This repository contains both the **Express + TypeScript REST API backend** (powered by PostgreSQL/Neon and S3-Compatible Object Storage with Prisma ORM) and the **Expo React Native TypeScript mobile client** (with Expo SecureStore).

---

## Features & Highlights

- **Core Lending & Ledger Engine**:
  - Full support for both **LENT** and **BORROWED** loan types.
  - Decimal-safe financial arithmetic for portfolio aggregates: `totalLent`, `totalBorrowed`, `totalRepaid`, `outstandingLent`, `outstandingBorrowed`, `overdueReceivable`, and `overduePayable`.
  - Atomic repayment marking with concurrency control: prevents double repayments using isolated database updates.
  - Query parameter validation: strictly validates status and direction filters, rejecting malformed input with HTTP 400.
- **Authentication & Identity Security**:
  - Phone normalization to E.164 and Indian 10-digit mobile number parsing.
  - Cryptographically secure 6-digit OTP generation with SHA-256 hash storage, 5-minute expiry, 60-second cooldown, and 3-attempt lockout.
  - Mock OTPs logged prominently to the backend terminal in local development; never returned in API payloads.
  - Password-based authentication for registered users; secure legacy OTP setup flow for existing accounts.
  - Timing-safe verification using `crypto.timingSafeEqual` to prevent timing attacks.
  - JWT token issuance upon verification and Bearer authentication middleware.
- **Registered Counterparties & Bilateral Pairwise Netting**:
  - Counterparty discovery via `GET /api/users/search?q=...` with privacy-preserving phone number masking.
  - Bilateral mutual ledgers: loans linked between registered users automatically invert perspective (Lender sees Lent; Borrower sees Borrowed).
  - Pairwise netting calculation via `GET /api/users/:id/relationship` computing net receivable, net payable, or settled status.
- **Profile Editing & Atomic Verification**:
  - Profile updates require phone OTP verification before committing changes.
  - Atomic verification and update token consumption to prevent token reuse or tampering.
- **Server-Generated PDF Statements**:
  - Authoritative PDF ledger generation via `POST /api/ledger/export/pdf`.
  - Filter by direction (All, Lent, Borrowed), status (Outstanding, Overdue, Repaid), date range, or counterparty.
  - Base64 JSON and direct binary PDF delivery with native device sharing (`expo-sharing`).
- **Profile Picture Avatar Upload & S3 Object Storage**:
  - Native gallery image picker (`expo-image-picker`) with 1:1 square crop preview, replacement, and removal.
  - S3-compatible object storage via AWS SDK v3 with private bucket architecture.
  - Cryptographic magic byte detection supporting JPEG (`0xFFD8FF`), PNG (`0x89504E47`), and WebP (`RIFF...WEBP`).
  - 5MB file-size limit enforced with HTTP 413 handling.
  - Short-lived presigned URLs (1 hour) and authenticated streaming endpoints (`/api/account/avatar` and `/api/users/:id/avatar`).
- **Comprehensive Test Coverage**:
  - **85/85 automated backend integration tests passing** with Vitest against live PostgreSQL and Object Storage.
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
│   │   └── index.ts          # Server entry point (listens on 0.0.0.0:4000)
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
│   ├── .env.example          # Mobile environment template (EXPO_PUBLIC_API_URL)
│   └── package.json          # Dependencies and scripts
└── README.md                 # Project documentation and quickstart
```

---

## How to Run Locally

### Prerequisites
- **Node.js**: v20+ LTS
- **npm**: v10+
- **PostgreSQL**: PostgreSQL 15+ database (local instance or cloud database such as Neon)
- **Device for testing**:
  - Android phone with the [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) app installed (connected to the same Wi-Fi), OR
  - Android Studio Virtual Device (Emulator).

### Database Configuration

MiniLedger supports both **local PostgreSQL** and **Neon PostgreSQL**.

Configure the `DATABASE_URL` variable in your backend environment file (`backend/.env`) with the connection string for your chosen database:

- **Option 1: Neon PostgreSQL**  
  Use your Neon PostgreSQL connection string as `DATABASE_URL`:
  ```env
  DATABASE_URL="postgresql://neondb_owner:<password>@<endpoint>-pooler.<region>.aws.neon.tech/neondb?sslmode=require"
  ```

- **Option 2: Local PostgreSQL**  
  If you prefer local PostgreSQL instead of Neon, create a database locally and set `DATABASE_URL` to your local connection string. For example:
  ```env
  DATABASE_URL="postgresql://postgres:your_password@localhost:5432/miniledger"
  ```
  *(Replace `postgres`, `your_password`, and `miniledger` with your actual PostgreSQL username, password, and database name).*

#### Initialize the Database Schema

After configuring the connection string, run the database setup command from the `backend/` directory using the project's existing Prisma configuration:

- **Apply existing Prisma migrations**:
  ```bash
  npx prisma migrate deploy
  ```
- **Or synchronize the Prisma schema directly**:
  ```bash
  npx prisma db push
  ```

Ensure the selected PostgreSQL server is running and the target database exists before initializing the schema. Never commit real database credentials to Git.

---

### Step 1: Find Your Computer's LAN IP Address

To allow your physical phone on Wi-Fi to reach your backend server, identify your computer's local IPv4 address:

- **Windows**: Open Command Prompt / PowerShell and run:
  ```powershell
  ipconfig
  ```
  Look for your active Wi-Fi adapter (e.g. `Wireless LAN adapter Wi-Fi`) and copy the **IPv4 Address** (e.g. `192.168.1.100` or `10.0.0.x`).
- **macOS / Linux**: Run `ifconfig` or `ip a` and locate your Wi-Fi interface address (`en0` / `wlan0`).

---

### Step 2: Start the Backend Server

Open a terminal and navigate to the `backend/` directory:

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env to set DATABASE_URL (see Database Configuration above) and JWT_SECRET (>= 32 characters)
# (Note: AWS/Neon S3 credentials are only required if testing the optional profile avatar upload feature)

# 3. Initialize database schema
npx prisma db push
# (or: npx prisma migrate deploy)

# 4. Start the development server (listens on 0.0.0.0:4000)
npm run dev
```

*Expected output:*
```text
MiniLedger API running on port 4000 [development]
```

Verify backend health in your browser or curl:
```bash
curl http://localhost:4000/api/health
# Response: {"status":"ok","service":"MiniLedger API"}
```

---

### Step 3: Configure and Start the Mobile App

Open a **second terminal** and navigate to the `mobile/` directory:

```bash
cd mobile

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
```

Open `mobile/.env` and set `EXPO_PUBLIC_API_URL` based on how you are running the app:

- **Option A (Physical Phone over Wi-Fi)**:
  ```env
  EXPO_PUBLIC_API_URL="http://<YOUR_LAN_IP>:4000/api"
  ```
  *(Example: `EXPO_PUBLIC_API_URL="http://192.168.1.100:4000/api"`)*

- **Option B (Android Studio Emulator)**:
  ```env
  EXPO_PUBLIC_API_URL="http://10.0.2.2:4000/api"
  ```

- **Option C (iOS Simulator / Web)**:
  ```env
  EXPO_PUBLIC_API_URL="http://localhost:4000/api"
  ```

Now start the Expo development server with a **cleared cache** (`-c`) so it loads the updated environment variable:

```bash
npx expo start -c
```

---

### Step 4: Test on Your Phone (Expo Go)

1. Make sure your phone is connected to the **same Wi-Fi network** as your computer.
2. Open the **Expo Go** app on your Android phone and scan the QR code displayed in the terminal.
3. In the app:
   - Enter your phone number (e.g., `9876543210`) and tap **Continue with OTP**.
   - Check your **backend server terminal** where the 6-digit mock OTP is prominently logged:
     ```text
     ==================================================
       🔑 [MOCK OTP] Phone: +919876543210 | Code: 492104
       Valid for 5 minutes (attempt 1/3)
     ==================================================
     ```
   - Enter the 6-digit code in the app to complete authentication.
   - Explore the app: create loans, upload a profile avatar, filter statements, and export a ledger PDF!

---

## Local API Endpoints

### Base URL: `http://localhost:4000/api` (or `http://<YOUR_LAN_IP>:4000/api`)

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

## Running Verification Tests

```bash
# Run backend integration tests (85 tests across 9 test files)
cd backend
npm test

# Run mobile strict TypeScript typecheck
cd ../mobile
npm run typecheck

# Verify backend production build
cd ../backend
npm run build
```

---

## License

ISC License.
