// Purpose: API client for requesting server-generated PDF ledger exports with filters.
// Imported by: src/components/ExportPdfModal.tsx, src/features/account/AccountScreen.tsx

import { apiRequest } from './client';

export interface ExportLedgerPdfOptions {
  direction?: 'ALL' | 'LENT' | 'BORROWED';
  status?: 'ALL' | 'OUTSTANDING' | 'OVERDUE' | 'REPAID';
  startDate?: string;
  endDate?: string;
  counterpartyId?: string;
  format?: 'base64' | 'binary';
}

export interface ExportLedgerPdfResponse {
  success: boolean;
  filename: string;
  base64: string;
  recordCount: number;
  summary: {
    totalLent: string;
    totalBorrowed: string;
    outstandingLent: string;
    outstandingBorrowed: string;
    overdueReceivable: string;
    overduePayable: string;
    repaidAmount: string;
  };
}

/**
 * Requests an authoritative PDF ledger statement with specified filters.
 */
export async function exportLedgerPdfApi(
  options: ExportLedgerPdfOptions = {}
): Promise<ExportLedgerPdfResponse> {
  return apiRequest<ExportLedgerPdfResponse>('/api/ledger/export/pdf', {
    method: 'POST',
    body: {
      ...options,
      format: 'base64',
    },
  });
}
