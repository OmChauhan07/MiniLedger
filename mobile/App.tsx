// Purpose: Root application component managing authentication state, session bootstrapping, and Stitch tab navigation.
// Imported by: index.ts (entry point - no direct source importers)

import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { User, Loan, Summary, CreateLoanPayload } from './src/types/index.js';
import { getStoredToken, getStoredUser, clearStoredToken, clearStoredUser } from './src/utils/storage.js';
import { fetchSummaryApi } from './src/api/summary.api.js';
import { fetchLoansApi, markLoanRepaidApi, createLoanApi } from './src/api/loan.api.js';
import { LoginScreen } from './src/features/auth/LoginScreen.js';
import { OtpScreen } from './src/features/auth/OtpScreen.js';
import { DashboardScreen } from './src/features/dashboard/DashboardScreen.js';
import { AllLoansScreen } from './src/features/loans/AllLoansScreen.js';
import { AccountScreen } from './src/features/account/AccountScreen.js';
import { BottomNav, TabKey } from './src/components/BottomNav.js';
import { AddLoanModal } from './src/components/AddLoanModal.js';
import { Toast } from './src/components/Toast.js';
import { Theme } from './src/theme/index.js';
import { formatCurrencyCompact } from './src/utils/format.js';

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);

  // Authenticated tab and ledger state
  const [currentTab, setCurrentTab] = useState<TabKey>('dashboard');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLedgerLoading, setIsLedgerLoading] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  // Restores saved session from secure storage
  useEffect(() => {
    async function restoreSession() {
      try {
        const storedToken = await getStoredToken();
        const storedUser = await getStoredUser();
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
        }
      } catch (err) {
        console.warn('Failed to restore user session:', err);
      } finally {
        setIsInitializing(false);
      }
    }
    restoreSession();
  }, []);

  // Loads ledger data when user logs in
  const loadLedgerData = useCallback(async () => {
    if (!token) return;
    setIsLedgerLoading(true);
    try {
      const [summaryData, loansData] = await Promise.all([
        fetchSummaryApi(),
        fetchLoansApi(),
      ]);
      setSummary(summaryData);
      setLoans(loansData);
    } catch (err: any) {
      console.warn('Failed to load ledger data:', err);
    } finally {
      setIsLedgerLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadLedgerData();
    }
  }, [token, loadLedgerData]);

  const handleAuthSuccess = (authToken: string, authUser: User) => {
    setToken(authToken);
    setUser(authUser);
    setPendingPhone(null);
    setCurrentTab('dashboard');
  };

  const handleLogout = async () => {
    await clearStoredToken();
    await clearStoredUser();
    setToken(null);
    setUser(null);
    setPendingPhone(null);
    setLoans([]);
    setSummary(null);
    setCurrentTab('dashboard');
  };

  const handleRepayLoan = async (loanId: string) => {
    const target = loans.find((l) => l.id === loanId);
    try {
      const updated = await markLoanRepaidApi(loanId);
      setLoans((prev) => prev.map((l) => (l.id === loanId ? updated : l)));
      const freshSummary = await fetchSummaryApi();
      setSummary(freshSummary);

      const debtor = target ? target.friendName : 'Loan';
      const amountStr = target ? formatCurrencyCompact(target.amount) : '';
      setToastMessage(`${amountStr} from ${debtor} marked repaid!`);
      setToastVisible(true);
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to mark loan as repaid.');
      setToastVisible(true);
    }
  };

  const handleCreateLoan = async (payload: CreateLoanPayload) => {
    await createLoanApi(payload);
    await loadLedgerData();
    setToastMessage(`Loan of ${formatCurrencyCompact(payload.amount)} saved!`);
    setToastVisible(true);
  };

  if (isInitializing) {
    return (
      <View style={styles.splashContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.splashText}>Loading MiniLedger...</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={styles.rootContainer}>
      <StatusBar style="dark" />

      {/* Global Toast Notification */}
      <Toast
        visible={toastVisible}
        message={toastMessage || ''}
        type="success"
        onDismiss={() => setToastVisible(false)}
      />

      {token && user ? (
        <View style={styles.authenticatedShell}>
          {/* Active Screen based on Tab */}
          <View style={styles.screenContainer}>
            {currentTab === 'dashboard' && (
              <DashboardScreen
                user={user}
                onLogout={handleLogout}
                onNavigateToAllLoans={() => setCurrentTab('all-loans')}
                onNavigateToAccount={() => setCurrentTab('account')}
                onOpenAddLoan={() => setIsAddModalVisible(true)}
              />
            )}
            {currentTab === 'all-loans' && (
              <AllLoansScreen
                loans={loans}
                summary={summary}
                isLoading={isLedgerLoading}
                onRefresh={loadLedgerData}
                onRepayLoan={handleRepayLoan}
                onOpenAddLoan={() => setIsAddModalVisible(true)}
              />
            )}
            {currentTab === 'account' && (
              <AccountScreen
                user={user}
                summary={summary}
                totalLoansCount={loans.length}
                onLogout={handleLogout}
              />
            )}
          </View>

          {/* Bottom 4-Tab Navigation Bar */}
          <BottomNav
            currentTab={currentTab}
            onSelectTab={setCurrentTab}
            onAddLoanPress={() => setIsAddModalVisible(true)}
          />

          {/* Global Add Loan Modal */}
          <AddLoanModal
            visible={isAddModalVisible}
            onClose={() => setIsAddModalVisible(false)}
            onSubmit={handleCreateLoan}
          />
        </View>
      ) : pendingPhone ? (
        <OtpScreen
          phone={pendingPhone}
          onVerificationSuccess={handleAuthSuccess}
          onChangePhone={() => setPendingPhone(null)}
        />
      ) : (
        <LoginScreen onOtpSent={(phone) => setPendingPhone(phone)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  authenticatedShell: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
  splashContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashText: {
    marginTop: 14,
    fontSize: 14,
    color: Theme.colors.textMuted,
    fontWeight: '500',
  },
});
