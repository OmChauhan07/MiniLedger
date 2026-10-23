// Purpose: Calculates authoritative financial summary totals (lent, repaid, outstanding, overdue) for a user.
// Imported by: src/modules/summary/summary.controller.ts, tests/loans.test.ts

import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { isOverdue } from '../../lib/date.js';
import { formatAmount } from '../../lib/money.js';

export interface UserSummary {
  totalLent: string;
  totalRepaid: string;
  outstandingAmount: string;
  overdueAmount: string;
}

// Computes decimal-safe aggregates for a user's loans using Prisma Decimal arithmetic
export async function getUserSummary(userId: string): Promise<UserSummary> {
  const loans = await prisma.loan.findMany({
    where: { userId },
  });

  let totalLent = new Prisma.Decimal(0);
  let totalRepaid = new Prisma.Decimal(0);
  let overdueAmount = new Prisma.Decimal(0);

  for (const loan of loans) {
    totalLent = totalLent.add(loan.amount);

    if (loan.isRepaid) {
      totalRepaid = totalRepaid.add(loan.amount);
    } else if (isOverdue(loan.dueDate, loan.isRepaid)) {
      overdueAmount = overdueAmount.add(loan.amount);
    }
  }

  // Outstanding is strictly total lent minus total repaid
  const outstandingAmount = totalLent.sub(totalRepaid);

  return {
    totalLent: formatAmount(totalLent),
    totalRepaid: formatAmount(totalRepaid),
    outstandingAmount: formatAmount(outstandingAmount),
    overdueAmount: formatAmount(overdueAmount),
  };
}
