// Purpose: Renders a single loan card displaying friend name, amount, due date, status badge, and repayment action.
// Imported by: src/features/dashboard/DashboardScreen.tsx

import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Loan } from '../types/index.js';
import { formatCurrency, formatDisplayDate, checkIsOverdue } from '../utils/format.js';

interface LoanCardProps {
  loan: Loan;
  onRepay: (loanId: string) => void;
  isRepaying?: boolean;
}

// Renders an individual loan entry card with visual overdue indicators and mark-repaid button
export function LoanCard({ loan, onRepay, isRepaying = false }: LoanCardProps) {
  const isOverdueLoan = checkIsOverdue(loan.dueDate, loan.isRepaid);

  return (
    <View style={[styles.card, isOverdueLoan && styles.overdueCard]}>
      <View style={styles.headerRow}>
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{loan.friendName}</Text>
          <Text style={[styles.dueDate, isOverdueLoan && styles.overdueDateText]}>
            Due: {formatDisplayDate(loan.dueDate)}
          </Text>
        </View>

        <View style={styles.amountInfo}>
          <Text style={[styles.amount, isOverdueLoan && styles.overdueAmountText]}>
            {formatCurrency(loan.amount)}
          </Text>
          {/* Status Badge */}
          {loan.isRepaid ? (
            <View style={[styles.badge, styles.repaidBadge]}>
              <Text style={styles.repaidBadgeText}>✓ Repaid</Text>
            </View>
          ) : isOverdueLoan ? (
            <View style={[styles.badge, styles.overdueBadge]}>
              <Text style={styles.overdueBadgeText}>⚠ Overdue</Text>
            </View>
          ) : (
            <View style={[styles.badge, styles.pendingBadge]}>
              <Text style={styles.pendingBadgeText}>Pending</Text>
            </View>
          )}
        </View>
      </View>

      {/* Action Footer for Unpaid Loans */}
      {!loan.isRepaid && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.repayButton, isRepaying && styles.repayButtonDisabled]}
            onPress={() => onRepay(loan.id)}
            disabled={isRepaying}
            activeOpacity={0.7}
          >
            {isRepaying ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.repayButtonText}>Mark Repaid</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Repayment Timestamp for Settled Loans */}
      {loan.isRepaid && loan.repaidAt && (
        <Text style={styles.repaidAtText}>
          Settled on {formatDisplayDate(loan.repaidAt.slice(0, 10))}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  overdueCard: {
    borderColor: '#FECDD3',
    backgroundColor: '#FFF5F5',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  friendInfo: {
    flex: 1,
    marginRight: 12,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  dueDate: {
    fontSize: 13,
    color: '#64748B',
  },
  overdueDateText: {
    color: '#E11D48',
    fontWeight: '600',
  },
  amountInfo: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  overdueAmountText: {
    color: '#BE123C',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  repaidBadge: {
    backgroundColor: '#DCFCE7',
  },
  repaidBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
  },
  overdueBadge: {
    backgroundColor: '#FFE4E6',
  },
  overdueBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#BE123C',
  },
  pendingBadge: {
    backgroundColor: '#F1F5F9',
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  actionRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    alignItems: 'flex-end',
  },
  repayButton: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repayButtonDisabled: {
    opacity: 0.6,
  },
  repayButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  repaidAtText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 8,
  },
});
