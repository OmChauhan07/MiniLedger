// Purpose: Root application component managing authentication state, session bootstrapping, and Stitch tab navigation.
// Imported by: index.ts (entry point - no direct source importers)

import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ActivityIndicator, Text, Platform, StatusBar as RNStatusBar } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { User, Loan, Summary, CreateLoanPayload, LoanDirection } from './src/types/index';
import { getStoredToken, getStoredUser, setStoredToken, setStoredUser, clearStoredToken, clearStoredUser } from './src/utils/storage';
import { fetchSummaryApi } from './src/api/summary.api';
import { fetchLoansApi, markLoanRepaidApi, createLoanApi } from './src/api/loan.api';
import { LoginScreen } from './src/features/auth/LoginScreen';
import { SignupScreen } from './src/features/auth/SignupScreen';
import { OtpScreen } from './src/features/auth/OtpScreen';
import { DashboardScreen } from './src/features/dashboard/DashboardScreen';
import { LentLoansScreen } from './src/features/loans/LentLoansScreen';
import { BorrowedLoansScreen } from './src/features/loans/BorrowedLoansScreen';
import { AllLoansScreen } from './src/features/loans/AllLoansScreen';
import { AccountScreen } from './src/features/account/AccountScreen';
import { BottomNav, TabKey } from './src/components/BottomNav';
import { AddLoanModal } from './src/components/AddLoanModal';
import { Toast } from './src/components/Toast';
import { Theme } from './src/theme/index';
import { formatCurrencyCompact } from './src/utils/format';

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);

  // Authenticated tab and ledger state
  const [currentTab, setCurrentTab] = useState<TabKey>('dashboard');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLedgerLoading, setIsLedgerLoading] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [modalDefaultDirection, setModalDefaultDirection] = useState<LoanDirection>('LENT');

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  // Restores saved session from secure storage
  useEffect(() => {
    if (Platform.OS === 'android') {
      (RNStatusBar as any).setTranslucent?.(true);
      (RNStatusBar as any).setBackgroundColor?.('transparent', true);
    }
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

  const handleAuthSuccess = async (authToken: string, authUser: User) => {
    setToken(authToken);
    setUser(authUser);
    setPendingPhone(null);
    setCurrentTab('dashboard');
    try {
      await setStoredToken(authToken);
      await setStoredUser(authUser);
    } catch (err) {
      console.warn('Failed to persist session:', err);
    }
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

      const isLent = target ? (target.type ?? 'LENT') === 'LENT' : true;
      const counterparty = target ? target.friendName : 'Loan';
      const amountStr = target ? formatCurrencyCompact(target.amount) : '';
      setToastMessage(
        isLent
          ? `${amountStr} from ${counterparty} marked repaid!`
          : `${amountStr} to ${counterparty} marked as paid!`
      );
      setToastVisible(true);
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to update repayment status.');
      setToastVisible(true);
    }
  };

  const handleCreateLoan = async (payload: CreateLoanPayload) => {
    await createLoanApi(payload);
    await loadLedgerData();
    const isLent = (payload.type ?? 'LENT') === 'LENT';
    const amountStr = formatCurrencyCompact(payload.amount);
    setToastMessage(
      isLent
        ? `Lent ${amountStr} to ${payload.friendName} recorded!`
        : `Borrowed ${amountStr} from ${payload.friendName} recorded!`
    );
    setToastVisible(true);
  };

  const openAddLent = () => {
    setModalDefaultDirection('LENT');
    setIsAddModalVisible(true);
  };

  const openAddBorrowed = () => {
    setModalDefaultDirection('BORROWED');
    setIsAddModalVisible(true);
  };

  const openAddFromNav = () => {
    if (currentTab === 'borrowed') {
      setModalDefaultDirection('BORROWED');
    } else {
      setModalDefaultDirection('LENT');
    }
    setIsAddModalVisible(true);
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
                onNavigateToLent={() => setCurrentTab('lent')}
                onNavigateToBorrowed={() => setCurrentTab('borrowed')}
                onNavigateToAccount={() => setCurrentTab('account')}
                onOpenAddLoan={openAddFromNav}
              />
            )}
            {currentTab === 'lent' && (
              <LentLoansScreen
                loans={loans}
                summary={summary}
                isLoading={isLedgerLoading}
                onRefresh={loadLedgerData}
                onRepayLoan={handleRepayLoan}
                onOpenAddLoan={openAddLent}
              />
            )}
            {currentTab === 'borrowed' && (
              <BorrowedLoansScreen
                loans={loans}
                summary={summary}
                isLoading={isLedgerLoading}
                onRefresh={loadLedgerData}
                onRepayLoan={handleRepayLoan}
                onOpenAddLoan={openAddBorrowed}
              />
            )}
            {currentTab === 'all-loans' && (
              <AllLoansScreen
                loans={loans}
                summary={summary}
                isLoading={isLedgerLoading}
                onRefresh={loadLedgerData}
                onRepayLoan={handleRepayLoan}
                onOpenAddLoan={openAddFromNav}
              />
            )}
            {currentTab === 'account' && (
              <AccountScreen
                user={user}
                summary={summary}
                loans={loans}
                totalLoansCount={loans.length}
                onLogout={handleLogout}
              />
            )}
          </View>

          {/* Bottom 5-Tab Navigation Bar with Lent and Borrowed */}
          <BottomNav
            currentTab={currentTab}
            onSelectTab={setCurrentTab}
            onAddLoanPress={openAddFromNav}
          />

          {/* Global Add Loan Modal */}
          <AddLoanModal
            visible={isAddModalVisible}
            onClose={() => setIsAddModalVisible(false)}
            onSubmit={handleCreateLoan}
            defaultDirection={modalDefaultDirection}
          />
        </View>
      ) : pendingPhone ? (
        <OtpScreen
          phone={pendingPhone}
          onVerificationSuccess={handleAuthSuccess}
          onChangePhone={() => setPendingPhone(null)}
        />
      ) : authMode === 'SIGNUP' ? (
        <SignupScreen
          onAuthSuccess={handleAuthSuccess}
          onNavigateToLogin={() => setAuthMode('LOGIN')}
        />
      ) : (
        <LoginScreen
          onLoginSuccess={handleAuthSuccess}
          onNavigateToSignup={() => setAuthMode('SIGNUP')}
        />
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
