// Purpose: Main dashboard screen displaying the financial summary, loan list, and actions for adding and settling loans.
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { User, Loan, Summary, CreateLoanPayload } from '../../types/index.js';
import { fetchSummaryApi } from '../../api/summary.api.js';
import { fetchLoansApi, markLoanRepaidApi, createLoanApi } from '../../api/loan.api.js';
import { SummaryCards } from '../../components/SummaryCards.js';
import { LoanCard } from '../../components/LoanCard.js';
import { AddLoanModal } from '../../components/AddLoanModal.js';
import { ErrorBanner } from '../../components/ErrorBanner.js';

interface DashboardScreenProps {
  user: User;
  onLogout: () => void;
}

// Renders the main ledger dashboard with live aggregates, loan cards, and modal triggers
export function DashboardScreen({ user, onLogout }: DashboardScreenProps) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [repayingLoanId, setRepayingLoanId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  // Loads latest lending statistics and loan entries concurrently from the API
  const loadDashboardData = useCallback(async () => {
    setErrorMessage(null);
    try {
      const [summaryData, loansData] = await Promise.all([
        fetchSummaryApi(),
        fetchLoansApi(),
      ]);
      setSummary(summaryData);
      setLoans(loansData);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to fetch ledger data. Pull down to refresh.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initializes dashboard state on screen mount
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handles pull-to-refresh gestures
  const handleRefresh = () => {
    setIsRefreshing(true);
    loadDashboardData();
  };

  // Marks an outstanding or overdue loan as repaid and updates local ledger metrics
  const handleRepay = async (loanId: string) => {
    setRepayingLoanId(loanId);
    setErrorMessage(null);
    try {
      const updatedLoan = await markLoanRepaidApi(loanId);
      // Immediately reflect the status change in the local loan list
      setLoans((prev) =>
        prev.map((item) => (item.id === loanId ? updatedLoan : item))
      );
      // Refresh summary metrics to update outstanding and repaid balances
      const freshSummary = await fetchSummaryApi();
      setSummary(freshSummary);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to mark loan as repaid.');
    } finally {
      setRepayingLoanId(null);
    }
  };

  // Submits a new loan to the API and refreshes dashboard statistics and loans
  const handleCreateLoan = async (payload: CreateLoanPayload) => {
    await createLoanApi(payload);
    await loadDashboardData();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Top Application Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.appTitle}>MiniLedger</Text>
          <Text style={styles.userPhone}>{user.phone}</Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={styles.logoutButton} activeOpacity={0.7}>
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={styles.loadingText}>Loading your ledger...</Text>
        </View>
      ) : (
        <FlatList
          data={loans}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#0284C7']}
            />
          }
          ListHeaderComponent={
            <View>
              <ErrorBanner
                message={errorMessage}
                onDismiss={() => setErrorMessage(null)}
                onRetry={loadDashboardData}
              />

              {/* Summary Cards Grid */}
              <SummaryCards summary={summary} />

              {/* Section Header */}
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Loans</Text>
                  <Text style={styles.sectionSubtitle}>
                    {loans.length} {loans.length === 1 ? 'entry' : 'entries'} recorded
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setIsAddModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addButtonText}>+ Add Loan</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <LoanCard
              loan={item}
              onRepay={handleRepay}
              isRepaying={repayingLoanId === item.id}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                <Text style={styles.emptyIcon}>🤝</Text>
              </View>
              <Text style={styles.emptyTitle}>No loans recorded yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the button below to add your first loan and start tracking friend balances.
              </Text>
              <TouchableOpacity
                style={styles.emptyActionButton}
                onPress={() => setIsAddModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyActionText}>+ Record First Loan</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Add Loan Modal Form */}
      <AddLoanModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onSubmit={handleCreateLoan}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  userPhone: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  logoutButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
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
    color: '#64748B',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  addButton: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginTop: 8,
  },
  emptyIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyIcon: {
    fontSize: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyActionButton: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
