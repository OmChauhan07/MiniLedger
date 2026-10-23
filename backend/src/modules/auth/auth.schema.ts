// Purpose: Zod validation schemas for phone number, OTP authentication, signup, login, and legacy password setup.
// Imported by: src/modules/auth/auth.controller.ts

import { z } from 'zod';
import { normalizePhoneNumber, isValidPhoneNumber } from './phone.utils.js';

// Schema for requesting mock OTP code (generic / backward-compatible)
export const sendOtpSchema = z.object({
  phone: z
    .string({ required_error: 'Phone number is required.' })
    .trim()
    .transform((val) => normalizePhoneNumber(val))
    .refine((val) => isValidPhoneNumber(val), {
      message: 'Please provide a valid 10-digit mobile number or standard E.164 phone format.',
    }),
});

// Schema for verifying submitted OTP code (generic / backward-compatible)
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

// Schema for signup step 1: Request signup OTP
export const registerSendOtpSchema = sendOtpSchema;

// Schema for signup step 2: Verify OTP
export const registerVerifyOtpSchema = verifyOtpSchema;

// Schema for signup step 3: Complete registration with profile & password
export const registerCompleteSchema = z.object({
  signupToken: z
    .string({ required_error: 'Signup token is required.' })
    .trim()
    .min(10, { message: 'Invalid or missing signup verification token.' }),
  name: z
    .string({ required_error: 'Full name is required.' })
    .trim()
    .min(2, { message: 'Full name must be at least 2 characters.' })
    .max(100, { message: 'Full name cannot exceed 100 characters.' }),
  email: z
    .string()
    .trim()
    .email({ message: 'Please enter a valid email address.' })
    .optional()
    .or(z.literal(''))
    .transform((val) => (val && val.length > 0 ? val : undefined)),
  password: z
    .string({ required_error: 'Password is required.' })
    .min(8, { message: 'Password must be at least 8 characters.' })
    .max(100, { message: 'Password cannot exceed 100 characters.' }),
});

// Schema for standard login: Phone + Password
export const loginSchema = z.object({
  phone: z
    .string({ required_error: 'Phone number is required.' })
    .trim()
    .transform((val) => normalizePhoneNumber(val))
    .refine((val) => isValidPhoneNumber(val), {
      message: 'Please provide a valid phone number.',
    }),
  password: z
    .string({ required_error: 'Password is required.' })
    .min(1, { message: 'Password is required.' }),
});

// Schema for legacy password setup
export const legacySetupSendOtpSchema = sendOtpSchema;

export const legacySetupVerifySchema = z.object({
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
  password: z
    .string({ required_error: 'New password is required.' })
    .min(8, { message: 'Password must be at least 8 characters.' })
    .max(100, { message: 'Password cannot exceed 100 characters.' }),
  name: z
    .string()
    .trim()
    .min(2, { message: 'Full name must be at least 2 characters.' })
    .max(100, { message: 'Full name cannot exceed 100 characters.' })
    .optional(),
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type RegisterCompleteInput = z.infer<typeof registerCompleteSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type LegacySetupVerifyInput = z.infer<typeof legacySetupVerifySchema>;
