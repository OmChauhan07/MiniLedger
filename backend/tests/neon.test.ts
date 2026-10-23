// Purpose: End-to-end integration tests verifying wired Neon Lakebase Postgres and Neon Object Storage services.
// Imported by: vitest test runner (no source importers)

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import {
  uploadObject,
  downloadObject,
  listBucketObjects,
  deleteBucketObject,
  testStorageConnection,
} from '../src/lib/storage.js';

describe('Neon Services Integration Tests', () => {
  const testKey = `test-artifacts/smoke-${Date.now()}.txt`;
  const testPayload = 'Hello from Neon Object Storage in MiniLedger!';

  beforeAll(async () => {
    // Ensure DB connection is warm
    await prisma.$connect();
  });

  afterAll(async () => {
    // Clean up test file if it was uploaded
    try {
      await deleteBucketObject(testKey);
    } catch {
      // Ignore cleanup error if file was already deleted
    }
    await prisma.$disconnect();
  });

  it('verifies GET /api/health/services returns healthy status for Postgres and Object Storage', async () => {
    const response = await request(app).get('/api/health/services');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.services.postgres.connected).toBe(true);
    expect(response.body.services.objectStorage.connected).toBe(true);
    expect(response.body.services.objectStorage.bucket).toBe('assets');
  });

  it('performs end-to-end upload, download, list, and delete on Neon Object Storage', async () => {
    // 1. Upload
    await uploadObject(testKey, testPayload, 'text/plain');

    // 2. List
    const objectList = await listBucketObjects('test-artifacts/');
    expect(objectList).toContain(testKey);

    // 3. Download & verify payload integrity
    const downloadedBuffer = await downloadObject(testKey);
    expect(downloadedBuffer.toString('utf-8')).toBe(testPayload);

    // 4. Delete
    await deleteBucketObject(testKey);

    // 5. Verify object removed
    const listAfterDelete = await listBucketObjects('test-artifacts/');
    expect(listAfterDelete).not.toContain(testKey);
  });

  it('verifies Lakebase Postgres queries execute successfully against live Neon database', async () => {
    const result = await prisma.$queryRaw<Array<{ value: number }>>`SELECT 42 as value`;
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe(42);
  });
});
