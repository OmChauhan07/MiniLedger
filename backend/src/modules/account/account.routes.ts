// Purpose: Configures Express routing for account profile retrieval and OTP-verified updates.
// Imported by: src/app.ts

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import {
  getProfileHandler,
  updateProfileHandler,
  verifyUpdateHandler,
} from './account.controller.js';

export const accountRouter = Router();

// Retrieve current authenticated user profile
accountRouter.get('/', requireAuth, getProfileHandler);

// Initiate profile update challenge
accountRouter.patch('/', requireAuth, updateProfileHandler);

// Verify OTP and commit profile changes
accountRouter.post('/verify-update', requireAuth, verifyUpdateHandler);
