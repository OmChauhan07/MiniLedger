// Purpose: Implements business logic for OTP challenge lifecycle, user signup, password login, legacy upgrades, and JWT issuance.
// Imported by: src/modules/auth/auth.controller.ts, tests/auth.test.ts

import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma.js';
import { generateOtp, hashOtp, verifyOtpHash } from '../../lib/crypto.js';
import { hashPassword, verifyPassword } from '../../lib/password.js';
import { config } from '../../config/env.js';

// Maximum allowed verification attempts before challenge lockout
const MAX_ATTEMPTS = 3;

// Expiration window for OTP challenges in milliseconds (5 minutes)
const OTP_EXPIRY_MS = 5 * 60 * 1000;

// Expiration window for intermediate signup tokens (15 minutes)
const SIGNUP_TOKEN_EXPIRY = '15m';

interface SignupTokenPayload {
  phone: string;
  purpose: 'signup';
}

/**
 * Creates a short-lived mock OTP challenge, logs it to server terminal, and saves challenge hash.
 */
export async function sendOtpChallenge(phone: string): Promise<{ message: string; isExistingUser?: boolean }> {
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

/**
 * Verifies submitted OTP against database record with attempt counter and expiration enforcement.
 */
async function verifyOtpInternal(phone: string, otp: string) {
  const challenge = await prisma.otpChallenge.findFirst({
    where: {
      phone,
      consumedAt: null,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

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

  const isValid = verifyOtpHash(phone, otp, challenge.codeHash);

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
        message: 'Invalid OTP code.',
      },
    };
  }

  await prisma.otpChallenge.update({
    where: { id: challenge.id },
    data: { consumedAt: new Date() },
  });

  return { success: true as const, challenge };
}

/**
 * Legacy / Backward-compatible OTP verification: creates user if missing and issues JWT.
 */
export async function verifyOtpChallenge(phone: string, otp: string) {
  const verifyResult = await verifyOtpInternal(phone, otp);
  if (!verifyResult.success) {
    return verifyResult;
  }

  const user = await prisma.user.upsert({
    where: { phone },
    update: { phoneVerifiedAt: new Date() },
    create: { phone, phoneVerifiedAt: new Date() },
  });

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
        name: user.name,
        email: user.email,
        phoneVerifiedAt: user.phoneVerifiedAt,
      },
    },
  };
}

/**
 * Signup Step 1: Send registration OTP.
 * Detects if user already has an active password-protected account.
 */
export async function sendRegisterOtp(phone: string) {
  const existingUser = await prisma.user.findUnique({
    where: { phone },
    select: { id: true, passwordHash: true },
  });

  if (existingUser && existingUser.passwordHash) {
    return {
      success: true as const,
      status: 200,
      data: {
        message: 'If the phone number is valid, an OTP request was created.',
        isExistingUser: true,
      },
    };
  }

  const result = await sendOtpChallenge(phone);
  return {
    success: true as const,
    status: 200,
    data: {
      ...result,
      isExistingUser: false,
    },
  };
}

/**
 * Signup Step 2: Verify OTP and issue short-lived signup token.
 */
export async function verifyRegisterOtp(phone: string, otp: string) {
  const verifyResult = await verifyOtpInternal(phone, otp);
  if (!verifyResult.success) {
    return verifyResult;
  }

  const signupToken = jwt.sign(
    { phone, purpose: 'signup' } satisfies SignupTokenPayload,
    config.JWT_SECRET,
    { expiresIn: SIGNUP_TOKEN_EXPIRY }
  );

  return {
    success: true as const,
    status: 200,
    data: {
      signupToken,
      phone,
    },
  };
}

/**
 * Signup Step 3: Complete registration by supplying profile details and password.
 */
export async function completeRegistration(input: {
  signupToken: string;
  name: string;
  email?: string;
  password: string;
}) {
  let phone: string;
  try {
    const decoded = jwt.verify(input.signupToken, config.JWT_SECRET) as SignupTokenPayload;
    if (!decoded || decoded.purpose !== 'signup' || !decoded.phone) {
      return {
        success: false as const,
        status: 400,
        error: {
          code: 'INVALID_SIGNUP_TOKEN',
          message: 'Invalid or expired signup token. Please verify your phone number again.',
        },
      };
    }
    phone = decoded.phone;
  } catch {
    return {
      success: false as const,
      status: 400,
      error: {
        code: 'INVALID_SIGNUP_TOKEN',
        message: 'Invalid or expired signup token. Please verify your phone number again.',
      },
    };
  }

  // Check if account with this phone already exists and has password
  const existingUser = await prisma.user.findUnique({
    where: { phone },
  });

  if (existingUser && existingUser.passwordHash) {
    return {
      success: false as const,
      status: 409,
      error: {
        code: 'ACCOUNT_ALREADY_EXISTS',
        message: 'An account with this phone number already exists. Please log in.',
      },
    };
  }

  // Securely hash password using scrypt
  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.upsert({
    where: { phone },
    update: {
      name: input.name,
      email: input.email ?? null,
      passwordHash,
      phoneVerifiedAt: new Date(),
    },
    create: {
      phone,
      name: input.name,
      email: input.email ?? null,
      passwordHash,
      phoneVerifiedAt: new Date(),
    },
  });

  const token = jwt.sign(
    { userId: user.id, phone: user.phone },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );

  return {
    success: true as const,
    status: 201,
    data: {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        phoneVerifiedAt: user.phoneVerifiedAt,
      },
    },
  };
}

/**
 * Password-based login for existing users.
 * Generic 401 for unknown user or wrong password to prevent user enumeration.
 * Specific 403 for legacy users whose password is not yet configured.
 */
export async function loginWithPassword(phone: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { phone },
  });

  if (!user) {
    return {
      success: false as const,
      status: 401,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid mobile number or password.',
      },
    };
  }

  // Handle legacy accounts without passwords safely
  if (!user.passwordHash) {
    return {
      success: false as const,
      status: 403,
      error: {
        code: 'PASSWORD_NOT_SET',
        message: 'This account was created without a password. Please verify via OTP to set your password.',
      },
    };
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return {
      success: false as const,
      status: 401,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid mobile number or password.',
      },
    };
  }

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
        name: user.name,
        email: user.email,
        phoneVerifiedAt: user.phoneVerifiedAt,
      },
    },
  };
}

/**
 * Legacy Account Setup Step 1: Send OTP for passwordless user
 */
export async function sendLegacySetupOtp(phone: string) {
  const user = await prisma.user.findUnique({
    where: { phone },
  });

  if (!user) {
    return {
      success: false as const,
      status: 404,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'No account found with this phone number.',
      },
    };
  }

  const result = await sendOtpChallenge(phone);
  return {
    success: true as const,
    status: 200,
    data: result,
  };
}

/**
 * Legacy Account Setup Step 2: Verify OTP and save new password
 */
export async function verifyAndSetLegacyPassword(input: {
  phone: string;
  otp: string;
  password: string;
  name?: string;
}) {
  const verifyResult = await verifyOtpInternal(input.phone, input.otp);
  if (!verifyResult.success) {
    return verifyResult;
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.update({
    where: { phone: input.phone },
    data: {
      passwordHash,
      phoneVerifiedAt: new Date(),
      ...(input.name ? { name: input.name } : {}),
    },
  });

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
        name: user.name,
        email: user.email,
        phoneVerifiedAt: user.phoneVerifiedAt,
      },
    },
  };
}
