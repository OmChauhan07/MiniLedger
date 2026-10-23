// Purpose: Renders the direction-aware Bento Metric Grid matching MiniLedger Stitch specifications.
// Clearly separates Lent (Receivables) from Borrowed (Payables), including separate outstanding and overdue amounts.
// Imported by: src/features/dashboard/DashboardScreen.tsx

import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Summary } from '../types/index';
import { formatCurrencyCompact } from '../utils/format';
import { Theme } from '../theme/index';
import { WalletIcon, CheckIcon, ClockIcon, AlertTriangleIcon } from './Icons';

interface SummaryCardsProps {
  summary: Summary | null;
  totalLoansCount?: number;
  overdueLoansCount?: number;
  onPressLent?: () => void;
  onPressBorrowed?: () => void;
}

export function SummaryCards({
  summary,
  totalLoansCount = 0,
  overdueLoansCount = 0,
  onPressLent,
  onPressBorrowed,
}: SummaryCardsProps) {
  // Lent (Receivables)
  const lentOutstanding = parseFloat(summary?.outstandingLent ?? summary?.outstandingAmount ?? '0') || 0;
  const overdueReceivable = parseFloat(summary?.overdueReceivable ?? summary?.overdueAmount ?? '0') || 0;
  const totalLent = parseFloat(summary?.totalLent ?? '0') || 0;

  // Borrowed (Payables)
  const borrowedOutstanding = parseFloat(summary?.outstandingBorrowed ?? '0') || 0;
  const overduePayable = parseFloat(summary?.overduePayable ?? '0') || 0;
  const totalBorrowed = parseFloat(summary?.totalBorrowed ?? '0') || 0;

  const hasOverdueReceivable = overdueReceivable > 0;
  const hasOverduePayable = overduePayable > 0;

  // Net position
  const netBalance = parseFloat(summary?.netBalance ?? '0') || 0;
  const netStatus = summary?.netStatus ?? 'SETTLED';

  return (
    <View style={styles.gridContainer}>
      {/* Net Position Hero Card */}
      <View style={styles.netHeroCard}>
        <View style={styles.netHeroLeft}>
          <Text style={styles.netHeroKicker}>PORTFOLIO NET BALANCE</Text>
          <Text style={styles.netHeroValue}>
            {netStatus === 'SETTLED' ? 'Balanced (₹0)' : `₹${summary?.netBalance ?? '0.00'}`}
          </Text>
          <Text style={styles.netHeroSubtext}>
            {netStatus === 'RECEIVABLE'
              ? 'Net Receivable • You are owed more overall'
              : netStatus === 'PAYABLE'
              ? 'Net Payable • You owe more overall'
              : 'Equal obligations • Fully balanced'}
          </Text>
        </View>
        <View
          style={[
            styles.netStatusPill,
            netStatus === 'RECEIVABLE'
              ? styles.netStatusPillReceivable
              : netStatus === 'PAYABLE'
              ? styles.netStatusPillPayable
              : styles.netStatusPillSettled,
          ]}
        >
          <Text
            style={[
              styles.netStatusPillText,
              netStatus === 'RECEIVABLE'
                ? styles.netStatusPillReceivableText
                : netStatus === 'PAYABLE'
                ? styles.netStatusPillPayableText
                : styles.netStatusPillSettledText,
            ]}
          >
            {netStatus}
          </Text>
        </View>
      </View>

      {/* Row 1: Gross Outstanding Balances (Lent vs Borrowed) */}
      <View style={styles.gridRow}>
        {/* 1. Lent Outstanding (They owe you) */}
        <TouchableOpacity
          style={styles.cardLent}
          onPress={onPressLent}
          activeOpacity={onPressLent ? 0.75 : 1}
        >
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.kickerLent}>RECEIVABLE</Text>
              <Text style={styles.labelNeutral}>Lent Outstanding</Text>
            </View>
            <View style={styles.iconBoxNeutral}>
              <WalletIcon size={16} color="#0F172A" />
            </View>
          </View>
          <View style={styles.cardBottom}>
            <Text style={styles.amountNeutral}>{formatCurrencyCompact(lentOutstanding)}</Text>
            <Text style={styles.subtextNeutral}>They owe you ➔</Text>
          </View>
        </TouchableOpacity>

        {/* 2. Borrowed Outstanding (You owe them) */}
        <TouchableOpacity
          style={styles.cardBorrowed}
          onPress={onPressBorrowed}
          activeOpacity={onPressBorrowed ? 0.75 : 1}
        >
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.kickerBorrowed}>PAYABLE</Text>
              <Text style={styles.labelNeutral}>Borrowed Outstanding</Text>
            </View>
            <View style={styles.iconBoxBorrowed}>
              <ClockIcon size={16} color="#0F172A" strokeWidth={1.8} />
            </View>
          </View>
          <View style={styles.cardBottom}>
            <Text style={styles.amountNeutral}>{formatCurrencyCompact(borrowedOutstanding)}</Text>
            <Text style={styles.subtextNeutral}>You owe them ➔</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Row 2: Overdue Obligations (Receivable vs Payable) */}
      <View style={styles.gridRow}>
        {/* 3. Overdue Receivable */}
        <TouchableOpacity
          style={[styles.cardAlert, !hasOverdueReceivable && styles.cardAlertClear]}
          onPress={onPressLent}
          activeOpacity={onPressLent ? 0.75 : 1}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.labelAlert, !hasOverdueReceivable && styles.labelAlertClear]}>
              Overdue to You
            </Text>
            <View style={[styles.iconBoxAlert, !hasOverdueReceivable && styles.iconBoxAlertClear]}>
              {hasOverdueReceivable ? (
                <AlertTriangleIcon size={13} color="#DC2626" />
              ) : (
                <CheckIcon size={12} color="#0F172A" />
              )}
            </View>
          </View>
          <View style={styles.cardBottom}>
            <Text style={[styles.amountAlert, !hasOverdueReceivable && styles.amountAlertClear]}>
              {formatCurrencyCompact(overdueReceivable)}
            </Text>
            <Text style={styles.subtextAlert}>
              {hasOverdueReceivable ? 'Action required ➔' : 'No overdue records'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* 4. Overdue Payable */}
        <TouchableOpacity
          style={[styles.cardAlert, !hasOverduePayable && styles.cardAlertClear]}
          onPress={onPressBorrowed}
          activeOpacity={onPressBorrowed ? 0.75 : 1}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.labelAlert, !hasOverduePayable && styles.labelAlertClear]}>
              Overdue from You
            </Text>
            <View style={[styles.iconBoxAlert, !hasOverduePayable && styles.iconBoxAlertClear]}>
              {hasOverduePayable ? (
                <AlertTriangleIcon size={13} color="#DC2626" />
              ) : (
                <CheckIcon size={12} color="#0F172A" />
              )}
            </View>
          </View>
          <View style={styles.cardBottom}>
            <Text style={[styles.amountAlert, !hasOverduePayable && styles.amountAlertClear]}>
              {formatCurrencyCompact(overduePayable)}
            </Text>
            <Text style={styles.subtextAlert}>
              {hasOverduePayable ? 'Pay back immediately ➔' : 'Payments on schedule'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Bottom Summary Strip: Cumulative Totals */}
      <View style={styles.cumulativeTotalsStrip}>
        <View style={styles.totalCol}>
          <Text style={styles.totalColLabel}>Total Lent (Historical)</Text>
          <Text style={styles.totalColValue}>{formatCurrencyCompact(totalLent)}</Text>
        </View>
        <View style={styles.totalColDivider} />
        <View style={[styles.totalCol, styles.totalColRight]}>
          <Text style={styles.totalColLabel}>Total Borrowed (Historical)</Text>
          <Text style={styles.totalColValue}>{formatCurrencyCompact(totalBorrowed)}</Text>
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
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.xl,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#0F172A',
    justifyContent: 'space-between',
    minHeight: 112,
    ...Theme.shadows.card,
  },
  cardBorrowed: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.xl,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#0F172A',
    justifyContent: 'space-between',
    minHeight: 112,
    ...Theme.shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  kickerLent: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1D4ED8',
    letterSpacing: 0.6,
  },
  kickerBorrowed: {
    fontSize: 9,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.6,
  },
  labelNeutral: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginTop: 1,
  },
  iconBoxNeutral: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Theme.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxBorrowed: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Theme.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBottom: {
    marginTop: 4,
  },
  amountNeutral: {
    fontSize: 20,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtextNeutral: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  cardAlert: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: Theme.colors.statusOverdueBorder,
    justifyContent: 'space-between',
    minHeight: 104,
    ...Theme.shadows.card,
  },
  cardAlertClear: {
    borderColor: Theme.colors.borderSubtle,
  },
  labelAlert: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.statusOverdue,
  },
  labelAlertClear: {
    color: Theme.colors.textSecondary,
  },
  iconBoxAlert: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Theme.colors.statusOverdueTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxAlertClear: {
    backgroundColor: Theme.colors.surfaceContainerLow,
  },
  amountAlert: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.statusOverdue,
    letterSpacing: -0.2,
  },
  amountAlertClear: {
    color: Theme.colors.textPrimary,
  },
  subtextAlert: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  cumulativeTotalsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Theme.colors.borderSubtle,
    ...Theme.shadows.sm,
  },
  totalCol: {
    flex: 1,
  },
  totalColRight: {
    alignItems: 'flex-end',
  },
  totalColDivider: {
    width: 1,
    height: 28,
    backgroundColor: Theme.colors.borderSubtle,
    marginHorizontal: 12,
  },
  totalColLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalColValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    marginTop: 2,
  },
  netHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: Theme.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    ...Theme.shadows.card,
  },
  netHeroLeft: {
    flex: 1,
    marginRight: 12,
  },
  netHeroKicker: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  netHeroValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
    letterSpacing: -0.3,
  },
  netHeroSubtext: {
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 2,
  },
  netStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Theme.borderRadius.full,
  },
  netStatusPillReceivable: {
    backgroundColor: '#DCFCE7',
  },
  netStatusPillPayable: {
    backgroundColor: '#FEE2E2',
  },
  netStatusPillSettled: {
    backgroundColor: '#334155',
  },
  netStatusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  netStatusPillReceivableText: {
    color: '#15803D',
  },
  netStatusPillPayableText: {
    color: '#B91C1C',
  },
  netStatusPillSettledText: {
    color: '#E2E8F0',
  },
});
