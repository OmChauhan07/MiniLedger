// Purpose: Defines the health check HTTP routes to verify API availability and Neon services connectivity.
// Imported by: src/app.ts

import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { testStorageConnection } from '../lib/storage.js';

export const healthRouter = Router();

// Handles GET /api/health requests and returns standard service health status
healthRouter.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'MiniLedger API',
  });
});

// Handles GET /api/health/services to verify connectivity to Neon Lakebase Postgres and Object Storage
healthRouter.get('/health/services', async (_req: Request, res: Response) => {
  try {
    // 1. Verify Lakebase Postgres connection
    await prisma.$queryRaw`SELECT 1`;

    // 2. Verify Neon Object Storage bucket connection
    const storageResult = await testStorageConnection();

    res.status(200).json({
      status: 'ok',
      service: 'MiniLedger API',
      services: {
        postgres: { connected: true, driver: 'prisma-postgresql' },
        objectStorage: {
          connected: storageResult.ok,
          bucket: storageResult.bucket,
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    });
  }
});
