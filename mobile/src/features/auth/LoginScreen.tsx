// Purpose: Renders the phone number login screen where users input their mobile number to receive an OTP.
// Imported by: App.tsx

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { sendOtpApi } from '../../api/auth.api.js';
import { ErrorBanner } from '../../components/ErrorBanner.js';

interface LoginScreenProps {
  onOtpSent: (normalizedPhone: string) => void;
}

// Renders the phone entry form with validation and OTP dispatch trigger
export function LoginScreen({ onOtpSent }: LoginScreenProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Validates phone format and requests a one-time verification code from the API
  const handleSendOtp = async () => {
    setErrorMessage(null);
    const cleanDigits = phoneNumber.trim().replace(/\D/g, '');

    // Ensure valid length for 10-digit Indian numbers or E.164
    if (cleanDigits.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    // Default to +91 country code for 10-digit numbers
    const formattedPhone = cleanDigits.length === 10 ? `+91${cleanDigits}` : `+${cleanDigits}`;

    setIsLoading(true);
    try {
      await sendOtpApi(formattedPhone);
      setIsLoading(false);
      onOtpSent(formattedPhone);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Unable to send OTP. Please verify your connection.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Brand Header */}
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>₹</Text>
          </View>
          <Text style={styles.appTitle}>MiniLedger</Text>
          <Text style={styles.appSubtitle}>Personal Lending Ledger</Text>
          <Text style={styles.appDescription}>
            Keep track of money lent to friends, manage due dates, and monitor settlements with zero clutter.
          </Text>
        </View>

        {/* Login Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Sign In / Register</Text>
          <Text style={styles.formSubtitle}>Enter your phone number to receive a secure login code</Text>

          <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />

          <Text style={styles.inputLabel}>MOBILE NUMBER</Text>
          <View style={styles.phoneInputRow}>
            <View style={styles.countryCodeBox}>
              <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder="98765 43210"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={(text) => {
                setPhoneNumber(text);
                if (errorMessage) setErrorMessage(null);
              }}
              maxLength={15}
              autoFocus
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSendOtp}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Continue with OTP</Text>
            )}
          </TouchableOpacity>

          {/* Dev Helper Notice */}
          <View style={styles.devNote}>
            <Text style={styles.devNoteText}>
              💡 Development Mode: The 6-digit mock OTP is logged to your backend server terminal.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  logoBadgeText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#38BDF8',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    marginTop: 4,
  },
  appDescription: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 18,
    maxWidth: 280,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  phoneInputRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  countryCodeBox: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  phoneInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: '#CBD5E1',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#0284C7',
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  devNote: {
    marginTop: 16,
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  devNoteText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
});
