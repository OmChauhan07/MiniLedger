// Purpose: Express controller for account profile retrieval, update initiation, and OTP verification.
// Imported by: src/modules/account/account.routes.ts

import { Request, Response } from 'express';
import { z } from 'zod';
import {
  getAccountProfile,
  initiateProfileUpdate,
  verifyAndApplyProfileUpdate,
  uploadUserAvatar,
  deleteUserAvatar,
  getUserAvatarFile,
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

/**
 * POST /api/account/avatar — Upload and set profile avatar picture.
 * Accepts raw binary image (image/jpeg, image/png, image/webp) or JSON with imageBase64.
 */
export async function uploadAvatarHandler(req: Request, res: Response) {
  const user = req.user;
  if (!user) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
    });
  }

  let buffer: Buffer | null = null;
  let mimeType = (req.headers['content-type'] || '').toLowerCase();

  if (Buffer.isBuffer(req.body)) {
    buffer = req.body;
  } else if (req.body && typeof req.body === 'object') {
    if (typeof req.body.imageBase64 === 'string' && req.body.imageBase64.trim().length > 0) {
      const cleanBase64 = req.body.imageBase64.replace(/^data:[^;]+;base64,/, '');
      buffer = Buffer.from(cleanBase64, 'base64');
      if (typeof req.body.mimeType === 'string') {
        mimeType = req.body.mimeType.toLowerCase();
      }
    }
  }

  if (!buffer || buffer.length === 0) {
    return res.status(400).json({
      error: {
        code: 'MISSING_IMAGE_PAYLOAD',
        message: 'No image data provided. Send raw image binary or JSON with imageBase64.',
      },
    });
  }

  // Enforce size limit (5MB)
  const MAX_BYTES = 5 * 1024 * 1024;
  if (buffer.length > MAX_BYTES) {
    return res.status(400).json({
      error: {
        code: 'FILE_TOO_LARGE',
        message: 'Image file size exceeds the 5MB limit.',
      },
    });
  }

  const result = await uploadUserAvatar(user.id, buffer, mimeType);
  if (!result.success) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.status(result.status).json(result.data);
}

/**
 * DELETE /api/account/avatar — Remove profile picture and revert to default avatar.
 */
export async function deleteAvatarHandler(req: Request, res: Response) {
  const user = req.user;
  if (!user) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
    });
  }

  const result = await deleteUserAvatar(user.id);
  if (!result.success) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.status(result.status).json(result.data);
}

/**
 * GET /api/account/avatar — Direct streaming delivery of user's own avatar.
 */
export async function getOwnAvatarHandler(req: Request, res: Response) {
  const user = req.user;
  if (!user) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
    });
  }

  const result = await getUserAvatarFile(user.id);
  if (!result) {
    return res.status(404).json({
      error: { code: 'AVATAR_NOT_FOUND', message: 'No avatar found for this account.' },
    });
  }

  res.setHeader('Content-Type', result.contentType);
  res.setHeader('Cache-Control', 'private, max-age=3600');
  return res.status(200).send(result.buffer);
}

/**
 * GET /api/users/:id/avatar — Direct streaming delivery of any user's avatar.
 */
export async function getUserAvatarHandler(req: Request, res: Response) {
  const user = req.user;
  if (!user) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
    });
  }

  const targetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!targetId) {
    return res.status(400).json({
      error: { code: 'INVALID_USER_ID', message: 'Target user ID is required.' },
    });
  }

  const result = await getUserAvatarFile(targetId);
  if (!result) {
    return res.status(404).json({
      error: { code: 'AVATAR_NOT_FOUND', message: 'No avatar found for this user.' },
    });
  }

  res.setHeader('Content-Type', result.contentType);
  res.setHeader('Cache-Control', 'private, max-age=3600');
  return res.status(200).send(result.buffer);
}
