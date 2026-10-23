// Purpose: Instantiates and exports a singleton Prisma Client instance for database operations.
// Imported by: src/modules/auth/auth.service.ts, src/modules/loans/loan.service.ts, src/modules/summary/summary.service.ts

import { PrismaClient } from '@prisma/client';

// Global singleton pattern to avoid multiple client instances in development hot reload
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

// Export either existing singleton or new PrismaClient instance
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
