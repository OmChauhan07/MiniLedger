// Purpose: Express HTTP controllers for loan operations (create, list, and mark repaid).
// Imported by: src/modules/loans/loan.routes.ts

import { Request, Response } from 'express';
import { createLoanSchema, loanIdParamSchema } from './loan.schema.js';
import { createLoan, listLoans, markLoanRepaid } from './loan.service.js';

// Handles POST /api/loans to create a new loan entry
export async function createLoanHandler(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
    });
  }

  const parseResult = createLoanSchema.safeParse(req.body);
  if (!parseResult.success) {
    const message = parseResult.error.errors[0]?.message || 'Invalid loan input.';
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message },
    });
  }

  const newLoan = await createLoan(userId, parseResult.data);
  return res.status(201).json(newLoan);
}

// Handles GET /api/loans to list all loans for the authenticated user
export async function listLoansHandler(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
    });
  }

  const loans = await listLoans(userId);
  return res.status(200).json({ data: loans });
}

// Handles PATCH /api/loans/:id/repay to mark an unpaid loan as repaid
export async function markLoanRepaidHandler(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
    });
  }

  const paramResult = loanIdParamSchema.safeParse(req.params);
  if (!paramResult.success) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid loan identifier.' },
    });
  }

  const result = await markLoanRepaid(userId, paramResult.data.id);
  if (!result.success) {
    return res.status(result.status).json({
      error: result.error,
    });
  }

  return res.status(200).json(result.data);
}
