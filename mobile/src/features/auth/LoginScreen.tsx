// Purpose: Renders the modernized phone number login screen matching MiniLedger Stitch specifications.
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
  useWindowDimensions,
} from 'react-native';
import { sendOtpApi } from '../../api/auth.api.js';
import { Theme } from '../../theme/index.js';

interface LoginScreenProps {
  onOtpSent: (normalizedPhone: string) => void;
}

// Formats 10 raw digits into 5-5 grouped format (e.g. "98765 43210")
function formatPhoneInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10);
  if (digits.length > 5) {
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return digits;
}

export function LoginScreen({ onOtpSent }: LoginScreenProps) {
  const [phoneText, setPhoneText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { width } = useWindowDimensions();

  const rawDigits = phoneText.replace(/\D/g, '');
  const isValidLength = rawDigits.length === 10;

  const handlePhoneChange = (text: string) => {
    setPhoneText(formatPhoneInput(text));
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleClear = () => {
    setPhoneText('');
    setErrorMessage(null);
  };

  const handleSendOtp = async () => {
    if (!isValidLength) {
      setErrorMessage('Enter a valid 10-digit mobile number');
      return;
    }

    const normalizedPhone = `+91${rawDigits}`;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await sendOtpApi(normalizedPhone);
      setIsLoading(false);
      onOtpSent(normalizedPhone);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Unable to send OTP. Please verify your connection.');
    }
  };

  const isSmallDevice = width < 360;

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
        {/* Brand Header */}
        <View style={styles.brandContainer}>
          <View style={styles.logoWrapper}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeSymbol}>₹</Text>
            </View>
            <View style={styles.verifiedIconBadge}>
              <Text style={styles.verifiedIconText}>✓</Text>
            </View>
          </View>
          <Text style={styles.brandTitle}>MiniLedger</Text>
          <Text style={styles.brandSubtitle}>Track peer loans simply and reliably</Text>
        </View>

        {/* Main Phone Input Card */}
        <View style={styles.cardContainer}>
          {/* Welcome Banner */}
          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerIcon}>🔒</Text>
            <Text style={styles.infoBannerText}>
              Sign in with your phone number to access your lending ledger.
            </Text>
          </View>

          {/* Input Label */}
          <Text style={styles.inputLabel}>Mobile Number</Text>

          {/* Phone Input Box with +91 Chip & Clear Button */}
          <View
            style={[
              styles.inputBox,
              errorMessage ? styles.inputBoxError : isValidLength ? styles.inputBoxValid : null,
            ]}
          >
            <View style={styles.countryCodeChip}>
              <Text style={styles.flagText}>🇮🇳</Text>
              <Text style={styles.countryCodeText}>+91</Text>
              <Text style={styles.chevronDownText}>▾</Text>
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

            {phoneText.length > 0 && (
              <TouchableOpacity
                onPress={handleClear}
                style={styles.clearButton}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Validation Error Banner */}
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorIcon}>⚠</Text>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : (
            <View style={styles.helperRow}>
              <Text style={styles.helperIcon}>💬</Text>
              <Text style={styles.helperText}>
                We will send an SMS with a 6-digit verification code.
              </Text>
            </View>
          )}

          {/* Get OTP Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              isValidLength && !isLoading
                ? styles.submitButtonActive
                : styles.submitButtonDisabled,
            ]}
            onPress={handleSendOtp}
            disabled={!isValidLength || isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color={Theme.colors.onPrimary} size="small" />
            ) : (
              <View style={styles.submitBtnContent}>
                <Text
                  style={[
                    styles.submitButtonText,
                    isValidLength && !isLoading
                      ? styles.submitButtonTextActive
                      : styles.submitButtonTextDisabled,
                  ]}
                >
                  Get OTP
                </Text>
                <Text
                  style={[
                    styles.submitArrow,
                    isValidLength && !isLoading
                      ? styles.submitArrowActive
                      : styles.submitArrowDisabled,
                  ]}
                >
                  ➔
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Security & Features Bento Row */}
        <View style={styles.featuresGrid}>
          {/* 256-bit Encrypted Card */}
          <View style={styles.featureCard}>
            <View style={styles.featureIconRepaid}>
              <Text style={styles.featureGlyphGreen}>✓</Text>
            </View>
            <View style={styles.featureInfo}>
              <Text style={styles.featureLabel}>SECURITY</Text>
              <Text style={styles.featureTitle} numberOfLines={1}>
                256-bit Encrypted
              </Text>
            </View>
          </View>

          {/* Ledger Sync Card */}
          <View style={styles.featureCard}>
            <View style={styles.featureIconPrimary}>
              <Text style={styles.featureGlyphBlue}>↻</Text>
            </View>
            <View style={styles.featureInfo}>
              <Text style={styles.featureLabel}>LEDGER SYNC</Text>
              <Text style={styles.featureTitle} numberOfLines={1}>
                Instant Peer Update
              </Text>
            </View>
          </View>
        </View>

        {/* Footer info pill and agreement */}
        <View style={styles.footerContainer}>
          <View style={styles.badgePill}>
            <View style={styles.activeDot} />
            <Text style={styles.badgePillText}>Expo React Native Demo · Instant Auth</Text>
          </View>
          <Text style={styles.legalNotice}>
            By continuing, you agree to our Terms & Privacy Policy
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
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  scrollContentSmall: {
    paddingHorizontal: 14,
    paddingVertical: 18,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: Theme.borderRadius.xl,
    backgroundColor: Theme.colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.borderSubtle,
    ...Theme.shadows.sm,
  },
  logoBadgeSymbol: {
    fontSize: 32,
    fontWeight: '800',
    color: Theme.colors.primary,
  },
  verifiedIconBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Theme.colors.surfaceCard,
  },
  verifiedIconText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: Theme.colors.textSecondary,
    marginTop: 4,
  },
  cardContainer: {
    backgroundColor: Theme.colors.surfaceCard,
    borderRadius: Theme.borderRadius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: Theme.colors.borderSubtle,
    marginBottom: 20,
    ...Theme.shadows.card,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.borderRadius.md,
    padding: 12,
    marginBottom: 18,
  },
  infoBannerIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: Theme.colors.textSecondary,
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
    marginBottom: 8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: Theme.colors.borderSubtle,
    overflow: 'hidden',
  },
  inputBoxValid: {
    borderColor: Theme.colors.primary,
  },
  inputBoxError: {
    borderColor: Theme.colors.statusOverdue,
    backgroundColor: Theme.colors.statusOverdueTint,
  },
  countryCodeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLow,
    height: '100%',
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: Theme.colors.borderSubtle,
  },
  flagText: {
    fontSize: 16,
    marginRight: 4,
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  chevronDownText: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginLeft: 3,
  },
  textInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 12,
    fontSize: 17,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
    letterSpacing: 0.5,
  },
  clearButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Theme.colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.statusOverdueTint,
    borderRadius: Theme.borderRadius.sm,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 8,
  },
  errorIcon: {
    fontSize: 14,
    color: Theme.colors.statusOverdue,
    marginRight: 6,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.statusOverdue,
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  helperIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  helperText: {
    fontSize: 12,
    color: Theme.colors.textMuted,
  },
  submitButton: {
    height: 52,
    borderRadius: Theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  submitButtonActive: {
    backgroundColor: Theme.colors.primary,
    ...Theme.shadows.floating,
  },
  submitButtonDisabled: {
    backgroundColor: Theme.colors.surfaceContainerHighest,
  },
  submitBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  submitButtonTextActive: {
    color: Theme.colors.onPrimary,
  },
  submitButtonTextDisabled: {
    color: Theme.colors.textSecondary,
  },
  submitArrow: {
    fontSize: 16,
    fontWeight: '700',
  },
  submitArrowActive: {
    color: Theme.colors.onPrimary,
  },
  submitArrowDisabled: {
    color: Theme.colors.textSecondary,
  },
  featuresGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  featureCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceCard,
    borderRadius: Theme.borderRadius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: Theme.colors.borderSubtle,
    ...Theme.shadows.sm,
  },
  featureIconRepaid: {
    width: 32,
    height: 32,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Theme.colors.statusRepaidTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  featureGlyphGreen: {
    fontSize: 14,
    fontWeight: '800',
    color: Theme.colors.statusRepaid,
  },
  featureIconPrimary: {
    width: 32,
    height: 32,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Theme.colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  featureGlyphBlue: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.primary,
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
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
    marginTop: 1,
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 12,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerHigh,
    borderRadius: Theme.borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 8,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Theme.colors.statusRepaid,
    marginRight: 6,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  legalNotice: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    textAlign: 'center',
  },
});
