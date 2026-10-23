// Purpose: Client API for discovering registered MiniLedger counterparties.
// Imported by: src/components/AddLoanModal.tsx

import { apiRequest } from './client';
import { PublicUserResult } from '../types/index';

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
