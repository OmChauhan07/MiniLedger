// Purpose: Client API functions for requesting OTPs, completing signup, and password-based login.
// Imported by: src/features/auth/LoginScreen.tsx, src/features/auth/SignupScreen.tsx, src/features/auth/OtpScreen.tsx

import { apiRequest } from './client';
import { User } from '../types/index';

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterOtpResponse {
  message: string;
  isExistingUser?: boolean;
}

export interface RegisterVerifyOtpResponse {
  signupToken: string;
  phone: string;
}

// 1. Password-based login for existing users
export async function loginApi(phone: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { phone, password },
    requiresAuth: false,
  });
}

// 2. Signup Step 1: Send registration OTP
export async function registerSendOtpApi(phone: string): Promise<RegisterOtpResponse> {
  return apiRequest<RegisterOtpResponse>('/auth/register/send-otp', {
    method: 'POST',
    body: { phone },
    requiresAuth: false,
  });
}

// 3. Signup Step 2: Verify registration OTP
export async function registerVerifyOtpApi(phone: string, otp: string): Promise<RegisterVerifyOtpResponse> {
  return apiRequest<RegisterVerifyOtpResponse>('/auth/register/verify-otp', {
    method: 'POST',
    body: { phone, otp },
    requiresAuth: false,
  });
}

// 4. Signup Step 3: Complete registration with profile & password
export async function registerCompleteApi(payload: {
  signupToken: string;
  name: string;
  email?: string;
  password: string;
}): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/register/complete', {
    method: 'POST',
    body: payload,
    requiresAuth: false,
  });
}

// Legacy user password setup
export async function legacySetupSendOtpApi(phone: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/auth/legacy-setup/send-otp', {
    method: 'POST',
    body: { phone },
    requiresAuth: false,
  });
}

export async function legacySetupVerifyApi(payload: {
  phone: string;
  otp: string;
  password: string;
  name?: string;
}): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/legacy-setup/verify-and-set-password', {
    method: 'POST',
    body: payload,
    requiresAuth: false,
  });
}

// Legacy / Backward-compatible OTP endpoints
export async function sendOtpApi(phone: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/auth/send-otp', {
    method: 'POST',
    body: { phone },
    requiresAuth: false,
  });
}

export async function verifyOtpApi(phone: string, otp: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/verify-otp', {
    method: 'POST',
    body: { phone, otp },
    requiresAuth: false,
  });
}
