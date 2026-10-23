// Purpose: Shared TypeScript interfaces for entities, API payloads, and state models across the mobile app.
// Imported by: src/api/client.ts, src/api/auth.api.ts, src/api/loan.api.ts, src/api/summary.api.ts, src/components/*, src/features/*

// Authenticated user profile returned by authentication endpoints
export interface User {
  id: string;
  phone: string;
  name?: string | null;
  email?: string | null;
  phoneVerifiedAt?: string | null;
  avatarUrl?: string | null;
  hasAvatar?: boolean;
}

export type LoanDirection = 'LENT' | 'BORROWED';

export interface CounterpartyUser {
  id: string;
  name: string;
  maskedPhone: string;
  avatarUrl?: string | null;
}

export interface PairwiseNetting {
  hasCounterparty: boolean;
  counterparty?: CounterpartyUser;
  lentPrincipal: string;
  borrowedPrincipal: string;
  netStatus: 'RECEIVABLE' | 'PAYABLE' | 'SETTLED';
  netAmount: string;
  explanation: string;
}

// Full loan item matching backend persistence and API contract
export interface Loan {
  id: string;
  userId?: string;
  friendName: string;
  amount: string;
  dueDate: string;
  type: LoanDirection;
  isRepaid: boolean;
  repaidAt: string | null;
  counterpartyUserId?: string | null;
  counterpartyPhone?: string | null;
  counterpartyUser?: CounterpartyUser | null;
  isCreator?: boolean;
  recordedByName?: string;
  netting?: PairwiseNetting | null;
  createdAt: string;
  updatedAt?: string;
  notes?: string;
}

// Financial summary aggregates returned by GET /api/summary
export interface Summary {
  // Lent (Receivables)
  totalLent: string;
  totalRepaidLent?: string;
  outstandingLent?: string;
  overdueReceivable?: string;

  // Borrowed (Payables)
  totalBorrowed?: string;
  totalRepaidBorrowed?: string;
  outstandingBorrowed?: string;
  overduePayable?: string;

  // Global Netting
  netReceivable?: string;
  netPayable?: string;
  netBalance?: string;
  netStatus?: 'RECEIVABLE' | 'PAYABLE' | 'SETTLED';

  // Backward-compatible fields
  totalRepaid: string;
  outstandingAmount: string;
  overdueAmount: string;
}

// Standardized error shape returned by backend error middleware
export interface ApiError {
  code: string;
  message: string;
}

// Payload for creating a new loan
export interface CreateLoanPayload {
  friendName: string;
  amount: string;
  dueDate: string;
  type?: LoanDirection;
  counterpartyUserId?: string | null;
  counterpartyPhone?: string | null;
  notes?: string;
}

// Registered user search result for counterparty selection
export interface PublicUserResult {
  id: string;
  name: string;
  maskedPhone: string;
}

// Mutual relationship and ledger details between two registered users
export interface CounterpartyRelationship {
  counterparty: PublicUserResult;
  netting: PairwiseNetting;
  metrics: {
    totalLent: string;
    totalBorrowed: string;
    activeLentCount: number;
    activeBorrowedCount: number;
    settledCount: number;
  };
  loans: Loan[];
}

