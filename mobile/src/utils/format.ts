// Purpose: Formatting helpers for Indian Rupee currency display, dates, overdue status checks, and avatar initials.
// Imported by: src/components/LoanCard.tsx, src/components/SummaryCards.tsx, src/features/*

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

// Formats a monetary string or number into clean concise INR display without decimals if integer (e.g., "₹5,000")
export function formatCurrencyCompact(amount: string | number): string {
  const numericVal = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numericVal)) {
    return '₹0';
  }

  const isInt = Number.isInteger(numericVal);
  if (!isInt) {
    return formatCurrency(numericVal);
  }

  const intPart = Math.floor(numericVal).toString();
  const lastThree = intPart.substring(intPart.length - 3);
  const otherNumbers = intPart.substring(0, intPart.length - 3);
  const formattedInt = otherNumbers !== ''
    ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
    : lastThree;

  return `₹${formattedInt}`;
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

// Computes overdue or pending relative time badge label (e.g., "Overdue 14d", "Due Today", "32d left")
export function getRelativeDueLabel(dueDateStr: string, isRepaid: boolean): { text: string; isOverdue: boolean } {
  if (isRepaid) {
    return { text: 'Repaid', isOverdue: false };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parts = dueDateStr.split('-');
  if (parts.length !== 3) {
    return { text: dueDateStr, isOverdue: false };
  }

  const targetDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  targetDate.setHours(0, 0, 0, 0);

  const diffMs = targetDate.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { text: 'Due Today', isOverdue: false };
  } else if (diffDays === -1) {
    return { text: 'Overdue 1d', isOverdue: true };
  } else if (diffDays < -1) {
    return { text: `Overdue ${Math.abs(diffDays)}d`, isOverdue: true };
  } else if (diffDays === 1) {
    return { text: 'Due Tomorrow', isOverdue: false };
  } else {
    return { text: `Pending (${diffDays}d)`, isOverdue: false };
  }
}

// Formats a 10-digit phone number with masking for OTP verification screen (e.g., "+91 98765 •••10")
export function maskPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) {
    return phone;
  }
  const last10 = digits.slice(-10);
  const firstPart = last10.slice(0, 5);
  const last2 = last10.slice(-2);
  return `+91 ${firstPart} •••${last2}`;
}

// Generates 2-letter uppercase initials from a contact or friend name
export function getInitials(name: string): string {
  if (!name || !name.trim()) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
