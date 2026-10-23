// Purpose: Express HTTP controller returning financial ledger summary for the authenticated user.
// Imported by: src/modules/summary/summary.routes.ts

import { Request, Response } from 'express';
import { getUserSummary } from './summary.service.js';

// Handles GET /api/summary to return user-scoped lending totals
export async function getSummaryHandler(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
    });
  }

  const summary = await getUserSummary(userId);
  return res.status(200).json(summary);
}
