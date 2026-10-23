// Purpose: Express controller for account profile retrieval, update initiation, and OTP verification.
// Imported by: src/modules/account/account.routes.ts

import { Request, Response } from 'express';
import { z } from 'zod';
import {
  getAccountProfile,
  initiateProfileUpdate,
  verifyAndApplyProfileUpdate,
} from './account.service.js';

const updateProfileSchema = z.object({
  name: z.string().max(80, 'Name must not exceed 80 characters').optional(),
  email: z
    .string()
    .email('Invalid email address format')
    .nullable()
    .optional()
    .or(z.literal('')),
});

const verifyUpdateSchema = z.object({
  updateToken: z.string({ required_error: 'updateToken is required' }).min(1),
  otp: z
    .string({ required_error: 'OTP is required' })
    .regex(/^\d{6}$/, 'OTP must be exactly 6 digits'),
});

/**
 * GET /api/account — Retrieve the authenticated user's profile.
 */
export async function getProfileHandler(req: Request, res: Response) {
  const user = req.user;
  if (!user) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
    });
  }

  const result = await getAccountProfile(user.id);
  if (!result.success) {
    return res.status(result.status).json({ error: result.error });
  }
  return res.status(result.status).json(result.data);
}

/**
 * PATCH /api/account — Validate proposed changes and dispatch an OTP challenge.
 */
export async function updateProfileHandler(req: Request, res: Response) {
  const user = req.user;
  if (!user) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
    });
  }

  const parsed = updateProfileSchema.safeParse(req.body);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: firstIssue.message,
      },
    });
  }

  const { name, email } = parsed.data;

  const result = await initiateProfileUpdate(user.id, user.phone, {
    name: name !== undefined ? name : undefined,
    email: email !== undefined ? (email === '' ? null : email) : undefined,
  });

  if (!result.success) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.status(result.status).json(result.data);
}

/**
 * POST /api/account/verify-update — Verify submitted OTP and commit profile updates.
 */
export async function verifyUpdateHandler(req: Request, res: Response) {
  const user = req.user;
  if (!user) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
    });
  }

  const parsed = verifyUpdateSchema.safeParse(req.body);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: firstIssue.message,
      },
    });
  }

  const { updateToken, otp } = parsed.data;

  const result = await verifyAndApplyProfileUpdate(
    user.id,
    user.phone,
    updateToken,
    otp
  );

  if (!result.success) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.status(result.status).json(result.data);
}
