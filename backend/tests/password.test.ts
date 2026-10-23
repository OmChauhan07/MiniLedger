// Purpose: Unit tests for secure password hashing and constant-time verification.
// Imported by: vitest test runner

import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../src/lib/password.js';

describe('Password Utility', () => {
  it('hashes password with unique salt each time', async () => {
    const password = 'SuperSecretPassword123!';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    expect(hash1).toContain(':');
    expect(hash2).toContain(':');
    // Salting ensures identical passwords produce different stored hashes
    expect(hash1).not.toBe(hash2);
  });

  it('verifies correct password against its hash', async () => {
    const password = 'CorrectPassword99#';
    const hash = await hashPassword(password);

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it('rejects wrong password', async () => {
    const password = 'CorrectPassword99#';
    const hash = await hashPassword(password);

    const isValid = await verifyPassword('WrongPassword123', hash);
    expect(isValid).toBe(false);
  });

  it('gracefully handles malformed or empty hash strings', async () => {
    expect(await verifyPassword('test', '')).toBe(false);
    expect(await verifyPassword('test', 'nohashformat')).toBe(false);
    expect(await verifyPassword('test', 'toomany:parts:here')).toBe(false);
    expect(await verifyPassword('test', 'nothex:nothex')).toBe(false);
  });
});
