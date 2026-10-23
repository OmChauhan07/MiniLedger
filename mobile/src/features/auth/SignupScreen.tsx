// Purpose: Step-by-step new user registration screen (Phone -> OTP verification -> Profile & password setup).
// Imported by: App.tsx

import React, { useState, useEffect } from 'react';
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
import {
  registerSendOtpApi,
  registerVerifyOtpApi,
  registerCompleteApi,
} from '../../api/auth.api';
import { User } from '../../types/index';
import { Theme, STATUS_BAR_HEIGHT } from '../../theme/index';

interface SignupScreenProps {
  onAuthSuccess: (token: string, user: User) => void;
  onNavigateToLogin: () => void;
}

type SignupStep = 'PHONE' | 'OTP' | 'PROFILE';

export function SignupScreen({ onAuthSuccess, onNavigateToLogin }: SignupScreenProps) {
  const [step, setStep] = useState<SignupStep>('PHONE');

  // Step 1: Phone
  const [phoneText, setPhoneText] = useState('');
  const [normalizedPhone, setNormalizedPhone] = useState('');

  // Step 2: OTP
  const [otpText, setOtpText] = useState('');
  const [signupToken, setSignupToken] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Step 3: Profile
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Common UI State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (step === 'OTP' && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [step, countdown]);

  const rawPhoneDigits = phoneText.replace(/\D/g, '');
  const isPhoneValid = rawPhoneDigits.length === 10;

  // Format 10 digits as "98765 43210"
  const handlePhoneChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 10);
    if (digits.length > 5) {
      setPhoneText(`${digits.slice(0, 5)} ${digits.slice(5)}`);
    } else {
      setPhoneText(digits);
    }
    setErrorMessage(null);
  };

  // Step 1: Request Registration OTP
  const handleSendOtp = async () => {
    if (!isPhoneValid) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    const phone = `+91${rawPhoneDigits}`;
    setNormalizedPhone(phone);
    setIsLoading(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const res = await registerSendOtpApi(phone);
      setIsLoading(false);

      if (res.isExistingUser) {
        setErrorMessage('An account with this number already exists. Please log in.');
        return;
      }

      setStep('OTP');
      setCountdown(30);
      setCanResend(false);
      setInfoMessage('Verification code sent! Check your development terminal log.');
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Unable to send verification OTP.');
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await registerSendOtpApi(normalizedPhone);
      setIsLoading(false);
      setCountdown(30);
      setCanResend(false);
      setInfoMessage('New OTP sent! Check development terminal.');
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Failed to resend code.');
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    const cleanedOtp = otpText.trim();
    if (cleanedOtp.length !== 6) {
      setErrorMessage('Please enter the 6-digit code.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await registerVerifyOtpApi(normalizedPhone, cleanedOtp);
      setIsLoading(false);
      setSignupToken(res.signupToken);
      setStep('PROFILE');
      setInfoMessage(null);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Invalid or expired verification code.');
    }
  };

  // Step 3: Complete Profile & Create Account
  const handleCompleteSignup = async () => {
    if (fullName.trim().length < 2) {
      setErrorMessage('Please enter your full name (minimum 2 characters).');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please check and retype.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await registerCompleteApi({
        signupToken,
        name: fullName.trim(),
        email: email.trim().length > 0 ? email.trim() : undefined,
        password,
      });

      setIsLoading(false);
      onAuthSuccess(res.token, res.user);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Failed to create account. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeSymbol}>₹</Text>
          </View>
          <Text style={styles.brandTitle}>Create Account</Text>
          <Text style={styles.brandSubtitle}>
            {step === 'PHONE' && 'Step 1 of 3: Verify your mobile number'}
            {step === 'OTP' && 'Step 2 of 3: Enter 6-digit verification code'}
            {step === 'PROFILE' && 'Step 3 of 3: Set up your profile & password'}
          </Text>
        </View>

        {/* Step Progress Pills */}
        <View style={styles.stepIndicatorRow}>
          <View style={[styles.stepDot, styles.stepDotActive]} />
          <View style={[styles.stepLine, step !== 'PHONE' && styles.stepLineActive]} />
          <View style={[styles.stepDot, step !== 'PHONE' && styles.stepDotActive]} />
          <View style={[styles.stepLine, step === 'PROFILE' && styles.stepLineActive]} />
          <View style={[styles.stepDot, step === 'PROFILE' && styles.stepDotActive]} />
        </View>

        {/* Form Card */}
        <View style={styles.cardContainer}>
          {infoMessage && (
            <View style={styles.infoBanner}>
              <Text style={styles.infoText}>{infoMessage}</Text>
            </View>
          )}

          {errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorIcon}>⚠</Text>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* STEP 1: PHONE */}
          {step === 'PHONE' && (
            <View>
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

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  isPhoneValid && !isLoading ? styles.buttonActive : styles.buttonDisabled,
                ]}
                onPress={handleSendOtp}
                disabled={!isPhoneValid || isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Get Verification Code ➔</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: OTP */}
          {step === 'OTP' && (
            <View>
              <View style={styles.phoneBadgeRow}>
                <Text style={styles.phoneBadgeLabel}>Code sent to:</Text>
                <Text style={styles.phoneBadgeValue}>{normalizedPhone}</Text>
                <TouchableOpacity onPress={() => setStep('PHONE')}>
                  <Text style={styles.changePhoneLink}>Change</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>6-Digit Verification Code</Text>
              <View style={styles.otpInputBox}>
                <TextInput
                  style={styles.otpTextInput}
                  placeholder="••••••"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otpText}
                  onChangeText={(val) => {
                    setOtpText(val.replace(/\D/g, '').slice(0, 6));
                    setErrorMessage(null);
                  }}
                  autoFocus
                />
              </View>

              <View style={styles.resendRow}>
                {countdown > 0 ? (
                  <Text style={styles.countdownText}>Resend code in {countdown}s</Text>
                ) : (
                  <TouchableOpacity onPress={handleResendOtp} disabled={isLoading}>
                    <Text style={styles.resendLink}>Resend Code</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  otpText.length === 6 && !isLoading ? styles.buttonActive : styles.buttonDisabled,
                ]}
                onPress={handleVerifyOtp}
                disabled={otpText.length !== 6 || isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Verify & Continue ➔</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3: PROFILE SETUP */}
          {step === 'PROFILE' && (
            <View>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Priya Sharma"
                  placeholderTextColor="#94A3B8"
                  value={fullName}
                  onChangeText={(t) => {
                    setFullName(t);
                    setErrorMessage(null);
                  }}
                  autoFocus
                />
              </View>

              <Text style={styles.inputLabel}>Email Address (Optional)</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. priya@example.com"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    setErrorMessage(null);
                  }}
                />
              </View>

              <Text style={styles.inputLabel}>Password * (min 8 characters)</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Create strong password"
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

              <Text style={styles.inputLabel}>Confirm Password *</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Retype password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  value={confirmPassword}
                  onChangeText={(t) => {
                    setConfirmPassword(t);
                    setErrorMessage(null);
                  }}
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, styles.buttonActive]}
                onPress={handleCompleteSignup}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Complete Registration ➔</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Switch to Login Link */}
        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Already have an account?</Text>
          <TouchableOpacity onPress={onNavigateToLogin}>
            <Text style={styles.switchLink}>Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    paddingTop: STATUS_BAR_HEIGHT,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: Theme.borderRadius.xl,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  logoBadgeSymbol: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    marginTop: 4,
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#CBD5E1',
  },
  stepDotActive: {
    backgroundColor: '#0F172A',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: '#0F172A',
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: Theme.colors.borderSubtle,
    ...Theme.shadows.card,
    marginBottom: 16,
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
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.statusOverdueTint,
    borderRadius: Theme.borderRadius.md,
    padding: 10,
    marginBottom: 14,
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
  otpInputBox: {
    height: 52,
    backgroundColor: '#F8FAFC',
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpTextInput: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 8,
    textAlign: 'center',
    color: '#0F172A',
    width: '100%',
  },
  phoneBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: Theme.borderRadius.md,
    marginBottom: 14,
    gap: 8,
  },
  phoneBadgeLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  phoneBadgeValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  changePhoneLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    textDecorationLine: 'underline',
  },
  resendRow: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  countdownText: {
    fontSize: 12,
    color: '#64748B',
  },
  resendLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  toggleVisibilityBtn: {
    paddingHorizontal: 12,
  },
  toggleVisibilityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  primaryButton: {
    height: 50,
    borderRadius: Theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonActive: {
    backgroundColor: '#0F172A',
    ...Theme.shadows.floating,
  },
  buttonDisabled: {
    backgroundColor: '#E2E8F0',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  switchText: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
  },
  switchLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    textDecorationLine: 'underline',
  },
});
