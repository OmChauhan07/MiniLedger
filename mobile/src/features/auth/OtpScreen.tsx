// Purpose: Renders the modernized 6-slot OTP verification screen matching MiniLedger Stitch specifications.
// Imported by: App.tsx

import React, { useState, useEffect, useRef } from 'react';
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
  useWindowDimensions,
} from 'react-native';
import { verifyOtpApi, sendOtpApi } from '../../api/auth.api';
import { maskPhoneNumber } from '../../utils/format';
import { User } from '../../types/index';
import { Theme, STATUS_BAR_HEIGHT } from '../../theme/index';

interface OtpScreenProps {
  phone: string;
  onVerificationSuccess: (token: string, user: User) => void;
  onChangePhone: () => void;
}

const TOTAL_SLOTS = 6;
const COUNTDOWN_INITIAL_SECONDS = 45;

export function OtpScreen({ phone, onVerificationSuccess, onChangePhone }: OtpScreenProps) {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(COUNTDOWN_INITIAL_SECONDS);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const inputRef = useRef<any>(null);
  const { width } = useWindowDimensions();

  // Resend countdown timer interval
  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  const handleTextChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, TOTAL_SLOTS);
    setOtp(cleaned);
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleClearSlots = () => {
    setOtp('');
    setErrorMessage(null);
    inputRef.current?.focus();
  };

  const handleVerify = async () => {
    if (otp.length !== TOTAL_SLOTS) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      const response = await verifyOtpApi(phone, otp);
      setIsLoading(false);
      onVerificationSuccess(response.token, response.user);
    } catch (err: any) {
      setIsLoading(false);
      const remaining = attemptsRemaining !== null ? Math.max(0, attemptsRemaining - 1) : 2;
      setAttemptsRemaining(remaining);
      setErrorMessage(
        err.message ||
          (remaining > 0
            ? `The code entered is incorrect. ${remaining} attempts remaining.`
            : 'Verification failed. Please request a new code.')
      );
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;

    setIsResending(true);
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      await sendOtpApi(phone);
      setIsResending(false);
      setCountdown(COUNTDOWN_INITIAL_SECONDS);
      setSuccessNotice('New verification code dispatched via SMS.');
      setAttemptsRemaining(3);
      setOtp('');
      inputRef.current?.focus();
    } catch (err: any) {
      setIsResending(false);
      setErrorMessage(err.message || 'Unable to resend OTP. Please wait a moment.');
    }
  };

  const isSmallDevice = width < 360;
  const isComplete = otp.length === TOTAL_SLOTS;
  const formattedCountdown = `0:${countdown < 10 ? '0' : ''}${countdown}`;
  const maskedDisplay = maskPhoneNumber(phone);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isSmallDevice && styles.scrollContentSmall,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Invalid OTP / Status Banner */}
        {errorMessage && (
          <View style={styles.errorBannerContainer}>
            <View style={styles.errorIconBadge}>
              <Text style={styles.errorIconText}>!</Text>
            </View>
            <View style={styles.errorContent}>
              <Text style={styles.errorHeading}>Invalid OTP</Text>
              <Text style={styles.errorMessageText}>{errorMessage}</Text>
            </View>
            <TouchableOpacity
              onPress={handleClearSlots}
              style={styles.retryButton}
              activeOpacity={0.8}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Success Notice Banner */}
        {successNotice && (
          <View style={styles.successBanner}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successText}>{successNotice}</Text>
          </View>
        )}

        {/* Step Header */}
        <View style={styles.headerContainer}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeIcon}>🛡</Text>
            <Text style={styles.stepBadgeText}>Step 2 of 2 • Instant Auth</Text>
          </View>

          <Text style={styles.screenTitle}>Verify phone number</Text>

          <View style={styles.phoneDetailsRow}>
            <Text style={styles.subtextPrompt}>Enter the 6-digit code sent via SMS to </Text>
            <Text style={styles.maskedPhoneText}>{maskedDisplay}</Text>
            <TouchableOpacity onPress={onChangePhone} style={styles.editNumberBtn} activeOpacity={0.7}>
              <Text style={styles.editNumberText}>Edit number</Text>
              <Text style={styles.editIcon}>✎</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Visual 6-Slot OTP Container Card */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => inputRef.current?.focus()}
          style={styles.otpCard}
        >
          {/* Hidden TextInput handling OS input & autocorrect */}
          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            value={otp}
            onChangeText={handleTextChange}
            keyboardType="number-pad"
            maxLength={TOTAL_SLOTS}
            autoFocus
          />

          <View style={styles.slotsRow}>
            {Array.from({ length: TOTAL_SLOTS }).map((_, index) => {
              const char = otp[index] || '';
              const isFocused = index === otp.length;
              const isFilled = index < otp.length;

              return (
                <View
                  key={index}
                  style={[
                    styles.slotBox,
                    isSmallDevice && styles.slotBoxSmall,
                    isFocused && styles.slotBoxFocused,
                    isFilled && styles.slotBoxFilled,
                  ]}
                >
                  {char ? (
                    <Text style={styles.slotDigit}>{char}</Text>
                  ) : isFocused ? (
                    <View style={styles.focusedIndicator} />
                  ) : (
                    <View style={styles.emptyIndicatorDot} />
                  )}
                </View>
              );
            })}
          </View>

          {/* Security Note */}
          <View style={styles.securityHintRow}>
            <Text style={styles.securityHintIcon}>🔒</Text>
            <Text style={styles.securityHintText}>
              MiniLedger keeps your financial credentials encrypted
            </Text>
          </View>
        </TouchableOpacity>

        {/* Countdown & Resend Section */}
        <View style={styles.resendSection}>
          <View style={styles.timerRow}>
            <Text style={styles.timerClockIcon}>⏱</Text>
            <Text style={styles.timerLabel}>Resend code in</Text>
            <View style={styles.timerPill}>
              <Text style={styles.timerPillText}>{formattedCountdown}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleResend}
            disabled={countdown > 0 || isResending}
            style={styles.resendButton}
            activeOpacity={0.7}
          >
            {isResending ? (
              <ActivityIndicator size="small" color={Theme.colors.primary} />
            ) : (
              <Text
                style={[
                  styles.resendButtonText,
                  countdown === 0 ? styles.resendActiveText : styles.resendDisabledText,
                ]}
              >
                Resend via SMS ↻
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Verify CTA Button */}
        <TouchableOpacity
          style={[
            styles.verifyButton,
            isComplete && !isLoading
              ? styles.verifyButtonActive
              : styles.verifyButtonDisabled,
          ]}
          onPress={handleVerify}
          disabled={!isComplete || isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color={Theme.colors.onPrimary} size="small" />
          ) : (
            <View style={styles.verifyBtnContent}>
              <Text
                style={[
                  styles.verifyButtonText,
                  isComplete ? styles.verifyTextActive : styles.verifyTextDisabled,
                ]}
              >
                Verify & Continue
              </Text>
              <Text
                style={[
                  styles.verifyArrow,
                  isComplete ? styles.verifyTextActive : styles.verifyTextDisabled,
                ]}
              >
                ➔
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Development Tip Banner */}
        <View style={styles.devTipCard}>
          <Text style={styles.devTipText}>
            💡 Development Mode: The mock OTP code is printed directly to your backend server logs.
          </Text>
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
  scrollContentSmall: {
    paddingHorizontal: 12,
    paddingVertical: 18,
  },
  errorBannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.statusOverdueTint,
    borderRadius: Theme.borderRadius.xl,
    padding: 12,
    borderWidth: 1,
    borderColor: Theme.colors.statusOverdueBorder,
    marginBottom: 20,
    ...Theme.shadows.sm,
  },
  errorIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Theme.colors.statusOverdue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  errorIconText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  errorContent: {
    flex: 1,
    marginRight: 8,
  },
  errorHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.statusOverdue,
  },
  errorMessageText: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  retryButton: {
    backgroundColor: Theme.colors.statusOverdue,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: Theme.borderRadius.full,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.statusRepaidTint,
    borderRadius: Theme.borderRadius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: Theme.colors.statusRepaidBorder,
    marginBottom: 16,
  },
  successIcon: {
    fontSize: 14,
    color: Theme.colors.statusRepaid,
    marginRight: 8,
    fontWeight: '700',
  },
  successText: {
    fontSize: 12,
    color: Theme.colors.statusRepaid,
    fontWeight: '600',
  },
  headerContainer: {
    marginBottom: 20,
  },
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Theme.colors.surfaceContainerHigh,
    borderRadius: Theme.borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  stepBadgeIcon: {
    fontSize: 12,
    marginRight: 5,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  phoneDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  subtextPrompt: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
  },
  maskedPhoneText: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  editNumberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  editNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  editIcon: {
    fontSize: 12,
    color: Theme.colors.primary,
    marginLeft: 2,
  },
  otpCard: {
    backgroundColor: Theme.colors.surfaceCard,
    borderRadius: Theme.borderRadius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: Theme.colors.borderSubtle,
    marginBottom: 18,
    ...Theme.shadows.card,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  slotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  slotBox: {
    flex: 1,
    height: 52,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  slotBoxSmall: {
    height: 44,
  },
  slotBoxFocused: {
    borderColor: Theme.colors.primary,
    backgroundColor: '#FFFFFF',
    ...Theme.shadows.sm,
  },
  slotBoxFilled: {
    borderColor: Theme.colors.borderSubtle,
    backgroundColor: Theme.colors.surfaceCard,
  },
  slotDigit: {
    fontSize: 24,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  focusedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.primary,
  },
  emptyIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.outlineVariant,
  },
  securityHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  securityHintIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  securityHintText: {
    fontSize: 11,
    color: Theme.colors.textMuted,
  },
  resendSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerClockIcon: {
    fontSize: 13,
    marginRight: 4,
  },
  timerLabel: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginRight: 6,
  },
  timerPill: {
    backgroundColor: Theme.colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.full,
  },
  timerPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  resendButton: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  resendButtonText: {
    fontSize: 13,
  },
  resendActiveText: {
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  resendDisabledText: {
    color: Theme.colors.textMuted,
    fontWeight: '500',
  },
  verifyButton: {
    height: 52,
    borderRadius: Theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  verifyButtonActive: {
    backgroundColor: Theme.colors.primaryContainer,
    ...Theme.shadows.floating,
  },
  verifyButtonDisabled: {
    backgroundColor: Theme.colors.surfaceContainerHighest,
  },
  verifyBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  verifyButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  verifyTextActive: {
    color: Theme.colors.onPrimary,
  },
  verifyTextDisabled: {
    color: Theme.colors.textSecondary,
  },
  verifyArrow: {
    fontSize: 16,
    fontWeight: '700',
  },
  devTipCard: {
    padding: 12,
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.borderSubtle,
    alignItems: 'center',
  },
  devTipText: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});
