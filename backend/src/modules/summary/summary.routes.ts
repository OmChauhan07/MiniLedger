// Purpose: Configures Express routing for summary aggregates with mandatory JWT authentication.
// Imported by: src/app.ts

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { getSummaryHandler } from './summary.controller.js';

export const summaryRouter = Router();

// Protect all summary routes with JWT authentication middleware
summaryRouter.use(requireAuth);

// Route for retrieving financial lending aggregates
summaryRouter.get('/', getSummaryHandler);
