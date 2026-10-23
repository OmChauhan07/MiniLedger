// Purpose: Client API functions for retrieving, creating, and marking loans as repaid.
// Imported by: src/features/dashboard/DashboardScreen.tsx, src/components/AddLoanModal.tsx

import { apiRequest } from './client';
import { Loan, CreateLoanPayload } from '../types/index';

// Fetches the list of all loans owned by the authenticated user with optional filters
export async function fetchLoansApi(options?: { type?: string; status?: string; search?: string }): Promise<Loan[]> {
  const params = new URLSearchParams();
  if (options?.type && options.type !== 'ALL') params.append('type', options.type);
  if (options?.status && options.status !== 'all') params.append('status', options.status);
  if (options?.search && options.search.trim()) params.append('search', options.search.trim());

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const response = await apiRequest<{ data: Loan[] }>(`/loans${queryString}`, {
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
