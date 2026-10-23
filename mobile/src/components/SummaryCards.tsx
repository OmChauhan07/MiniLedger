// Purpose: Renders the 2x2 Bento Metric Grid matching MiniLedger Stitch specifications.
// Imported by: src/features/dashboard/DashboardScreen.tsx

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Summary } from '../types/index';
import { formatCurrencyCompact } from '../utils/format';
import { Theme } from '../theme/index';

interface SummaryCardsProps {
  summary: Summary | null;
  totalLoansCount?: number;
  overdueLoansCount?: number;
}

export function SummaryCards({
  summary,
  totalLoansCount = 0,
  overdueLoansCount = 0,
}: SummaryCardsProps) {
  const lent = parseFloat(summary?.totalLent ?? '0') || 0;
  const repaid = parseFloat(summary?.totalRepaid ?? '0') || 0;
  const outstanding = parseFloat(summary?.outstandingAmount ?? '0') || 0;
  const overdue = parseFloat(summary?.overdueAmount ?? '0') || 0;

  const recoveryPercent = lent > 0 ? ((repaid / lent) * 100).toFixed(1) : '0';
  const hasOverdue = overdue > 0;

  return (
    <View style={styles.gridContainer}>
      {/* Row 1: Total Lent & Total Repaid */}
      <View style={styles.gridRow}>
        {/* 1. Total Lent (Slate Neutral) */}
        <View style={styles.cardLent}>
          <View style={styles.cardHeader}>
            <Text style={styles.labelNeutral}>Total Lent</Text>
            <View style={styles.iconBoxNeutral}>
              <Text style={styles.iconGlyphNeutral}>👛</Text>
            </View>
          </View>
          <View>
            <Text style={styles.amountNeutral}>{formatCurrencyCompact(lent)}</Text>
            <Text style={styles.subtextNeutral}>
              {totalLoansCount > 0 ? `${totalLoansCount} total loans` : 'All records'}
            </Text>
          </View>
        </View>

        {/* 2. Total Repaid (Emerald Tint) */}
        <View style={styles.cardRepaid}>
          <View style={styles.cardHeader}>
            <Text style={styles.labelRepaid}>Total Repaid</Text>
            <View style={styles.iconBoxRepaid}>
              <Text style={styles.iconGlyphRepaid}>✓</Text>
            </View>
          </View>
          <View>
            <Text style={styles.amountRepaid}>{formatCurrencyCompact(repaid)}</Text>
            <View style={styles.repaidPillRow}>
              <View style={styles.repaidBadgePill}>
                <Text style={styles.repaidBadgeText}>+{recoveryPercent}%</Text>
              </View>
              <Text style={styles.subtextRepaid}>recovered</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Row 2: Outstanding & Overdue */}
      <View style={styles.gridRow}>
        {/* 3. Outstanding (Deep Indigo Hero Card) */}
        <View style={styles.cardOutstanding}>
          <View style={styles.cardHeader}>
            <Text style={styles.labelOutstanding}>Outstanding</Text>
            <View style={styles.iconBoxOutstanding}>
              <Text style={styles.iconGlyphWhite}>⏱</Text>
            </View>
          </View>
          <View>
            <Text style={styles.amountOutstanding}>{formatCurrencyCompact(outstanding)}</Text>
            <Text style={styles.subtextOutstanding}>Pending collection</Text>
          </View>
        </View>

        {/* 4. Overdue (Coral Alert Tint) */}
        <View style={[styles.cardOverdue, !hasOverdue && styles.cardOverdueClear]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.labelOverdue, !hasOverdue && styles.labelOverdueClear]}>
              Overdue
            </Text>
            <View style={styles.iconBoxOverdue}>
              <Text style={styles.iconGlyphOverdue}>{hasOverdue ? '⚠' : '✓'}</Text>
            </View>
          </View>
          <View>
            <Text style={[styles.amountOverdue, !hasOverdue && styles.amountOverdueClear]}>
              {formatCurrencyCompact(overdue)}
            </Text>
            {hasOverdue ? (
              <View style={styles.overdueBadgePill}>
                <Text style={styles.overdueBadgeText}>
                  {overdueLoansCount > 0 ? `${overdueLoansCount} loans overdue` : 'Action required'}
                </Text>
              </View>
            ) : (
              <Text style={styles.subtextNeutral}>All loans on schedule</Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    gap: 12,
    marginBottom: 16,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cardLent: {
    flex: 1,
    backgroundColor: Theme.colors.surfaceCard,
    borderRadius: Theme.borderRadius.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: Theme.colors.borderSubtle,
    justifyContent: 'space-between',
    minHeight: 104,
    ...Theme.shadows.card,
  },
  cardRepaid: {
    flex: 1,
    backgroundColor: Theme.colors.statusRepaidTint,
    borderRadius: Theme.borderRadius.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: Theme.colors.statusRepaidBorder,
    justifyContent: 'space-between',
    minHeight: 104,
    ...Theme.shadows.card,
  },
  cardOutstanding: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.xl,
    padding: 14,
    justifyContent: 'space-between',
    minHeight: 104,
    ...Theme.shadows.floating,
  },
  cardOverdue: {
    flex: 1,
    backgroundColor: Theme.colors.statusOverdueTint,
    borderRadius: Theme.borderRadius.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: Theme.colors.statusOverdueBorder,
    justifyContent: 'space-between',
    minHeight: 104,
    ...Theme.shadows.card,
  },
  cardOverdueClear: {
    backgroundColor: Theme.colors.surfaceCard,
    borderColor: Theme.colors.borderSubtle,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  labelNeutral: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  iconBoxNeutral: {
    width: 28,
    height: 28,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Theme.colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyphNeutral: {
    fontSize: 14,
  },
  amountNeutral: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtextNeutral: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  labelRepaid: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.statusRepaid,
  },
  iconBoxRepaid: {
    width: 28,
    height: 28,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Theme.colors.surfaceCard,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.sm,
  },
  iconGlyphRepaid: {
    fontSize: 13,
    fontWeight: '800',
    color: Theme.colors.statusRepaid,
  },
  amountRepaid: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.colors.statusRepaid,
    letterSpacing: -0.3,
  },
  repaidPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 4,
  },
  repaidBadgePill: {
    backgroundColor: Theme.colors.surfaceCard,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: Theme.borderRadius.full,
  },
  repaidBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.statusRepaid,
  },
  subtextRepaid: {
    fontSize: 11,
    color: Theme.colors.statusRepaid,
    opacity: 0.85,
  },
  labelOutstanding: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.onPrimaryContainer,
  },
  iconBoxOutstanding: {
    width: 28,
    height: 28,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyphWhite: {
    fontSize: 13,
    color: '#FFFFFF',
  },
  amountOutstanding: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.colors.onPrimary,
    letterSpacing: -0.3,
  },
  subtextOutstanding: {
    fontSize: 11,
    color: Theme.colors.onPrimaryContainer,
    marginTop: 2,
  },
  labelOverdue: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.statusOverdue,
  },
  labelOverdueClear: {
    color: Theme.colors.textSecondary,
    fontWeight: '600',
  },
  iconBoxOverdue: {
    width: 28,
    height: 28,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Theme.colors.surfaceCard,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.sm,
  },
  iconGlyphOverdue: {
    fontSize: 13,
    fontWeight: '800',
    color: Theme.colors.statusOverdue,
  },
  amountOverdue: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.colors.statusOverdue,
    letterSpacing: -0.3,
  },
  amountOverdueClear: {
    color: Theme.colors.textPrimary,
  },
  overdueBadgePill: {
    alignSelf: 'flex-start',
    backgroundColor: Theme.colors.surfaceCard,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.full,
    marginTop: 3,
  },
  overdueBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.statusOverdue,
  },
});
