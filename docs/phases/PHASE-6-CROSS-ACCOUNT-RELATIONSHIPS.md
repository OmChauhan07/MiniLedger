# Phase 6: Registered-User Loan Relationships and Cross-Account Visibility

## 1. Executive Summary & Root Cause Analysis

### Problem Statement
The app allowed users to search for registered users and link them as counterparties when recording Lent or Borrowed loans. However:
1. When User A created a loan with registered User B, the loan was completely invisible from User B's account (not listed on Lent/Borrowed/All Loans, excluded from Dashboard metrics, and returned 404 if accessed by ID).
2. Tapping a registered counterparty provided no dedicated relationship/ledger view showing pairwise history and balances.

### Root Cause Findings
1. **Unilateral Database Filter in Loan Retrieval (`loan.service.ts`)**:
   `listLoans` queried `where: { userId }` exclusively, where `userId` represents the record creator. It completely omitted records where `counterpartyUserId === currentUserId`.
2. **Strict Single-Creator Ownership in Loan Details and Repayments**:
   `getLoanById` and `markLoanRepaid` queried `where: { id: loanId, userId }`, denying access to the registered counterparty.
3. **Unilateral Aggregation in Summary Engine (`summary.service.ts`)**:
   `getUserSummary` filtered `where: { userId }`, omitting counterparty obligations from global receivables/payables.
4. **Lack of Participant Perspective DTO Inversion**:
   When User A records a LENT loan to User B, it is an asset/receivable to User A, but a liability/payable to User B. The service did not invert `type` (`LENT` <-> `BORROWED`) or swap the counterparty profile when viewed by User B.
5. **One-Way Netting Query**:
   `calculatePairwiseNetting` only queried loans where caller was `userId` and target was `counterpartyUserId`, omitting loans created in the opposite direction.
6. **Missing Registered Counterparty Relationship API & UI**:
   No endpoint existed to fetch the isolated pairwise ledger between two users, and no mobile interface existed to view their mutual balance and transaction history.

---

## 2. Conceptual Data Model & Invariants

### Underlying Transaction Model
A single, authoritative `Loan` record represents the transaction between two participants:
- `userId` (`createdByUserId`): User who initiated/recorded the entry.
- `counterpartyUserId`: The other registered MiniLedger user (or `null` if external).
- `friendName`: Creator's label for the counterparty (or external contact name).
- `counterpartyPhone`: Optional external contact phone.
- `amount`: Decimal monetary principal.
- `dueDate`: Date due.
- `type`: `LENT` or `BORROWED`, relative to the creator (`userId`).
- `isRepaid`: Boolean settlement status.
- `repaidAt`: Timestamp of settlement.

### Non-Destructive Schema
The existing Prisma schema already includes `userId` and `counterpartyUserId` with foreign keys and indexes. No destructive migration is needed. An index on `counterpartyUserId` is already in place.

---

## 3. Participant Perspective Rules

Both perspectives are derived dynamically from the same underlying database record without duplicating records:

| Loan Recorded By User A | User A Perspective (Creator) | User B Perspective (Counterparty) |
| :--- | :--- | :--- |
| **User A Lends ₹5,000 to User B** (`type: LENT`) | **Lent ₹5,000**<br>• Counterparty: User B<br>• Role: Creditor (They owe me)<br>• Direction: Receivable | **Borrowed ₹5,000**<br>• Counterparty: User A<br>• Role: Debtor (I owe them)<br>• Direction: Payable |
| **User A Borrows ₹3,000 from User B** (`type: BORROWED`) | **Borrowed ₹3,000**<br>• Counterparty: User B<br>• Role: Debtor (I owe them)<br>• Direction: Payable | **Lent ₹3,000**<br>• Counterparty: User A<br>• Role: Creditor (They owe me)<br>• Direction: Receivable |

### Perspective Derivation Logic
For any caller `callerUserId`:
1. If `loan.userId === callerUserId`:
   - `effectiveType = loan.type`
   - `counterparty = loan.counterpartyUser` (or `loan.friendName` / `loan.counterpartyPhone` if external)
   - `isCreator = true`
   - `recordedByName = "You"`
2. If `loan.counterpartyUserId === callerUserId`:
   - `effectiveType = loan.type === 'LENT' ? 'BORROWED' : 'LENT'`
   - `counterparty = { id: loan.user.id, name: loan.user.name, maskedPhone: mask(loan.user.phone) }`
   - `isCreator = false`
   - `recordedByName = loan.user.name || "MiniLedger User"`

---

## 4. Record Creation, Transparency & Trust Model

1. **Attribution & Transparency**:
   Loans created by User A involving User B display a clear provenance badge:
   - For User A: *"Recorded by you"*
   - For User B: *"Recorded by Alice Cooper"*
2. **Repayment / Settlement Authority**:
   Either participant can mark an active loan repaid, or acknowledge receipt. The audit trail captures `isRepaid: true` and `repaidAt`.
3. **Strict Privacy & Isolation**:
   - User C cannot view loans between User A and User B.
   - External counterparty loans created by User A never leak or attach to registered accounts without an explicit registered user reference.

---

## 5. API Contracts

### 5.1 List Loans (`GET /api/loans`)
- **Query Filter**:
  ```ts
  where: {
    OR: [
      { userId: callerUserId },
      { counterpartyUserId: callerUserId },
    ],
  }
  ```
- **Filter by Type**:
  Calculated on `effectiveType` (relative to caller).
- **Response**: Array of `FormattedLoan` with `perspectiveType`, `isCreator`, `recordedByName`, and caller-relative counterparty details.

### 5.2 Single Loan Details (`GET /api/loans/:id`)
- **Access Rule**: Allowed if `loan.userId === callerUserId || loan.counterpartyUserId === callerUserId`. Otherwise HTTP 404.
- **Pairwise Netting**: Computes full netting between `callerUserId` and the other participant across all mutual active loans.

### 5.3 Mark Loan Repaid (`PATCH /api/loans/:id/repay`)
- **Access Rule**: Allowed if `loan.userId === callerUserId || loan.counterpartyUserId === callerUserId`.
- Sets `isRepaid: true`, `repaidAt: now()`.

### 5.4 User Summary (`GET /api/summary`)
- Aggregates all loans where `userId: callerUserId OR counterpartyUserId: callerUserId`.
- Categorizes amounts according to `effectiveType` relative to `callerUserId`.
- Calculates accurate `totalLent`, `totalBorrowed`, `outstandingLent`, `outstandingBorrowed`, `overdueReceivable`, `overduePayable`, and global `netBalance`.

### 5.5 Counterparty Relationship Ledger (`GET /api/users/:counterpartyId/relationship`)
- **Auth**: Protected by `requireAuth`.
- **Params**: `counterpartyId` (ID of registered user).
- **Access Control**: Validates target user exists and is not caller.
- **Response Contract**:
  ```json
  {
    "success": true,
    "counterparty": {
      "id": "cuid-bob",
      "name": "Bob Marley",
      "maskedPhone": "+91 98••• ••566"
    },
    "netting": {
      "hasCounterparty": true,
      "lentPrincipal": "5000.00",
      "borrowedPrincipal": "2000.00",
      "netStatus": "RECEIVABLE",
      "netAmount": "3000.00",
      "explanation": "Bob Marley owes you ₹3,000.00 net"
    },
    "metrics": {
      "totalLent": "5000.00",
      "totalBorrowed": "2000.00",
      "activeLentCount": 1,
      "activeBorrowedCount": 1,
      "settledCount": 0
    },
    "loans": [
      {
        "id": "cuid-loan-1",
        "amount": "5000.00",
        "dueDate": "2026-11-15",
        "type": "LENT",
        "isRepaid": false,
        "isCreator": true,
        "recordedByName": "You",
        "createdAt": "..."
      }
    ]
  }
  ```

---

## 6. Frontend Navigation & Screen Specifications

1. **Counterparty Relationship Modal (`CounterpartyLedgerModal.tsx`)**:
   - Opens when tapping a registered user from search results in `AddLoanModal`, from the registered badge in `LoanDetailsModal`, or from the counterparty list in `AccountScreen`.
   - Displays:
     - Person's avatar initials, display name, and masked phone.
     - Pairwise Netting Hero Box with clear status badge (RECEIVABLE / PAYABLE / SETTLED).
     - Breakdown: Total Lent, Total Borrowed, Active vs Settled count.
     - Chronological list of shared transactions between the two users.
     - Direct action button: **"Record New Loan with [Name]"**.
2. **Add Loan Modal Integration**:
   - When a registered user is selected from search, show a "View Mutual Ledger" button next to their name.
3. **Loan Details Modal Integration**:
   - In `LoanDetailsModal`, when viewing a loan with a registered user, the Registered User badge is clickable to view the complete mutual ledger.
   - Shows "Recorded by [Name]" provenance badge.
4. **All Loans / Lent / Borrowed Screens**:
   - Shows registered user badge with provenance information.
   - Inverts direction correctly for the counterparty user.

---

## 7. Implementation Checklist

- [ ] Write root cause analysis and update system documentation (`docs/SPEC.md`, `docs/SCHEMA.md`, `docs/API.md`, `docs/TASKS.md`, `docs/PROGRESS.md`).
- [ ] Backend: Refactor `loan.service.ts` to support participant-aware queries (`userId OR counterpartyUserId`), perspective inversion, and bilateral pairwise netting.
- [ ] Backend: Refactor `summary.service.ts` to aggregate both creator and counterparty obligations.
- [ ] Backend: Create `GET /api/users/:counterpartyId/relationship` endpoint and controller in `users/`.
- [ ] Backend: Update `loan.controller.ts` and routes.
- [ ] Backend Tests: Create `tests/cross-account-visibility.test.ts` verifying all 10 required test criteria.
- [ ] Mobile: Add `CounterpartyLedgerModal.tsx` and integrate with `AddLoanModal`, `LoanDetailsModal`, and `AccountScreen`.
- [ ] Mobile: Update `types/index.ts` and `api/users.api.ts` with relationship contracts.
- [ ] Mobile: Validate TypeScript (`npx tsc --noEmit`).
- [ ] Run full test suite (`npm test` in backend).
- [ ] Final verification and report.
