// Purpose: Express controller for registered user discovery endpoint.
// Imported by: src/modules/users/users.routes.ts

import { Request, Response } from 'express';
import { searchRegisteredUsers } from './users.service.js';

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
