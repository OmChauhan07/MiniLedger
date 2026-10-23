// Purpose: Implements business logic for mock OTP creation, rate limiting, verification, and JWT generation.
// Imported by: src/modules/auth/auth.controller.ts, tests/auth.test.ts

import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma.js';
import { generateOtp, hashOtp, verifyOtpHash } from '../../lib/crypto.js';
import { config } from '../../config/env.js';

// Maximum allowed verification attempts before challenge lockout
const MAX_ATTEMPTS = 3;

// Expiration window for OTP challenges in milliseconds (5 minutes)
const OTP_EXPIRY_MS = 5 * 60 * 1000;

// Creates a short-lived mock OTP challenge, logs it to server terminal, and saves challenge hash
export async function sendOtpChallenge(phone: string): Promise<{ message: string }> {
  const otp = generateOtp();
  const codeHash = hashOtp(phone, otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  // Store the hashed OTP challenge in the database
  await prisma.otpChallenge.create({
    data: {
      phone,
      codeHash,
      expiresAt,
    },
  });

  // Log mock OTP to development terminal for testing (never exposed over HTTP)
  console.log(`[MOCK OTP] Phone: ${phone} | Code: ${otp} (valid for 5 minutes)`);

  return {
    message: 'If the phone number is valid, an OTP request was created.',
  };
}

// Verifies a submitted OTP, enforces attempt limits, creates user if first login, and issues a JWT
export async function verifyOtpChallenge(phone: string, otp: string) {
  // Find the most recent unconsumed challenge for this phone number
  const challenge = await prisma.otpChallenge.findFirst({
    where: {
      phone,
      consumedAt: null,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Reject if no pending challenge exists or challenge has expired
  if (!challenge || challenge.expiresAt < new Date()) {
    return {
      success: false as const,
      status: 401,
      error: {
        code: 'INVALID_OTP',
        message: 'Invalid or expired OTP code.',
      },
    };
  }

  // Reject if max attempts have been exceeded
  if (challenge.attemptCount >= MAX_ATTEMPTS) {
    return {
      success: false as const,
      status: 429,
      error: {
        code: 'OTP_ATTEMPTS_EXCEEDED',
        message: 'Too many failed verification attempts. Please request a new OTP.',
      },
    };
  }

  // Verify the submitted OTP against the stored SHA-256 hash
  const isValid = verifyOtpHash(phone, otp, challenge.codeHash);

  if (!isValid) {
    // Record failed attempt in database
    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { attemptCount: { increment: 1 } },
    });

    return {
      success: false as const,
      status: 401,
      error: {
        code: 'INVALID_OTP',
        message: 'Invalid OTP code.',
      },
    };
  }

  // Atomically mark the challenge as consumed to prevent reuse
  await prisma.otpChallenge.update({
    where: { id: challenge.id },
    data: { consumedAt: new Date() },
  });

  // Ensure user account exists or create a new user entry
  const user = await prisma.user.upsert({
    where: { phone },
    update: {},
    create: { phone },
  });

  // Issue a signed JSON Web Token containing the user's primary identity
  const token = jwt.sign(
    { userId: user.id, phone: user.phone },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );

  return {
    success: true as const,
    status: 200,
    data: {
      token,
      user: {
        id: user.id,
        phone: user.phone,
      },
    },
  };
}
