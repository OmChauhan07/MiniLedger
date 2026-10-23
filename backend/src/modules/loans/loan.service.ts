// Purpose: Implements business logic and ownership-scoped persistence for loan creation, listing, and repayment.
// Imported by: src/modules/loans/loan.controller.ts, tests/loans.test.ts

import { Prisma, Loan } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { parseDateOnly, formatDateOnly } from '../../lib/date.js';
import { formatAmount } from '../../lib/money.js';
import { CreateLoanInput } from './loan.schema.js';

export interface FormattedLoan {
  id: string;
  friendName: string;
  amount: string;
  dueDate: string;
  isRepaid: boolean;
  repaidAt: string | null;
  createdAt: string;
}

// Transforms a raw Prisma Loan model into the standardized API response shape with string amounts
export function formatLoan(loan: Loan): FormattedLoan {
  return {
    id: loan.id,
    friendName: loan.friendName,
    amount: formatAmount(loan.amount),
    dueDate: formatDateOnly(loan.dueDate),
    isRepaid: loan.isRepaid,
    repaidAt: loan.repaidAt ? loan.repaidAt.toISOString() : null,
    createdAt: loan.createdAt.toISOString(),
  };
}

// Creates a new loan entry securely associated with the authenticated user
export async function createLoan(userId: string, input: CreateLoanInput): Promise<FormattedLoan> {
  const loan = await prisma.loan.create({
    data: {
      userId,
      friendName: input.friendName,
      amount: new Prisma.Decimal(input.amount),
      dueDate: parseDateOnly(input.dueDate),
    },
  });

  return formatLoan(loan);
}

// Retrieves all loans owned by the authenticated user in reverse chronological order
export async function listLoans(userId: string): Promise<FormattedLoan[]> {
  const loans = await prisma.loan.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return loans.map(formatLoan);
}

// Marks an owned loan as repaid, enforcing strict ownership and rejecting duplicate repayment attempts
export async function markLoanRepaid(userId: string, loanId: string) {
  // Query strictly by both loan ID and authenticated user ID to prevent ID enumeration
  const existingLoan = await prisma.loan.findFirst({
    where: {
      id: loanId,
      userId,
    },
  });

  // Return generic 404 if the loan does not exist or belongs to another user
  if (!existingLoan) {
    return {
      success: false as const,
      status: 404,
      error: {
        code: 'NOT_FOUND',
        message: 'Loan not found.',
      },
    };
  }

  // Reject with conflict 409 if the loan is already recorded as repaid
  if (existingLoan.isRepaid) {
    return {
      success: false as const,
      status: 409,
      error: {
        code: 'LOAN_ALREADY_REPAID',
        message: 'This loan has already been marked as repaid.',
      },
    };
  }

  // Atomically update repayment state with current timestamp
  const updatedLoan = await prisma.loan.update({
    where: { id: loanId },
    data: {
      isRepaid: true,
      repaidAt: new Date(),
    },
  });

  return {
    success: true as const,
    status: 200,
    data: formatLoan(updatedLoan),
  };
}
