// Purpose: Provides phone number normalization and validation utilities for Indian and international formats.
// Imported by: src/modules/auth/auth.schema.ts, src/modules/auth/auth.service.ts

// Normalizes a raw phone input string to standard E.164 format (+91XXXXXXXXXX for 10-digit Indian numbers)
export function normalizePhoneNumber(rawPhone: string): string {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return '';
  }

  // Remove whitespace, dashes, dots, and parentheses
  const cleaned = rawPhone.replace(/[\s\-\.\(\)]/g, '');

  // If already standard E.164 starting with '+'
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // If starts with 0 and followed by 10 digits, assume standard Indian mobile
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return `+91${cleaned.slice(1)}`;
  }

  // If exactly 10 digits, default to Indian mobile format (+91)
  if (/^\d{10}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }

  // If starts with country code without plus (e.g., 919876543210)
  if (/^91\d{10}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  return cleaned;
}

// Validates whether the normalized phone number conforms to an acceptable mobile phone format
export function isValidPhoneNumber(phone: string): boolean {
  // Must match E.164 format: leading '+' followed by 10 to 15 digits
  return /^\+[1-9]\d{9,14}$/.test(phone);
}

// Safely masks a phone number for public display (e.g., "+919876543210" -> "+91 98••• ••210")
export function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 8) {
    return '••••••••••';
  }

  if (phone.startsWith('+91') && phone.length === 13) {
    const prefix = phone.slice(0, 3); // +91
    const head = phone.slice(3, 5); // 98
    const tail = phone.slice(10); // 210
    return `${prefix} ${head}••• ••${tail}`;
  }

  // Generic fallback: keep first 3 and last 2 characters
  const start = phone.slice(0, 3);
  const end = phone.slice(-2);
  return `${start}••••${end}`;
}

