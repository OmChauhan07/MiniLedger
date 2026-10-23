// Purpose: Renders glanceable financial summary cards for Total Lent, Repaid, Outstanding, and Overdue amounts.
// Imported by: src/features/dashboard/DashboardScreen.tsx

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Summary } from '../types/index.js';
import { formatCurrency } from '../utils/format.js';

interface SummaryCardsProps {
  summary: Summary | null;
}

// Displays a 2x2 grid of key lending aggregates with contextual styling
export function SummaryCards({ summary }: SummaryCardsProps) {
  const lent = summary?.totalLent ?? '0.00';
  const repaid = summary?.totalRepaid ?? '0.00';
  const outstanding = summary?.outstandingAmount ?? '0.00';
  const overdue = summary?.overdueAmount ?? '0.00';

  const hasOverdue = parseFloat(overdue) > 0;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Outstanding Balance Card (Primary) */}
        <View style={[styles.card, styles.outstandingCard]}>
          <Text style={styles.cardLabel}>OUTSTANDING</Text>
          <Text style={[styles.cardAmount, styles.outstandingAmount]}>
            {formatCurrency(outstanding)}
          </Text>
          <Text style={styles.cardSubtext}>Pending to collect</Text>
        </View>

        {/* Overdue Card (Alert Accent) */}
        <View style={[styles.card, hasOverdue ? styles.overdueCardAlert : styles.overdueCardClear]}>
          <Text style={[styles.cardLabel, hasOverdue && styles.overdueLabelAlert]}>OVERDUE</Text>
          <Text style={[styles.cardAmount, hasOverdue ? styles.overdueAmountAlert : styles.overdueAmountClear]}>
            {formatCurrency(overdue)}
          </Text>
          <Text style={styles.cardSubtext}>
            {hasOverdue ? 'Requires action' : 'None overdue'}
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        {/* Total Lent Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>TOTAL LENT</Text>
          <Text style={styles.cardAmount}>{formatCurrency(lent)}</Text>
          <Text style={styles.cardSubtext}>All loans recorded</Text>
        </View>

        {/* Total Repaid Card (Muted Green) */}
        <View style={[styles.card, styles.repaidCard]}>
          <Text style={[styles.cardLabel, styles.repaidLabel]}>TOTAL REPAID</Text>
          <Text style={[styles.cardAmount, styles.repaidAmount]}>
            {formatCurrency(repaid)}
          </Text>
          <Text style={styles.cardSubtext}>Fully settled</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  cardAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  cardSubtext: {
    fontSize: 11,
    color: '#94A3B8',
  },
  outstandingCard: {
    borderColor: '#BFDBFE',
    backgroundColor: '#F0F7FF',
  },
  outstandingAmount: {
    color: '#1D4ED8',
  },
  overdueCardAlert: {
    borderColor: '#FECDD3',
    backgroundColor: '#FFF1F2',
  },
  overdueCardClear: {
    borderColor: '#E2E8F0',
  },
  overdueLabelAlert: {
    color: '#BE123C',
  },
  overdueAmountAlert: {
    color: '#E11D48',
  },
  overdueAmountClear: {
    color: '#0F172A',
  },
  repaidCard: {
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  repaidLabel: {
    color: '#15803D',
  },
  repaidAmount: {
    color: '#16A34A',
  },
});
