// Purpose: Integration test verifying the health check endpoint returns 200 OK and expected status JSON.
// Imported by: none (test file executed by test runner)

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('GET /api/health and GET /health', () => {
  // Test that health endpoint returns 200 OK with correct status payload
  it('should return 200 and health status payload on /api/health', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      service: 'MiniLedger API',
    });
  });

  // Test that root /health endpoint returns 200 OK for Render and platform checkers
  it('should return 200 and health status payload on root /health', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      service: 'MiniLedger API',
    });
  });

  // Test that unmapped endpoints return 404 with standardized error response
  it('should return 404 for unmapped endpoints', async () => {
    const response = await request(app).get('/api/unknown-endpoint');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource was not found.',
      },
    });
  });
});
