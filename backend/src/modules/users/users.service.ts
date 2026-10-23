// Purpose: Business logic for discovering registered MiniLedger users and retrieving mutual relationship ledgers.
// Imported by: src/modules/users/users.controller.ts, tests/cross-account-visibility.test.ts

import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { maskPhoneNumber } from '../auth/phone.utils.js';
import { calculatePairwiseNetting, formatLoan, FormattedLoan, PairwiseNetting } from '../loans/loan.service.js';
import { formatAmount } from '../../lib/money.js';

export interface PublicUserResult {
  id: string;
  name: string;
  maskedPhone: string;
  avatarUrl?: string | null;
}

export interface CounterpartyRelationshipResult {
  counterparty: PublicUserResult;
  netting: PairwiseNetting;
  metrics: {
    totalLent: string;
    totalBorrowed: string;
    activeLentCount: number;
    activeBorrowedCount: number;
    settledCount: number;
  };
  loans: FormattedLoan[];
}

/**
 * Searches registered users matching query term by name or phone number.
 * Privacy & Security rules:
 * - Excludes the requesting user's own account.
 * - Caps maximum results to 20 (default 10).
 * - Masks the phone number.
 * - Never returns email, passwordHash, tokens, or timestamps.
 */
export async function searchRegisteredUsers(
  currentUserId: string,
  query: string,
  limit: number = 10
): Promise<PublicUserResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const effectiveLimit = Math.min(Math.max(1, limit), 20);

  // Search users where name matches or phone matches
  const users = await prisma.user.findMany({
    where: {
      id: { not: currentUserId },
      OR: [
        {
          name: {
            contains: trimmed,
            mode: 'insensitive',
          },
        },
        {
          phone: {
            contains: trimmed,
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      phone: true,
      avatarKey: true,
    },
    take: effectiveLimit,
    orderBy: {
      name: 'asc',
    },
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name || 'MiniLedger User',
    maskedPhone: maskPhoneNumber(u.phone),
    avatarUrl: u.avatarKey ? `/api/users/${u.id}/avatar` : null,
  }));
}

/**
 * Retrieves the pairwise relationship and mutual ledger between current user and a registered counterparty.
 * Strictly isolates loans to only those involving these two users.
 */
export async function getCounterpartyRelationship(
  currentUserId: string,
  counterpartyId: string
): Promise<
  | { success: true; data: CounterpartyRelationshipResult }
  | { success: false; status: number; error: { code: string; message: string } }
> {
  if (counterpartyId === currentUserId) {
    return {
      success: false,
      status: 400,
      error: {
        code: 'INVALID_COUNTERPARTY',
        message: 'Cannot view relationship with your own account.',
      },
    };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: counterpartyId },
    select: { id: true, name: true, phone: true },
  });

  if (!targetUser) {
    return {
      success: false,
      status: 404,
      error: {
        code: 'COUNTERPARTY_NOT_FOUND',
        message: 'Counterparty user could not be found.',
      },
    };
  }

  const netting = await calculatePairwiseNetting(currentUserId, counterpartyId, targetUser);

  // Fetch mutual loans between current user and target user strictly
  const mutualLoans = await prisma.loan.findMany({
    where: {
      OR: [
        { userId: currentUserId, counterpartyUserId: counterpartyId },
        { userId: counterpartyId, counterpartyUserId: currentUserId },
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
    orderBy: { createdAt: 'desc' },
  });

  let totalLent = new Prisma.Decimal(0);
  let totalBorrowed = new Prisma.Decimal(0);
  let activeLentCount = 0;
  let activeBorrowedCount = 0;
  let settledCount = 0;

  const formattedLoans = mutualLoans.map((loan) => {
    const formatted = formatLoan(loan, currentUserId);
    if (formatted.isRepaid) {
      settledCount++;
    } else if (formatted.type === 'LENT') {
      activeLentCount++;
      totalLent = totalLent.add(loan.amount);
    } else {
      activeBorrowedCount++;
      totalBorrowed = totalBorrowed.add(loan.amount);
    }
    return formatted;
  });

  return {
    success: true,
    data: {
      counterparty: {
        id: targetUser.id,
        name: targetUser.name || 'MiniLedger User',
        maskedPhone: maskPhoneNumber(targetUser.phone),
      },
      netting,
      metrics: {
        totalLent: formatAmount(totalLent),
        totalBorrowed: formatAmount(totalBorrowed),
        activeLentCount,
        activeBorrowedCount,
        settledCount,
      },
      loans: formattedLoans,
    },
  };
}
