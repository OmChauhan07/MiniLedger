// Purpose: Modal dialog for editing user profile (Name, Email) with mandatory phone OTP verification before saving.
// Imported by: src/features/account/AccountScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { User } from '../types/index';
import { updateAccountProfileApi, verifyAccountUpdateApi } from '../api/account.api';
import { ShieldIcon, LockIcon, CheckIcon } from './Icons';
import { Theme } from '../theme/index';

interface EditProfileModalProps {
  visible: boolean;
  user: User;
  onClose: () => void;
  onProfileUpdated: (updatedUser: User) => void;
}

export function EditProfileModal({
  visible,
  user,
  onClose,
  onProfileUpdated,
}: EditProfileModalProps) {
  const [step, setStep] = useState<'FORM' | 'OTP'>('FORM');
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');

  // OTP step state
  const [updateToken, setUpdateToken] = useState<string | null>(null);
  const [maskedPhone, setMaskedPhone] = useState<string>('');
  const [otpCode, setOtpCode] = useState('');

  // Status and error handling
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state whenever modal opens
  useEffect(() => {
    if (visible) {
      setStep('FORM');
      setName(user.name || '');
      setEmail(user.email || '');
      setUpdateToken(null);
      setOtpCode('');
      setErrorMessage(null);
      setIsLoading(false);
    }
  }, [visible, user]);

  const handleInitiateUpdate = async () => {
    setErrorMessage(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Full name cannot be empty.');
      return;
    }

    const trimmedEmail = email.trim();
    if (trimmedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        setErrorMessage('Please enter a valid email address.');
        return;
      }
    }

    setIsLoading(true);
    try {
      const response = await updateAccountProfileApi({
        name: trimmedName,
        email: trimmedEmail || null,
      });

      if (!response.requiresOtp) {
        // No changes or updated directly
        onClose();
        return;
      }

      setUpdateToken(response.updateToken || null);
      setMaskedPhone(response.maskedPhone || user.phone);
      setStep('OTP');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to initiate profile update. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!updateToken) {
      setErrorMessage('Verification session expired. Please start over.');
      setStep('FORM');
      return;
    }

    const trimmedOtp = otpCode.trim();
    if (trimmedOtp.length !== 6 || !/^\d{6}$/.test(trimmedOtp)) {
      setErrorMessage('Please enter a valid 6-digit verification code.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);
    try {
      const response = await verifyAccountUpdateApi({
        updateToken,
        otp: trimmedOtp,
      });

      onProfileUpdated(response.user);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid verification code. Please check and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.headerKicker}>
                {step === 'FORM' ? 'ACCOUNT SETTINGS' : 'SECURITY VERIFICATION'}
              </Text>
              <Text style={styles.headerTitle}>
                {step === 'FORM' ? 'Edit Profile' : 'Enter Verification Code'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              style={styles.closeBtn}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Error Banner */}
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          ) : null}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {step === 'FORM' ? (
              <View>
                {/* Full Name */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Full Name</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your full name"
                    placeholderTextColor="#94A3B8"
                    value={name}
                    onChangeText={setName}
                    maxLength={80}
                    autoCapitalize="words"
                  />
                </View>

                {/* Email Address */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Email Address (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="name@example.com"
                    placeholderTextColor="#94A3B8"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {/* Phone Number (Read-only) */}
                <View style={styles.fieldGroup}>
                  <View style={styles.labelWithBadgeRow}>
                    <Text style={styles.fieldLabel}>Phone Number</Text>
                    <View style={styles.readOnlyBadge}>
                      <ShieldIcon size={10} color="#0F172A" />
                      <Text style={styles.readOnlyBadgeText}>Verified (Read-Only)</Text>
                    </View>
                  </View>
                  <TextInput
                    style={[styles.textInput, styles.textInputDisabled]}
                    value={user.phone}
                    editable={false}
                  />
                  <Text style={styles.helperText}>
                    Phone number modifications require a separate ownership verification process.
                  </Text>
                </View>

                {/* Security info card */}
                <View style={styles.securityInfoCard}>
                  <LockIcon size={15} color="#0F172A" />
                  <Text style={styles.securityInfoText}>
                    For your financial security, saving profile changes requires verifying an OTP code sent to your registered phone.
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={onClose}
                    activeOpacity={0.7}
                    disabled={isLoading}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.saveBtn, isLoading && styles.btnDisabled]}
                    onPress={handleInitiateUpdate}
                    activeOpacity={0.8}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.saveBtnText}>Save Profile Changes</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View>
                {/* OTP Verification Step */}
                <View style={styles.otpPromptBox}>
                  <Text style={styles.otpPromptTitle}>Verification Code Sent</Text>
                  <Text style={styles.otpPromptSubtitle}>
                    We sent a 6-digit confirmation code to{' '}
                    <Text style={{ fontWeight: '700', color: '#0F172A' }}>{maskedPhone}</Text>.
                  </Text>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>6-Digit OTP Code</Text>
                  <TextInput
                    style={[styles.textInput, styles.otpInput]}
                    placeholder="123456"
                    placeholderTextColor="#94A3B8"
                    value={otpCode}
                    onChangeText={setOtpCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                  />
                </View>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => {
                      setStep('FORM');
                      setErrorMessage(null);
                    }}
                    activeOpacity={0.7}
                    disabled={isLoading}
                  >
                    <Text style={styles.cancelBtnText}>Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.saveBtn, isLoading && styles.btnDisabled]}
                    onPress={handleVerifyOtp}
                    activeOpacity={0.8}
                    disabled={isLoading || otpCode.length !== 6}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.saveBtnText}>Verify & Confirm</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.xl,
    padding: 20,
    ...Theme.shadows.card,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.borderSubtle,
  },
  headerKicker: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.textMuted,
    letterSpacing: 0.6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginTop: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Theme.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: Theme.borderRadius.md,
    padding: 10,
    marginBottom: 14,
  },
  errorBannerText: {
    fontSize: 12,
    color: '#991B1B',
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 4,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  labelWithBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
    marginBottom: 6,
  },
  readOnlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.full,
  },
  readOnlyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  textInput: {
    height: 44,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Theme.colors.borderSubtle,
    borderRadius: Theme.borderRadius.lg,
    paddingHorizontal: 12,
    fontSize: 14,
    color: Theme.colors.textPrimary,
  },
  textInputDisabled: {
    backgroundColor: '#F1F5F9',
    color: '#64748B',
  },
  helperText: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    marginTop: 4,
  },
  securityInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Theme.borderRadius.md,
    padding: 12,
    marginTop: 4,
    marginBottom: 18,
  },
  securityInfoText: {
    flex: 1,
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },
  otpPromptBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 16,
  },
  otpPromptTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  otpPromptSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
    lineHeight: 17,
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  saveBtn: {
    flex: 2,
    height: 44,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.sm,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
