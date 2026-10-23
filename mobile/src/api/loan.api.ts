// Purpose: Client API functions for retrieving, creating, and marking loans as repaid.
// Imported by: src/features/dashboard/DashboardScreen.tsx, src/components/AddLoanModal.tsx

import { apiRequest } from './client.js';
import { Loan, CreateLoanPayload } from '../types/index.js';

// Fetches the list of all loans owned by the authenticated user
export async function fetchLoansApi(): Promise<Loan[]> {
  const response = await apiRequest<{ data: Loan[] }>('/loans', {
    method: 'GET',
    requiresAuth: true,
  });
  return response.data;
}

// Submits a new loan entry to be created and saved in the ledger
export async function createLoanApi(payload: CreateLoanPayload): Promise<Loan> {
  return apiRequest<Loan>('/loans', {
    method: 'POST',
    body: payload,
    requiresAuth: true,
  });
}

// Marks an existing unpaid loan as fully repaid
export async function markLoanRepaidApi(loanId: string): Promise<Loan> {
  return apiRequest<Loan>(`/loans/${loanId}/repay`, {
    method: 'PATCH',
    requiresAuth: true,
  });
}
