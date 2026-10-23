// Purpose: Secure password hashing and timing-safe verification using Node.js crypto.scrypt.
// Imported by: Auth service and user management modules.

import crypto from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(crypto.scrypt);

const SALT_BYTE_LENGTH = 16;
const KEY_BYTE_LENGTH = 64;

/**
 * Hash a plain text password using scrypt with a unique cryptographically secure salt.
 * Output format: "hexSalt:hexHash"
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(SALT_BYTE_LENGTH);
  const derivedKey = (await scryptAsync(password, salt, KEY_BYTE_LENGTH)) as Buffer;
  return `${salt.toString('hex')}:${derivedKey.toString('hex')}`;
}

/**
 * Verifies a plain text password against a stored "hexSalt:hexHash" string
 * using constant-time equality check (timingSafeEqual) to prevent timing attacks.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash || typeof storedHash !== 'string' || !storedHash.includes(':')) {
    return false;
  }

  const parts = storedHash.split(':');
  if (parts.length !== 2) {
    return false;
  }

  const [saltHex, keyHex] = parts;
  if (!saltHex || !keyHex) {
    return false;
  }

  // Ensure both salt and hash are valid hex strings of even length
  const HEX_REGEX = /^[0-9a-fA-F]+$/;
  if (
    !HEX_REGEX.test(saltHex) ||
    !HEX_REGEX.test(keyHex) ||
    saltHex.length % 2 !== 0 ||
    keyHex.length % 2 !== 0 ||
    saltHex.length < 16 ||
    keyHex.length < 32
  ) {
    return false;
  }

  try {
    const salt = Buffer.from(saltHex, 'hex');
    const expectedKey = Buffer.from(keyHex, 'hex');

    const actualKey = (await scryptAsync(password, salt, expectedKey.length)) as Buffer;

    if (actualKey.length !== expectedKey.length) {
      return false;
    }

    return crypto.timingSafeEqual(actualKey, expectedKey);
  } catch {
    return false;
  }
}
