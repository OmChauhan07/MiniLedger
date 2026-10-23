// Purpose: Configures Express routing for authentication endpoints (/send-otp and /verify-otp).
// Imported by: src/app.ts

import { Router } from 'express';
import { sendOtpHandler, verifyOtpHandler } from './auth.controller.js';

export const authRouter = Router();

// Route for creating a mock OTP challenge for a phone number
authRouter.post('/send-otp', sendOtpHandler);

// Route for verifying an OTP and obtaining an authenticated JWT
authRouter.post('/verify-otp', verifyOtpHandler);
