// Purpose: Dedicated phone + password login screen with link to signup and legacy account upgrade support.
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
import { loginApi, legacySetupSendOtpApi, legacySetupVerifyApi } from '../../api/auth.api';
import { User } from '../../types/index';
import { Theme, STATUS_BAR_HEIGHT } from '../../theme/index';

interface LoginScreenProps {
  onLoginSuccess: (token: string, user: User) => void;
  onNavigateToSignup: () => void;
}

export function LoginScreen({ onLoginSuccess, onNavigateToSignup }: LoginScreenProps) {
  const [phoneText, setPhoneText] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Legacy User Password Setup Modal State
  const [isLegacySetup, setIsLegacySetup] = useState(false);
  const [legacyOtp, setLegacyOtp] = useState('');
  const [legacyNewPassword, setLegacyNewPassword] = useState('');
  const [legacyInfoMessage, setLegacyInfoMessage] = useState<string | null>(null);

  const rawPhoneDigits = phoneText.replace(/\D/g, '');
  const isPhoneValid = rawPhoneDigits.length === 10;
  const isFormValid = isPhoneValid && password.length > 0;

  const handlePhoneChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 10);
    if (digits.length > 5) {
      setPhoneText(`${digits.slice(0, 5)} ${digits.slice(5)}`);
    } else {
      setPhoneText(digits);
    }
    setErrorMessage(null);
  };

  const handleLogin = async () => {
    if (!isPhoneValid) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    const normalizedPhone = `+91${rawPhoneDigits}`;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await loginApi(normalizedPhone, password);
      setIsLoading(false);
      onLoginSuccess(res.token, res.user);
    } catch (err: any) {
      setIsLoading(false);
      if (err.code === 'PASSWORD_NOT_SET') {
        // Trigger legacy OTP setup flow
        setIsLegacySetup(true);
        setLegacyInfoMessage('Your account was created before passwords. We sent an OTP to set your password.');
        try {
          await legacySetupSendOtpApi(normalizedPhone);
        } catch {
          // Handled in dialog
        }
      } else {
        setErrorMessage(err.message || 'Invalid mobile number or password.');
      }
    }
  };

  const handleLegacyUpgrade = async () => {
    if (legacyOtp.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit OTP.');
      return;
    }
    if (legacyNewPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters.');
      return;
    }

    const normalizedPhone = `+91${rawPhoneDigits}`;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await legacySetupVerifyApi({
        phone: normalizedPhone,
        otp: legacyOtp.trim(),
        password: legacyNewPassword,
      });
      setIsLoading(false);
      setIsLegacySetup(false);
      onLoginSuccess(res.token, res.user);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Failed to verify OTP or set password.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeSymbol}>₹</Text>
          </View>
          <Text style={styles.brandTitle}>MiniLedger</Text>
          <Text style={styles.brandSubtitle}>Personal loan ledger & settlement</Text>
        </View>

        {/* Main Login Card */}
        <View style={styles.cardContainer}>
          <Text style={styles.cardHeaderTitle}>
            {isLegacySetup ? 'Set Account Password' : 'Sign In'}
          </Text>

          {legacyInfoMessage && (
            <View style={styles.infoBanner}>
              <Text style={styles.infoText}>{legacyInfoMessage}</Text>
            </View>
          )}

          {errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorIcon}>⚠</Text>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {!isLegacySetup ? (
            /* Normal Login Form */
            <View>
              {/* Phone Input */}
              <Text style={styles.inputLabel}>Mobile Number</Text>
              <View style={[styles.inputBox, isPhoneValid && styles.inputBoxValid]}>
                <View style={styles.countryCodeChip}>
                  <Text style={styles.flagText}>🇮🇳</Text>
                  <Text style={styles.countryCodeText}>+91</Text>
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="98765 43210"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                  maxLength={11}
                  value={phoneText}
                  onChangeText={handlePhoneChange}
                  autoFocus
                />
              </View>

              {/* Password Input */}
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    setErrorMessage(null);
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.toggleVisibilityBtn}
                >
                  <Text style={styles.toggleVisibilityText}>{showPassword ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  isFormValid && !isLoading ? styles.submitButtonActive : styles.submitButtonDisabled,
                ]}
                onPress={handleLogin}
                disabled={!isFormValid || isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Log In ➔</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* Legacy Password Setup Form */
            <View>
              <Text style={styles.inputLabel}>Enter 6-Digit OTP</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInput}
                  placeholder="123456"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={legacyOtp}
                  onChangeText={(t) => setLegacyOtp(t)}
                  autoFocus
                />
              </View>

              <Text style={styles.inputLabel}>Create New Password (min 8 chars)</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Choose password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  value={legacyNewPassword}
                  onChangeText={(t) => setLegacyNewPassword(t)}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, styles.submitButtonActive]}
                onPress={handleLegacyUpgrade}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Save Password & Log In ➔</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsLegacySetup(false)}
                style={styles.cancelLegacyBtn}
              >
                <Text style={styles.cancelLegacyText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Link to Signup Screen */}
        <View style={styles.signupPromptRow}>
          <Text style={styles.signupPromptText}>Don't have an account?</Text>
          <TouchableOpacity onPress={onNavigateToSignup}>
            <Text style={styles.signupLinkText}>Create Account</Text>
          </TouchableOpacity>
        </View>

        {/* Security Bento Highlights */}
        <View style={styles.featuresGrid}>
          <View style={styles.featureCard}>
            <View style={styles.featureIconBadge}>
              <Text style={styles.featureIconText}>✓</Text>
            </View>
            <View style={styles.featureInfo}>
              <Text style={styles.featureLabel}>SECURITY</Text>
              <Text style={styles.featureTitle}>Encrypted Hashing</Text>
            </View>
          </View>
          <View style={styles.featureCard}>
            <View style={styles.featureIconBadge}>
              <Text style={styles.featureIconText}>⇅</Text>
            </View>
            <View style={styles.featureInfo}>
              <Text style={styles.featureLabel}>SETTLEMENT</Text>
              <Text style={styles.featureTitle}>Auto Netting</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    paddingTop: STATUS_BAR_HEIGHT,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: Theme.borderRadius.xl,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  logoBadgeSymbol: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    marginTop: 4,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: Theme.colors.borderSubtle,
    marginBottom: 16,
    ...Theme.shadows.card,
  },
  cardHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 14,
  },
  infoBanner: {
    backgroundColor: '#F1F5F9',
    borderRadius: Theme.borderRadius.md,
    padding: 10,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#0F172A',
  },
  infoText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.statusOverdueTint,
    borderRadius: Theme.borderRadius.sm,
    padding: 10,
    marginBottom: 12,
  },
  errorIcon: {
    fontSize: 14,
    color: Theme.colors.statusOverdue,
    marginRight: 6,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.statusOverdue,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
    marginBottom: 6,
    marginTop: 10,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: Theme.colors.borderSubtle,
    overflow: 'hidden',
  },
  inputBoxValid: {
    borderColor: '#0F172A',
  },
  countryCodeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    height: '100%',
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: Theme.colors.borderSubtle,
  },
  flagText: {
    fontSize: 14,
    marginRight: 4,
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  textInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 12,
    fontSize: 15,
    color: Theme.colors.textPrimary,
  },
  toggleVisibilityBtn: {
    paddingHorizontal: 12,
  },
  toggleVisibilityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  submitButton: {
    height: 50,
    borderRadius: Theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  submitButtonActive: {
    backgroundColor: '#0F172A',
    ...Theme.shadows.floating,
  },
  submitButtonDisabled: {
    backgroundColor: '#E2E8F0',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelLegacyBtn: {
    alignItems: 'center',
    marginTop: 12,
  },
  cancelLegacyText: {
    fontSize: 13,
    color: '#64748B',
    textDecorationLine: 'underline',
  },
  signupPromptRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  signupPromptText: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
  },
  signupLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    textDecorationLine: 'underline',
  },
  featuresGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  featureCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: Theme.colors.borderSubtle,
    ...Theme.shadows.sm,
  },
  featureIconBadge: {
    width: 28,
    height: 28,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  featureIconText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  featureInfo: {
    flex: 1,
  },
  featureLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Theme.colors.textMuted,
    letterSpacing: 0.5,
  },
  featureTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
    marginTop: 1,
  },
});
