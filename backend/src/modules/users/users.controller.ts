// Purpose: Express controller for registered user discovery and mutual relationship endpoints.
// Imported by: src/modules/users/users.routes.ts

import { Request, Response } from 'express';
import { searchRegisteredUsers, getCounterpartyRelationship } from './users.service.js';

// Handles GET /api/users/search?q=...&limit=10
export async function searchUsersHandler(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required to search registered users.',
      },
    });
  }

  const query = typeof req.query.q === 'string' ? req.query.q : '';
  const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 10;

  if (query.trim().length < 2) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Search query must contain at least 2 characters.',
      },
    });
  }

  const results = await searchRegisteredUsers(userId, query, limit);
  return res.status(200).json({ data: results });
}

// Handles GET /api/users/:counterpartyId/relationship
export async function getCounterpartyRelationshipHandler(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required to view counterparty relationship.',
      },
    });
  }

  const { counterpartyId } = req.params;
  if (!counterpartyId || typeof counterpartyId !== 'string') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Valid counterparty ID is required.',
      },
    });
  }

  const result = await getCounterpartyRelationship(userId, counterpartyId);
  if (!result.success) {
    return res.status(result.status).json({
      error: result.error,
    });
  }

  return res.status(200).json(result.data);
}
