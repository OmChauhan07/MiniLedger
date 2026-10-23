// Purpose: Renders the OTP verification screen where users input the 6-digit code sent to their mobile number.
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
import { verifyOtpApi, sendOtpApi } from '../../api/auth.api.js';
import { setStoredToken, setStoredUser } from '../../utils/storage.js';
import { ErrorBanner } from '../../components/ErrorBanner.js';
import { User } from '../../types/index.js';

interface OtpScreenProps {
  phone: string;
  onVerificationSuccess: (token: string, user: User) => void;
  onChangePhone: () => void;
}

// Renders the 6-digit verification code form and manages OTP confirmation logic
export function OtpScreen({ phone, onVerificationSuccess, onChangePhone }: OtpScreenProps) {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Formats phone number for privacy display
  const maskedPhone =
    phone.length > 7
      ? `${phone.slice(0, 4)} •••• ••${phone.slice(-3)}`
      : phone;

  // Verifies the user-entered 6-digit OTP and completes authentication
  const handleVerifyOtp = async () => {
    setErrorMessage(null);
    setInfoMessage(null);
    const cleanOtp = otp.trim();

    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await verifyOtpApi(phone, cleanOtp);
      await setStoredToken(response.token);
      await setStoredUser(response.user);
      setIsLoading(false);
      onVerificationSuccess(response.token, response.user);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Verification failed. Please re-check the code.');
    }
  };

  // Re-requests a fresh verification code for the current phone number
  const handleResendOtp = async () => {
    setErrorMessage(null);
    setIsResending(true);
    try {
      await sendOtpApi(phone);
      setIsResending(false);
      setInfoMessage('A new verification code has been generated. Check server logs.');
    } catch (err: any) {
      setIsResending(false);
      setErrorMessage(err.message || 'Unable to resend OTP. Please wait a moment.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Verification Card */}
        <View style={styles.formCard}>
          <TouchableOpacity onPress={onChangePhone} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Change Number</Text>
          </TouchableOpacity>

          <Text style={styles.formTitle}>Enter Verification Code</Text>
          <Text style={styles.formSubtitle}>
            We sent a 6-digit code to{' '}
            <Text style={styles.phoneHighlight}>{maskedPhone}</Text>
          </Text>

          <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />

          {infoMessage && (
            <View style={styles.infoBanner}>
              <Text style={styles.infoBannerText}>✓ {infoMessage}</Text>
            </View>
          )}

          <Text style={styles.inputLabel}>6-DIGIT CODE</Text>
          <TextInput
            style={styles.otpInput}
            placeholder="000000"
            placeholderTextColor="#CBD5E1"
            keyboardType="number-pad"
            value={otp}
            onChangeText={(text) => {
              setOtp(text.replace(/\D/g, '').slice(0, 6));
              if (errorMessage) setErrorMessage(null);
            }}
            maxLength={6}
            autoFocus
          />

          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleVerifyOtp}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Verify & Continue</Text>
            )}
          </TouchableOpacity>

          {/* Resend Action */}
          <View style={styles.resendRow}>
            <Text style={styles.resendText}>Didn't receive the code? </Text>
            <TouchableOpacity onPress={handleResendOtp} disabled={isResending}>
              <Text style={styles.resendLink}>
                {isResending ? 'Sending...' : 'Resend Code'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Development Terminal Hint */}
          <View style={styles.devNote}>
            <Text style={styles.devNoteText}>
              💡 Development Note: Inspect your backend server terminal to view the mock OTP.
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
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    paddingVertical: 4,
  },
  backButtonText: {
    fontSize: 13,
    color: '#0284C7',
    fontWeight: '600',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  formSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 20,
    lineHeight: 18,
  },
  phoneHighlight: {
    color: '#0F172A',
    fontWeight: '700',
  },
  infoBanner: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  infoBannerText: {
    fontSize: 12,
    color: '#15803D',
    fontWeight: '500',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  otpInput: {
    height: 56,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 10,
    textAlign: 'center',
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    marginBottom: 20,
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
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
  },
  resendText: {
    fontSize: 13,
    color: '#64748B',
  },
  resendLink: {
    fontSize: 13,
    color: '#0284C7',
    fontWeight: '700',
  },
  devNote: {
    marginTop: 20,
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
