// Purpose: Provides decimal-safe monetary arithmetic and formatting utilities to avoid floating-point errors.
// Imported by: src/modules/loans/loan.service.ts, src/modules/summary/summary.service.ts

import { Prisma } from '@prisma/client';

// Formats a Decimal, number, or string amount to a consistent two-decimal monetary string (e.g., "1200.00")
export function formatAmount(amount: Prisma.Decimal | number | string): string {
  const dec = new Prisma.Decimal(amount);
  return dec.toFixed(2);
}

// Safely sums an array of Decimal amounts using Prisma.Decimal arithmetic
export function sumDecimals(amounts: (Prisma.Decimal | number | string)[]): Prisma.Decimal {
  return amounts.reduce<Prisma.Decimal>((acc, curr) => {
    return acc.add(new Prisma.Decimal(curr));
  }, new Prisma.Decimal(0));
}
