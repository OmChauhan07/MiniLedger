# Feature Spec — Track Lent and Borrowed Loans

## Goal
Extend MiniLedger so a signed-in user can track:
- money they lent to a person (receivable);
- money they borrowed from a person (payable).

## Core domain rule
Each record belongs to the current authenticated user. `type` describes the direction relative to that user:
- `LENT`: the current user gave money; the named person owes them.
- `BORROWED`: the current user received money; the current user owes the named person.

The named person does not need an account. Do not create a shared loan between two app users.

## Data model requirements
- Add a direction field to the existing loan record, preferably an enum with `LENT` and `BORROWED`.
- Existing records must migrate as `LENT` by default so old data retains its meaning.
- Keep the existing fields and relationships unless inspection proves changes are needed.
- Avoid replacing the existing Prisma schema wholesale.
- Keep currency as INR for the current app unless the existing spec says otherwise.
- Preserve the current repayment state model. If the schema uses `isRepaid`, don't redesign repayment history unless separately requested.

## API requirements
Inspect existing routes first and extend their contracts consistently.
- Create-loan endpoint accepts `type` (`LENT` or `BORROWED`); default to `LENT` only for backward compatibility if required.
- List endpoint supports filtering by type and status, with search if currently supported.
- Detail endpoint returns type and direction-appropriate data.
- Repayment endpoint works for both directions; the record is marked settled and records a paid date only if the schema supports it.
- Summary endpoint reports separate values for lent and borrowed, including outstanding and overdue amounts.
- All endpoints must scope queries to the authenticated user.
- Validate type values and reject invalid inputs.
- Do not trust a client-supplied user ID for ownership.
- Keep existing response shapes compatible where practical; document any breaking changes.

## Status and calculations
- Outstanding Lent = sum of unpaid LENT records.
- Outstanding Borrowed = sum of unpaid BORROWED records.
- Overdue Receivable = sum of unpaid LENT records whose due date is before the current date.
- Overdue Payable = sum of unpaid BORROWED records whose due date is before the current date.
- A record is overdue only when it is unpaid and past due.
- Total Lent and Total Borrowed should be separately labelled.
- Do not show a single combined outstanding number without explaining that it combines receivables and payables.
- Repaid/paid totals must be labelled clearly; do not mix lent repayments received with borrowed repayments made into one unlabeled metric.

## Mobile UI requirements
- Add Loan includes an explicit Lent/Borrowed selector.
- All Loans supports All/Lent/Borrowed and status filters. If needed, use horizontally scrollable chips or a filter sheet to avoid crowding.
- Loan cards and details show direction text, not color alone.
- Direction-specific language:
  - LENT: “They owe you”; action can be “Mark as Repaid” / “Mark as Received”.
  - BORROWED: “You owe them”; action can be “Mark as Paid” / “Mark as Repaid”.
- Dashboard separates lent and borrowed totals and overdue obligations.
- Account stats must label both directions clearly.
- Do not imply payment execution; this is a tracking ledger only.

## Acceptance criteria
1. User can create a Lent record.
2. User can create a Borrowed record.
3. Existing loans remain Lent after migration.
4. User can list/filter both directions and status.
5. Detail view clearly communicates who owes whom.
6. Repayment action works for both directions.
7. Summary amounts are correct for both directions, including overdue.
8. Users cannot read/update another user's loans.
9. Loading, empty, validation, and API-error states work.
10. Existing Lent-only functionality remains functional.
11. Tests cover both types, overdue calculation, filtering, and ownership boundaries.
