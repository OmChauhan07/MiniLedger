# Phase 7 — Account Editing, OTP-Protected Changes, and PDF Ledger Export

## 1. Overview & Objectives

Phase 7 enhances the user's account and portfolio management capabilities in MiniLedger with three primary features:
1. **Editable User Profile Details**: Enable authenticated users to update their personal information (full name, email address) with mandatory phone OTP verification before committing any changes to the database.
2. **Removal of Screen Lock / Biometrics UI**: Remove the nonfunctional/placeholder "Screen Lock Security" row and toggle from the Account screen while ensuring real authentication (Phone + Password, OTP, JWT) remains intact.
3. **Professional PDF Ledger Export**: Provide an authoritative, bank-statement-inspired Personal Loan Ledger Statement export in PDF format, supporting filters (direction, status, date range), perspective-aware transaction history, and reconcilable summary figures.

---

## 2. Profile Editing & OTP Challenge Lifecycle

### 2.1 Scope & Non-Goals
- **Supported Fields**: `name` (String, required, 1–80 characters) and `email` (String, optional, valid email format or null).
- **Phone Number Policy**: In accordance with Section 1.3, phone numbers remain **read-only** in this phase. Phone number alterations require a separate two-step proof of ownership (old verified number + proposed new number) and are explicitly documented as a future feature. Users cannot modify their phone number via standard profile updates.
- **Client Trust Invariant**: The server never trusts client-supplied user IDs. The current user is always derived from the authenticated JWT session context (`req.user.id`).

### 2.2 Security Architecture & Challenge Binding
To prevent replay attacks, unauthorized profile overrides, and cross-account privilege escalation, the pending profile update is cryptographically bound to the user and the OTP challenge:

```
[ User edits profile ]
        │
        ▼
[ PATCH /api/account ]
        │
        ├─► No changes detected? ──► Return { updated: false, message: 'No changes detected.' }
        │
        ▼ (Changes detected)
[ Generate 6-digit OTP & Store OtpChallenge ]
        │
        ▼
[ Issue signed updateToken (JWT, 5m expiry) ]
  Payload: { purpose: 'profile_update', userId, challengeId, pendingChanges: { name, email } }
        │
        ▼
[ Return 200 { requiresOtp: true, updateToken, maskedPhone } ]
        │
        ▼
[ User enters OTP ]
        │
        ▼
[ POST /api/account/verify-update ]
        │
        ├─► Verify JWT signature & verify payload.purpose === 'profile_update'
        ├─► Verify payload.userId === req.user.id (prevents cross-user token reuse)
        ├─► Verify OtpChallenge: not consumed, not expired, attemptCount < 3
        ├─► Verify OTP code hash
        │
        ▼ (Valid)
[ Mark challenge consumedAt = now() ]
        │
        ▼
[ Apply pendingChanges to prisma.user ]
        │
        ▼
[ Return 200 { message: 'Profile updated successfully.', user } ]
```

### 2.3 Failure Handling & Edge Cases
- **No-Op Submission**: If the submitted name and email match existing database values, the server responds with `{ updated: false }` without creating an OTP challenge or sending an SMS.
- **Invalid OTP**: Increments `attemptCount`. If attempts reach 3, the challenge is locked (`429 OTP_ATTEMPTS_EXCEEDED`).
- **Expired Challenge**: Returns `401 INVALID_OTP`.
- **Token Tampering / Cross-Account**: Returns `401 UNAUTHORIZED`.

---

## 3. Removal of Screen Lock / Biometrics UI

- The "Screen Lock Security" row in `mobile/src/features/account/AccountScreen.tsx` was a client-side mock toggle with no underlying biometric or keychain integration.
- The state variable `screenLockEnabled` and its switch UI are removed.
- Core authentication security (JWT expiration, bcrypt password hashing, OTP rate limiting) is completely untouched.

---

## 4. PDF Ledger Export Specification

### 4.1 Architecture & Generation Approach
- **Engine**: Server-side PDF generation using `pdfkit` (pure JavaScript, zero C++ native binaries, cross-platform, deterministic layout).
- **Endpoint**: `POST /api/ledger/export/pdf`.
- **Dual Output Support**:
  - `format: 'binary'` (or `Accept: application/pdf`): Streams raw `application/pdf` with `Content-Disposition: attachment; filename="MiniLedger_Statement_<timestamp>.pdf"`.
  - `format: 'base64'` (or `Accept: application/json`): Returns JSON payload `{ success: true, filename, base64, recordCount, summary }` allowing mobile clients and tests to easily inspect or share without binary stream buffering issues.

### 4.2 Supported Filters
- `direction`: `'ALL' | 'LENT' | 'BORROWED'` (default: `'ALL'`)
- `status`: `'ALL' | 'OUTSTANDING' | 'OVERDUE' | 'REPAID'` (default: `'ALL'`)
- `startDate`: ISO 8601 date string (optional)
- `endDate`: ISO 8601 date string (optional)
- `counterpartyId`: Registered counterparty ID (optional)

### 4.3 Statement Layout & Sections
1. **Header**:
   - Brand title: `MINILEDGER`
   - Document Title: `Personal Loan Ledger Statement`
   - Generated date and time (IST)
   - Active filter parameters (e.g., Direction: Lent Only | Status: Outstanding | Period: All Time)
2. **Account Information Card**:
   - Account Holder: User display name
   - Phone Number: Masked phone number (`+91 98••• ••210`)
   - Statement Identifier: Unique statement reference string
3. **Financial Summary Block**:
   - **Gross Lent Portfolio**: Total lent, outstanding receivable, overdue receivable.
   - **Gross Borrowed Portfolio**: Total borrowed, outstanding payable, overdue payable.
   - **Settlement Metrics**: Total settled/repaid amount.
   - Explicit disclaimer that values represent gross transaction totals, not speculative netting offsets.
4. **Transaction Details Table**:
   - Columns: `Date Recorded` | `Counterparty` | `Direction` | `Due Date` | `Status` | `Amount (₹ INR)`
   - Rows reflect the **caller-relative inverted perspective** (loans created by counterparties appear accurately as Lent or Borrowed from the caller's view).
   - Empty state: Clean notification block when no records match selected filters.
5. **Footer**:
   - Page numbering (`Page X of Y`).
   - Legal/Informational Disclaimer: *"Generated by MiniLedger from records stored in this application. This document is a personal ledger summary, not a bank statement or proof of payment."*

### 4.4 Mobile Export & Sharing Flow
1. User taps **"Export Ledger as PDF"** on the Account screen.
2. An `ExportPdfModal` displays filter selectors (Direction, Status, Date Range).
3. User selects filters and taps **"Generate & Export PDF"**.
4. App calls `POST /api/ledger/export/pdf`.
5. Mobile saves the base64/binary PDF to `FileSystem.cacheDirectory` and triggers `Sharing.shareAsync` (enabling save to Downloads, Google Drive, WhatsApp, or Print).

---

## 5. API Contracts

### `GET /api/account`
- **Auth**: Required (`Bearer <token>`).
- **Response** (`200 OK`):
  ```json
  {
    "user": {
      "id": "usr_123",
      "phone": "+919876543210",
      "name": "Alice Cooper",
      "email": "alice@example.com",
      "phoneVerifiedAt": "2026-10-23T12:00:00.000Z",
      "createdAt": "2026-10-23T10:00:00.000Z"
    }
  }
  ```

### `PATCH /api/account`
- **Auth**: Required (`Bearer <token>`).
- **Body**:
  ```json
  {
    "name": "Alice M. Cooper",
    "email": "alice.cooper@example.com"
  }
  ```
- **Response (No-Op)** (`200 OK`):
  ```json
  {
    "updated": false,
    "message": "No profile changes detected."
  }
  ```
- **Response (Changes Detected)** (`200 OK`):
  ```json
  {
    "requiresOtp": true,
    "updateToken": "eyJhbGciOi...",
    "maskedPhone": "+91 98••• ••210",
    "message": "OTP verification required to save profile changes. A code was sent to your registered phone."
  }
  ```

### `POST /api/account/verify-update`
- **Auth**: Required (`Bearer <token>`).
- **Body**:
  ```json
  {
    "updateToken": "eyJhbGciOi...",
    "otp": "123456"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "message": "Profile updated successfully.",
    "user": {
      "id": "usr_123",
      "phone": "+919876543210",
      "name": "Alice M. Cooper",
      "email": "alice.cooper@example.com",
      "phoneVerifiedAt": "2026-10-23T12:00:00.000Z"
    }
  }
  ```

### `POST /api/ledger/export/pdf`
- **Auth**: Required (`Bearer <token>`).
- **Body**:
  ```json
  {
    "direction": "ALL",
    "status": "ALL",
    "format": "base64"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "filename": "MiniLedger_Statement_20261023.pdf",
    "base64": "JVBERi0xLjQK...",
    "recordCount": 5,
    "summary": {
      "totalLent": "12000.00",
      "totalBorrowed": "4500.00",
      "outstandingLent": "8000.00",
      "outstandingBorrowed": "4500.00",
      "repaidAmount": "4000.00"
    }
  }
  ```

---

## 6. Implementation Checklist

- [ ] Update `docs/SPEC.md`, `docs/API.md`, `docs/Design.md`, `docs/TASKS.md`, `docs/PROGRESS.md`.
- [ ] Install `pdfkit` and `@types/pdfkit` in backend.
- [ ] Implement `account.service.ts`, `account.controller.ts`, and `account.routes.ts`.
- [ ] Implement `ledger-export.service.ts` and `ledger.routes.ts`.
- [ ] Mount `/api/account` and `/api/ledger` in `backend/src/app.ts`.
- [ ] Remove biometric/screen lock row and state from `mobile/src/features/account/AccountScreen.tsx`.
- [ ] Create `mobile/src/components/EditProfileModal.tsx` with OTP verification step.
- [ ] Create `mobile/src/components/ExportPdfModal.tsx` with filter selection and sharing actions.
- [ ] Install and configure `expo-file-system` and `expo-sharing` in `mobile/`.
- [ ] Add integration tests in `backend/tests/account-and-pdf.test.ts`.
- [ ] Verify full test suite (all tests passing) and mobile TypeScript check (`npx tsc --noEmit`).
