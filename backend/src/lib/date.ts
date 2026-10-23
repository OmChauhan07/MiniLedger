// Purpose: Date utility helpers for standard date-only (YYYY-MM-DD) parsing and overdue evaluation.
// Imported by: src/modules/loans/loan.schema.ts, src/modules/loans/loan.service.ts, src/modules/summary/summary.service.ts

// Formats a Date object or string into a standardized YYYY-MM-DD date-only string
export function formatDateOnly(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Parses a YYYY-MM-DD string into a normalized UTC Date object at midnight
export function parseDateOnly(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

// Determines if an unpaid loan is overdue by comparing due date against current UTC calendar date
export function isOverdue(dueDate: Date | string, isRepaid: boolean, referenceDate: Date = new Date()): boolean {
  if (isRepaid) {
    return false;
  }
  const dueStr = formatDateOnly(dueDate);
  const todayStr = formatDateOnly(referenceDate);
  return dueStr < todayStr;
}
