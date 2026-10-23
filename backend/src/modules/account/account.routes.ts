// Purpose: Configures Express routing for account profile retrieval and OTP-verified updates.
// Imported by: src/app.ts

import express, { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import {
  getProfileHandler,
  updateProfileHandler,
  verifyUpdateHandler,
  uploadAvatarHandler,
  deleteAvatarHandler,
  getOwnAvatarHandler,
} from './account.controller.js';

export const accountRouter = Router();

// Retrieve current authenticated user profile
accountRouter.get('/', requireAuth, getProfileHandler);

// Initiate profile update challenge
accountRouter.patch('/', requireAuth, updateProfileHandler);

// Verify OTP and commit profile changes
accountRouter.post('/verify-update', requireAuth, verifyUpdateHandler);

// Upload profile avatar picture (supports binary buffer or JSON base64)
accountRouter.post(
  '/avatar',
  requireAuth,
  express.raw({ type: ['image/*', 'application/octet-stream'], limit: '5mb' }),
  uploadAvatarHandler
);

// Delete profile avatar picture
accountRouter.delete('/avatar', requireAuth, deleteAvatarHandler);

// Get authenticated user's own avatar directly from storage
accountRouter.get('/avatar', requireAuth, getOwnAvatarHandler);
