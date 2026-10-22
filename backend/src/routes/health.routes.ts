// Purpose: Defines the health check HTTP route to verify API availability and readiness.
// Imported by: src/app.ts

import { Router, Request, Response } from 'express';

export const healthRouter = Router();

// Handles GET /api/health requests and returns standard service health status
healthRouter.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'MiniLedger API',
  });
});
