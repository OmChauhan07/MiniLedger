// Purpose: Client API for discovering registered MiniLedger counterparties and retrieving mutual ledgers.
// Imported by: src/components/AddLoanModal.tsx, src/components/CounterpartyLedgerModal.tsx, src/components/LoanDetailsModal.tsx

import { apiRequest } from './client';
import { PublicUserResult, CounterpartyRelationship } from '../types/index';

export interface SearchUsersResponse {
  data: PublicUserResult[];
}

/**
 * Searches registered users by name or phone prefix.
 * Requires user authentication.
 */
export async function searchUsersApi(query: string): Promise<PublicUserResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const encoded = encodeURIComponent(query.trim());
  const response = await apiRequest<SearchUsersResponse>(`/users/search?q=${encoded}`, {
    method: 'GET',
    requiresAuth: true,
  });

  return response.data;
}

/**
 * Fetches the mutual relationship and pairwise ledger with a registered user.
 * Requires user authentication.
 */
export async function fetchCounterpartyRelationshipApi(
  counterpartyId: string
): Promise<CounterpartyRelationship> {
  const response = await apiRequest<CounterpartyRelationship>(
    `/users/${encodeURIComponent(counterpartyId)}/relationship`,
    {
      method: 'GET',
      requiresAuth: true,
    }
  );

  return response;
}
