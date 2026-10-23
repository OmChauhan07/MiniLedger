// Purpose: Implements business logic and ownership-scoped persistence for loan creation, listing, retrieval, and repayment.
// Imported by: src/modules/loans/loan.controller.ts, tests/loans.test.ts

import { Prisma, Loan, LoanType } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { parseDateOnly, formatDateOnly } from '../../lib/date.js';
import { formatAmount } from '../../lib/money.js';
import { CreateLoanInput } from './loan.schema.js';

export interface FormattedLoan {
  id: string;
  friendName: string;
  amount: string;
  dueDate: string;
  type: 'LENT' | 'BORROWED';
  isRepaid: boolean;
  repaidAt: string | null;
  createdAt: string;
}

export interface ListLoansOptions {
  type?: 'LENT' | 'BORROWED' | 'ALL';
  status?: 'pending' | 'overdue' | 'repaid' | 'all';
  search?: string;
}

// Transforms a raw Prisma Loan model into the standardized API response shape with string amounts
export function formatLoan(loan: Loan): FormattedLoan {
  return {
    id: loan.id,
    friendName: loan.friendName,
    amount: formatAmount(loan.amount),
    dueDate: formatDateOnly(loan.dueDate),
    type: loan.type,
    isRepaid: loan.isRepaid,
    repaidAt: loan.repaidAt ? loan.repaidAt.toISOString() : null,
    createdAt: loan.createdAt.toISOString(),
  };
}

// Creates a new loan entry securely associated with the authenticated user with explicit direction
export async function createLoan(userId: string, input: CreateLoanInput): Promise<FormattedLoan> {
  const loan = await prisma.loan.create({
    data: {
      userId,
      friendName: input.friendName,
      amount: new Prisma.Decimal(input.amount),
      dueDate: parseDateOnly(input.dueDate),
      type: (input.type as LoanType) || LoanType.LENT,
    },
  });

  return formatLoan(loan);
}

// Retrieves all loans owned by the authenticated user with optional direction, status, and search filters
export async function listLoans(userId: string, options?: ListLoansOptions): Promise<FormattedLoan[]> {
  const where: Prisma.LoanWhereInput = { userId };

  if (options?.type && options.type !== 'ALL') {
    where.type = options.type as LoanType;
  }

  if (options?.status && options.status !== 'all') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (options.status === 'repaid') {
      where.isRepaid = true;
    } else if (options.status === 'overdue') {
      where.isRepaid = false;
      where.dueDate = { lt: today };
    } else if (options.status === 'pending') {
      where.isRepaid = false;
      where.dueDate = { gte: today };
    }
  }

  if (options?.search && options.search.trim()) {
    where.friendName = {
      contains: options.search.trim(),
      mode: 'insensitive',
    };
  }

  const loans = await prisma.loan.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return loans.map(formatLoan);
}

// Retrieves a single loan strictly owned by the authenticated user
export async function getLoanById(userId: string, loanId: string) {
  const loan = await prisma.loan.findFirst({
    where: {
      id: loanId,
      userId,
    },
  });

  if (!loan) {
    return {
      success: false as const,
      status: 404,
      error: {
        code: 'NOT_FOUND',
        message: 'Loan not found.',
      },
    };
  }

  return {
    success: true as const,
    status: 200,
    data: formatLoan(loan),
  };
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
