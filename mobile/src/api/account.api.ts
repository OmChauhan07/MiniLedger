// Purpose: API client for fetching account profile, initiating OTP updates, and verifying profile changes.
// Imported by: src/features/account/AccountScreen.tsx, src/components/EditProfileModal.tsx

import { apiRequest } from './client';
import { User } from '../types/index';

export interface InitiateProfileUpdateResponse {
  requiresOtp?: boolean;
  updateToken?: string;
  maskedPhone?: string;
  updated?: boolean;
  message: string;
}

export interface VerifyProfileUpdateResponse {
  message: string;
  user: User;
}

/**
 * Fetches current authenticated user profile.
 */
export async function fetchAccountProfileApi(): Promise<{ user: User }> {
  return apiRequest<{ user: User }>('/api/account', {
    method: 'GET',
  });
}

/**
 * Validates proposed profile changes and requests an OTP challenge if changes exist.
 */
export async function updateAccountProfileApi(payload: {
  name?: string;
  email?: string | null;
}): Promise<InitiateProfileUpdateResponse> {
  return apiRequest<InitiateProfileUpdateResponse>('/api/account', {
    method: 'PATCH',
    body: payload,
  });
}

/**
 * Verifies submitted OTP code and commits approved profile changes.
 */
export async function verifyAccountUpdateApi(payload: {
  updateToken: string;
  otp: string;
}): Promise<VerifyProfileUpdateResponse> {
  return apiRequest<VerifyProfileUpdateResponse>('/api/account/verify-update', {
    method: 'POST',
    body: payload,
  });
}
