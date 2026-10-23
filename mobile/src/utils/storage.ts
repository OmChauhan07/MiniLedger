// Purpose: Secure storage utility for persisting the JWT authentication token using Expo SecureStore.
// Imported by: src/api/client.ts, App.tsx

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'miniledger_jwt_token';

// In-memory token fallback for non-native environments
let memoryToken: string | null = null;

// Retrieves the stored JWT authentication token
export async function getStoredToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return memoryToken;
  }
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (err) {
    console.warn('Failed to read token from SecureStore, using memory fallback:', err);
    return memoryToken;
  }
}

// Persists the JWT authentication token securely
export async function setStoredToken(token: string): Promise<void> {
  memoryToken = token;
  if (Platform.OS === 'web') {
    return;
  }
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (err) {
    console.warn('Failed to save token to SecureStore:', err);
  }
}

// Deletes the stored JWT authentication token upon logout
export async function clearStoredToken(): Promise<void> {
  memoryToken = null;
  if (Platform.OS === 'web') {
    return;
  }
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (err) {
    console.warn('Failed to delete token from SecureStore:', err);
  }
}

const USER_KEY = 'miniledger_user_profile';
let memoryUser: string | null = null;

// Retrieves the cached user profile
export async function getStoredUser(): Promise<any | null> {
  if (Platform.OS === 'web') {
    return memoryUser ? JSON.parse(memoryUser) : null;
  }
  try {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return memoryUser ? JSON.parse(memoryUser) : null;
  }
}

// Persists the user profile securely
export async function setStoredUser(user: any): Promise<void> {
  const serialized = JSON.stringify(user);
  memoryUser = serialized;
  if (Platform.OS === 'web') {
    return;
  }
  try {
    await SecureStore.setItemAsync(USER_KEY, serialized);
  } catch (err) {
    console.warn('Failed to save user to SecureStore:', err);
  }
}

// Clears the stored user profile upon logout
export async function clearStoredUser(): Promise<void> {
  memoryUser = null;
  if (Platform.OS === 'web') {
    return;
  }
  try {
    await SecureStore.deleteItemAsync(USER_KEY);
  } catch (err) {
    console.warn('Failed to delete user from SecureStore:', err);
  }
}

