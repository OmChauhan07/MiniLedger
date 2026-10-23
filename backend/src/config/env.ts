// Purpose: Validates environment variables using Zod to ensure runtime type-safety and safe fallbacks.
// Imported by: src/index.ts, src/app.ts, src/lib/prisma.ts, src/lib/storage.ts, src/modules/auth/auth.service.ts, src/middleware/auth.middleware.ts

import path from 'path';
import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env and .env.local (both local and root)
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Define schema for runtime environment variables
const envSchema = z.object({
  PORT: z
    .string()
    .default('4000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  // Neon Lakebase Postgres connection strings
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required'),
  DATABASE_URL_UNPOOLED: z
    .string()
    .optional(),
  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET must be at least 16 characters long')
    .default('miniledger-super-secure-jwt-secret-key-32-chars-min'),
  JWT_EXPIRES_IN: z
    .string()
    .default('7d'),
  // Neon Object Storage configuration (S3-compatible)
  AWS_ACCESS_KEY_ID: z
    .string()
    .optional(),
  AWS_SECRET_ACCESS_KEY: z
    .string()
    .optional(),
  AWS_ENDPOINT_URL_S3: z
    .string()
    .optional(),
  AWS_REGION: z
    .string()
    .default('us-east-1'),
  NEON_STORAGE_BUCKET: z
    .string()
    .default('assets'),
});

// Parse and validate the environment configuration safely
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment configuration:', parsedEnv.error.format());
  process.exit(1);
}

// Export the typed and validated environment configuration object
export const config = parsedEnv.data;
