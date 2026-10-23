// Purpose: Reusable error and alert banner component for displaying API and form validation issues.
// Imported by: src/features/auth/LoginScreen.tsx, src/features/auth/OtpScreen.tsx, src/features/dashboard/DashboardScreen.tsx

import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

interface ErrorBannerProps {
  message: string | null;
  onDismiss?: () => void;
  onRetry?: () => void;
}

// Renders an alert banner with error message, retry action, and dismiss control
export function ErrorBanner({ message, onDismiss, onRetry }: ErrorBannerProps) {
  if (!message) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>⚠</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
      <View style={styles.actions}>
        {onRetry && (
          <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
            <Text style={styles.dismissText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECDD3',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  icon: {
    fontSize: 14,
    color: '#E11D48',
    marginRight: 8,
    fontWeight: '700',
  },
  message: {
    flex: 1,
    fontSize: 13,
    color: '#9F1239',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FFE4E6',
    borderRadius: 4,
  },
  retryText: {
    fontSize: 12,
    color: '#9F1239',
    fontWeight: '600',
  },
  dismissButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  dismissText: {
    fontSize: 13,
    color: '#9F1239',
    fontWeight: '600',
  },
});
