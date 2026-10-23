// Purpose: Dedicated screen for tracking and managing Money Lent (Receivables / They Owe You).
// Features specialized emerald-accented hero metrics, lent-specific status filters, search, and settlement actions.
// Imported by: App.tsx

import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Loan, Summary } from '../../types/index';
import { LoanCard } from '../../components/LoanCard';
import { LoanDetailsModal } from '../../components/LoanDetailsModal';
import {
  SearchIcon,
  AlertTriangleIcon,
  CheckIcon,
  WalletIcon,
  ClockIcon,
  ArrowUpRightIcon,
} from '../../components/Icons';
import { Theme, STATUS_BAR_HEIGHT } from '../../theme/index';
import { formatCurrencyCompact, checkIsOverdue } from '../../utils/format';

type StatusFilter = 'all' | 'pending' | 'overdue' | 'repaid';

interface LentLoansScreenProps {
  loans: Loan[];
  summary: Summary | null;
  isLoading: boolean;
  onRefresh: () => void;
  onRepayLoan: (loanId: string) => Promise<void>;
  onOpenAddLoan: () => void;
  onViewRelationship?: (counterpartyId: string) => void;
}

export function LentLoansScreen({
  loans,
  summary,
  isLoading,
  onRefresh,
  onRepayLoan,
  onOpenAddLoan,
  onViewRelationship,
}: LentLoansScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');
  const [repayingId, setRepayingId] = useState<string | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  // Filter exclusively for Lent records
  const lentLoans = useMemo(() => {
    return loans.filter((l) => (l.type ?? 'LENT') === 'LENT');
  }, [loans]);

  // Calculate status counts strictly within lent loans
  const statusCounts = useMemo(() => {
    let pending = 0;
    let overdue = 0;
    let repaid = 0;

    for (const loan of lentLoans) {
      if (loan.isRepaid) {
        repaid++;
      } else if (checkIsOverdue(loan.dueDate, false)) {
        overdue++;
      } else {
        pending++;
      }
    }

    return { all: lentLoans.length, pending, overdue, repaid };
  }, [lentLoans]);

  // Filter by search query and active status chip
  const filteredLoans = useMemo(() => {
    return lentLoans.filter((loan) => {
      // 1. Status Filter match
      if (activeFilter === 'pending') {
        if (loan.isRepaid || checkIsOverdue(loan.dueDate, false)) return false;
      } else if (activeFilter === 'overdue') {
        if (loan.isRepaid || !checkIsOverdue(loan.dueDate, false)) return false;
      } else if (activeFilter === 'repaid') {
        if (!loan.isRepaid) return false;
      }

      // 2. Search match (borrower name or notes)
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const nameMatch = loan.friendName.toLowerCase().includes(query);
        const notesMatch = loan.notes ? loan.notes.toLowerCase().includes(query) : false;
        return nameMatch || notesMatch;
      }

      return true;
    });
  }, [lentLoans, activeFilter, searchQuery]);

  const handleRepay = async (loanId: string) => {
    setRepayingId(loanId);
    try {
      await onRepayLoan(loanId);
    } finally {
      setRepayingId(null);
    }
  };

  const outstandingLent = parseFloat(summary?.outstandingLent ?? summary?.outstandingAmount ?? '0') || 0;
  const overdueReceivable = parseFloat(summary?.overdueReceivable ?? summary?.overdueAmount ?? '0') || 0;
  const totalLent = parseFloat(summary?.totalLent ?? '0') || 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Header Bar */}
      <View style={styles.topHeader}>
        <View style={styles.titleRow}>
          <View style={styles.kickerRow}>
            <ArrowUpRightIcon size={12} color="#059669" strokeWidth={2.4} />
            <Text style={styles.headerKicker}>Receivables · They Owe You</Text>
          </View>
          <Text style={styles.headerTitle}>Lent Money</Text>
        </View>
        <TouchableOpacity
          onPress={onOpenAddLoan}
          style={styles.addIconBtn}
          activeOpacity={0.8}
        >
          <Text style={styles.addIconText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        style={styles.mainContainer}
        data={filteredLoans}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            colors={[Theme.colors.primary]}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerSection}>
            {/* Search Input Bar */}
            <View style={styles.searchBox}>
              <View style={styles.searchIconWrapper}>
                <SearchIcon size={18} color={Theme.colors.textMuted} strokeWidth={2} />
              </View>
              <TextInput
                style={styles.searchInput}
                placeholder="Search borrower or note..."
                placeholderTextColor={Theme.colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.clearSearchBtn}
                >
                  <Text style={styles.clearSearchText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Lent Hero Metrics Banner */}
            <View style={styles.metricsHeroBanner}>
              <View style={styles.metricsHeroLeft}>
                <View style={styles.bannerBadgeRow}>
                  <ArrowUpRightIcon size={13} color="#34D399" strokeWidth={2.4} />
                  <Text style={styles.metricsHeroKicker}>Total Lent Outstanding</Text>
                </View>
                <Text style={styles.metricsHeroAmount}>
                  {formatCurrencyCompact(outstandingLent)}
                </Text>
                <View style={styles.metricsOverdueRow}>
                  <View
                    style={[
                      styles.overduePulseDot,
                      { backgroundColor: overdueReceivable > 0 ? '#FECACA' : '#A7F3D0' },
                    ]}
                  />
                  <Text style={styles.metricsOverdueText}>
                    {overdueReceivable > 0
                      ? `${formatCurrencyCompact(overdueReceivable)} strictly overdue to receive`
                      : 'All lent loans are in good standing'}
                  </Text>
                </View>
                <Text style={styles.lifetimeVolumeText}>
                  Total Lent: {formatCurrencyCompact(totalLent)} · {lentLoans.length} total loans
                </Text>
              </View>
              <View style={styles.metricsHeroIconBox}>
                <WalletIcon size={24} color="#FFFFFF" strokeWidth={2} />
              </View>
            </View>

            {/* Status Filter Chips Row */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              {/* All Lent Chip */}
              <TouchableOpacity
                onPress={() => setActiveFilter('all')}
                style={[
                  styles.filterChip,
                  activeFilter === 'all' ? styles.filterChipAllActive : styles.filterChipInactive,
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    activeFilter === 'all' && styles.chipTextAllActive,
                  ]}
                >
                  All Lent
                </Text>
                <View
                  style={[
                    styles.chipCountPill,
                    activeFilter === 'all' && styles.chipCountPillAllActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipCountText,
                      activeFilter === 'all' && styles.chipCountTextAllActive,
                    ]}
                  >
                    {statusCounts.all}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Pending Chip */}
              <TouchableOpacity
                onPress={() => setActiveFilter('pending')}
                style={[
                  styles.filterChip,
                  activeFilter === 'pending'
                    ? styles.filterChipPendingActive
                    : styles.filterChipInactive,
                ]}
                activeOpacity={0.7}
              >
                <ClockIcon
                  size={13}
                  color={Theme.colors.statusPending}
                  strokeWidth={1.8}
                />
                <Text
                  style={[
                    styles.chipText,
                    activeFilter === 'pending' && styles.chipTextPendingActive,
                  ]}
                >
                  Pending
                </Text>
                <View style={styles.chipCountPill}>
                  <Text style={styles.chipCountText}>{statusCounts.pending}</Text>
                </View>
              </TouchableOpacity>

              {/* Overdue Chip */}
              <TouchableOpacity
                onPress={() => setActiveFilter('overdue')}
                style={[
                  styles.filterChip,
                  activeFilter === 'overdue'
                    ? styles.filterChipOverdueActive
                    : styles.filterChipInactive,
                ]}
                activeOpacity={0.7}
              >
                <AlertTriangleIcon
                  size={13}
                  color={Theme.colors.statusOverdue}
                />
                <Text
                  style={[
                    styles.chipText,
                    activeFilter === 'overdue' && styles.chipTextOverdueActive,
                  ]}
                >
                  Overdue
                </Text>
                <View style={styles.chipCountPill}>
                  <Text style={styles.chipCountText}>{statusCounts.overdue}</Text>
                </View>
              </TouchableOpacity>

              {/* Repaid Chip */}
              <TouchableOpacity
                onPress={() => setActiveFilter('repaid')}
                style={[
                  styles.filterChip,
                  activeFilter === 'repaid'
                    ? styles.filterChipRepaidActive
                    : styles.filterChipInactive,
                ]}
                activeOpacity={0.7}
              >
                <CheckIcon
                  size={13}
                  color={Theme.colors.statusRepaid}
                  strokeWidth={2.2}
                />
                <Text
                  style={[
                    styles.chipText,
                    activeFilter === 'repaid' && styles.chipTextRepaidActive,
                  ]}
                >
                  Repaid
                </Text>
                <View style={styles.chipCountPill}>
                  <Text style={styles.chipCountText}>{statusCounts.repaid}</Text>
                </View>
              </TouchableOpacity>
            </ScrollView>

            {/* List Header Count */}
            <View style={styles.resultsHeaderRow}>
              <Text style={styles.resultsHeading}>Receivable Records</Text>
              <Text style={styles.resultsCountText}>
                Showing {filteredLoans.length} {filteredLoans.length === 1 ? 'loan' : 'loans'}
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <LoanCard
            loan={item}
            onPress={(l) => setSelectedLoan(l)}
            onRepay={handleRepay}
            isRepaying={repayingId === item.id}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <ArrowUpRightIcon size={28} color="#059669" strokeWidth={2.2} />
            </View>
            <Text style={styles.emptyTitle}>No lent records found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery.trim()
                ? 'Try a different search term.'
                : activeFilter !== 'all'
                ? `No lent loans in "${activeFilter}" status.`
                : 'You have not recorded any lent money yet. Tap + to record money you lent to someone.'}
            </Text>
            <TouchableOpacity
              onPress={onOpenAddLoan}
              style={styles.emptyAddBtn}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyAddBtnText}>+ Record Lent Money</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Loan Details Modal */}
      <LoanDetailsModal
        loan={selectedLoan}
        visible={!!selectedLoan}
        onClose={() => setSelectedLoan(null)}
        onRepay={handleRepay}
        onViewRelationship={onViewRelationship}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: STATUS_BAR_HEIGHT,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.borderSubtle,
    ...Theme.shadows.sm,
  },
  titleRow: {
    justifyContent: 'center',
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerKicker: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginTop: 1,
  },
  addIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#064E3B',
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.sm,
  },
  addIconText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: -2,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 96,
  },
  headerSection: {
    marginBottom: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.lg,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Theme.colors.borderSubtle,
    marginBottom: 12,
    ...Theme.shadows.sm,
  },
  searchIconWrapper: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: Theme.colors.textPrimary,
  },
  clearSearchBtn: {
    padding: 6,
  },
  clearSearchText: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    fontWeight: '700',
  },
  metricsHeroBanner: {
    backgroundColor: '#064E3B',
    borderRadius: Theme.borderRadius.xl,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    ...Theme.shadows.floating,
  },
  bannerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metricsHeroLeft: {
    flex: 1,
  },
  metricsHeroKicker: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A7F3D0',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  metricsHeroAmount: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    marginTop: 2,
  },
  metricsOverdueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  overduePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  metricsOverdueText: {
    fontSize: 12,
    color: '#D1FAE5',
  },
  lifetimeVolumeText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 6,
  },
  metricsHeroIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 14,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.full,
    gap: 5,
  },
  filterChipInactive: {
    backgroundColor: Theme.colors.surfaceContainerLow,
  },
  filterChipAllActive: {
    backgroundColor: '#064E3B',
  },
  filterChipPendingActive: {
    backgroundColor: Theme.colors.statusPendingTint,
    borderWidth: 1,
    borderColor: Theme.colors.statusPendingBorder,
  },
  filterChipOverdueActive: {
    backgroundColor: Theme.colors.statusOverdueTint,
    borderWidth: 1,
    borderColor: Theme.colors.statusOverdueBorder,
  },
  filterChipRepaidActive: {
    backgroundColor: Theme.colors.statusRepaidTint,
    borderWidth: 1,
    borderColor: Theme.colors.statusRepaidBorder,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  chipTextAllActive: {
    color: '#FFFFFF',
  },
  chipTextPendingActive: {
    color: Theme.colors.statusPending,
  },
  chipTextOverdueActive: {
    color: Theme.colors.statusOverdue,
  },
  chipTextRepaidActive: {
    color: Theme.colors.statusRepaid,
  },
  chipCountPill: {
    backgroundColor: Theme.colors.surfaceCard,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Theme.borderRadius.full,
  },
  chipCountPillAllActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  chipCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  chipCountTextAllActive: {
    color: '#FFFFFF',
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultsHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  resultsCountText: {
    fontSize: 12,
    color: Theme.colors.textMuted,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: Theme.colors.borderSubtle,
    marginTop: 12,
  },
  emptyIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  emptyAddBtn: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Theme.borderRadius.lg,
    ...Theme.shadows.sm,
  },
  emptyAddBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
