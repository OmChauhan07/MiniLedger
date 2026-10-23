// Purpose: Configures Express routing for loan operations with mandatory JWT authentication.
// Imported by: src/app.ts

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { createLoanHandler, listLoansHandler, markLoanRepaidHandler } from './loan.controller.js';

export const loanRouter = Router();

// Protect all loan routes with JWT authentication middleware
loanRouter.use(requireAuth);

// Route for creating a new loan
loanRouter.post('/', createLoanHandler);

// Route for listing all loans belonging to the authenticated user
loanRouter.get('/', listLoansHandler);

// Route for marking an unpaid loan as repaid
loanRouter.patch('/:id/repay', markLoanRepaidHandler);
