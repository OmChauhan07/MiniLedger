# MiniLedger Product Specification (PRD)

Purpose: This document defines the assignment scope, user flows, acceptance criteria and exclusions. The implementation should satisfy the hiring assignment before adding enhancements.

## 1. Problem
People sometimes lend money to friends and forget amounts, due dates or repayment status. MiniLedger provides a simple private ledger for those entries.

## 2. Goals
- Let a user authenticate with a phone number and development mock OTP.
- Record a loan with friend name, amount and due date.
- Show a list of the user's loans.
- Mark an unpaid loan as repaid.
- Summarize total lent, total repaid, outstanding amount and overdue amount.
- Make overdue entries visually obvious.
- Deliver a reproducible repository and short demo recording.

## 3. Primary user
One individual who wants to keep track of personal loans made to friends.

## 4. User flows

### Login
1. User enters a valid phone number.
2. App requests an OTP from the API.
3. API logs the OTP in the server terminal; API response does not reveal it.
4. User enters the OTP.
5. API validates expiry and attempt limits, creates or finds the user, and returns a JWT.
6. App stores the token using an appropriate mobile-safe storage mechanism and loads the dashboard.

### Add loan
1. Authenticated user opens the add-loan form.
2. User enters friend's name, a positive amount and a due date.
3. App validates obvious errors; API validates independently.
4. API creates a loan owned by the authenticated user.
5. App refreshes the list and summary.

### Mark repaid
1. User selects an unpaid loan and taps “Mark repaid”.
2. API confirms the loan belongs to the authenticated user.
3. API marks it repaid and sets `repaidAt`.
4. App refreshes the entry and summary.

### Dashboard
- Show total lent, total repaid, outstanding and overdue amounts.
- Show loans newest first or in a clearly documented order.
- Unpaid loans with due dates before the current local calendar date are overdue.
- Repaid loans are not overdue.
- Display loading, empty and error states.

## 5. Functional requirements
- FR-01: Request mock OTP for a valid phone number.
- FR-02: Verify OTP and issue a JWT.
- FR-03: Reject invalid, expired, reused or over-attempted OTPs.
- FR-04: Protect all loan and summary endpoints.
- FR-05: Create loan entries with friend name, amount and due date.
- FR-06: List only loans belonging to the authenticated user.
- FR-07: Mark an owned unpaid loan as repaid.
- FR-08: Reject repayment of another user's loan without disclosing its existence.
- FR-09: Return consistent financial summary values.
- FR-10: Highlight overdue entries in the mobile UI.
- FR-11: Validate user input and return predictable errors.
- FR-12: Provide automated tests and clear setup instructions.

## 6. Business rules
- Amount must be positive and have at most two fractional digits.
- Friend name must be non-empty after trimming and within a reasonable length limit.
- Due date is required and stored consistently.
- An entry is overdue only when it is unpaid and its due date is before today's date in the documented app timezone policy.
- Total lent is the sum of all loan amounts.
- Total repaid is the sum of amounts for fully repaid loans.
- Outstanding is total lent minus total repaid.
- Overdue amount is the sum of unpaid loans that are overdue.
- A user can only read or mutate their own entries.
- Repeated mark-repaid requests must not double-count a loan; return a clear conflict or idempotent success according to the documented API contract.

## 7. Non-functional requirements
- TypeScript strict mode where practical.
- Validate untrusted input at API boundaries.
- Use parameterized/ORM queries.
- No secrets in source control.
- Useful error messages without stack traces or sensitive details.
- Tests for key business rules and access controls.
- README instructions must be reproducible.
- UI should be usable on a typical Android phone.

## 8. Out of scope
- Real SMS provider integration.
- Bank account connections or actual payments.
- Partial repayments, interest, recurring loans or currencies other than INR.
- Push notifications and scheduled reminders.
- Multi-user sharing or social features.
- Production-grade identity verification.
- Receipt upload until the required features, tests and README are complete.

## 9. Acceptance criteria
- [x] A new phone number can complete the mock OTP flow.
- [x] OTP appears only in server logs and is not exposed in the API response.
- [x] Authenticated user can create and list a loan.
- [x] User can mark an owned loan as repaid.
- [x] Dashboard values update correctly after create and repay.
- [x] Overdue entries are highlighted and repaid entries are not highlighted as overdue.
- [x] Unauthenticated access is rejected.
- [x] A user cannot access another user's loan by guessing its ID.
- [x] Backend tests and production build pass.
- [x] App runs on Android.
- [x] README and 2–3 minute demo are ready.

## 10. Account & Settlement Netting Enhancements (Phase 5)
- **Signup Flow:** Phone verification via OTP followed by profile setup (Name, optional Email, Password). Account is marked phone-verified upon creation.
- **Login Flow:** Registered users log in with Phone + Password directly without requiring OTP on every session.
- **Legacy Compatibility:** Existing users without passwords can complete a one-time OTP verification to establish their password.
- **Registered Counterparty Search:** When recording a loan, users can search registered users by name or phone. Results display display name and masked phone number (`+91 98*** **210`).
- **External Contacts:** Users can explicitly choose "Add someone outside MiniLedger" to enter an external name and optional phone number. External contacts are never automatically linked to registered accounts.
- **Derived Balance Netting:** For any two registered users, the system computes the pairwise net balance ($|L - B|$) while strictly preserving all original underlying transactions, due dates, and repayment records.
- **Overdue Invariant:** Gross overdue receivables and gross overdue payables are tracked separately. Due dates are never synthesized or netted.

## 11. Cross-Account Visibility & Mutual Relationships (Phase 6)
- **Shared Authoritative Transaction:** A single loan record represents the financial agreement between two registered users (`userId` = creator, `counterpartyUserId` = registered counterparty).
- **Participant Perspective Inversion:** 
  - If User A records a LENT loan to User B: User A sees Lent (asset/receivable from User B), User B sees Borrowed (liability/payable to User A).
  - If User A records a BORROWED loan from User B: User A sees Borrowed (payable to User B), User B sees Lent (receivable from User A).
- **Bilateral Loan Discovery:** Authenticated queries for `listLoans`, `getLoanById`, and `getUserSummary` retrieve transactions where the user is either the creator (`userId`) OR the counterparty (`counterpartyUserId`).
- **Mutual Relationship Ledger:** Authenticated endpoint `GET /api/users/:counterpartyId/relationship` provides an isolated, comprehensive view of the pairwise ledger between two users, including total lent, total borrowed, active/settled breakdown, net balance, and transaction history.
- **Provenance & Attribution:** Records clearly state who recorded the entry (`isCreator`, `recordedByName`) to ensure full transparency without forcing a blocking approval flow.
- **Privacy & Isolation:** Unrelated users (User C) cannot view, modify, or infer transactions between User A and User B. External contacts never appear in another user's ledger.

## 12. Account Editing, OTP-Protected Changes & PDF Export (Phase 7)
- **Editable Profile with OTP Protection:** Authenticated users can edit `name` and `email`. Changes are validated and cryptographically bound via a signed `updateToken` to an OTP challenge sent to the verified phone number. Changes are only committed upon successful OTP verification.
- **No-Op Protection:** Submitting identical profile details does not generate an OTP challenge or dispatch an SMS.
- **Phone Number Immutability:** Phone number changes require separate multi-step ownership proof and are kept read-only for standard profile edits.
- **Screen Lock Removal:** The placeholder Screen Lock / Biometrics toggle is removed from the UI while keeping core phone OTP, password, and JWT authentication intact.
- **Authoritative PDF Ledger Export:** Personal loan ledger statement generation via `POST /api/ledger/export/pdf`. Features bank-statement styling, caller-perspective inversion, date/status/direction filtering, gross reconciliations, and mobile native sharing.
