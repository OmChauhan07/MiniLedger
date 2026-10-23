// Purpose: Shared TypeScript interfaces for entities, API payloads, and state models across the mobile app.
// Imported by: src/api/client.ts, src/api/auth.api.ts, src/api/loan.api.ts, src/api/summary.api.ts, src/components/*, src/features/*

// Authenticated user profile returned by authentication endpoints
export interface User {
  id: string;
  phone: string;
}

export type LoanDirection = 'LENT' | 'BORROWED';

// Full loan item matching backend persistence and API contract
export interface Loan {
  id: string;
  friendName: string;
  amount: string;
  dueDate: string;
  type: LoanDirection;
  isRepaid: boolean;
  repaidAt: string | null;
  createdAt: string;
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
  notes?: string;
}
