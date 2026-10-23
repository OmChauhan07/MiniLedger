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
  return apiRequest<{ user: User }>('/account', {
    method: 'GET',
  });
}

/**
 * Validates proposed profile changes and requests an OTP challenge if changes exist.
 */
export async function updateAccountProfileApi(payload: {
  name?: string;
  email?: string | null;
  }
): Promise<InitiateProfileUpdateResponse> {
  return apiRequest<InitiateProfileUpdateResponse>('/account', {
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
  return apiRequest<VerifyProfileUpdateResponse>('/account/verify-update', {
    method: 'POST',
    body: payload,
  });
}

export interface UploadAvatarResponse {
  message: string;
  avatarUrl: string;
  user: User;
}

export interface DeleteAvatarResponse {
  message: string;
  user: User;
}

/**
 * Uploads a profile avatar picture using base64 payload.
 */
export async function uploadAvatarApi(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<UploadAvatarResponse> {
  return apiRequest<UploadAvatarResponse>('/account/avatar', {
    method: 'POST',
    body: {
      imageBase64,
      mimeType,
    },
  });
}

/**
 * Removes the authenticated user's profile avatar picture.
 */
export async function deleteAvatarApi(): Promise<DeleteAvatarResponse> {
  return apiRequest<DeleteAvatarResponse>('/account/avatar', {
    method: 'DELETE',
  });
}
