// Purpose: Root application component managing global authentication state, session bootstrapping, and screen routing.
// Imported by: index.ts (entry point - no direct source importers)

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { User } from './src/types/index.js';
import { getStoredToken, getStoredUser, clearStoredToken, clearStoredUser } from './src/utils/storage.js';
import { LoginScreen } from './src/features/auth/LoginScreen.js';
import { OtpScreen } from './src/features/auth/OtpScreen.js';
import { DashboardScreen } from './src/features/dashboard/DashboardScreen.js';

// Root component coordinating session initialization, auth screens, and main ledger dashboard
export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);

  // Checks for existing saved session credentials upon application startup
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

  // Completes login and transitions the user to the active ledger dashboard
  const handleAuthSuccess = (authToken: string, authUser: User) => {
    setToken(authToken);
    setUser(authUser);
    setPendingPhone(null);
  };

  // Clears active tokens and resets the navigation back to the login screen
  const handleLogout = async () => {
    await clearStoredToken();
    await clearStoredUser();
    setToken(null);
    setUser(null);
    setPendingPhone(null);
  };

  if (isInitializing) {
    return (
      <View style={styles.splashContainer}>
        <ActivityIndicator size="large" color="#0284C7" />
        <Text style={styles.splashText}>Loading MiniLedger...</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={styles.rootContainer}>
      <StatusBar style="dark" />
      {token && user ? (
        <DashboardScreen user={user} onLogout={handleLogout} />
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
    backgroundColor: '#F8FAFC',
  },
  splashContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashText: {
    marginTop: 14,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
});
