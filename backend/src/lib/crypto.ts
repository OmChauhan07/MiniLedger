// Purpose: Provides cryptographic utilities for secure OTP generation and hashing.
// Imported by: src/modules/auth/auth.service.ts

import crypto from 'crypto';

// Generates a cryptographically secure 6-digit numeric OTP code
export function generateOtp(): string {
  const buffer = crypto.randomBytes(4);
  const code = (buffer.readUInt32BE(0) % 900000) + 100000;
  return code.toString();
}

// Computes a SHA-256 hash of the phone number and OTP code to prevent plaintext storage
export function hashOtp(phone: string, otp: string): string {
  return crypto
    .createHash('sha256')
    .update(`${phone}:${otp}`)
    .digest('hex');
}

// Compares an incoming OTP against the stored hash in constant time to prevent timing attacks
export function verifyOtpHash(phone: string, otp: string, expectedHash: string): boolean {
  const computedHash = hashOtp(phone, otp);
  if (computedHash.length !== expectedHash.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(expectedHash));
}
