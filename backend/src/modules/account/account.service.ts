// Purpose: Business logic for user profile retrieval, OTP-protected profile updates, and challenge verification.
// Imported by: src/modules/account/account.controller.ts, tests/account-and-pdf.test.ts

import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { generateOtp, hashOtp, verifyOtpHash } from '../../lib/crypto.js';
import { config } from '../../config/env.js';
import {
  uploadObject,
  deleteBucketObjectSafely,
  getSignedAvatarUrl,
  detectImageFormat,
  getObjectWithMetadata,
} from '../../lib/storage.js';

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const OTP_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_ATTEMPTS = 3;

export const profileUpdateTokenSchema = z.object({
  purpose: z.literal('profile_update'),
  userId: z.string().min(1),
  challengeId: z.string().min(1),
  pendingChanges: z.object({
    name: z.string().nullable(),
    email: z.string().email().nullable(),
  }),
});

export interface ProfileUpdatePayload {
  name?: string;
  email?: string | null;
}

export type ProfileUpdateTokenPayload = z.infer<typeof profileUpdateTokenSchema>;

/**
 * Formats a phone number for privacy display (+91 98••• ••210).
 */
function maskPhoneNumber(phone: string): string {
  if (phone.length >= 10) {
    const visibleStart = phone.slice(0, 5);
    const visibleEnd = phone.slice(-3);
    return `${visibleStart}••• ••${visibleEnd}`;
  }
  return phone;
}

/**
 * Fetches the authenticated user's profile details.
 */
export async function getAccountProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      phone: true,
      name: true,
      email: true,
      phoneVerifiedAt: true,
      avatarKey: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    return {
      success: false as const,
      status: 404,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'Account not found.',
      },
    };
  }

  let avatarUrl: string | null = null;
  if (user.avatarKey) {
    try {
      avatarUrl = await getSignedAvatarUrl(user.avatarKey);
    } catch {
      avatarUrl = `/api/account/avatar`;
    }
  }

  return {
    success: true as const,
    status: 200,
    data: {
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        phoneVerifiedAt: user.phoneVerifiedAt,
        avatarUrl,
        hasAvatar: Boolean(user.avatarKey),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    },
  };
}

/**
 * Validates proposed profile changes. If changes exist, generates an OTP challenge
 * and issues a cryptographically bound updateToken. If no-op, returns updated: false.
 */
export async function initiateProfileUpdate(
  userId: string,
  callerPhone: string,
  proposed: ProfileUpdatePayload
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return {
      success: false as const,
      status: 404,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'User account not found.',
      },
    };
  }

  const currentName = user.name ? user.name.trim() : null;
  const currentEmail = user.email ? user.email.trim() : null;

  const proposedName = proposed.name !== undefined ? (proposed.name ? proposed.name.trim() : null) : currentName;
  const proposedEmail = proposed.email !== undefined ? (proposed.email ? proposed.email.trim() : null) : currentEmail;

  // Check if anything actually changed
  if (currentName === proposedName && currentEmail === proposedEmail) {
    return {
      success: true as const,
      status: 200,
      data: {
        updated: false,
        message: 'No profile changes detected.',
      },
    };
  }

  // Check cooldown: reject if an OTP challenge was created within OTP_COOLDOWN_MS
  const recentChallenge = await prisma.otpChallenge.findFirst({
    where: { phone: user.phone },
    orderBy: { createdAt: 'desc' },
  });

  if (recentChallenge) {
    const elapsedMs = Date.now() - recentChallenge.createdAt.getTime();
    if (elapsedMs < OTP_COOLDOWN_MS) {
      const waitSeconds = Math.max(1, Math.ceil((OTP_COOLDOWN_MS - elapsedMs) / 1000));
      return {
        success: false as const,
        status: 429,
        error: {
          code: 'OTP_COOLDOWN',
          message: `Please wait ${waitSeconds} seconds before requesting a new verification code.`,
        },
      };
    }
  }

  // Create OTP challenge for verified phone number
  const otp = generateOtp();
  const codeHash = hashOtp(user.phone, otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  const challenge = await prisma.otpChallenge.create({
    data: {
      phone: user.phone,
      codeHash,
      expiresAt,
    },
  });

  // Issue a tamper-proof JWT token containing the pending changes bound to this challenge and user
  const tokenPayload: ProfileUpdateTokenPayload = {
    purpose: 'profile_update',
    userId: user.id,
    challengeId: challenge.id,
    pendingChanges: {
      name: proposedName,
      email: proposedEmail,
    },
  };

  const updateToken = jwt.sign(tokenPayload, config.JWT_SECRET, {
    expiresIn: '5m',
  });

  // Log mock OTP only in non-production environments
  if (config.NODE_ENV !== 'production') {
    console.log(`\n==================================================`);
    console.log(`  🔑 [MOCK OTP - Profile Update] Phone: ${user.phone} | Code: ${otp}`);
    console.log(`  Valid for 5 minutes`);
    console.log(`==================================================\n`);
  }

  return {
    success: true as const,
    status: 200,
    data: {
      requiresOtp: true,
      updateToken,
      maskedPhone: maskPhoneNumber(user.phone),
      message: 'OTP verification required to save profile changes. A verification code was sent to your registered phone.',
    },
  };
}

/**
 * Verifies submitted OTP against the bound challenge and applies approved profile changes.
 */
export async function verifyAndApplyProfileUpdate(
  userId: string,
  callerPhone: string,
  updateToken: string,
  otp: string
) {
  let payload: ProfileUpdateTokenPayload;

  try {
    const decoded = jwt.verify(updateToken, config.JWT_SECRET);
    const parseResult = profileUpdateTokenSchema.safeParse(decoded);
    if (!parseResult.success) {
      return {
        success: false as const,
        status: 401,
        error: {
          code: 'INVALID_UPDATE_TOKEN',
          message: 'The profile update verification session payload is malformed. Please initiate the change again.',
        },
      };
    }
    payload = parseResult.data;
  } catch (err) {
    return {
      success: false as const,
      status: 401,
      error: {
        code: 'INVALID_UPDATE_TOKEN',
        message: 'The profile update verification session is invalid or expired. Please initiate the change again.',
      },
    };
  }

  // Strict cross-account protection
  if (payload.purpose !== 'profile_update' || payload.userId !== userId) {
    return {
      success: false as const,
      status: 401,
      error: {
        code: 'UNAUTHORIZED',
        message: 'This update token was not issued for the authenticated account.',
      },
    };
  }

  const challenge = await prisma.otpChallenge.findUnique({
    where: { id: payload.challengeId },
  });

  if (!challenge || challenge.phone !== callerPhone) {
    return {
      success: false as const,
      status: 401,
      error: {
        code: 'INVALID_OTP',
        message: 'OTP verification challenge not found.',
      },
    };
  }

  if (challenge.consumedAt !== null) {
    return {
      success: false as const,
      status: 401,
      error: {
        code: 'OTP_ALREADY_USED',
        message: 'This OTP verification code has already been consumed.',
      },
    };
  }

  if (challenge.expiresAt < new Date()) {
    return {
      success: false as const,
      status: 401,
      error: {
        code: 'EXPIRED_OTP',
        message: 'The verification code has expired. Please request a new code.',
      },
    };
  }

  if (challenge.attemptCount >= MAX_ATTEMPTS) {
    return {
      success: false as const,
      status: 429,
      error: {
        code: 'OTP_ATTEMPTS_EXCEEDED',
        message: 'Too many failed verification attempts. Please initiate a new profile update.',
      },
    };
  }

  const isValid = verifyOtpHash(callerPhone, otp, challenge.codeHash);

  if (!isValid) {
    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { attemptCount: { increment: 1 } },
    });

    return {
      success: false as const,
      status: 401,
      error: {
        code: 'INVALID_OTP',
        message: 'Invalid verification code. Please check and try again.',
      },
    };
  }

  // Atomically consume challenge and apply changes to user account in a single transaction
  try {
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Atomic conditional update ensuring challenge has NOT been consumed
      const updateResult = await tx.otpChallenge.updateMany({
        where: {
          id: challenge.id,
          consumedAt: null,
        },
        data: {
          consumedAt: new Date(),
        },
      });

      if (updateResult.count === 0) {
        throw new Error('OTP_ALREADY_USED');
      }

      return await tx.user.update({
        where: { id: userId },
        data: {
          name: payload.pendingChanges.name,
          email: payload.pendingChanges.email,
        },
        select: {
          id: true,
          phone: true,
          name: true,
          email: true,
          phoneVerifiedAt: true,
          avatarKey: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    let avatarUrl: string | null = null;
    if (updatedUser.avatarKey) {
      try {
        avatarUrl = await getSignedAvatarUrl(updatedUser.avatarKey);
      } catch {
        avatarUrl = `/api/account/avatar`;
      }
    }

    return {
      success: true as const,
      status: 200,
      data: {
        message: 'Profile updated successfully.',
        user: {
          id: updatedUser.id,
          phone: updatedUser.phone,
          name: updatedUser.name,
          email: updatedUser.email,
          phoneVerifiedAt: updatedUser.phoneVerifiedAt,
          avatarUrl,
          hasAvatar: Boolean(updatedUser.avatarKey),
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt,
        },
      },
    };
  } catch (err: any) {
    if (err.message === 'OTP_ALREADY_USED') {
      return {
        success: false as const,
        status: 401,
        error: {
          code: 'OTP_ALREADY_USED',
          message: 'This OTP verification code has already been consumed.',
        },
      };
    }
    throw err;
  }
}

/**
 * Uploads, validates, and sets a user's profile avatar picture.
 * Validates cryptographic magic bytes to enforce JPEG, PNG, or WebP.
 * Deletes previous avatar safely after the database update succeeds.
 */
export async function uploadUserAvatar(
  userId: string,
  buffer: Buffer,
  _mimeType?: string
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, avatarKey: true },
  });

  if (!user) {
    return {
      success: false as const,
      status: 404,
      error: { code: 'USER_NOT_FOUND', message: 'User not found.' },
    };
  }

  // Detect genuine image format via magic bytes
  const detectedFormat = detectImageFormat(buffer);
  if (!detectedFormat) {
    return {
      success: false as const,
      status: 400,
      error: {
        code: 'INVALID_IMAGE_FORMAT',
        message: 'Unsupported or corrupted image file. Please provide a valid JPEG, PNG, or WebP image.',
      },
    };
  }

  const ext = detectedFormat === 'jpeg' ? 'jpg' : detectedFormat;
  const newKey = `avatars/${userId}/${Date.now()}-${randomBytes(8).toString('hex')}.${ext}`;
  const contentType = `image/${detectedFormat}`;

  try {
    // 1. Upload new object to Neon Object Storage bucket
    await uploadObject(newKey, buffer, contentType);

    // 2. Update user avatarKey in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatarKey: newKey },
      select: {
        id: true,
        phone: true,
        name: true,
        email: true,
        phoneVerifiedAt: true,
        avatarKey: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // 3. Delete old object from bucket if it exists and was replaced
    if (user.avatarKey && user.avatarKey !== newKey) {
      deleteBucketObjectSafely(user.avatarKey).catch(() => {});
    }

    let avatarUrl: string | null = null;
    try {
      avatarUrl = await getSignedAvatarUrl(newKey);
    } catch {
      avatarUrl = `/api/account/avatar`;
    }

    return {
      success: true as const,
      status: 200,
      data: {
        message: 'Profile image uploaded successfully.',
        avatarUrl,
        user: {
          id: updatedUser.id,
          phone: updatedUser.phone,
          name: updatedUser.name,
          email: updatedUser.email,
          phoneVerifiedAt: updatedUser.phoneVerifiedAt,
          avatarUrl,
          hasAvatar: true,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt,
        },
      },
    };
  } catch (err: any) {
    // Clean up newly uploaded orphaned object if DB update threw an error
    await deleteBucketObjectSafely(newKey).catch(() => {});
    console.error('Avatar upload failed:', err.message);
    return {
      success: false as const,
      status: 500,
      error: {
        code: 'STORAGE_ERROR',
        message: 'Failed to upload profile image to storage.',
      },
    };
  }
}

/**
 * Removes the authenticated user's profile avatar and safely deletes it from storage.
 */
export async function deleteUserAvatar(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      phone: true,
      name: true,
      email: true,
      phoneVerifiedAt: true,
      avatarKey: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    return {
      success: false as const,
      status: 404,
      error: { code: 'USER_NOT_FOUND', message: 'User not found.' },
    };
  }

  if (user.avatarKey) {
    const oldKey = user.avatarKey;
    // Update DB first
    await prisma.user.update({
      where: { id: userId },
      data: { avatarKey: null },
    });
    // Delete from bucket safely
    await deleteBucketObjectSafely(oldKey);
  }

  return {
    success: true as const,
    status: 200,
    data: {
      message: 'Profile photo removed.',
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        phoneVerifiedAt: user.phoneVerifiedAt,
        avatarUrl: null,
        hasAvatar: false,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    },
  };
}

/**
 * Fetches raw avatar buffer and content type for direct streaming delivery.
 */
export async function getUserAvatarFile(userId: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarKey: true },
  });

  if (!user || !user.avatarKey) {
    return null;
  }

  try {
    return await getObjectWithMetadata(user.avatarKey);
  } catch (err: any) {
    console.warn(`Could not load avatar for user ${userId}:`, err.message);
    return null;
  }
}
