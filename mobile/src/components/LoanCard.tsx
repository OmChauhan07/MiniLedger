// Purpose: Renders a modernized direction-aware loan card matching MiniLedger Stitch specifications.
// Distinguishes between LENT ("They owe you") and BORROWED ("You owe them") using clear text badges, amounts, and actions.
// Imported by: src/features/dashboard/DashboardScreen.tsx, src/features/loans/AllLoansScreen.tsx

import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Loan } from '../types/index';
import {
  formatCurrencyCompact,
  formatDisplayDate,
  checkIsOverdue,
  getRelativeDueLabel,
  getInitials,
} from '../utils/format';
import { Theme } from '../theme/index';
import { CheckIcon, AlertTriangleIcon, ClockIcon } from './Icons';

interface LoanCardProps {
  loan: Loan;
  onRepay: (loanId: string) => void;
  onPress?: (loan: Loan) => void;
  isRepaying?: boolean;
}

export function LoanCard({ loan, onRepay, onPress, isRepaying = false }: LoanCardProps) {
  const isLent = loan.type === 'LENT';
  const isOverdue = checkIsOverdue(loan.dueDate, loan.isRepaid);
  const initials = getInitials(loan.friendName);
  const relativeBadge = getRelativeDueLabel(loan.dueDate, loan.isRepaid);

  // Avatar styles depending on loan status
  const avatarBg = loan.isRepaid
    ? Theme.colors.statusRepaidTint
    : isOverdue
    ? Theme.colors.statusOverdueTint
    : Theme.colors.surfaceContainerHigh;

  const avatarTextColor = loan.isRepaid
    ? Theme.colors.statusRepaid
    : isOverdue
    ? Theme.colors.statusOverdue
    : Theme.colors.textPrimary;

  // Amount text color
  const amountColor = loan.isRepaid
    ? Theme.colors.statusRepaid
    : isOverdue
    ? Theme.colors.statusOverdue
    : Theme.colors.textPrimary;

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.9 : 1}
      onPress={() => onPress?.(loan)}
      style={[
        styles.cardContainer,
        loan.isRepaid && styles.cardRepaid,
        isOverdue && styles.cardOverdue,
      ]}
    >
      {/* Direction & Status Header Bar */}
      <View style={styles.directionHeaderBar}>
        <View
          style={[
            styles.directionBadge,
            isLent ? styles.directionBadgeLent : styles.directionBadgeBorrowed,
          ]}
        >
          <Text
            style={[
              styles.directionBadgeText,
              isLent ? styles.directionBadgeTextLent : styles.directionBadgeTextBorrowed,
            ]}
          >
            {isLent ? 'THEY OWE YOU' : 'YOU OWE THEM'}
          </Text>
        </View>

        {/* Status Pill Badge */}
        {loan.isRepaid ? (
          <View style={styles.badgeRepaid}>
            <CheckIcon size={11} color={Theme.colors.statusRepaid} strokeWidth={2.2} />
            <Text style={styles.badgeRepaidText}>Settled</Text>
          </View>
        ) : isOverdue ? (
          <View style={styles.badgeOverdue}>
            <AlertTriangleIcon size={11} color={Theme.colors.statusOverdue} />
            <Text style={styles.badgeOverdueText}>{relativeBadge.text}</Text>
          </View>
        ) : (
          <View style={styles.badgePending}>
            <ClockIcon size={11} color={Theme.colors.statusPending} strokeWidth={1.8} />
            <Text style={styles.badgePendingText}>{relativeBadge.text}</Text>
          </View>
        )}
      </View>

      {/* Main Details Row */}
      <View style={styles.mainRow}>
        {/* Contact Avatar & Name */}
        <View style={styles.borrowerSection}>
          <View style={[styles.avatarCircle, { backgroundColor: avatarBg }]}>
            <Text style={[styles.avatarText, { color: avatarTextColor }]}>{initials}</Text>
          </View>
          <View style={styles.borrowerTextCol}>
            <View style={styles.nameRow}>
              <Text style={styles.borrowerName} numberOfLines={1}>
                {loan.friendName}
              </Text>
              {loan.counterpartyUserId && (
                <View style={styles.regBadge}>
                  <Text style={styles.regBadgeText}>Reg</Text>
                </View>
              )}
            </View>
            <Text style={styles.dueDateText}>
              {loan.isRepaid && loan.repaidAt
                ? `Settled on ${formatDisplayDate(loan.repaidAt.slice(0, 10))}`
                : `Due ${formatDisplayDate(loan.dueDate)}`}
            </Text>
          </View>
        </View>

        {/* Amount Section */}
        <View style={styles.amountSection}>
          <Text style={[styles.amountText, { color: amountColor }]}>
            {formatCurrencyCompact(loan.amount)}
          </Text>
          <Text style={styles.amountDirectionLabel}>
            {isLent ? 'Receivable' : 'Payable'}
          </Text>
        </View>
      </View>

      {/* Bottom Context Strip */}
      <View style={styles.bottomStrip}>
        <Text style={styles.noteText} numberOfLines={1}>
          {loan.notes && loan.notes.trim() ? loan.notes : (isLent ? 'Lent loan • UPI' : 'Borrowed loan • UPI')}
        </Text>

        {!loan.isRepaid ? (
          <TouchableOpacity
            style={[styles.repayButton, isRepaying && styles.repayButtonDisabled]}
            onPress={() => onRepay(loan.id)}
            disabled={isRepaying}
            activeOpacity={0.8}
          >
            {isRepaying ? (
              <ActivityIndicator size="small" color={Theme.colors.statusRepaid} />
            ) : (
              <View style={styles.repayContent}>
                <CheckIcon size={12} color={Theme.colors.statusRepaid} strokeWidth={2.2} />
                <Text style={styles.repayText}>
                  {isLent ? 'Mark Repaid' : 'Mark as Paid'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.settledBadge}>
            <CheckIcon size={12} color={Theme.colors.statusRepaid} strokeWidth={2.2} />
            <Text style={styles.settledText}>
              {isLent ? 'Settled (Received)' : 'Settled (Paid)'}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.xl,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.2,
    borderColor: Theme.colors.borderSubtle,
    ...Theme.shadows.card,
  },
  cardRepaid: {
    opacity: 0.94,
  },
  cardOverdue: {
    borderColor: Theme.colors.statusOverdueBorder,
    borderWidth: 1.5,
  },
  directionHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  directionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1,
  },
  directionBadgeLent: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  directionBadgeBorrowed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  directionBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  directionBadgeTextLent: {
    color: '#1D4ED8',
  },
  directionBadgeTextBorrowed: {
    color: '#DC2626',
  },
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  borrowerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  borrowerTextCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  borrowerName: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    flexShrink: 1,
  },
  regBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  regBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  dueDateText: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  amountSection: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  amountDirectionLabel: {
    fontSize: 10,
    color: Theme.colors.textMuted,
    fontWeight: '600',
    marginTop: 1,
  },
  badgeRepaid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.statusRepaidTint,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.full,
    gap: 4,
  },
  badgeRepaidText: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.statusRepaid,
  },
  badgeOverdue: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.statusOverdueTint,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.full,
    gap: 4,
  },
  badgeOverdueText: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.statusOverdue,
  },
  badgePending: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.statusPendingTint,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.full,
    gap: 4,
  },
  badgePendingText: {
    fontSize: 10,
    fontWeight: '600',
    color: Theme.colors.statusPending,
  },
  bottomStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Theme.colors.background,
    marginHorizontal: -14,
    marginBottom: -14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomLeftRadius: Theme.borderRadius.xl,
    borderBottomRightRadius: Theme.borderRadius.xl,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.borderLight,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: Theme.colors.textMuted,
    fontStyle: 'italic',
    marginRight: 10,
  },
  repayButton: {
    backgroundColor: Theme.colors.statusRepaidTint,
    borderWidth: 1,
    borderColor: Theme.colors.statusRepaidBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Theme.borderRadius.md,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  repayButtonDisabled: {
    opacity: 0.6,
  },
  repayContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  repayText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.statusRepaid,
  },
  settledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  settledText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.statusRepaid,
  },
});
