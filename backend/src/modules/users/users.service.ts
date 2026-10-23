// Purpose: Business logic for discovering registered MiniLedger users by name or phone with privacy protections.
// Imported by: src/modules/users/users.controller.ts

import { prisma } from '../../lib/prisma.js';
import { maskPhoneNumber } from '../auth/phone.utils.js';

export interface PublicUserResult {
  id: string;
  name: string;
  maskedPhone: string;
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
  }));
}
