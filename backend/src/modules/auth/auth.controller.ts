// Purpose: Express HTTP controllers handling registration, login, legacy setup, and OTP verification requests.
// Imported by: src/modules/auth/auth.routes.ts

import { Request, Response } from 'express';
import {
  sendOtpSchema,
  verifyOtpSchema,
  registerSendOtpSchema,
  registerVerifyOtpSchema,
  registerCompleteSchema,
  loginSchema,
  legacySetupSendOtpSchema,
  legacySetupVerifySchema,
} from './auth.schema.js';
import {
  sendOtpChallenge,
  verifyOtpChallenge,
  sendRegisterOtp,
  verifyRegisterOtp,
  completeRegistration,
  loginWithPassword,
  sendLegacySetupOtp,
  verifyAndSetLegacyPassword,
} from './auth.service.js';

// Handles POST /api/auth/send-otp (legacy / backward-compatible)
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

// Handles POST /api/auth/verify-otp (legacy / backward-compatible)
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

// Handles POST /api/auth/register/send-otp
export async function registerSendOtpHandler(req: Request, res: Response) {
  const parseResult = registerSendOtpSchema.safeParse(req.body);

  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message || 'Invalid phone number format.';
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: firstError,
      },
    });
  }

  const result = await sendRegisterOtp(parseResult.data.phone);
  return res.status(result.status).json(result.data);
}

// Handles POST /api/auth/register/verify-otp
export async function registerVerifyOtpHandler(req: Request, res: Response) {
  const parseResult = registerVerifyOtpSchema.safeParse(req.body);

  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message || 'Invalid verification payload.';
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: firstError,
      },
    });
  }

  const result = await verifyRegisterOtp(parseResult.data.phone, parseResult.data.otp);

  if (!result.success) {
    return res.status(result.status).json({
      error: result.error,
    });
  }

  return res.status(result.status).json(result.data);
}

// Handles POST /api/auth/register/complete
export async function registerCompleteHandler(req: Request, res: Response) {
  const parseResult = registerCompleteSchema.safeParse(req.body);

  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message || 'Invalid registration details.';
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: firstError,
      },
    });
  }

  const result = await completeRegistration(parseResult.data);

  if (!result.success) {
    return res.status(result.status).json({
      error: result.error,
    });
  }

  return res.status(result.status).json(result.data);
}

// Handles POST /api/auth/login
export async function loginHandler(req: Request, res: Response) {
  const parseResult = loginSchema.safeParse(req.body);

  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message || 'Invalid login credentials.';
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: firstError,
      },
    });
  }

  const result = await loginWithPassword(parseResult.data.phone, parseResult.data.password);

  if (!result.success) {
    return res.status(result.status).json({
      error: result.error,
    });
  }

  return res.status(result.status).json(result.data);
}

// Handles POST /api/auth/legacy-setup/send-otp
export async function legacySetupSendOtpHandler(req: Request, res: Response) {
  const parseResult = legacySetupSendOtpSchema.safeParse(req.body);

  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message || 'Invalid phone number.';
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: firstError,
      },
    });
  }

  const result = await sendLegacySetupOtp(parseResult.data.phone);

  if (!result.success) {
    return res.status(result.status).json({
      error: result.error,
    });
  }

  return res.status(result.status).json(result.data);
}

// Handles POST /api/auth/legacy-setup/verify-and-set-password
export async function legacySetupVerifyHandler(req: Request, res: Response) {
  const parseResult = legacySetupVerifySchema.safeParse(req.body);

  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message || 'Invalid password setup payload.';
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: firstError,
      },
    });
  }

  const result = await verifyAndSetLegacyPassword(parseResult.data);

  if (!result.success) {
    return res.status(result.status).json({
      error: result.error,
    });
  }

  return res.status(result.status).json(result.data);
}
