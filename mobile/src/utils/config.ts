// Purpose: Central configuration for API endpoint base URL supporting production HTTPS, emulators, and local development.
// Imported by: src/api/client.ts, src/features/dashboard/DashboardScreen.tsx

import { Platform } from 'react-native';

const DEFAULT_PORT = '4000';

// In-memory override in case user adjusts server address at runtime during testing
let customApiBaseUrl: string | null = null;

/**
 * Checks whether the app is executing in a production environment.
 */
export function isProductionEnvironment(): boolean {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL || '';
  const isLocalLan =
    configuredUrl.includes('localhost') ||
    configuredUrl.includes('127.0.0.1') ||
    configuredUrl.includes('10.0.2.2') ||
    configuredUrl.startsWith('http://192.168.') ||
    configuredUrl.startsWith('http://10.') ||
    configuredUrl.startsWith('http://172.');
  if (isLocalLan) {
    return false;
  }
  return !__DEV__ || process.env.NODE_ENV === 'production';
}

/**
 * Normalizes an API URL string to guarantee a clean base URL ending with /api.
 */
function normalizeApiUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

/**
 * Returns the active API base URL based on runtime environment and platform.
 * Enforces HTTPS in production builds and eliminates hardcoded local LAN IPs.
 */
export function getApiBaseUrl(): string {
  if (customApiBaseUrl) {
    return normalizeApiUrl(customApiBaseUrl);
  }

  const configuredUrl = process.env.EXPO_PUBLIC_API_URL;
  const isProd = isProductionEnvironment();

  if (isProd) {
    if (!configuredUrl) {
      throw new Error(
        'MiniLedger Production Configuration Error: EXPO_PUBLIC_API_URL is not set. A secure HTTPS production API URL is required.'
      );
    }

    if (!configuredUrl.startsWith('https://')) {
      throw new Error(
        `MiniLedger Security Violation: Production API must use HTTPS protocol. Insecure URL provided: ${configuredUrl}`
      );
    }

    return normalizeApiUrl(configuredUrl);
  }

  // Development environment: use explicitly configured environment URL if available
  if (configuredUrl) {
    return normalizeApiUrl(configuredUrl);
  }

  // Optional custom developer LAN host for testing on physical devices over local Wi-Fi
  const devHost = process.env.EXPO_PUBLIC_DEV_HOST;
  if (devHost) {
    return `http://${devHost}:${DEFAULT_PORT}/api`;
  }

  // Android emulator uses 10.0.2.2 to reach host machine localhost; iOS and Web use localhost
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${DEFAULT_PORT}/api`;
  }

  return `http://localhost:${DEFAULT_PORT}/api`;
}

/**
 * Allows setting a custom API base URL dynamically for flexible testing.
 */
export function setCustomApiBaseUrl(url: string | null): void {
  customApiBaseUrl = url;
}

