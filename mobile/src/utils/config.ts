// Purpose: Central configuration for API endpoint base URL supporting physical Android devices and emulators.
// Imported by: src/api/client.ts, src/features/dashboard/DashboardScreen.tsx

import { Platform } from 'react-native';

// Default host machine LAN IP for physical device Wi-Fi connectivity
const DEFAULT_LAN_HOST = '10.246.135.16';
const DEFAULT_PORT = '4000';

// In-memory override in case user adjusts server address at runtime
let customApiBaseUrl: string | null = null;

// Returns the active API base URL based on device platform and runtime configuration
export function getApiBaseUrl(): string {
  if (customApiBaseUrl) {
    return customApiBaseUrl;
  }

  // Android emulator uses 10.0.2.2 to reach host localhost; physical device uses host LAN IP
  if (Platform.OS === 'android') {
    return `http://${DEFAULT_LAN_HOST}:${DEFAULT_PORT}/api`;
  }

  return `http://localhost:${DEFAULT_PORT}/api`;
}

// Allows setting a custom API base URL dynamically for flexible testing
export function setCustomApiBaseUrl(url: string | null): void {
  customApiBaseUrl = url;
}
