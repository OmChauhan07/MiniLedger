// Purpose: Screen displaying complete loan directory with search, status filtering, and outstanding summaries matching MiniLedger Stitch specifications.
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
import { Theme, STATUS_BAR_HEIGHT } from '../../theme/index';
import { formatCurrencyCompact, checkIsOverdue } from '../../utils/format';

type FilterType = 'all' | 'pending' | 'overdue' | 'repaid';

interface AllLoansScreenProps {
  loans: Loan[];
  summary: Summary | null;
  isLoading: boolean;
  onRefresh: () => void;
  onRepayLoan: (loanId: string) => Promise<void>;
  onOpenAddLoan: () => void;
}

export function AllLoansScreen({
  loans,
  summary,
  isLoading,
  onRefresh,
  onRepayLoan,
  onOpenAddLoan,
}: AllLoansScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [repayingId, setRepayingId] = useState<string | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  // Categorize loans
  const counts = useMemo(() => {
    let pending = 0;
    let overdue = 0;
    let repaid = 0;

    for (const loan of loans) {
      if (loan.isRepaid) {
        repaid++;
      } else if (checkIsOverdue(loan.dueDate, false)) {
        overdue++;
      } else {
        pending++;
      }
    }

    return { all: loans.length, pending, overdue, repaid };
  }, [loans]);

  // Filtered loans list based on search and selected status chip
  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      // 1. Filter match
      if (activeFilter === 'pending') {
        if (loan.isRepaid || checkIsOverdue(loan.dueDate, false)) return false;
      } else if (activeFilter === 'overdue') {
        if (loan.isRepaid || !checkIsOverdue(loan.dueDate, false)) return false;
      } else if (activeFilter === 'repaid') {
        if (!loan.isRepaid) return false;
      }

      // 2. Search match
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const nameMatch = loan.friendName.toLowerCase().includes(query);
        const notesMatch = loan.notes ? loan.notes.toLowerCase().includes(query) : false;
        return nameMatch || notesMatch;
      }

      return true;
    });
  }, [loans, activeFilter, searchQuery]);

  const handleRepay = async (loanId: string) => {
    setRepayingId(loanId);
    try {
      await onRepayLoan(loanId);
    } finally {
      setRepayingId(null);
    }
  };

  const outstanding = parseFloat(summary?.outstandingAmount ?? '0') || 0;
  const overdue = parseFloat(summary?.overdueAmount ?? '0') || 0;

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
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search friend or note..."
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

            {/* Filter Chips Horizontal Row */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              {/* All Chip */}
              <TouchableOpacity
                onPress={() => setActiveFilter('all')}
                style={[
                  styles.filterChip,
                  activeFilter === 'all' && styles.filterChipAllActive,
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    activeFilter === 'all' && styles.chipTextAllActive,
                  ]}
                >
                  All
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
                    {counts.all}
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
                <Text style={styles.chipGlyph}>⏱</Text>
                <Text
                  style={[
                    styles.chipText,
                    activeFilter === 'pending' && styles.chipTextPendingActive,
                  ]}
                >
                  Pending
                </Text>
                <View style={styles.chipCountPill}>
                  <Text style={styles.chipCountText}>{counts.pending}</Text>
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
                <Text style={styles.chipGlyph}>⚠</Text>
                <Text
                  style={[
                    styles.chipText,
                    activeFilter === 'overdue' && styles.chipTextOverdueActive,
                  ]}
                >
                  Overdue
                </Text>
                <View style={styles.chipCountPill}>
                  <Text style={styles.chipCountText}>{counts.overdue}</Text>
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
                <Text style={styles.chipGlyph}>✓</Text>
                <Text
                  style={[
                    styles.chipText,
                    activeFilter === 'repaid' && styles.chipTextRepaidActive,
                  ]}
                >
                  Repaid
                </Text>
                <View style={styles.chipCountPill}>
                  <Text style={styles.chipCountText}>{counts.repaid}</Text>
                </View>
              </TouchableOpacity>
            </ScrollView>

            {/* Total Outstanding Metric Banner (from Stitch) */}
            <View style={styles.metricsHeroBanner}>
              <View style={styles.metricsHeroLeft}>
                <Text style={styles.metricsHeroKicker}>Total Outstanding</Text>
                <Text style={styles.metricsHeroAmount}>
                  {formatCurrencyCompact(outstanding)}
                </Text>
                {overdue > 0 && (
                  <View style={styles.metricsOverdueRow}>
                    <View style={styles.overduePulseDot} />
                    <Text style={styles.metricsOverdueText}>
                      {formatCurrencyCompact(overdue)} strictly overdue
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.metricsHeroIconBox}>
                <Text style={styles.metricsHeroIconText}>👛</Text>
              </View>
            </View>

            {/* List Header Count */}
            <View style={styles.resultsHeaderRow}>
              <Text style={styles.resultsHeading}>Active & Past Records</Text>
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
            <Text style={styles.emptySearchEmoji}>🔍</Text>
            <Text style={styles.emptySearchTitle}>No matching loans found</Text>
            <Text style={styles.emptySearchSubtitle}>
              Try clearing your search query or selecting a different status filter.
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
    marginBottom: 14,
    ...Theme.shadows.sm,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 10,
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
  chipGlyph: {
    fontSize: 12,
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
    backgroundColor: '#FECACA',
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
  metricsHeroIconText: {
    fontSize: 24,
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
  emptySearchEmoji: {
    fontSize: 32,
    marginBottom: 10,
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
