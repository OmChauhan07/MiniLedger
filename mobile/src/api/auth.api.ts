// Purpose: Client API functions for requesting mock OTPs and verifying login credentials.
// Imported by: src/features/auth/LoginScreen.tsx, src/features/auth/OtpScreen.tsx

import { apiRequest } from './client.js';
import { User } from '../types/index.js';

export interface VerifyOtpResponse {
  token: string;
  user: User;
}

// Sends a phone number to trigger generation of a development mock OTP challenge
export async function sendOtpApi(phone: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/auth/send-otp', {
    method: 'POST',
    body: { phone },
    requiresAuth: false,
  });
}

// Submits the OTP code and phone number to obtain a verified session token and user profile
export async function verifyOtpApi(phone: string, otp: string): Promise<VerifyOtpResponse> {
  return apiRequest<VerifyOtpResponse>('/auth/verify-otp', {
    method: 'POST',
    body: { phone, otp },
    requiresAuth: false,
  });
}
