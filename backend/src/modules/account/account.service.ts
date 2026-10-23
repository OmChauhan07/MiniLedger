// Purpose: Business logic for user profile retrieval, OTP-protected profile updates, and challenge verification.
// Imported by: src/modules/account/account.controller.ts, tests/account-and-pdf.test.ts

import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma.js';
import { generateOtp, hashOtp, verifyOtpHash } from '../../lib/crypto.js';
import { config } from '../../config/env.js';

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 3;

export interface ProfileUpdatePayload {
  name?: string;
  email?: string | null;
}

export interface ProfileUpdateTokenPayload {
  purpose: 'profile_update';
  userId: string;
  challengeId: string;
  pendingChanges: {
    name: string | null;
    email: string | null;
  };
}

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

  return {
    success: true as const,
    status: 200,
    data: { user },
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
    console.log(`[MOCK OTP - Profile Update] Phone: ${user.phone} | Code: ${otp} (valid for 5 minutes)`);
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
    payload = jwt.verify(updateToken, config.JWT_SECRET) as ProfileUpdateTokenPayload;
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

  // Mark challenge as consumed
  await prisma.otpChallenge.update({
    where: { id: challenge.id },
    data: { consumedAt: new Date() },
  });

  // Apply changes to user account
  const updatedUser = await prisma.user.update({
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
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    success: true as const,
    status: 200,
    data: {
      message: 'Profile updated successfully.',
      user: updatedUser,
    },
  };
}
