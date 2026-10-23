// Purpose: Central HTTP fetch client managing request headers, Bearer authentication token, and error normalization.
// Imported by: src/api/auth.api.ts, src/api/loan.api.ts, src/api/summary.api.ts

import { getApiBaseUrl } from '../utils/config';
import { getStoredToken } from '../utils/storage';
import { ApiError } from '../types/index';

export class AppApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = 'AppApiError';
  }
}

// Executes an HTTP request against the configured backend with optional authentication
export async function apiRequest<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: unknown;
    requiresAuth?: boolean;
  } = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (options.requiresAuth !== false) {
    const token = await getStoredToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch (netErr: any) {
    throw new AppApiError(
      'NETWORK_ERROR',
      `Cannot connect to API server at ${baseUrl}. Ensure backend is running and phone is on the same network.`,
      0
    );
  }

  let data: any = null;
  const text = await response.text();
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  if (!response.ok) {
    const errorPayload: ApiError = data.error || {
      code: 'HTTP_ERROR',
      message: data.message || `Request failed with status ${response.status}`,
    };
    throw new AppApiError(errorPayload.code, errorPayload.message, response.status);
  }

  return data as T;
}
