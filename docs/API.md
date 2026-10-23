# MiniLedger API Contract

Purpose: This is the planned HTTP contract for the mobile app and backend. Implement this contract consistently; if it changes, update this file and `DECISIONS.md`.

Base path: `/api`. JSON requests and responses unless noted. Protected routes require `Authorization: Bearer <JWT>`.

## Standard error shape
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid fields."
  }
}
```
Do not include stack traces, OTP values, secrets or private database details.

---

## Health
### `GET /api/health`
Public. Returns `200`.
```json
{ "status": "ok", "service": "MiniLedger API" }
```

---

## Authentication: Signup Flow (Phone + OTP + Profile Setup)

### 1. Request Signup OTP
`POST /api/auth/register/send-otp`
Public. Rate-limited by IP and normalized phone.

Request:
```json
{ "phone": "+919876543210" }
```
Validation:
- Normalizes phone to E.164.
- Checks if user with this phone already exists and has a verified account with a password: if so, returns generic message and `isExistingUser: true` or directs to login without leaking private data.

Success (`200 OK`):
```json
{ "message": "If the phone number is valid, an OTP request was created." }
```

### 2. Verify Signup OTP
`POST /api/auth/register/verify-otp`
Public. Verifies OTP and returns a short-lived, single-use `signupToken`.

Request:
```json
{ "phone": "+919876543210", "otp": "123456" }
```
Success (`200 OK`):
```json
{
  "signupToken": "jwt-or-hmac-token-valid-15-mins",
  "phone": "+919876543210"
}
```

### 3. Complete Registration
`POST /api/auth/register/complete`
Public (requires `signupToken`).

Request:
```json
{
  "signupToken": "jwt-or-hmac-token-valid-15-mins",
  "name": "Priya Sharma",
  "email": "priya@example.com",
  "password": "SecurePassword123"
}
```
Validation:
- `signupToken` is valid, signed, unexpired, and not replayed.
- `name` is trimmed, min 2 chars, max 100 chars.
- `email` is optional; if present, valid email format.
- `password` is min 8 chars, max 100 chars.

Success (`201 Created`):
```json
{
  "token": "<jwt>",
  "user": {
    "id": "usr_abc123",
    "phone": "+919876543210",
    "name": "Priya Sharma",
    "email": "priya@example.com",
    "phoneVerifiedAt": "2026-10-23T17:00:00.000Z"
  }
}
```

---

## Authentication: Login Flow (Phone + Password)

### `POST /api/auth/login`
Public. Rate-limited.

Request:
```json
{
  "phone": "+919876543210",
  "password": "SecurePassword123"
}
```
Validation:
- Phone normalized.
- Secure timing-safe password hash verification.

Success (`200 OK`):
```json
{
  "token": "<jwt>",
  "user": {
    "id": "usr_abc123",
    "phone": "+919876543210",
    "name": "Priya Sharma",
    "email": "priya@example.com",
    "phoneVerifiedAt": "2026-10-23T17:00:00.000Z"
  }
}
```

Error Cases:
- `401 Unauthorized` with `INVALID_CREDENTIALS` (timing-safe generic message for wrong password or non-existent user).
- `403 Forbidden` with `PASSWORD_NOT_SET` (legacy user migration path).

---

## Authentication: Legacy Account Password Setup

### 1. Request Legacy Setup OTP
`POST /api/auth/legacy-setup/send-otp`
Public. Sends OTP to verified phone without password.

Request:
```json
{ "phone": "+919876543210" }
```

### 2. Verify OTP and Set Password
`POST /api/auth/legacy-setup/verify-and-set-password`
Public.

Request:
```json
{
  "phone": "+919876543210",
  "otp": "123456",
  "password": "NewSecurePassword123",
  "name": "Optional Name Update"
}
```
Success (`200 OK`): Returns `{ "token": "<jwt>", "user": { ... } }`.

---

## Registered User Search (Counterparty Discovery)

### `GET /api/users/search?q=<query>&limit=10`
Protected (`requireAuth`). Rate-limited.

Query parameters:
- `q`: String, min 2 characters. Searches by name prefix or exact/partial phone.
- `limit`: Integer, default 10, max 20.

Response (`200 OK`):
```json
{
  "data": [
    {
      "id": "usr_456",
      "name": "Priya Sharma",
      "maskedPhone": "+91 98••• ••210"
    }
  ]
}
```
Privacy constraints:
- Authenticated user's own account is excluded from search results.
- Returns only public identifying fields: `id`, `name`, `maskedPhone`.
- Never returns `email`, `passwordHash`, unmasked phone, tokens, or OTP details.

---

## Loans API

### List Loans
`GET /api/loans`
Protected (`requireAuth`).

Query parameters:
- `type`: Optional (`LENT` | `BORROWED`).
- `status`: Optional (`all` | `pending` | `overdue` | `repaid`).
- `search`: Optional string (matches friend/counterparty name or phone).

Success (`200 OK`):
```json
{
  "data": [
    {
      "id": "loan-id",
      "userId": "user-id",
      "friendName": "Priya Sharma",
      "amount": "1200.00",
      "dueDate": "2026-10-30",
      "type": "LENT",
      "isRepaid": false,
      "repaidAt": null,
      "counterpartyUserId": "usr_456",
      "counterpartyPhone": null,
      "counterpartyUser": {
        "id": "usr_456",
        "name": "Priya Sharma",
        "maskedPhone": "+91 98••• ••210"
      },
      "createdAt": "2026-10-23T12:00:00.000Z"
    }
  ]
}
```

### Create Loan
`POST /api/loans`
Protected (`requireAuth`).

Request:
```json
{
  "friendName": "Priya Sharma",
  "amount": "1200.00",
  "dueDate": "2026-10-30",
  "type": "LENT",
  "counterpartyUserId": "usr_456",
  "counterpartyPhone": "+919876543210"
}
```
Validation:
- `friendName`: Trimmed, non-empty, max 100 chars.
- `amount`: Positive decimal string, max 2 decimals.
- `dueDate`: Valid `YYYY-MM-DD`.
- `type`: `"LENT"` or `"BORROWED"`. Default is `"LENT"`.
- `counterpartyUserId`: Optional UUID/CUID of registered user. Must not equal caller's `userId`. If provided, must exist in DB.
- `counterpartyPhone`: Optional string, normalized E.164.

Success (`201 Created`): Returns created loan with the same shape as list item.

### Get Loan Details & Netting
`GET /api/loans/:id`
Protected (`requireAuth`).

Success (`200 OK`):
```json
{
  "data": {
    "id": "loan-id",
    "friendName": "Priya Sharma",
    "amount": "5000.00",
    "dueDate": "2026-10-30",
    "type": "LENT",
    "isRepaid": false,
    "repaidAt": null,
    "counterpartyUserId": "usr_456",
    "counterpartyUser": {
      "id": "usr_456",
      "name": "Priya Sharma",
      "maskedPhone": "+91 98••• ••210"
    },
    "netting": {
      "hasCounterparty": true,
      "counterparty": {
        "id": "usr_456",
        "name": "Priya Sharma",
        "maskedPhone": "+91 98••• ••210"
      },
      "lentPrincipal": "5000.00",
      "borrowedPrincipal": "2000.00",
      "netStatus": "RECEIVABLE",
      "netAmount": "3000.00",
      "explanation": "Priya Sharma owes you ₹3,000.00 net"
    },
    "createdAt": "2026-10-23T12:00:00.000Z"
  }
}
```

If loan has no registered counterparty (`counterpartyUserId` is null), `netting` is `null` or `{ "hasCounterparty": false }`.

### Mark Repaid
`PATCH /api/loans/:id/repay`
Protected (`requireAuth`). No request body required.
Success: `200 OK`. Returns updated loan.
- Scoped to authenticated user's ownership.
- Returns `409 Conflict` (`LOAN_ALREADY_REPAID`) if already repaid.
- Returns `404 Not Found` if loan does not exist or belongs to another user.

---

## Summary API

### `GET /api/summary`
Protected (`requireAuth`).

Success (`200 OK`):
```json
{
  "totalLent": "15000.00",
  "totalBorrowed": "5000.00",
  "outstandingLent": "10000.00",
  "outstandingBorrowed": "3000.00",
  "overdueReceivable": "2000.00",
  "overduePayable": "500.00",
  "netReceivable": "7000.00",
  "netPayable": "0.00",
  "netBalance": "7000.00",
  "netStatus": "RECEIVABLE",
  "totalRepaid": "5000.00",
  "outstandingAmount": "10000.00",
  "overdueAmount": "2000.00"
}
```
All amounts are formatted as two-decimal strings.
- `outstandingLent`: Sum of unpaid Lent loans owned by the user.
- `outstandingBorrowed`: Sum of unpaid Borrowed loans owned by the user.
- `overdueReceivable`: Sum of unpaid overdue Lent loans.
- `overduePayable`: Sum of unpaid overdue Borrowed loans.
- `netReceivable`: `max(0, outstandingLent - outstandingBorrowed)`
- `netPayable`: `max(0, outstandingBorrowed - outstandingLent)`
- `netBalance`: Absolute difference `|outstandingLent - outstandingBorrowed|`
- `netStatus`: `"RECEIVABLE"` if Lent > Borrowed; `"PAYABLE"` if Borrowed > Lent; `"SETTLED"` if equal.

---

## Status codes
- `200 OK`: Successful read/update/OTP verification.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Validation failure or malformed payload.
- `401 Unauthorized`: Invalid or missing credentials / token.
- `403 Forbidden`: Action forbidden (e.g. legacy user without password).
- `404 Not Found`: Scoped resource not found.
- `409 Conflict`: Business state conflict (e.g. loan already repaid, duplicate phone).
- `429 Too Many Requests`: Rate limit reached.
- `500 Internal Server Error`: Generic internal error.
