// Purpose: Configures Express routing for all authentication and account setup endpoints.
// Imported by: src/app.ts

import { Router } from 'express';
import {
  sendOtpHandler,
  verifyOtpHandler,
  registerSendOtpHandler,
  registerVerifyOtpHandler,
  registerCompleteHandler,
  loginHandler,
  legacySetupSendOtpHandler,
  legacySetupVerifyHandler,
} from './auth.controller.js';

export const authRouter = Router();

// Legacy / Backward-compatible OTP endpoints
authRouter.post('/send-otp', sendOtpHandler);
authRouter.post('/verify-otp', verifyOtpHandler);

// New User Signup Flow
authRouter.post('/register/send-otp', registerSendOtpHandler);
authRouter.post('/register/verify-otp', registerVerifyOtpHandler);
authRouter.post('/register/complete', registerCompleteHandler);

// Existing User Password Login
authRouter.post('/login', loginHandler);

// Legacy Account Password Setup Flow
authRouter.post('/legacy-setup/send-otp', legacySetupSendOtpHandler);
authRouter.post('/legacy-setup/verify-and-set-password', legacySetupVerifyHandler);
