// Purpose: Validates environment variables using Zod to ensure runtime type-safety and safe fallbacks.
// Imported by: src/index.ts, src/app.ts, src/lib/prisma.ts, src/modules/auth/auth.service.ts, src/middleware/auth.middleware.ts

import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file into process.env
dotenv.config();

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
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET must be at least 16 characters long')
    .default('miniledger-super-secure-jwt-secret-key-32-chars-min'),
  JWT_EXPIRES_IN: z
    .string()
    .default('7d'),
});

// Parse and validate the environment configuration safely
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment configuration:', parsedEnv.error.format());
  process.exit(1);
}

// Export the typed and validated environment configuration object
export const config = parsedEnv.data;
