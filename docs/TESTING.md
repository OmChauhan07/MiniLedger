# MiniLedger Testing Strategy

Purpose: Define minimum test coverage and verification commands. A feature is not complete merely because it appears to work manually.

## Testing layers
1. Unit tests: validation, overdue rules, summary calculations and date helpers.
2. API/integration tests: OTP flow, JWT protection, ownership, create/list/repay and summary endpoints.
3. Mobile checks: TypeScript check, basic component tests if configured, and manual Android end-to-end run.
4. Delivery checks: production build, environment hygiene and README verification.

## Minimum backend test matrix
### Authentication
- Valid phone number can request an OTP.
- OTP is printed in server logs, not returned in response.
- Correct OTP succeeds.
- Incorrect OTP fails.
- Expired OTP fails.
- OTP cannot be reused after successful verification.
- Attempt limit is enforced.
- Protected endpoints reject missing/invalid JWT.

### Loans
- Valid loan is created.
- Missing friend name, invalid amount and malformed due date are rejected.
- Amount must be positive and max two decimal places.
- User sees only their own loans.
- User cannot repay another user's loan.
- Repeated repayment does not double-count totals.
- Repaid loans do not contribute to overdue amount.

### Summary
- Empty user returns zero totals.
- Total lent includes all loans.
- Total repaid includes only repaid loans.
- Outstanding equals lent minus repaid.
- Overdue amount includes only unpaid loans whose due date has passed.
- Decimal values are handled without floating-point rounding errors.

## Minimum mobile manual test
- Launch app on Android.
- Request OTP and retrieve it from backend terminal.
- Complete login.
- Add one overdue loan and one future-due loan.
- Confirm summary and overdue highlighting.
- Mark one loan repaid.
- Confirm summary/list update and overdue style disappears for that loan.
- Restart app and confirm authenticated behavior follows the chosen token persistence design.
- Test invalid inputs, loading and API-unavailable states.

## Commands
Backend:
```bash
cd backend
npm test
npm run build
npx prisma validate
```
Mobile:
```bash
cd mobile
npx tsc --noEmit
npm test
```
Use the actual configured test runner and scripts. If an optional script is not configured, do not claim it passed; configure it or report it as unavailable.

## Completion rule
All relevant tests must pass before phase completion and push. When a failure is found, fix it, rerun the failing test and the broader relevant suite, then review the final diff. Report commands and results accurately.
