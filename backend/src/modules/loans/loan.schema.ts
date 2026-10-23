// Purpose: Zod validation schemas for loan creation and loan route parameter inputs.
// Imported by: src/modules/loans/loan.controller.ts

import { z } from 'zod';

// Schema validating input for creating a new loan entry
export const createLoanSchema = z.object({
  friendName: z
    .string({ required_error: 'Friend name is required.' })
    .trim()
    .min(1, 'Friend name cannot be empty.')
    .max(100, 'Friend name must be 100 characters or fewer.'),
  amount: z
    .union([z.string(), z.number()])
    .transform((val) => String(val).trim())
    .refine((val) => /^\d+(\.\d{1,2})?$/.test(val), {
      message: 'Amount must be a positive number with at most two decimal places.',
    })
    .refine((val) => parseFloat(val) > 0, {
      message: 'Amount must be greater than zero.',
    }),
  dueDate: z
    .string({ required_error: 'Due date is required.' })
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Due date must be formatted as YYYY-MM-DD.' })
    .refine((val) => {
      const parsed = new Date(val);
      return !isNaN(parsed.getTime());
    }, {
      message: 'Due date must be a valid calendar date.',
    }),
});

// Schema validating the loan ID path parameter
export const loanIdParamSchema = z.object({
  id: z.string().trim().min(1, 'Loan ID is required.'),
});

export type CreateLoanInput = z.infer<typeof createLoanSchema>;
