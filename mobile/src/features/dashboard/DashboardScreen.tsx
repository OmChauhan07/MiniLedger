// Purpose: Modernized dashboard screen featuring Bento metric cards, quick ledger actions, recent loans, and toast feedback matching MiniLedger Stitch specifications.
// Imported by: App.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { User, Loan, Summary, CreateLoanPayload } from '../../types/index';
import { fetchSummaryApi } from '../../api/summary.api';
import { fetchLoansApi, markLoanRepaidApi, createLoanApi } from '../../api/loan.api';
import { SummaryCards } from '../../components/SummaryCards';
import { LoanCard } from '../../components/LoanCard';
import { AddLoanModal } from '../../components/AddLoanModal';
import { LoanDetailsModal } from '../../components/LoanDetailsModal';
import { Toast } from '../../components/Toast';
import { EyeIcon, BoltIcon, WalletIcon } from '../../components/Icons';
import { Theme, STATUS_BAR_HEIGHT } from '../../theme/index';
import { formatCurrencyCompact, getInitials } from '../../utils/format';

interface DashboardScreenProps {
  user: User;
  onLogout: () => void;
  onNavigateToAllLoans?: () => void;
  onNavigateToAccount?: () => void;
  onOpenAddLoan?: () => void;
  externalAddModalVisible?: boolean;
  onCloseExternalAddModal?: () => void;
}

export function DashboardScreen({
  user,
  onLogout,
  onNavigateToAllLoans,
  onNavigateToAccount,
  onOpenAddLoan,
  externalAddModalVisible,
  onCloseExternalAddModal,
}: DashboardScreenProps) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [repayingLoanId, setRepayingLoanId] = useState<string | null>(null);
  const [localAddModalVisible, setLocalAddModalVisible] = useState(false);
  const [emptyPreviewMode, setEmptyPreviewMode] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  const { width } = useWindowDimensions();

  const isAddModalVisible =
    externalAddModalVisible !== undefined ? externalAddModalVisible : localAddModalVisible;
  const setAddModalVisible = (visible: boolean) => {
    if (visible && onOpenAddLoan) {
      onOpenAddLoan();
    } else if (!visible && onCloseExternalAddModal) {
      onCloseExternalAddModal();
    } else {
      setLocalAddModalVisible(visible);
    }
  };

  const loadDashboardData = useCallback(async () => {
    try {
      const [summaryData, loansData] = await Promise.all([
        fetchSummaryApi(),
        fetchLoansApi(),
      ]);
      setSummary(summaryData);
      setLoans(loansData);
    } catch (err: any) {
      setToastMessage(err.message || 'Unable to fetch ledger data. Pull to refresh.');
      setToastVisible(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadDashboardData();
  };

  const handleRepay = async (loanId: string) => {
    const targetLoan = loans.find((l) => l.id === loanId);
    setRepayingLoanId(loanId);
    try {
      const updatedLoan = await markLoanRepaidApi(loanId);
      setLoans((prev) => prev.map((item) => (item.id === loanId ? updatedLoan : item)));

      const freshSummary = await fetchSummaryApi();
      setSummary(freshSummary);

      const debtorName = targetLoan ? targetLoan.friendName : 'Loan';
      const amountStr = targetLoan ? formatCurrencyCompact(targetLoan.amount) : '';
      setToastMessage(`${amountStr} from ${debtorName} marked repaid!`);
      setToastVisible(true);
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to mark loan as repaid.');
      setToastVisible(true);
    } finally {
      setRepayingLoanId(null);
    }
  };

  const handleCreateLoan = async (payload: CreateLoanPayload) => {
    await createLoanApi(payload);
    await loadDashboardData();
    setToastMessage(`Loan of ${formatCurrencyCompact(payload.amount)} saved!`);
    setToastVisible(true);
  };

  const userInitial = user.phone ? user.phone.slice(-2) : 'RM';
  const overdueCount = loans.filter((l) => {
    if (l.isRepaid) return false;
    const today = new Date().toISOString().slice(0, 10);
    return l.dueDate < today;
  }).length;

  const displayLoans = emptyPreviewMode ? [] : loans;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Floating Micro Toast */}
      <Toast
        visible={toastVisible}
        message={toastMessage || ''}
        type="success"
        onDismiss={() => setToastVisible(false)}
      />

      {/* Sticky Top Header */}
      <View style={styles.headerBar}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadgeSmall}>
            <Text style={styles.logoBadgeText}>₹</Text>
          </View>
          <View style={styles.brandTitleCol}>
            <Text style={styles.brandKicker}>MiniLedger</Text>
            <Text style={styles.brandPageTitle}>Dashboard</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={onNavigateToAccount}
          style={styles.profileAvatarButton}
          activeOpacity={0.8}
        >
          <Text style={styles.profileAvatarText}>{userInitial}</Text>
        </TouchableOpacity>
      </View>

      {/* Main Body */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loadingText}>Syncing ledger overview...</Text>
        </View>
      ) : (
        <FlatList
          style={styles.mainContainer}
          data={displayLoans}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[Theme.colors.primary]}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeaderWrapper}>
              {/* Greeting & Preview Toggle Banner */}
              <View style={styles.greetingRow}>
                <View style={styles.greetingCol}>
                  <View style={styles.greetingTitleRow}>
                    <Text style={styles.greetingName}>
                      Hi, {user.phone ? user.phone.slice(-4) : 'User'}
                    </Text>
                    <View style={styles.activeOnlinePill}>
                      <View style={styles.activeOnlineDot} />
                      <Text style={styles.activeOnlineText}>Active</Text>
                    </View>
                  </View>
                  <Text style={styles.greetingSubtitle}>Here is your financial overview today</Text>
                </View>

                {/* Preview Empty Mode Toggle (from Stitch specs) */}
                <TouchableOpacity
                  onPress={() => setEmptyPreviewMode((prev) => !prev)}
                  style={styles.previewToggleBtn}
                  activeOpacity={0.7}
                >
                  <EyeIcon size={13} color={Theme.colors.textSecondary} />
                  <Text style={styles.previewToggleText}>
                    {emptyPreviewMode ? 'Active View' : 'Demo Empty'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 2x2 Bento Metric Grid */}
              <SummaryCards
                summary={summary}
                totalLoansCount={loans.length}
                overdueLoansCount={overdueCount}
              />

              {/* Quick Action Banner */}
              <View style={styles.quickActionCard}>
                <View style={styles.quickActionHeader}>
                  <View style={styles.quickActionIconCircle}>
                    <BoltIcon size={14} color="#FFFFFF" />
                  </View>
                  <View style={styles.quickActionTextCol}>
                    <Text style={styles.quickActionTitle}>Quick Ledger Actions</Text>
                    <Text style={styles.quickActionSubtitle}>
                      Record transfers or inspect ledger logs
                    </Text>
                  </View>
                </View>

                <View style={styles.quickActionButtonsRow}>
                  <TouchableOpacity
                    style={styles.addLoanQuickBtn}
                    onPress={() => setAddModalVisible(true)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.addLoanQuickIcon}>+</Text>
                    <Text style={styles.addLoanQuickText}>Add Loan</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.filterQuickBtn}
                    onPress={onNavigateToAllLoans}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.filterQuickIcon}>⚙</Text>
                    <Text style={styles.filterQuickText}>Filter Ledger</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Recent Loans Section Header */}
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.sectionHeading}>Recent Loans</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{displayLoans.length} total</Text>
                  </View>
                </View>

                {loans.length > 0 && onNavigateToAllLoans && (
                  <TouchableOpacity
                    onPress={onNavigateToAllLoans}
                    style={styles.seeAllBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.seeAllText}>See all ({loans.length})</Text>
                    <Text style={styles.seeAllChevron}>➔</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <LoanCard
              loan={item}
              onPress={(l) => setSelectedLoan(l)}
              onRepay={handleRepay}
              isRepaying={repayingLoanId === item.id}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <WalletIcon size={26} color={Theme.colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>All settled up!</Text>
              <Text style={styles.emptySubtitle}>
                Zero active loans on your ledger. Kickstart a clean slate or record your first debtor.
              </Text>
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => {
                  setEmptyPreviewMode(false);
                  setAddModalVisible(true);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.emptyAddBtnText}>+ Add First Loan</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Loan Details Modal */}
      <LoanDetailsModal
        loan={selectedLoan}
        visible={!!selectedLoan}
        onClose={() => setSelectedLoan(null)}
        onRepay={handleRepay}
      />

      {/* Add Loan Modal Form */}
      <AddLoanModal
        visible={isAddModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSubmit={handleCreateLoan}
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
  headerBar: {
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
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadgeSmall: {
    width: 36,
    height: 36,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: Theme.colors.borderSubtle,
  },
  logoBadgeText: {
    fontSize: 20,
    fontWeight: '800',
    color: Theme.colors.primary,
  },
  brandTitleCol: {
    justifyContent: 'center',
  },
  brandKicker: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  brandPageTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  profileAvatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.sm,
  },
  profileAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Theme.colors.textSecondary,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 96,
  },
  listHeaderWrapper: {
    marginBottom: 6,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  greetingCol: {
    flex: 1,
  },
  greetingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greetingName: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  activeOnlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  activeOnlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  activeOnlineText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
  },
  greetingSubtitle: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  previewToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerHigh,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Theme.borderRadius.full,
    gap: 4,
  },
  previewToggleIcon: {
    fontSize: 12,
  },
  previewToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  quickActionCard: {
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.borderRadius.xl,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Theme.colors.borderSubtle,
  },
  quickActionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  quickActionGlyph: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  quickActionTextCol: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  quickActionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  addLoanQuickBtn: {
    flex: 1,
    height: 44,
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...Theme.shadows.sm,
  },
  addLoanQuickIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addLoanQuickText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  filterQuickBtn: {
    flex: 1,
    height: 44,
    backgroundColor: Theme.colors.surfaceCard,
    borderRadius: Theme.borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.borderSubtle,
    gap: 6,
    ...Theme.shadows.sm,
  },
  filterQuickIcon: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  filterQuickText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  countBadge: {
    backgroundColor: Theme.colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.full,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.primary,
  },
  seeAllChevron: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 42,
    paddingHorizontal: 24,
    backgroundColor: Theme.colors.surfaceCard,
    borderRadius: Theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: Theme.colors.borderSubtle,
    marginTop: 6,
    ...Theme.shadows.sm,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Theme.colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyIconText: {
    fontSize: 30,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 260,
    marginBottom: 18,
  },
  emptyAddBtn: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Theme.borderRadius.lg,
    ...Theme.shadows.sm,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
