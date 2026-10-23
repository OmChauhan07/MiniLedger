// Purpose: Renders a modernized loan card matching MiniLedger Stitch specifications.
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

interface LoanCardProps {
  loan: Loan;
  onRepay: (loanId: string) => void;
  onPress?: (loan: Loan) => void;
  isRepaying?: boolean;
}

export function LoanCard({ loan, onRepay, onPress, isRepaying = false }: LoanCardProps) {
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
      {/* Top Header Row */}
      <View style={styles.topRow}>
        {/* Borrower Avatar & Details */}
        <View style={styles.borrowerSection}>
          <View style={[styles.avatarCircle, { backgroundColor: avatarBg }]}>
            <Text style={[styles.avatarText, { color: avatarTextColor }]}>{initials}</Text>
          </View>
          <View style={styles.borrowerTextCol}>
            <Text style={styles.borrowerName} numberOfLines={1}>
              {loan.friendName}
            </Text>
            <Text style={styles.dueDateText}>
              {loan.isRepaid && loan.repaidAt
                ? `Paid on ${formatDisplayDate(loan.repaidAt.slice(0, 10))}`
                : `Due ${formatDisplayDate(loan.dueDate)}`}
            </Text>
          </View>
        </View>

        {/* Amount & Status Badge */}
        <View style={styles.amountSection}>
          <Text style={[styles.amountText, { color: amountColor }]}>
            {formatCurrencyCompact(loan.amount)}
          </Text>

          {/* Pill Badge */}
          {loan.isRepaid ? (
            <View style={styles.badgeRepaid}>
              <Text style={styles.badgeRepaidIcon}>✓</Text>
              <Text style={styles.badgeRepaidText}>Repaid</Text>
            </View>
          ) : isOverdue ? (
            <View style={styles.badgeOverdue}>
              <Text style={styles.badgeOverdueIcon}>⚠</Text>
              <Text style={styles.badgeOverdueText}>{relativeBadge.text}</Text>
            </View>
          ) : (
            <View style={styles.badgePending}>
              <Text style={styles.badgePendingIcon}>⏱</Text>
              <Text style={styles.badgePendingText}>{relativeBadge.text}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Bottom Context Strip */}
      <View style={styles.bottomStrip}>
        <Text style={styles.noteText} numberOfLines={1}>
          {loan.notes && loan.notes.trim() ? loan.notes : 'Friend loan • UPI'}
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
                <Text style={styles.repayIcon}>✓</Text>
                <Text style={styles.repayText}>Mark Repaid</Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.settledBadge}>
            <Text style={styles.settledIcon}>✓</Text>
            <Text style={styles.settledText}>Settled</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: Theme.colors.surfaceCard,
    borderRadius: Theme.borderRadius.xl,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Theme.colors.borderSubtle,
    ...Theme.shadows.card,
  },
  cardRepaid: {
    opacity: 0.94,
  },
  cardOverdue: {
    borderColor: Theme.colors.statusOverdueBorder,
  },
  topRow: {
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
  borrowerName: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
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
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  badgeRepaid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.statusRepaidTint,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.full,
    marginTop: 3,
    gap: 3,
  },
  badgeRepaidIcon: {
    fontSize: 11,
    fontWeight: '800',
    color: Theme.colors.statusRepaid,
  },
  badgeRepaidText: {
    fontSize: 11,
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
    marginTop: 3,
    gap: 3,
  },
  badgeOverdueIcon: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.statusOverdue,
  },
  badgeOverdueText: {
    fontSize: 11,
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
    marginTop: 3,
    gap: 3,
  },
  badgePendingIcon: {
    fontSize: 10,
    color: Theme.colors.statusPending,
  },
  badgePendingText: {
    fontSize: 11,
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
    gap: 4,
  },
  repayIcon: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.colors.statusRepaid,
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
  settledIcon: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.colors.statusRepaid,
  },
  settledText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.statusRepaid,
  },
});
