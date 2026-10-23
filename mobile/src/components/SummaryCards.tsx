// Purpose: Renders the 2x2 Bento Metric Grid matching MiniLedger Stitch specifications.
// Updated with white-and-black outline UI for marked KPI cards and vector icon components.
// Imported by: src/features/dashboard/DashboardScreen.tsx

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Summary } from '../types/index';
import { formatCurrencyCompact } from '../utils/format';
import { Theme } from '../theme/index';
import { WalletIcon, CheckIcon, ClockIcon, AlertTriangleIcon } from './Icons';

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
      {/* Row 1: Total Lent & Total Repaid (White Cards with Royal Black Outlines) */}
      <View style={styles.gridRow}>
        {/* 1. Total Lent (White Card + Bold Black Outline) */}
        <View style={styles.cardLent}>
          <View style={styles.cardHeader}>
            <Text style={styles.labelNeutral}>Total Lent</Text>
            <View style={styles.iconBoxNeutral}>
              <WalletIcon size={16} color="#0F172A" />
            </View>
          </View>
          <View>
            <Text style={styles.amountNeutral}>{formatCurrencyCompact(lent)}</Text>
            <Text style={styles.subtextNeutral}>
              {totalLoansCount > 0 ? `${totalLoansCount} total loans` : 'All records'}
            </Text>
          </View>
        </View>

        {/* 2. Total Repaid (White Card + Bold Black Outline) */}
        <View style={styles.cardRepaid}>
          <View style={styles.cardHeader}>
            <Text style={styles.labelRepaid}>Total Repaid</Text>
            <View style={styles.iconBoxRepaid}>
              <CheckIcon size={14} color="#0F172A" strokeWidth={2.2} />
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
        {/* 3. Outstanding (Royal Black Obsidian Hero Card) */}
        <View style={styles.cardOutstanding}>
          <View style={styles.cardHeader}>
            <Text style={styles.labelOutstanding}>Outstanding</Text>
            <View style={styles.iconBoxOutstanding}>
              <ClockIcon size={15} color="#FFFFFF" strokeWidth={1.8} />
            </View>
          </View>
          <View>
            <Text style={styles.amountOutstanding}>{formatCurrencyCompact(outstanding)}</Text>
            <Text style={styles.subtextOutstanding}>Pending collection</Text>
          </View>
        </View>

        {/* 4. Overdue (Crisp White Alert Card) */}
        <View style={[styles.cardOverdue, !hasOverdue && styles.cardOverdueClear]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.labelOverdue, !hasOverdue && styles.labelOverdueClear]}>
              Overdue
            </Text>
            <View style={[styles.iconBoxOverdue, !hasOverdue && styles.iconBoxOverdueClear]}>
              {hasOverdue ? (
                <AlertTriangleIcon size={14} color="#DC2626" />
              ) : (
                <CheckIcon size={12} color="#0F172A" />
              )}
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
  // Total Lent: White card with crisp Black Outline
  cardLent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.xl,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#0F172A',
    justifyContent: 'space-between',
    minHeight: 104,
    ...Theme.shadows.card,
  },
  // Total Repaid: White card with crisp Black Outline
  cardRepaid: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.xl,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#0F172A',
    justifyContent: 'space-between',
    minHeight: 104,
    ...Theme.shadows.card,
  },
  cardOutstanding: {
    flex: 1,
    backgroundColor: Theme.colors.primary, // #0F172A Obsidian
    borderRadius: Theme.borderRadius.xl,
    padding: 14,
    justifyContent: 'space-between',
    minHeight: 104,
    ...Theme.shadows.floating,
  },
  cardOverdue: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.xl,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Theme.colors.statusOverdueBorder,
    justifyContent: 'space-between',
    minHeight: 104,
    ...Theme.shadows.card,
  },
  cardOverdueClear: {
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
    fontWeight: '700',
    color: '#0F172A',
  },
  iconBoxNeutral: {
    width: 28,
    height: 28,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountNeutral: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
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
    color: '#0F172A',
  },
  iconBoxRepaid: {
    width: 28,
    height: 28,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountRepaid: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  repaidPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 4,
  },
  repaidBadgePill: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: Theme.borderRadius.full,
  },
  repaidBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
  },
  subtextRepaid: {
    fontSize: 11,
    color: Theme.colors.textMuted,
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
  amountOutstanding: {
    fontSize: 20,
    fontWeight: '800',
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
    color: '#0F172A',
    fontWeight: '600',
  },
  iconBoxOverdue: {
    width: 28,
    height: 28,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Theme.colors.statusOverdueTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxOverdueClear: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#0F172A',
  },
  amountOverdue: {
    fontSize: 20,
    fontWeight: '800',
    color: Theme.colors.statusOverdue,
    letterSpacing: -0.3,
  },
  amountOverdueClear: {
    color: '#0F172A',
  },
  overdueBadgePill: {
    alignSelf: 'flex-start',
    backgroundColor: Theme.colors.statusOverdueTint,
    borderWidth: 1,
    borderColor: Theme.colors.statusOverdueBorder,
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
