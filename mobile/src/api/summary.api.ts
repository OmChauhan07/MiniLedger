// Purpose: Client API function for retrieving aggregated ledger summary totals.
// Imported by: src/features/dashboard/DashboardScreen.tsx

import { apiRequest } from './client';
import { Summary } from '../types/index';

// Fetches the latest financial summary (total lent, repaid, outstanding, overdue)
export async function fetchSummaryApi(): Promise<Summary> {
  return apiRequest<Summary>('/summary', {
    method: 'GET',
    requiresAuth: true,
  });
}
