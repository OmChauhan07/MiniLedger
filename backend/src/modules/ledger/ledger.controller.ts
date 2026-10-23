// Purpose: Express controller for PDF ledger exports supporting both binary streaming and JSON base64.
// Imported by: src/modules/ledger/ledger.routes.ts

import { Request, Response } from 'express';
import { z } from 'zod';
import { generateLedgerPdf } from './ledger-export.service.js';

const exportPdfSchema = z.object({
  direction: z.enum(['ALL', 'LENT', 'BORROWED']).optional(),
  status: z.enum(['ALL', 'OUTSTANDING', 'OVERDUE', 'REPAID']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  counterpartyId: z.string().optional(),
  format: z.enum(['base64', 'binary']).optional(),
});

/**
 * POST /api/ledger/export/pdf — Generates and downloads an authoritative personal loan ledger PDF.
 */
export async function exportLedgerPdfHandler(req: Request, res: Response) {
  const parsed = exportPdfSchema.safeParse(req.body);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: firstIssue.message,
      },
    });
  }

  const user = req.user;
  if (!user) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
    });
  }

  const { direction, status, startDate, endDate, counterpartyId, format } = parsed.data;

  try {
    const result = await generateLedgerPdf(user.id, {
      direction,
      status,
      startDate,
      endDate,
      counterpartyId,
    });

    const isBase64Requested =
      format === 'base64' ||
      req.headers.accept?.includes('application/json');

    if (isBase64Requested) {
      return res.status(200).json({
        success: true,
        filename: result.filename,
        base64: result.pdfBuffer.toString('base64'),
        recordCount: result.recordCount,
        summary: result.summary,
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    return res.status(200).send(result.pdfBuffer);
  } catch (err: any) {
    console.error('Failed to generate ledger PDF:', err);
    return res.status(500).json({
      error: {
        code: 'PDF_GENERATION_FAILED',
        message: 'Could not generate ledger statement PDF. Please try again.',
      },
    });
  }
}
