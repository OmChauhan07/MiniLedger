// Purpose: Express middleware verifying JWT Bearer token and attaching authenticated user identity to the request.
// Imported by: src/app.ts, src/modules/loans/loan.routes.ts, src/modules/summary/summary.routes.ts, tests/auth.test.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

interface JwtPayload {
  userId: string;
  phone: string;
}

// Authenticates incoming HTTP requests via Authorization Bearer token header
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Missing Bearer token.',
      },
    });
  }

  const token = authHeader.slice(7).trim();

  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as JwtPayload;

    if (!payload.userId || !payload.phone) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Malformed token payload.',
        },
      });
    }

    // Attach authenticated user identity to request object
    req.user = {
      id: payload.userId,
      phone: payload.phone,
    };

    return next();
  } catch (err) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired authentication token.',
      },
    });
  }
}
