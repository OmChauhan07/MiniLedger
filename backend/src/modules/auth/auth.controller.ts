// Purpose: Express HTTP controllers handling send-otp and verify-otp requests.
// Imported by: src/modules/auth/auth.routes.ts

import { Request, Response } from 'express';
import { sendOtpSchema, verifyOtpSchema } from './auth.schema.js';
import { sendOtpChallenge, verifyOtpChallenge } from './auth.service.js';

// Handles POST /api/auth/send-otp
export async function sendOtpHandler(req: Request, res: Response) {
  const parseResult = sendOtpSchema.safeParse(req.body);

  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message || 'Invalid phone number format.';
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: firstError,
      },
    });
  }

  const result = await sendOtpChallenge(parseResult.data.phone);
  return res.status(200).json(result);
}

// Handles POST /api/auth/verify-otp
export async function verifyOtpHandler(req: Request, res: Response) {
  const parseResult = verifyOtpSchema.safeParse(req.body);

  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message || 'Invalid verification payload.';
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: firstError,
      },
    });
  }

  const result = await verifyOtpChallenge(parseResult.data.phone, parseResult.data.otp);

  if (!result.success) {
    return res.status(result.status).json({
      error: result.error,
    });
  }

  return res.status(200).json(result.data);
}
