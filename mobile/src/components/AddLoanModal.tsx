// Purpose: Modernized Add Loan modal bottom sheet matching MiniLedger Stitch specifications.
// Imported by: DashboardScreen.tsx, AllLoansScreen.tsx, App.tsx

import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { CreateLoanPayload } from '../types/index.js';
import { Theme } from '../theme/index.js';

interface AddLoanModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateLoanPayload) => Promise<void>;
}

const PRESET_AMOUNTS = [500, 1000, 2000, 5000];
const CONTACT_SUGGESTIONS = ['Priya Sharma', 'Karan Dave', 'Sneha Rao', 'Aarav Verma'];

export function AddLoanModal({ visible, onClose, onSubmit }: AddLoanModalProps) {
  const [friendName, setFriendName] = useState('');
  const [amount, setAmount] = useState('5000');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  const [notes, setNotes] = useState('');
  const [receiptSimulated, setReceiptSimulated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { height } = useWindowDimensions();

  const setQuickDate = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setDueDate(`${y}-${m}-${day}`);
  };

  const handleSave = async () => {
    setError(null);

    const trimmedName = friendName.trim();
    if (!trimmedName) {
      setError('Please enter borrower name.');
      return;
    }

    const trimmedAmount = amount.trim();
    if (!trimmedAmount || isNaN(parseFloat(trimmedAmount)) || parseFloat(trimmedAmount) <= 0) {
      setError('Please enter a valid positive loan amount.');
      return;
    }

    if (!/^\d+(\.\d{1,2})?$/.test(trimmedAmount)) {
      setError('Amount can have at most two decimal places.');
      return;
    }

    const trimmedDate = dueDate.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) {
      setError('Due date must be in YYYY-MM-DD format.');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        friendName: trimmedName,
        amount: trimmedAmount,
        dueDate: trimmedDate,
        notes: notes.trim() ? notes.trim() : undefined,
      });

      // Reset form
      setFriendName('');
      setAmount('5000');
      setNotes('');
      setReceiptSimulated(false);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record loan. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={[styles.sheetContainer, { maxHeight: height * 0.92 }]}>
          {/* Android Drag Handle */}
          <View style={styles.dragHandleWrapper}>
            <View style={styles.dragHandle} />
          </View>

          {/* Sheet Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconCircle}>
                <Text style={styles.headerIconText}>🤝</Text>
              </View>
              <View style={styles.headerTitleCol}>
                <Text style={styles.sheetTitle}>New Peer Loan</Text>
                <Text style={styles.sheetSubtitle}>Record friendly money lent or borrowed</Text>
              </View>
            </View>

            <View style={styles.unsettledPill}>
              <Text style={styles.unsettledText}>Unsettled</Text>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollBody}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorIcon}>⚠</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* 1. Borrower Name Field with Suggestions */}
            <View style={styles.fieldCard}>
              <View style={styles.fieldHeaderRow}>
                <Text style={styles.fieldLabel}>Borrower / Friend Name</Text>
                <Text style={styles.requiredLabel}>Required</Text>
              </View>

              <View style={styles.textInputBox}>
                <Text style={styles.inputPrefixIcon}>👤</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Aarav Sharma"
                  placeholderTextColor={Theme.colors.textMuted}
                  value={friendName}
                  onChangeText={(val) => {
                    setFriendName(val);
                    if (error) setError(null);
                  }}
                  autoCapitalize="words"
                />
              </View>

              {/* Quick Contact Chips */}
              <View style={styles.contactsRow}>
                <Text style={styles.recentLabel}>Recent:</Text>
                {CONTACT_SUGGESTIONS.map((name) => (
                  <TouchableOpacity
                    key={name}
                    style={styles.contactChip}
                    onPress={() => setFriendName(name)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.contactChipInitial}>
                      <Text style={styles.contactChipInitialText}>{name[0]}</Text>
                    </View>
                    <Text style={styles.contactChipName}>{name.split(' ')[0]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 2. Amount Section with Quick Increment Chips */}
            <View style={styles.fieldCard}>
              <View style={styles.fieldHeaderRow}>
                <Text style={styles.fieldLabel}>Loan Principal Amount</Text>
                <Text style={styles.currencyBadge}>INR (₹)</Text>
              </View>

              <View style={styles.amountInputRow}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0"
                  placeholderTextColor="#CBD5E1"
                  value={amount}
                  onChangeText={(val) => {
                    setAmount(val);
                    if (error) setError(null);
                  }}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Quick Preset Amount Chips */}
              <View style={styles.presetGrid}>
                {PRESET_AMOUNTS.map((val) => {
                  const isSelected = amount === val.toString();
                  return (
                    <TouchableOpacity
                      key={val}
                      style={[
                        styles.presetChip,
                        isSelected && styles.presetChipSelected,
                      ]}
                      onPress={() => setAmount(val.toString())}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.presetChipText,
                          isSelected && styles.presetChipTextSelected,
                        ]}
                      >
                        ₹{val.toLocaleString('en-IN')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 3. Due Date Section with Quick Buttons */}
            <View style={styles.fieldCard}>
              <Text style={styles.fieldLabel}>Target Repayment Date</Text>
              <View style={styles.textInputBox}>
                <Text style={styles.inputPrefixIcon}>📅</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Theme.colors.textMuted}
                  value={dueDate}
                  onChangeText={(val) => {
                    setDueDate(val);
                    if (error) setError(null);
                  }}
                />
              </View>

              <View style={styles.quickDatesRow}>
                <TouchableOpacity
                  style={styles.datePill}
                  onPress={() => setQuickDate(7)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.datePillText}>+7 Days</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.datePill}
                  onPress={() => setQuickDate(14)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.datePillText}>+14 Days</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.datePill, styles.datePillPrimary]}
                  onPress={() => setQuickDate(30)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.datePillText, styles.datePillTextPrimary]}>+30 Days</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.dateHintText}>
                ℹ Defaults to 30 days from today. Friendly reminders will be gentle.
              </Text>
            </View>

            {/* 4. Purpose / Note Field */}
            <View style={styles.fieldCard}>
              <Text style={styles.fieldLabel}>Reason or Purpose</Text>
              <View style={styles.textInputBox}>
                <Text style={styles.inputPrefixIcon}>💬</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Dinner split, concert tickets, trip advance"
                  placeholderTextColor={Theme.colors.textMuted}
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>
            </View>

            {/* 5. Receipt Attachment Card (from Stitch) */}
            <TouchableOpacity
              style={styles.receiptCard}
              onPress={() => setReceiptSimulated((prev) => !prev)}
              activeOpacity={0.8}
            >
              <View style={styles.receiptIconCircle}>
                <Text style={styles.receiptGlyph}>{receiptSimulated ? '✓' : '📎'}</Text>
              </View>
              <View style={styles.receiptTextCol}>
                <Text style={styles.receiptTitle}>
                  {receiptSimulated ? 'Receipt attached cleanly' : 'Attach receipt (Optional)'}
                </Text>
                <Text style={styles.receiptSubtitle}>
                  {receiptSimulated
                    ? 'upi_receipt_confirmed.png'
                    : 'Helps resolve friendly disputes cleanly'}
                </Text>
              </View>
              <View style={styles.receiptCameraBadge}>
                <Text style={styles.cameraIconText}>📷</Text>
              </View>
            </TouchableOpacity>

            {/* Privacy note */}
            <View style={styles.privacyNote}>
              <Text style={styles.privacyLock}>🔒</Text>
              <Text style={styles.privacyText}>
                All entries are stored securely on your private cloud database.
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[styles.saveButton, submitting && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <View style={styles.saveBtnContent}>
                    <Text style={styles.saveIconText}>💾</Text>
                    <Text style={styles.saveButtonText}>Save Loan Entry</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                disabled={submitting}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 28, 48, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: Theme.borderRadius.xxl,
    borderTopRightRadius: Theme.borderRadius.xxl,
    ...Theme.shadows.floating,
  },
  dragHandleWrapper: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dragHandle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Theme.colors.borderSubtle,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.borderLight,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Theme.colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerIconText: {
    fontSize: 18,
  },
  headerTitleCol: {
    flex: 1,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  sheetSubtitle: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginTop: 1,
  },
  unsettledPill: {
    backgroundColor: Theme.colors.statusPendingTint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1,
    borderColor: Theme.colors.statusPendingBorder,
  },
  unsettledText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.statusPending,
  },
  scrollBody: {
    padding: 18,
    paddingBottom: 36,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.statusOverdueTint,
    borderRadius: Theme.borderRadius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: Theme.colors.statusOverdueBorder,
    marginBottom: 14,
  },
  errorIcon: {
    fontSize: 14,
    color: Theme.colors.statusOverdue,
    marginRight: 6,
  },
  errorText: {
    flex: 1,
    color: Theme.colors.statusOverdue,
    fontSize: 12,
    fontWeight: '600',
  },
  fieldCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: Theme.colors.borderSubtle,
    marginBottom: 14,
    ...Theme.shadows.sm,
  },
  fieldHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  requiredLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  currencyBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.textMuted,
  },
  textInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.borderRadius.md,
    height: 48,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Theme.colors.borderSubtle,
  },
  inputPrefixIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    fontWeight: '500',
    color: Theme.colors.textPrimary,
  },
  contactsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 6,
  },
  recentLabel: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    fontWeight: '600',
  },
  contactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.full,
    gap: 4,
  },
  contactChipInitial: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactChipInitialText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  contactChipName: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Theme.colors.borderSubtle,
    marginBottom: 10,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: Theme.colors.primary,
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  presetGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  presetChip: {
    flex: 1,
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.borderRadius.md,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetChipSelected: {
    backgroundColor: Theme.colors.primary,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  presetChipTextSelected: {
    color: '#FFFFFF',
  },
  quickDatesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  datePill: {
    flex: 1,
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.borderRadius.full,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePillPrimary: {
    backgroundColor: Theme.colors.surfaceContainerHigh,
  },
  datePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  datePillTextPrimary: {
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  dateHintText: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    marginTop: 8,
    lineHeight: 15,
  },
  receiptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.borderRadius.lg,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Theme.colors.borderSubtle,
  },
  receiptIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  receiptGlyph: {
    fontSize: 16,
  },
  receiptTextCol: {
    flex: 1,
  },
  receiptTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  receiptSubtitle: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    marginTop: 1,
  },
  receiptCameraBadge: {
    padding: 6,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: '#FFFFFF',
  },
  cameraIconText: {
    fontSize: 14,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 6,
  },
  privacyLock: {
    fontSize: 11,
  },
  privacyText: {
    fontSize: 11,
    color: Theme.colors.textMuted,
  },
  actionsContainer: {
    gap: 10,
  },
  saveButton: {
    height: 50,
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.floating,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveIconText: {
    fontSize: 16,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
});
