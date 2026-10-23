// Purpose: Screen displaying complete loan directory with search, direction tabs, status filtering, and direction-aware outstanding summaries matching MiniLedger Stitch specifications.
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
import { Loan, Summary, LoanDirection } from '../../types/index';
import { LoanCard } from '../../components/LoanCard';
import { LoanDetailsModal } from '../../components/LoanDetailsModal';
import {
  SearchIcon,
  AlertTriangleIcon,
  CheckIcon,
  WalletIcon,
  ClockIcon,
  ArrowUpRightIcon,
  ArrowDownLeftIcon,
} from '../../components/Icons';
import { Theme, STATUS_BAR_HEIGHT } from '../../theme/index';
import { formatCurrencyCompact, checkIsOverdue } from '../../utils/format';

type DirectionFilter = 'ALL' | 'LENT' | 'BORROWED';
type StatusFilter = 'all' | 'pending' | 'overdue' | 'repaid';

interface AllLoansScreenProps {
  loans: Loan[];
  summary: Summary | null;
  isLoading: boolean;
  onRefresh: () => void;
  onRepayLoan: (loanId: string) => Promise<void>;
  onOpenAddLoan: () => void;
  onViewRelationship?: (counterpartyId: string) => void;
}

export function AllLoansScreen({
  loans,
  summary,
  isLoading,
  onRefresh,
  onRepayLoan,
  onOpenAddLoan,
  onViewRelationship,
}: AllLoansScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('ALL');
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');
  const [repayingId, setRepayingId] = useState<string | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  // Direction counts across all loans
  const directionCounts = useMemo(() => {
    let lent = 0;
    let borrowed = 0;
    for (const loan of loans) {
      if ((loan.type ?? 'LENT') === 'BORROWED') {
        borrowed++;
      } else {
        lent++;
      }
    }
    return { all: loans.length, lent, borrowed };
  }, [loans]);

  // Loans filtered by the active direction tab
  const directionFilteredLoans = useMemo(() => {
    if (directionFilter === 'ALL') return loans;
    return loans.filter((l) => (l.type ?? 'LENT') === directionFilter);
  }, [loans, directionFilter]);

  // Categorize status counts for the selected direction
  const statusCounts = useMemo(() => {
    let pending = 0;
    let overdue = 0;
    let repaid = 0;

    for (const loan of directionFilteredLoans) {
      if (loan.isRepaid) {
        repaid++;
      } else if (checkIsOverdue(loan.dueDate, false)) {
        overdue++;
      } else {
        pending++;
      }
    }

    return { all: directionFilteredLoans.length, pending, overdue, repaid };
  }, [directionFilteredLoans]);

  // Filtered loans list based on search, direction, and selected status chip
  const filteredLoans = useMemo(() => {
    return directionFilteredLoans.filter((loan) => {
      // 1. Status Filter match
      if (activeFilter === 'pending') {
        if (loan.isRepaid || checkIsOverdue(loan.dueDate, false)) return false;
      } else if (activeFilter === 'overdue') {
        if (loan.isRepaid || !checkIsOverdue(loan.dueDate, false)) return false;
      } else if (activeFilter === 'repaid') {
        if (!loan.isRepaid) return false;
      }

      // 2. Search match (friend name, notes, or direction)
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const nameMatch = loan.friendName.toLowerCase().includes(query);
        const notesMatch = loan.notes ? loan.notes.toLowerCase().includes(query) : false;
        const typeMatch =
          (loan.type ?? 'LENT').toLowerCase().includes(query) ||
          (loan.type === 'BORROWED' && query.includes('borrow')) ||
          ((loan.type === 'LENT' || !loan.type) && query.includes('lent'));
        return nameMatch || notesMatch || typeMatch;
      }

      return true;
    });
  }, [directionFilteredLoans, activeFilter, searchQuery]);

  const handleRepay = async (loanId: string) => {
    setRepayingId(loanId);
    try {
      await onRepayLoan(loanId);
    } finally {
      setRepayingId(null);
    }
  };

  // Metric values
  const outstandingLent = parseFloat(summary?.outstandingLent ?? summary?.outstandingAmount ?? '0') || 0;
  const outstandingBorrowed = parseFloat(summary?.outstandingBorrowed ?? '0') || 0;
  const overdueReceivable = parseFloat(summary?.overdueReceivable ?? summary?.overdueAmount ?? '0') || 0;
  const overduePayable = parseFloat(summary?.overduePayable ?? '0') || 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Header Bar */}
      <View style={styles.topHeader}>
        <View style={styles.titleRow}>
          <Text style={styles.headerKicker}>MiniLedger</Text>
          <Text style={styles.headerTitle}>All Loans</Text>
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
                placeholder="Search friend, note, lent or borrowed..."
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

            {/* Direction Selector Tabs (All | Lent | Borrowed) */}
            <View style={styles.directionSegmentContainer}>
              <TouchableOpacity
                onPress={() => setDirectionFilter('ALL')}
                style={[
                  styles.directionSegmentBtn,
                  directionFilter === 'ALL' && styles.directionSegmentBtnActive,
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.directionSegmentText,
                    directionFilter === 'ALL' && styles.directionSegmentTextActive,
                  ]}
                >
                  All Loans
                </Text>
                <View
                  style={[
                    styles.directionCountBadge,
                    directionFilter === 'ALL' && styles.directionCountBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.directionCountBadgeText,
                      directionFilter === 'ALL' && styles.directionCountBadgeTextActive,
                    ]}
                  >
                    {directionCounts.all}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setDirectionFilter('LENT')}
                style={[
                  styles.directionSegmentBtn,
                  directionFilter === 'LENT' && styles.directionSegmentBtnActiveLent,
                ]}
                activeOpacity={0.7}
              >
                <ArrowUpRightIcon
                  size={12}
                  color={directionFilter === 'LENT' ? '#FFFFFF' : '#059669'}
                  strokeWidth={2}
                />
                <Text
                  style={[
                    styles.directionSegmentText,
                    directionFilter === 'LENT' && styles.directionSegmentTextActive,
                  ]}
                >
                  Lent
                </Text>
                <View
                  style={[
                    styles.directionCountBadge,
                    directionFilter === 'LENT' && styles.directionCountBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.directionCountBadgeText,
                      directionFilter === 'LENT' && styles.directionCountBadgeTextActive,
                    ]}
                  >
                    {directionCounts.lent}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setDirectionFilter('BORROWED')}
                style={[
                  styles.directionSegmentBtn,
                  directionFilter === 'BORROWED' && styles.directionSegmentBtnActiveBorrowed,
                ]}
                activeOpacity={0.7}
              >
                <ArrowDownLeftIcon
                  size={12}
                  color={directionFilter === 'BORROWED' ? '#FFFFFF' : '#D97706'}
                  strokeWidth={2}
                />
                <Text
                  style={[
                    styles.directionSegmentText,
                    directionFilter === 'BORROWED' && styles.directionSegmentTextActive,
                  ]}
                >
                  Borrowed
                </Text>
                <View
                  style={[
                    styles.directionCountBadge,
                    directionFilter === 'BORROWED' && styles.directionCountBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.directionCountBadgeText,
                      directionFilter === 'BORROWED' && styles.directionCountBadgeTextActive,
                    ]}
                  >
                    {directionCounts.borrowed}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Status Filter Chips Row (Counts dynamically reflect selected direction) */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              {/* All Status Chip */}
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
                  All Status
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

            {/* Direction-Aware Outstanding Metric Banner */}
            {directionFilter === 'ALL' ? (
              <View style={styles.dualMetricsBanner}>
                {/* Left: They Owe You (Lent) */}
                <View style={styles.dualMetricCol}>
                  <View style={styles.dualMetricHeaderRow}>
                    <ArrowUpRightIcon size={13} color="#34D399" strokeWidth={2.4} />
                    <Text style={styles.dualMetricKickerLent}>They Owe You</Text>
                  </View>
                  <Text style={styles.dualMetricAmount}>
                    {formatCurrencyCompact(outstandingLent)}
                  </Text>
                  <Text style={styles.dualMetricSubtext}>
                    {overdueReceivable > 0
                      ? `${formatCurrencyCompact(overdueReceivable)} overdue`
                      : '0 overdue'}
                  </Text>
                </View>

                {/* Center Divider */}
                <View style={styles.dualMetricDivider} />

                {/* Right: You Owe Them (Borrowed) */}
                <View style={styles.dualMetricCol}>
                  <View style={styles.dualMetricHeaderRow}>
                    <ArrowDownLeftIcon size={13} color="#FBBF24" strokeWidth={2.4} />
                    <Text style={styles.dualMetricKickerBorrowed}>You Owe Them</Text>
                  </View>
                  <Text style={styles.dualMetricAmount}>
                    {formatCurrencyCompact(outstandingBorrowed)}
                  </Text>
                  <Text style={styles.dualMetricSubtext}>
                    {overduePayable > 0
                      ? `${formatCurrencyCompact(overduePayable)} overdue`
                      : '0 overdue'}
                  </Text>
                </View>
              </View>
            ) : directionFilter === 'LENT' ? (
              <View style={[styles.metricsHeroBanner, styles.bannerLentTheme]}>
                <View style={styles.metricsHeroLeft}>
                  <View style={styles.bannerBadgeRow}>
                    <ArrowUpRightIcon size={12} color="#34D399" strokeWidth={2.4} />
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
                </View>
                <View style={styles.metricsHeroIconBox}>
                  <WalletIcon size={24} color="#FFFFFF" strokeWidth={2} />
                </View>
              </View>
            ) : (
              <View style={[styles.metricsHeroBanner, styles.bannerBorrowedTheme]}>
                <View style={styles.metricsHeroLeft}>
                  <View style={styles.bannerBadgeRow}>
                    <ArrowDownLeftIcon size={12} color="#FBBF24" strokeWidth={2.4} />
                    <Text style={styles.metricsHeroKicker}>Total Borrowed (To Pay)</Text>
                  </View>
                  <Text style={styles.metricsHeroAmount}>
                    {formatCurrencyCompact(outstandingBorrowed)}
                  </Text>
                  <View style={styles.metricsOverdueRow}>
                    <View
                      style={[
                        styles.overduePulseDot,
                        { backgroundColor: overduePayable > 0 ? '#FECACA' : '#FED7AA' },
                      ]}
                    />
                    <Text style={styles.metricsOverdueText}>
                      {overduePayable > 0
                        ? `${formatCurrencyCompact(overduePayable)} strictly overdue to pay`
                        : 'All borrowed obligations on track'}
                    </Text>
                  </View>
                </View>
                <View style={styles.metricsHeroIconBox}>
                  <WalletIcon size={24} color="#FFFFFF" strokeWidth={2} />
                </View>
              </View>
            )}

            {/* List Header Count */}
            <View style={styles.resultsHeaderRow}>
              <Text style={styles.resultsHeading}>
                {directionFilter === 'ALL'
                  ? 'All Ledger Records'
                  : directionFilter === 'LENT'
                  ? 'Lent Records (Receivables)'
                  : 'Borrowed Records (Payables)'}
              </Text>
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
          <View style={styles.emptySearchContainer}>
            <View style={styles.emptySearchIconBox}>
              <SearchIcon size={32} color={Theme.colors.textMuted} strokeWidth={1.5} />
            </View>
            <Text style={styles.emptySearchTitle}>No matching loans found</Text>
            <Text style={styles.emptySearchSubtitle}>
              {searchQuery.trim()
                ? 'Try clearing your search query or switching tabs.'
                : `No ${directionFilter !== 'ALL' ? directionFilter.toLowerCase() : ''} loans match the selected "${activeFilter}" filter.`}
            </Text>
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
  headerKicker: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  addIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.primary,
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
  directionSegmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: Theme.borderRadius.lg,
    padding: 4,
    marginBottom: 12,
    gap: 4,
  },
  directionSegmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: Theme.borderRadius.md,
    gap: 5,
  },
  directionSegmentBtnActive: {
    backgroundColor: Theme.colors.primary,
    ...Theme.shadows.sm,
  },
  directionSegmentBtnActiveLent: {
    backgroundColor: '#064E3B',
    ...Theme.shadows.sm,
  },
  directionSegmentBtnActiveBorrowed: {
    backgroundColor: '#78350F',
    ...Theme.shadows.sm,
  },
  directionSegmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  directionSegmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  directionCountBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: Theme.borderRadius.full,
  },
  directionCountBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  directionCountBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  directionCountBadgeTextActive: {
    color: '#FFFFFF',
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
    backgroundColor: Theme.colors.textPrimary,
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
  dualMetricsBanner: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.xl,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    ...Theme.shadows.floating,
  },
  dualMetricCol: {
    flex: 1,
  },
  dualMetricHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  dualMetricKickerLent: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6EE7B7',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dualMetricKickerBorrowed: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FCD34D',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dualMetricAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  dualMetricSubtext: {
    fontSize: 11,
    color: Theme.colors.onPrimaryContainer,
    marginTop: 2,
  },
  dualMetricDivider: {
    width: 1,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 12,
  },
  metricsHeroBanner: {
    backgroundColor: Theme.colors.primaryContainer,
    borderRadius: Theme.borderRadius.xl,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    ...Theme.shadows.floating,
  },
  bannerLentTheme: {
    backgroundColor: '#064E3B',
  },
  bannerBorrowedTheme: {
    backgroundColor: '#78350F',
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
    color: Theme.colors.onPrimaryContainer,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  metricsHeroAmount: {
    fontSize: 24,
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
    color: Theme.colors.onPrimaryContainer,
  },
  metricsHeroIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
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
  emptySearchContainer: {
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
  emptySearchIconBox: {
    marginBottom: 12,
  },
  emptySearchTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: 4,
  },
  emptySearchSubtitle: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
