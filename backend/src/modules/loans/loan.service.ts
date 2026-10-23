// Purpose: Implements business logic and ownership-scoped persistence for loan creation, participant-aware listing, retrieval, repayment, and bilateral pairwise netting.
// Imported by: src/modules/loans/loan.controller.ts, src/modules/users/users.service.ts, tests/loans.test.ts, tests/accounts-netting.test.ts, tests/cross-account-visibility.test.ts

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
  isCreator: boolean;
  recordedByName: string;
  netting?: PairwiseNetting | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListLoansOptions {
  type?: 'LENT' | 'BORROWED' | 'ALL';
  status?: 'pending' | 'overdue' | 'repaid' | 'all';
  search?: string;
}

export type LoanWithParticipants = Loan & {
  user: {
    id: string;
    name: string | null;
    phone: string;
  };
  counterpartyUser?: {
    id: string;
    name: string | null;
    phone: string;
  } | null;
};

/**
 * Transforms a raw Prisma Loan model into participant-aware response shape relative to callerUserId.
 * - If caller is the creator: direction is preserved (loan.type), counterparty is loan.counterpartyUser.
 * - If caller is counterparty: direction is inverted (LENT -> BORROWED, BORROWED -> LENT), counterparty is creator (loan.user).
 */
export function formatLoan(
  loan: LoanWithParticipants,
  callerUserId: string,
  netting?: PairwiseNetting | null
): FormattedLoan {
  const isCreator = loan.userId === callerUserId;
  let perspectiveType: 'LENT' | 'BORROWED';
  let counterpartyUser: FormattedCounterparty | null = null;
  let friendName: string;
  let counterpartyUserId: string | null = null;
  let counterpartyPhone: string | null = null;
  let recordedByName: string;

  if (isCreator) {
    perspectiveType = loan.type;
    friendName = loan.friendName;
    counterpartyUserId = loan.counterpartyUserId ?? null;
    counterpartyPhone = loan.counterpartyPhone ?? null;
    recordedByName = 'You';

    if (loan.counterpartyUser) {
      counterpartyUser = {
        id: loan.counterpartyUser.id,
        name: loan.counterpartyUser.name || 'MiniLedger User',
        maskedPhone: maskPhoneNumber(loan.counterpartyUser.phone),
      };
    }
  } else {
    // Caller is the counterparty; invert direction and swap counterparty to the creator
    perspectiveType = loan.type === 'LENT' ? 'BORROWED' : 'LENT';
    friendName = loan.user.name || 'MiniLedger User';
    counterpartyUserId = loan.user.id;
    counterpartyPhone = maskPhoneNumber(loan.user.phone);
    recordedByName = loan.user.name || 'MiniLedger User';

    counterpartyUser = {
      id: loan.user.id,
      name: loan.user.name || 'MiniLedger User',
      maskedPhone: maskPhoneNumber(loan.user.phone),
    };
  }

  return {
    id: loan.id,
    userId: loan.userId,
    friendName,
    amount: formatAmount(loan.amount),
    dueDate: formatDateOnly(loan.dueDate),
    type: perspectiveType,
    isRepaid: loan.isRepaid,
    repaidAt: loan.repaidAt ? loan.repaidAt.toISOString() : null,
    counterpartyUserId,
    counterpartyPhone,
    counterpartyUser,
    isCreator,
    recordedByName,
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
      user: {
        select: { id: true, name: true, phone: true },
      },
      counterpartyUser: {
        select: { id: true, name: true, phone: true },
      },
    },
  });

  return {
    success: true as const,
    status: 201,
    data: formatLoan(loan, userId),
  };
}

// Retrieves all loans where caller is either creator OR counterparty, computing caller-relative direction and filters
export async function listLoans(callerUserId: string, options?: ListLoansOptions): Promise<FormattedLoan[]> {
  const conditions: Prisma.LoanWhereInput[] = [];

  // 1. Participant and direction condition relative to caller
  if (options?.type === 'LENT') {
    conditions.push({
      OR: [
        { userId: callerUserId, type: 'LENT' },
        { counterpartyUserId: callerUserId, type: 'BORROWED' },
      ],
    });
  } else if (options?.type === 'BORROWED') {
    conditions.push({
      OR: [
        { userId: callerUserId, type: 'BORROWED' },
        { counterpartyUserId: callerUserId, type: 'LENT' },
      ],
    });
  } else {
    conditions.push({
      OR: [
        { userId: callerUserId },
        { counterpartyUserId: callerUserId },
      ],
    });
  }

  // 2. Status condition
  if (options?.status && options.status !== 'all') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (options.status === 'repaid') {
      conditions.push({ isRepaid: true });
    } else if (options.status === 'overdue') {
      conditions.push({ isRepaid: false, dueDate: { lt: today } });
    } else if (options.status === 'pending') {
      conditions.push({ isRepaid: false, dueDate: { gte: today } });
    }
  }

  // 3. Search condition
  if (options?.search && options.search.trim()) {
    const query = options.search.trim();
    conditions.push({
      OR: [
        { friendName: { contains: query, mode: 'insensitive' } },
        { counterpartyPhone: { contains: query } },
        { counterpartyUser: { name: { contains: query, mode: 'insensitive' } } },
        { counterpartyUser: { phone: { contains: query } } },
        { user: { name: { contains: query, mode: 'insensitive' } } },
        { user: { phone: { contains: query } } },
      ],
    });
  }

  const where: Prisma.LoanWhereInput = { AND: conditions };

  const loans = await prisma.loan.findMany({
    where,
    include: {
      user: {
        select: { id: true, name: true, phone: true },
      },
      counterpartyUser: {
        select: { id: true, name: true, phone: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return loans.map((loan) => formatLoan(loan, callerUserId));
}

// Calculates bilateral pairwise netting between caller and a registered counterparty across mutual active loans
export async function calculatePairwiseNetting(
  callerUserId: string,
  counterpartyUserId: string,
  counterpartyUser: { id: string; name: string | null; phone: string }
): Promise<PairwiseNetting> {
  // Query all active (unpaid) loans between caller and counterparty in either direction
  const activeLoans = await prisma.loan.findMany({
    where: {
      isRepaid: false,
      OR: [
        { userId: callerUserId, counterpartyUserId },
        { userId: counterpartyUserId, counterpartyUserId: callerUserId },
      ],
    },
    select: {
      userId: true,
      amount: true,
      type: true,
    },
  });

  let lentDecimal = new Prisma.Decimal(0);
  let borrowedDecimal = new Prisma.Decimal(0);

  for (const item of activeLoans) {
    const isCallerCreator = item.userId === callerUserId;
    const effectiveType = isCallerCreator
      ? item.type
      : item.type === 'LENT' ? 'BORROWED' : 'LENT';

    if (effectiveType === 'BORROWED') {
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

// Retrieves a single loan if caller is creator OR counterparty, computing perspective and pairwise netting
export async function getLoanById(callerUserId: string, loanId: string) {
  const loan = await prisma.loan.findFirst({
    where: {
      id: loanId,
      OR: [
        { userId: callerUserId },
        { counterpartyUserId: callerUserId },
      ],
    },
    include: {
      user: {
        select: { id: true, name: true, phone: true },
      },
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
  const otherParticipant = loan.userId === callerUserId ? loan.counterpartyUser : loan.user;
  if (otherParticipant) {
    netting = await calculatePairwiseNetting(callerUserId, otherParticipant.id, otherParticipant);
  }

  return {
    success: true as const,
    status: 200,
    data: formatLoan(loan, callerUserId, netting),
  };
}

// Marks a loan as repaid if caller is creator OR counterparty, enforcing consistent state
export async function markLoanRepaid(callerUserId: string, loanId: string) {
  const existingLoan = await prisma.loan.findFirst({
    where: {
      id: loanId,
      OR: [
        { userId: callerUserId },
        { counterpartyUserId: callerUserId },
      ],
    },
    include: {
      user: {
        select: { id: true, name: true, phone: true },
      },
      counterpartyUser: {
        select: { id: true, name: true, phone: true },
      },
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
      user: {
        select: { id: true, name: true, phone: true },
      },
      counterpartyUser: {
        select: { id: true, name: true, phone: true },
      },
    },
  });

  return {
    success: true as const,
    status: 200,
    data: formatLoan(updatedLoan, callerUserId),
  };
}
