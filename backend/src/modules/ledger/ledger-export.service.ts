// Purpose: Generates authoritative bank-statement styled personal loan ledger PDFs with filters and reconciliation.
// Imported by: src/modules/ledger/ledger.controller.ts, tests/account-and-pdf.test.ts

import { Prisma } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { prisma } from '../../lib/prisma.js';
import { formatLoan } from '../loans/loan.service.js';
import { formatAmount } from '../../lib/money.js';
import { isOverdue, parseDateOnly } from '../../lib/date.js';

export interface LedgerExportOptions {
  direction?: 'ALL' | 'LENT' | 'BORROWED';
  status?: 'ALL' | 'OUTSTANDING' | 'OVERDUE' | 'REPAID';
  startDate?: string;
  endDate?: string;
  counterpartyId?: string;
}

function maskPhoneNumber(phone: string): string {
  if (phone.length >= 10) {
    const visibleStart = phone.slice(0, 5);
    const visibleEnd = phone.slice(-3);
    return `${visibleStart}••• ••${visibleEnd}`;
  }
  return phone;
}

function formatInr(amount: number | string | Prisma.Decimal): string {
  const str =
    amount instanceof Prisma.Decimal
      ? formatAmount(amount)
      : typeof amount === 'number'
      ? amount.toFixed(2)
      : amount;
  const num = parseFloat(str);
  if (isNaN(num)) return '₹0.00';
  return '₹' + num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '-';
  const day = String(date.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

export async function generateLedgerPdf(
  userId: string,
  options: LedgerExportOptions = {}
): Promise<{
  pdfBuffer: Buffer;
  filename: string;
  recordCount: number;
  summary: {
    totalLent: string;
    totalBorrowed: string;
    outstandingLent: string;
    outstandingBorrowed: string;
    overdueReceivable: string;
    overduePayable: string;
    repaidAmount: string;
  };
}> {
  // Fetch requesting user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Retrieve participant-aware authorized loans, supporting bilateral counterparty filtering
  const loanWhere: Prisma.LoanWhereInput = options.counterpartyId
    ? {
        OR: [
          { userId, counterpartyUserId: options.counterpartyId },
          { userId: options.counterpartyId, counterpartyUserId: userId },
        ],
      }
    : {
        OR: [
          { userId },
          { counterpartyUserId: userId },
        ],
      };

  const rawLoans = await prisma.loan.findMany({
    where: loanWhere,
    include: {
      user: { select: { id: true, name: true, phone: true } },
      counterpartyUser: { select: { id: true, name: true, phone: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Invert perspective relative to the requesting user
  const callerLoans = rawLoans.map((l) => formatLoan(l, userId));

  const now = new Date();

  // Normalize date range boundaries to UTC
  let filterStartDate: Date | null = null;
  if (options.startDate) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(options.startDate)) {
      filterStartDate = parseDateOnly(options.startDate);
    } else {
      filterStartDate = new Date(options.startDate);
    }
  }

  let filterEndDate: Date | null = null;
  if (options.endDate) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(options.endDate)) {
      const [y, m, d] = options.endDate.split('-').map(Number);
      filterEndDate = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
    } else {
      filterEndDate = new Date(options.endDate);
      filterEndDate.setUTCHours(23, 59, 59, 999);
    }
  }

  // Filter records
  const filteredLoans = callerLoans.filter((loan) => {
    // Direction filter
    if (options.direction && options.direction !== 'ALL') {
      if (loan.type !== options.direction) return false;
    }

    // Status filter
    const pastDue = isOverdue(loan.dueDate, loan.isRepaid, now);
    if (options.status && options.status !== 'ALL') {
      if (options.status === 'OUTSTANDING' && loan.isRepaid) return false;
      if (options.status === 'REPAID' && !loan.isRepaid) return false;
      if (options.status === 'OVERDUE' && !pastDue) return false;
    }

    // Date range filter (based on createdAt)
    const loanDate = new Date(loan.createdAt);
    if (filterStartDate && loanDate < filterStartDate) return false;
    if (filterEndDate && loanDate > filterEndDate) return false;

    // Counterparty filter (matching from caller's perspective)
    if (options.counterpartyId) {
      if (loan.counterpartyUserId !== options.counterpartyId) return false;
    }

    return true;
  });

  // Calculate summary metrics on included records using decimal-safe arithmetic
  let sumLent = new Prisma.Decimal(0);
  let sumBorrowed = new Prisma.Decimal(0);
  let outLent = new Prisma.Decimal(0);
  let outBorrowed = new Prisma.Decimal(0);
  let odReceivable = new Prisma.Decimal(0);
  let odPayable = new Prisma.Decimal(0);
  let sumRepaid = new Prisma.Decimal(0);

  for (const loan of filteredLoans) {
    const amt = new Prisma.Decimal(loan.amount);
    const pastDue = isOverdue(loan.dueDate, loan.isRepaid, now);

    if (loan.type === 'LENT') {
      sumLent = sumLent.add(amt);
      if (!loan.isRepaid) {
        outLent = outLent.add(amt);
        if (pastDue) odReceivable = odReceivable.add(amt);
      } else {
        sumRepaid = sumRepaid.add(amt);
      }
    } else {
      sumBorrowed = sumBorrowed.add(amt);
      if (!loan.isRepaid) {
        outBorrowed = outBorrowed.add(amt);
        if (pastDue) odPayable = odPayable.add(amt);
      } else {
        sumRepaid = sumRepaid.add(amt);
      }
    }
  }

  const summary = {
    totalLent: formatAmount(sumLent),
    totalBorrowed: formatAmount(sumBorrowed),
    outstandingLent: formatAmount(outLent),
    outstandingBorrowed: formatAmount(outBorrowed),
    overdueReceivable: formatAmount(odReceivable),
    overduePayable: formatAmount(odPayable),
    repaidAmount: formatAmount(sumRepaid),
  };

  const filename = `MiniLedger_Statement_${now.toISOString().slice(0, 10).replace(/-/g, '')}.pdf`;

  // Generate PDF document using PDFKit
  const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 36, // 0.5 inch margins
      info: {
        Title: 'Personal Loan Ledger Statement',
        Author: 'MiniLedger Personal Finance',
        Subject: `Ledger statement for ${user.name || user.phone}`,
        CreationDate: now,
      },
      bufferPages: true,
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (err) => reject(err));

    const left = 36;
    const pageWidth = 595.28;
    const contentWidth = pageWidth - 72; // 523.28

    // 1. Header Banner
    doc.rect(left, 36, contentWidth, 54).fill('#0F172A');

    doc.fillColor('#FFFFFF').fontSize(16).font('Helvetica-Bold');
    doc.text('MINILEDGER', left + 14, 48);

    doc.fontSize(10).font('Helvetica');
    doc.fillColor('#94A3B8');
    doc.text('Personal Loan Ledger Statement', left + 14, 68);

    // Right-aligned header metadata
    const statementDateStr = `${formatDate(now)} ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    doc.fontSize(8).font('Helvetica').fillColor('#94A3B8');
    doc.text('Statement Date', pageWidth - left - 150, 48, { width: 136, align: 'right' });
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#FFFFFF');
    doc.text(statementDateStr, pageWidth - left - 150, 60, { width: 136, align: 'right' });

    doc.y = 100;

    // 2. Account Details & Active Filters
    doc.rect(left, doc.y, contentWidth, 56).fill('#F8FAFC').stroke('#CBD5E1');

    const metaY = doc.y + 10;
    doc.fillColor('#64748B').fontSize(8).font('Helvetica-Bold');
    doc.text('ACCOUNT HOLDER', left + 12, metaY);
    doc.fillColor('#0F172A').fontSize(11).font('Helvetica-Bold');
    doc.text(user.name || 'Personal Account', left + 12, metaY + 11);
    doc.fillColor('#64748B').fontSize(8).font('Helvetica');
    doc.text(`Phone: ${maskPhoneNumber(user.phone)}${user.email ? `  |  Email: ${user.email}` : ''}`, left + 12, metaY + 26);

    const filterColLeft = left + 280;
    doc.fillColor('#64748B').fontSize(8).font('Helvetica-Bold');
    doc.text('APPLIED FILTERS', filterColLeft, metaY);
    doc.fillColor('#0F172A').fontSize(9).font('Helvetica');
    const filterDesc = [
      `Direction: ${options.direction || 'All'}`,
      `Status: ${options.status || 'All'}`,
      options.startDate || options.endDate ? `Date: ${options.startDate || 'Start'} to ${options.endDate || 'Now'}` : 'Period: All Time',
    ].join('  ·  ');
    doc.text(filterDesc, filterColLeft, metaY + 12, { width: 220 });

    doc.y += 66;

    // 3. Financial Summary Bento Box
    const sumBoxY = doc.y;
    doc.rect(left, sumBoxY, contentWidth, 64).fill('#FFFFFF').stroke('#E2E8F0');

    // 3 Columns: Lent (Receivables), Borrowed (Payables), Settled
    const colWidth = contentWidth / 3;

    // Col 1: Lent
    doc.fillColor('#059669').fontSize(9).font('Helvetica-Bold');
    doc.text('LENT (RECEIVABLES)', left + 10, sumBoxY + 8);
    doc.fillColor('#0F172A').fontSize(13).font('Helvetica-Bold');
    doc.text(formatInr(sumLent), left + 10, sumBoxY + 20);
    doc.fillColor('#64748B').fontSize(8).font('Helvetica');
    doc.text(`Outstanding: ${formatInr(outLent)}  |  Overdue: ${formatInr(odReceivable)}`, left + 10, sumBoxY + 38);

    // Divider 1
    doc.moveTo(left + colWidth, sumBoxY + 8).lineTo(left + colWidth, sumBoxY + 56).stroke('#E2E8F0');

    // Col 2: Borrowed
    doc.fillColor('#D97706').fontSize(9).font('Helvetica-Bold');
    doc.text('BORROWED (PAYABLES)', left + colWidth + 10, sumBoxY + 8);
    doc.fillColor('#0F172A').fontSize(13).font('Helvetica-Bold');
    doc.text(formatInr(sumBorrowed), left + colWidth + 10, sumBoxY + 20);
    doc.fillColor('#64748B').fontSize(8).font('Helvetica');
    doc.text(`Outstanding: ${formatInr(outBorrowed)}  |  Overdue: ${formatInr(odPayable)}`, left + colWidth + 10, sumBoxY + 38);

    // Divider 2
    doc.moveTo(left + (colWidth * 2), sumBoxY + 8).lineTo(left + (colWidth * 2), sumBoxY + 56).stroke('#E2E8F0');

    // Col 3: Settled
    doc.fillColor('#2563EB').fontSize(9).font('Helvetica-Bold');
    doc.text('SETTLED / REPAID', left + (colWidth * 2) + 10, sumBoxY + 8);
    doc.fillColor('#0F172A').fontSize(13).font('Helvetica-Bold');
    doc.text(formatInr(sumRepaid), left + (colWidth * 2) + 10, sumBoxY + 20);
    doc.fillColor('#64748B').fontSize(8).font('Helvetica');
    doc.text(`Total Records: ${filteredLoans.length}`, left + (colWidth * 2) + 10, sumBoxY + 38);

    doc.y = sumBoxY + 76;

    // 4. Transactions Table Header
    function drawTableHeader(yPos: number) {
      doc.rect(left, yPos, contentWidth, 20).fill('#0F172A');
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
      doc.text('DATE', left + 8, yPos + 6, { width: 55 });
      doc.text('COUNTERPARTY', left + 65, yPos + 6, { width: 140 });
      doc.text('DIRECTION', left + 210, yPos + 6, { width: 65 });
      doc.text('DUE DATE', left + 280, yPos + 6, { width: 65 });
      doc.text('STATUS', left + 350, yPos + 6, { width: 75 });
      doc.text('AMOUNT (INR)', left + 430, yPos + 6, { width: 85, align: 'right' });
    }

    drawTableHeader(doc.y);
    doc.y += 20;

    // 5. Table Rows
    if (filteredLoans.length === 0) {
      doc.rect(left, doc.y, contentWidth, 36).fill('#F8FAFC').stroke('#E2E8F0');
      doc.fillColor('#64748B').fontSize(9).font('Helvetica');
      doc.text('No ledger records found matching the specified criteria.', left, doc.y + 12, {
        width: contentWidth,
        align: 'center',
      });
      doc.y += 46;
    } else {
      let rowIndex = 0;
      for (const loan of filteredLoans) {
        // Page break check (leave room for table row and footer)
        if (doc.y > 750) {
          doc.addPage();
          drawTableHeader(36);
          doc.y = 56;
        }

        const rowY = doc.y;
        const rowHeight = 22;
        const isEven = rowIndex % 2 === 0;

        if (isEven) {
          doc.rect(left, rowY, contentWidth, rowHeight).fill('#F8FAFC');
        }

        const pastDue = isOverdue(loan.dueDate, loan.isRepaid, now);
        let statusText = loan.isRepaid ? 'Repaid' : pastDue ? 'Overdue' : 'Pending';
        let statusColor = loan.isRepaid ? '#059669' : pastDue ? '#DC2626' : '#D97706';

        // Date
        doc.fillColor('#334155').fontSize(8).font('Helvetica');
        doc.text(formatDate(loan.createdAt), left + 8, rowY + 6, { width: 55 });

        // Counterparty
        doc.fillColor('#0F172A').fontSize(8).font('Helvetica-Bold');
        const counterpartyDisplay = loan.friendName + (loan.counterpartyUserId ? ' (Registered)' : '');
        doc.text(counterpartyDisplay, left + 65, rowY + 6, { width: 140, lineBreak: false });

        // Direction
        const isLent = loan.type === 'LENT';
        doc.fillColor(isLent ? '#059669' : '#D97706').fontSize(8).font('Helvetica-Bold');
        doc.text(isLent ? 'Lent' : 'Borrowed', left + 210, rowY + 6, { width: 65 });

        // Due Date
        doc.fillColor('#475569').fontSize(8).font('Helvetica');
        doc.text(formatDate(loan.dueDate), left + 280, rowY + 6, { width: 65 });

        // Status
        doc.fillColor(statusColor).fontSize(8).font('Helvetica-Bold');
        doc.text(statusText, left + 350, rowY + 6, { width: 75 });

        // Amount
        doc.fillColor('#0F172A').fontSize(8).font('Helvetica-Bold');
        doc.text(formatInr(loan.amount), left + 430, rowY + 6, { width: 85, align: 'right' });

        // Subtle bottom border
        doc.moveTo(left, rowY + rowHeight).lineTo(left + contentWidth, rowY + rowHeight).stroke('#E2E8F0');

        doc.y = rowY + rowHeight;
        rowIndex++;
      }
    }

    // 6. Page Footers across all pages
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      const footerY = 800;

      doc.moveTo(left, footerY).lineTo(left + contentWidth, footerY).stroke('#CBD5E1');

      doc.fillColor('#64748B').fontSize(7).font('Helvetica');
      doc.text(
        'Generated by MiniLedger from personal records. This document is a personal ledger summary, not an official bank statement.',
        left,
        footerY + 5,
        { width: 400 }
      );

      doc.text(`Page ${i + 1} of ${range.count}`, pageWidth - left - 100, footerY + 5, {
        width: 100,
        align: 'right',
      });
    }

    doc.end();
  });

  return {
    pdfBuffer,
    filename,
    recordCount: filteredLoans.length,
    summary,
  };
}
