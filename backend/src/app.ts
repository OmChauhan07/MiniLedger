// Purpose: Configures and exports the Express application with global middlewares, route mounts, and error handling.
// Imported by: src/index.ts, tests/health.test.ts, tests/auth.test.ts, tests/loans.test.ts

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { loanRouter } from './modules/loans/loan.routes.js';
import { summaryRouter } from './modules/summary/summary.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import { accountRouter } from './modules/account/account.routes.js';
import { ledgerRouter } from './modules/ledger/ledger.routes.js';

export const app = express();

// Enable Cross-Origin Resource Sharing for mobile client access
app.use(cors());

// Parse incoming requests with JSON payloads
app.use(express.json());

// Mount API routes under the /api prefix
app.use('/api', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/loans', loanRouter);
app.use('/api/summary', summaryRouter);
app.use('/api/users', usersRouter);
app.use('/api/account', accountRouter);
app.use('/api/ledger', ledgerRouter);

// Fallback handler for unmapped routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found.',
    },
  });
});

// Centralized error handling middleware to prevent stack trace leaks
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal server error occurred.',
    },
  });
});
