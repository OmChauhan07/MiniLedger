// Purpose: Defines Express routing for registered user search and mutual relationship endpoints.
// Imported by: src/app.ts

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { searchUsersHandler, getCounterpartyRelationshipHandler } from './users.controller.js';

export const usersRouter = Router();

// GET /api/users/search?q=... (protected by requireAuth)
usersRouter.get('/search', requireAuth, searchUsersHandler);

// GET /api/users/:counterpartyId/relationship (protected by requireAuth)
usersRouter.get('/:counterpartyId/relationship', requireAuth, getCounterpartyRelationshipHandler);
