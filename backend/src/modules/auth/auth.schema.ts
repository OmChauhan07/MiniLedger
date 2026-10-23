// Purpose: Zod validation schemas for phone number and OTP authentication payloads.
// Imported by: src/modules/auth/auth.controller.ts

import { z } from 'zod';
import { normalizePhoneNumber, isValidPhoneNumber } from './phone.utils.js';

// Schema for requesting mock OTP code
export const sendOtpSchema = z.object({
  phone: z
    .string({ required_error: 'Phone number is required.' })
    .trim()
    .transform((val) => normalizePhoneNumber(val))
    .refine((val) => isValidPhoneNumber(val), {
      message: 'Please provide a valid 10-digit mobile number or standard E.164 phone format.',
    }),
});

// Schema for verifying submitted OTP code
export const verifyOtpSchema = z.object({
  phone: z
    .string({ required_error: 'Phone number is required.' })
    .trim()
    .transform((val) => normalizePhoneNumber(val))
    .refine((val) => isValidPhoneNumber(val), {
      message: 'Please provide a valid phone number.',
    }),
  otp: z
    .string({ required_error: 'OTP is required.' })
    .trim()
    .regex(/^\d{6}$/, { message: 'OTP must be exactly 6 digits.' }),
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
