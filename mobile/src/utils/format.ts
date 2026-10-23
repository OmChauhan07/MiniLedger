// Purpose: Formatting helpers for Indian Rupee currency display, dates, and overdue status checks.
// Imported by: src/components/LoanCard.tsx, src/components/SummaryCards.tsx

// Formats a monetary string or number into standard INR currency string (e.g., "₹1,200.00")
export function formatCurrency(amount: string | number): string {
  const numericVal = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numericVal)) {
    return '₹0.00';
  }

  // Format with standard Indian grouping or fixed two-decimal display
  const parts = numericVal.toFixed(2).split('.');
  const intPart = parts[0];
  const decPart = parts[1];

  // Apply Indian grouping regex: last 3 digits, then groups of 2 digits
  const lastThree = intPart.substring(intPart.length - 3);
  const otherNumbers = intPart.substring(0, intPart.length - 3);
  const formattedInt = otherNumbers !== ''
    ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
    : lastThree;

  return `₹${formattedInt}.${decPart}`;
}

// Formats a YYYY-MM-DD date string to a clean user-facing format (e.g., "30 Oct 2026")
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr || !dateStr.includes('-')) {
    return dateStr;
  }
  const [year, month, day] = dateStr.split('-');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIdx = parseInt(month, 10) - 1;
  const monthLabel = monthNames[monthIdx] || month;
  return `${parseInt(day, 10)} ${monthLabel} ${year}`;
}

// Determines whether an unpaid loan is past its due date based on current calendar date
export function checkIsOverdue(dueDateStr: string, isRepaid: boolean): boolean {
  if (isRepaid) {
    return false;
  }
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  return dueDateStr < todayStr;
}
