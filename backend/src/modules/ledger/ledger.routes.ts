// Purpose: Configures Express routing for personal ledger PDF exports.
// Imported by: src/app.ts

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { exportLedgerPdfHandler } from './ledger.controller.js';

export const ledgerRouter = Router();

// Export personal loan ledger as an authoritative PDF
ledgerRouter.post('/export/pdf', requireAuth, exportLedgerPdfHandler);
