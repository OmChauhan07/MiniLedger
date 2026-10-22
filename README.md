# MiniLedger

MiniLedger is a personal lending ledger mobile application built for Android that helps individuals track money lent to friends, monitor due dates, record full repayments, and view lending summaries (total lent, total repaid, outstanding balance, and overdue amounts).

This repository contains both the **Express + TypeScript REST API backend** and the **Expo React Native TypeScript mobile client**.

---

## Current Status: Phase 0 Completed

Phase 0 (Foundation and Local Development) is complete and verified:
- [x] Monorepo structure initialized with `backend/`, `mobile/`, and `docs/`.
- [x] Backend initialized with Express, TypeScript, Zod, and Vitest.
- [x] Verified `GET /api/health` endpoint returning `{ status: "ok", service: "MiniLedger API" }`.
- [x] Safe environment configuration (`.env.example`) and comprehensive `.gitignore`.
- [x] Expo React Native TypeScript mobile project initialized with Android support.
- [x] Type checking and automated tests passing.

---

## Repository Structure

```text
MiniLedger/
├── backend/                  # Node.js + Express + TypeScript REST API
│   ├── src/
│   │   ├── config/           # Environment configuration with Zod validation
│   │   ├── routes/           # API routes (e.g., /api/health)
│   │   ├── app.ts            # Express application setup and middleware
│   │   └── index.ts          # Server entry point
│   ├── tests/                # Automated API tests (Vitest + Supertest)
│   ├── .env.example          # Safe environment variable template
│   ├── tsconfig.json         # TypeScript strict configuration
│   └── package.json          # Backend dependencies and scripts
├── mobile/                   # React Native + Expo + TypeScript app
│   ├── App.tsx               # Root mobile application component
│   ├── app.json              # Expo application configuration
│   ├── tsconfig.json         # Mobile TypeScript configuration
│   └── package.json          # Mobile dependencies and scripts
├── docs/                     # Specifications and architectural guides
│   ├── SPEC.md               # Product specification and acceptance criteria
│   ├── ARCHITECTURE.md       # System design and boundaries
│   ├── API.md                # REST API contract
│   ├── SCHEMA.md             # Database schema design
│   ├── TASKS.md              # Master task execution checklist
│   ├── PROGRESS.md           # Verified progress log
│   ├── SECURITY.md           # Security and data protection rules
│   ├── CONVENTIONS.md        # Code conventions and required headers
│   ├── TESTING.md            # Testing strategy and requirements
│   ├── DECISIONS.md          # Architecture decision records
│   ├── Design.md             # Mobile UI/UX design brief
│   └── phases/               # Phase execution guides (Phases 0–4)
├── .gitignore                # Root gitignore rules
└── README.md                 # Project overview and setup guide
```

---

## Prerequisites

- **Node.js**: v20+ LTS (tested on Node v24.11.1)
- **npm**: v10+ (tested on npm 11.19.1)
- **Git**: v2.40+
- **Android Testing**:
  - Physical Android phone with the [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) app installed, OR
  - Android Studio with an Android Emulator configured.

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

# Create local environment file from example
cp .env.example .env

# Run development server (default port: 4000)
npm run dev

# Run automated tests
npm test

# Build production bundle
npm run build
```

Verify backend health in another terminal:
```bash
curl http://localhost:4000/api/health
# Response: {"status":"ok","service":"MiniLedger API"}
```

### 3. Mobile Setup

```bash
cd mobile

# Install dependencies
npm install

# Start Expo development server
npx expo start

# Run TypeScript type check
npx tsc --noEmit
```

---

## Running on Android

### Using a Physical Android Phone (Expo Go)
1. Ensure your Android phone and development computer are connected to the **same Wi-Fi network**.
2. Run `npx expo start` in the `mobile/` directory.
3. Open the **Expo Go** app on your Android phone.
4. Scan the QR code displayed in the terminal.
5. The JavaScript bundle will compile and launch the MiniLedger app on your phone.

> **Note on Network Configuration**: When connecting mobile to the backend API, physical devices cannot use `localhost` (which refers to the phone itself). Use your computer's local network IP address (e.g., `http://192.168.x.x:4000`).

### Using an Android Emulator
1. Start an Android Virtual Device (AVD) from Android Studio.
2. In the `mobile/` directory, run:
   ```bash
   npm run android
   ```
   Or press `a` in the interactive Expo CLI terminal.
3. For Android Emulator API access, `http://10.0.2.2:4000` maps to host `localhost:4000`.

---

## Planned Architecture & Phase Roadmap

MiniLedger is built following an iterative, phase-gated execution plan:

- **Phase 0 — Foundation and Local Development** *(Completed)*: Repository structure, Express TypeScript API, health check endpoint, safe environment configuration, Expo React Native mobile project setup, and Android verification.
- **Phase 1 — Database & Authentication**: PostgreSQL with Prisma ORM, User model, development mock phone OTP generation and server logging, JWT authentication, and auth middleware.
- **Phase 2 — Loan & Summary APIs**: Validated loan CRUD operations, ownership-scoped repayment, decimal-safe financial calculations (lent, repaid, outstanding, overdue).
- **Phase 3 — Mobile Integration & Screens**: Phone/OTP authentication screen, secure token persistence, dashboard with summary cards, loan list with overdue highlighting, add-loan form.
- **Phase 4 — Quality, Testing & Delivery**: End-to-end acceptance verification, automated test suites, demo recording, and documentation review.

See [`docs/TASKS.md`](./docs/TASKS.md) and [`docs/PROGRESS.md`](./docs/PROGRESS.md) for current progress.

---

## Security Guidelines

- Never commit `.env` files, production database connection strings, or JWT secrets.
- Mock OTP is strictly for development demonstration and printed in server logs only; it is never returned in API responses.
- All subsequent loan and summary endpoints are protected by JWT and strictly scoped to the authenticated user.
- See [`docs/SECURITY.md`](./docs/SECURITY.md) for complete security rules.

---

## License

ISC License.
