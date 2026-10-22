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

## Health
### `GET /api/health`
Public. Returns `200`.
```json
{ "status": "ok", "service": "MiniLedger API" }
```

## Request OTP
### `POST /api/auth/send-otp`
Public.
Request:
```json
{ "phone": "+919876543210" }
```
Success response (`200` or `202`, choose consistently):
```json
{ "message": "If the phone number is valid, an OTP request was created." }
```
OTP is printed only in the server log in development. Do not return it in response. Apply normalization, expiry and attempt/rate limits. For the assignment's mock flow, logs are the out-of-band delivery mechanism.

## Verify OTP
### `POST /api/auth/verify-otp`
Public.
Request:
```json
{ "phone": "+919876543210", "otp": "123456" }
```
Success:
```json
{
  "token": "<jwt>",
  "user": { "id": "user-id", "phone": "+919876543210" }
}
```
Never use the sample OTP as a fixed production value. OTP is one-time and short-lived.

## List loans
### `GET /api/loans`
Protected.
Success:
```json
{
  "data": [
    {
      "id": "loan-id",
      "friendName": "Aarav",
      "amount": "1200.00",
      "dueDate": "2026-10-20",
      "isRepaid": false,
      "repaidAt": null,
      "createdAt": "2026-10-22T12:00:00.000Z"
    }
  ]
}
```
Only return the authenticated user's entries. Ordering should be documented and consistent.

## Create loan
### `POST /api/loans`
Protected.
Request:
```json
{
  "friendName": "Aarav",
  "amount": "1200.00",
  "dueDate": "2026-10-30"
}
```
Success: `201 Created`, response includes the created loan using the same shape as list item.

Validation:
- Trimmed friend name is non-empty and bounded.
- Amount is positive, decimal-safe and at most two fractional digits.
- Due date is a valid date-only value in `YYYY-MM-DD` format.

## Mark repaid
### `PATCH /api/loans/:id/repay`
Protected. No request body required.
Success: `200 OK`, returns updated loan.
- Must scope update to authenticated user.
- Define repeated repayment behavior: preferably return `409 LOAN_ALREADY_REPAID`, or implement idempotent success and test it. Choose one and keep it consistent.

## Summary
### `GET /api/summary`
Protected.
Success:
```json
{
  "totalLent": "15000.00",
  "totalRepaid": "5000.00",
  "outstandingAmount": "10000.00",
  "overdueAmount": "3000.00"
}
```
Values above are illustrative only. Amounts are strings to preserve decimal precision. Compute:
- `totalLent`: all loan amounts owned by the user.
- `totalRepaid`: amounts of owned loans marked repaid.
- `outstandingAmount`: total lent minus total repaid.
- `overdueAmount`: amounts of owned unpaid loans with due date before the current date under the documented date policy.

## Status codes
- `200`: successful read/update/OTP request.
- `201`: resource created.
- `400`: invalid request data.
- `401`: missing/invalid authentication or invalid OTP.
- `404`: resource not found within current user's scope.
- `409`: state conflict such as already-repaid loan, if this behavior is chosen.
- `429`: rate/attempt limit reached.
- `500`: generic unexpected server error without internals.
