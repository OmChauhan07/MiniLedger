// Purpose: Calculates authoritative financial summary totals (lent, borrowed, repaid, outstanding, overdue) for a user.
// Imported by: src/modules/summary/summary.controller.ts, tests/loans.test.ts

import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { isOverdue } from '../../lib/date.js';
import { formatAmount } from '../../lib/money.js';

export interface UserSummary {
  // Lent (Receivables)
  totalLent: string;
  totalRepaidLent: string;
  outstandingLent: string;
  overdueReceivable: string;

  // Borrowed (Payables)
  totalBorrowed: string;
  totalRepaidBorrowed: string;
  outstandingBorrowed: string;
  overduePayable: string;

  // Backward-compatible fields
  totalRepaid: string;
  outstandingAmount: string;
  overdueAmount: string;
}

// Computes decimal-safe aggregates for a user's loans separated by direction (LENT vs BORROWED)
export async function getUserSummary(userId: string): Promise<UserSummary> {
  const loans = await prisma.loan.findMany({
    where: { userId },
  });

  let totalLent = new Prisma.Decimal(0);
  let totalRepaidLent = new Prisma.Decimal(0);
  let outstandingLent = new Prisma.Decimal(0);
  let overdueReceivable = new Prisma.Decimal(0);

  let totalBorrowed = new Prisma.Decimal(0);
  let totalRepaidBorrowed = new Prisma.Decimal(0);
  let outstandingBorrowed = new Prisma.Decimal(0);
  let overduePayable = new Prisma.Decimal(0);

  for (const loan of loans) {
    const pastDue = isOverdue(loan.dueDate, loan.isRepaid);

    if (loan.type === 'BORROWED') {
      totalBorrowed = totalBorrowed.add(loan.amount);
      if (loan.isRepaid) {
        totalRepaidBorrowed = totalRepaidBorrowed.add(loan.amount);
      } else {
        outstandingBorrowed = outstandingBorrowed.add(loan.amount);
        if (pastDue) {
          overduePayable = overduePayable.add(loan.amount);
        }
      }
    } else {
      // Default LENT
      totalLent = totalLent.add(loan.amount);
      if (loan.isRepaid) {
        totalRepaidLent = totalRepaidLent.add(loan.amount);
      } else {
        outstandingLent = outstandingLent.add(loan.amount);
        if (pastDue) {
          overdueReceivable = overdueReceivable.add(loan.amount);
        }
      }
    }
  }

  return {
    totalLent: formatAmount(totalLent),
    totalRepaidLent: formatAmount(totalRepaidLent),
    outstandingLent: formatAmount(outstandingLent),
    overdueReceivable: formatAmount(overdueReceivable),

    totalBorrowed: formatAmount(totalBorrowed),
    totalRepaidBorrowed: formatAmount(totalRepaidBorrowed),
    outstandingBorrowed: formatAmount(outstandingBorrowed),
    overduePayable: formatAmount(overduePayable),

    // Backward-compatible aliases for Lent flows
    totalRepaid: formatAmount(totalRepaidLent),
    outstandingAmount: formatAmount(outstandingLent),
    overdueAmount: formatAmount(overdueReceivable),
  };
}
