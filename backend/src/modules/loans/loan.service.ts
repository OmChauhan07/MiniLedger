// Purpose: Implements business logic and ownership-scoped persistence for loan creation, listing, retrieval, repayment, and pairwise netting.
// Imported by: src/modules/loans/loan.controller.ts, tests/loans.test.ts

import { Prisma, Loan, LoanType } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { parseDateOnly, formatDateOnly } from '../../lib/date.js';
import { formatAmount } from '../../lib/money.js';
import { maskPhoneNumber } from '../auth/phone.utils.js';
import { CreateLoanInput } from './loan.schema.js';

export interface FormattedCounterparty {
  id: string;
  name: string;
  maskedPhone: string;
}

export interface PairwiseNetting {
  hasCounterparty: boolean;
  counterparty?: FormattedCounterparty;
  lentPrincipal: string;
  borrowedPrincipal: string;
  netStatus: 'RECEIVABLE' | 'PAYABLE' | 'SETTLED';
  netAmount: string;
  explanation: string;
}

export interface FormattedLoan {
  id: string;
  userId: string;
  friendName: string;
  amount: string;
  dueDate: string;
  type: 'LENT' | 'BORROWED';
  isRepaid: boolean;
  repaidAt: string | null;
  counterpartyUserId: string | null;
  counterpartyPhone: string | null;
  counterpartyUser?: FormattedCounterparty | null;
  netting?: PairwiseNetting | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListLoansOptions {
  type?: 'LENT' | 'BORROWED' | 'ALL';
  status?: 'pending' | 'overdue' | 'repaid' | 'all';
  search?: string;
}

type LoanWithCounterparty = Loan & {
  counterpartyUser?: {
    id: string;
    name: string | null;
    phone: string;
  } | null;
};

// Transforms a raw Prisma Loan model into the standardized API response shape with string amounts
export function formatLoan(loan: LoanWithCounterparty, netting?: PairwiseNetting | null): FormattedLoan {
  let counterpartyUser: FormattedCounterparty | null = null;
  if (loan.counterpartyUser) {
    counterpartyUser = {
      id: loan.counterpartyUser.id,
      name: loan.counterpartyUser.name || 'MiniLedger User',
      maskedPhone: maskPhoneNumber(loan.counterpartyUser.phone),
    };
  }

  return {
    id: loan.id,
    userId: loan.userId,
    friendName: loan.friendName,
    amount: formatAmount(loan.amount),
    dueDate: formatDateOnly(loan.dueDate),
    type: loan.type,
    isRepaid: loan.isRepaid,
    repaidAt: loan.repaidAt ? loan.repaidAt.toISOString() : null,
    counterpartyUserId: loan.counterpartyUserId ?? null,
    counterpartyPhone: loan.counterpartyPhone ?? null,
    counterpartyUser,
    netting: netting ?? undefined,
    createdAt: loan.createdAt.toISOString(),
    updatedAt: loan.updatedAt ? loan.updatedAt.toISOString() : loan.createdAt.toISOString(),
  };
}

// Creates a new loan entry securely associated with the authenticated user with explicit direction and optional registered counterparty
export async function createLoan(userId: string, input: CreateLoanInput) {
  // Validate counterparty user if provided
  if (input.counterpartyUserId) {
    if (input.counterpartyUserId === userId) {
      return {
        success: false as const,
        status: 400,
        error: {
          code: 'INVALID_COUNTERPARTY',
          message: 'You cannot record a loan to yourself.',
        },
      };
    }

    const registeredUser = await prisma.user.findUnique({
      where: { id: input.counterpartyUserId },
      select: { id: true, name: true, phone: true },
    });

    if (!registeredUser) {
      return {
        success: false as const,
        status: 404,
        error: {
          code: 'COUNTERPARTY_NOT_FOUND',
          message: 'Selected registered user could not be found.',
        },
      };
    }
  }

  const loan = await prisma.loan.create({
    data: {
      userId,
      friendName: input.friendName,
      amount: new Prisma.Decimal(input.amount),
      dueDate: parseDateOnly(input.dueDate),
      type: (input.type as LoanType) || LoanType.LENT,
      counterpartyUserId: input.counterpartyUserId || null,
      counterpartyPhone: input.counterpartyPhone || null,
    },
    include: {
      counterpartyUser: {
        select: { id: true, name: true, phone: true },
      },
    },
  });

  return {
    success: true as const,
    status: 201,
    data: formatLoan(loan),
  };
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
    const query = options.search.trim();
    where.OR = [
      { friendName: { contains: query, mode: 'insensitive' } },
      { counterpartyPhone: { contains: query } },
      { counterpartyUser: { name: { contains: query, mode: 'insensitive' } } },
    ];
  }

  const loans = await prisma.loan.findMany({
    where,
    include: {
      counterpartyUser: {
        select: { id: true, name: true, phone: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return loans.map((loan) => formatLoan(loan));
}

// Calculates pairwise netting between caller and a registered counterparty across outstanding loans
export async function calculatePairwiseNetting(
  userId: string,
  counterpartyUserId: string,
  counterpartyUser: { id: string; name: string | null; phone: string }
): Promise<PairwiseNetting> {
  // Query all active (unpaid) loans between current user and counterparty
  const activeLoans = await prisma.loan.findMany({
    where: {
      userId,
      counterpartyUserId,
      isRepaid: false,
    },
    select: {
      amount: true,
      type: true,
    },
  });

  let lentDecimal = new Prisma.Decimal(0);
  let borrowedDecimal = new Prisma.Decimal(0);

  for (const item of activeLoans) {
    if (item.type === 'BORROWED') {
      borrowedDecimal = borrowedDecimal.add(item.amount);
    } else {
      lentDecimal = lentDecimal.add(item.amount);
    }
  }

  const counterpartyName = counterpartyUser.name || 'They';
  const maskedPhone = maskPhoneNumber(counterpartyUser.phone);
  const formattedCounterparty: FormattedCounterparty = {
    id: counterpartyUser.id,
    name: counterpartyUser.name || 'MiniLedger User',
    maskedPhone,
  };

  if (lentDecimal.greaterThan(borrowedDecimal)) {
    const net = lentDecimal.minus(borrowedDecimal);
    return {
      hasCounterparty: true,
      counterparty: formattedCounterparty,
      lentPrincipal: formatAmount(lentDecimal),
      borrowedPrincipal: formatAmount(borrowedDecimal),
      netStatus: 'RECEIVABLE',
      netAmount: formatAmount(net),
      explanation: `${counterpartyName} owes you ₹${formatAmount(net)} net`,
    };
  }

  if (borrowedDecimal.greaterThan(lentDecimal)) {
    const net = borrowedDecimal.minus(lentDecimal);
    return {
      hasCounterparty: true,
      counterparty: formattedCounterparty,
      lentPrincipal: formatAmount(lentDecimal),
      borrowedPrincipal: formatAmount(borrowedDecimal),
      netStatus: 'PAYABLE',
      netAmount: formatAmount(net),
      explanation: `You owe ${counterpartyName} ₹${formatAmount(net)} net`,
    };
  }

  return {
    hasCounterparty: true,
    counterparty: formattedCounterparty,
    lentPrincipal: formatAmount(lentDecimal),
    borrowedPrincipal: formatAmount(borrowedDecimal),
    netStatus: 'SETTLED',
    netAmount: '0.00',
    explanation: `Settled / No outstanding net balance with ${counterpartyName}`,
  };
}

// Retrieves a single loan strictly owned by the authenticated user, computing pairwise netting if registered counterparty
export async function getLoanById(userId: string, loanId: string) {
  const loan = await prisma.loan.findFirst({
    where: {
      id: loanId,
      userId,
    },
    include: {
      counterpartyUser: {
        select: { id: true, name: true, phone: true },
      },
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

  let netting: PairwiseNetting | null = null;
  if (loan.counterpartyUserId && loan.counterpartyUser) {
    netting = await calculatePairwiseNetting(userId, loan.counterpartyUserId, loan.counterpartyUser);
  }

  return {
    success: true as const,
    status: 200,
    data: formatLoan(loan, netting),
  };
}

// Marks an owned loan as repaid, enforcing strict ownership and rejecting duplicate repayment attempts
export async function markLoanRepaid(userId: string, loanId: string) {
  const existingLoan = await prisma.loan.findFirst({
    where: {
      id: loanId,
      userId,
    },
  });

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

  const updatedLoan = await prisma.loan.update({
    where: { id: loanId },
    data: {
      isRepaid: true,
      repaidAt: new Date(),
    },
    include: {
      counterpartyUser: {
        select: { id: true, name: true, phone: true },
      },
    },
  });

  return {
    success: true as const,
    status: 200,
    data: formatLoan(updatedLoan),
  };
}
