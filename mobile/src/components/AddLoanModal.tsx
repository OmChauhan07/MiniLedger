// Purpose: Modernized Add Loan modal bottom sheet with Lent/Borrowed direction selector matching MiniLedger Stitch specifications.
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
import { CreateLoanPayload, LoanDirection } from '../types/index';
import { Theme } from '../theme/index';
import { WalletIcon, ClockIcon, CheckIcon, AlertTriangleIcon, LockIcon } from './Icons';

interface AddLoanModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateLoanPayload) => Promise<void>;
  defaultDirection?: LoanDirection;
}

const PRESET_AMOUNTS = [500, 1000, 2000, 5000];
const CONTACT_SUGGESTIONS = ['Priya Sharma', 'Karan Dave', 'Sneha Rao', 'Aarav Verma'];

export function AddLoanModal({
  visible,
  onClose,
  onSubmit,
  defaultDirection = 'LENT',
}: AddLoanModalProps) {
  const [loanType, setLoanType] = useState<LoanDirection>(defaultDirection);
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

  const isLent = loanType === 'LENT';

  const handleSave = async () => {
    setError(null);

    const trimmedName = friendName.trim();
    if (!trimmedName) {
      setError(isLent ? "Please enter borrower's name." : "Please enter lender's name.");
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
        type: loanType,
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
        <View style={[styles.sheetContainer, { maxHeight: height * 0.94 }]}>
          {/* Android Drag Handle */}
          <View style={styles.dragHandleWrapper}>
            <View style={styles.dragHandle} />
          </View>

          {/* Sheet Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconCircle}>
                <WalletIcon size={18} color="#0F172A" />
              </View>
              <View style={styles.headerTitleCol}>
                <Text style={styles.sheetTitle}>
                  {isLent ? 'Record Lent Money' : 'Record Borrowed Money'}
                </Text>
                <Text style={styles.sheetSubtitle}>
                  {isLent ? 'Receivable • They owe you' : 'Payable • You owe them'}
                </Text>
              </View>
            </View>

            <View style={[styles.directionBadge, isLent ? styles.directionBadgeLent : styles.directionBadgeBorrowed]}>
              <Text style={[styles.directionBadgeText, isLent ? styles.directionBadgeTextLent : styles.directionBadgeTextBorrowed]}>
                {isLent ? 'They Owe You' : 'You Owe Them'}
              </Text>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollBody}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {error && (
              <View style={styles.errorBox}>
                <AlertTriangleIcon size={14} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* 1. Prominent Segmented Direction Selector */}
            <View style={styles.directionSection}>
              <Text style={styles.sectionKicker}>CHOOSE LOAN DIRECTION</Text>
              <View style={styles.segmentedControl}>
                {/* Lent Option */}
                <TouchableOpacity
                  style={[
                    styles.segmentBtn,
                    isLent && styles.segmentBtnActive,
                  ]}
                  onPress={() => setLoanType('LENT')}
                  activeOpacity={0.8}
                >
                  <View style={styles.segmentContent}>
                    <WalletIcon
                      size={14}
                      color={isLent ? '#FFFFFF' : '#0F172A'}
                    />
                    <Text
                      style={[
                        styles.segmentText,
                        isLent && styles.segmentTextActive,
                      ]}
                    >
                      I've Lent
                    </Text>
                  </View>
                  <Text style={[styles.segmentSubtext, isLent && styles.segmentSubtextActive]}>
                    Receivable
                  </Text>
                </TouchableOpacity>

                {/* Borrowed Option */}
                <TouchableOpacity
                  style={[
                    styles.segmentBtn,
                    !isLent && styles.segmentBtnActive,
                  ]}
                  onPress={() => setLoanType('BORROWED')}
                  activeOpacity={0.8}
                >
                  <View style={styles.segmentContent}>
                    <ClockIcon
                      size={14}
                      color={!isLent ? '#FFFFFF' : '#0F172A'}
                      strokeWidth={1.8}
                    />
                    <Text
                      style={[
                        styles.segmentText,
                        !isLent && styles.segmentTextActive,
                      ]}
                    >
                      I've Borrowed
                    </Text>
                  </View>
                  <Text style={[styles.segmentSubtext, !isLent && styles.segmentSubtextActive]}>
                    Payable
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.directionExplanation}>
                <Text style={styles.directionExplanationText}>
                  {isLent
                    ? '💡 You gave money to a friend. They owe you and must repay by the due date.'
                    : '💡 You received money from a friend. You owe them and must pay back by the due date.'}
                </Text>
              </View>
            </View>

            {/* 2. Borrower / Lender Name Field */}
            <View style={styles.fieldCard}>
              <View style={styles.fieldHeaderRow}>
                <Text style={styles.fieldLabel}>
                  {isLent ? "Borrower / Friend Name" : "Lender / Friend Name"}
                </Text>
                <Text style={styles.requiredLabel}>Required</Text>
              </View>

              <View style={styles.textInputBox}>
                <TextInput
                  style={styles.textInput}
                  placeholder={isLent ? "e.g. Aarav Sharma" : "e.g. Vikram Malhotra"}
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

            {/* 3. Amount Section with Quick Increment Chips */}
            <View style={styles.fieldCard}>
              <View style={styles.fieldHeaderRow}>
                <Text style={styles.fieldLabel}>
                  {isLent ? "Lent Principal Amount" : "Borrowed Principal Amount"}
                </Text>
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

            {/* 4. Due Date Section with Quick Buttons */}
            <View style={styles.fieldCard}>
              <Text style={styles.fieldLabel}>
                {isLent ? "Expected Repayment Date" : "Payment Due Date"}
              </Text>
              <View style={styles.textInputBox}>
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
                ℹ Defaults to 30 days from today. Used to compute overdue status.
              </Text>
            </View>

            {/* 5. Purpose / Note Field */}
            <View style={styles.fieldCard}>
              <Text style={styles.fieldLabel}>Reason or Purpose (Optional)</Text>
              <View style={styles.textInputBox}>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Dinner split, concert tickets, trip advance"
                  placeholderTextColor={Theme.colors.textMuted}
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>
            </View>

            {/* Privacy note */}
            <View style={styles.privacyNote}>
              <LockIcon size={13} color={Theme.colors.textMuted} />
              <Text style={styles.privacyText}>
                Entries belong strictly to your private authenticated ledger.
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
                    <CheckIcon size={14} color="#FFFFFF" strokeWidth={2.2} />
                    <Text style={styles.saveButtonText}>
                      {isLent ? 'Record Lent Loan' : 'Record Borrowed Loan'}
                    </Text>
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
    paddingBottom: 14,
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
  directionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1,
  },
  directionBadgeLent: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  directionBadgeBorrowed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  directionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  directionBadgeTextLent: {
    color: '#1D4ED8',
  },
  directionBadgeTextBorrowed: {
    color: '#DC2626',
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
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    color: Theme.colors.statusOverdue,
    fontWeight: '600',
    flex: 1,
  },
  directionSection: {
    marginBottom: 16,
  },
  sectionKicker: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.borderRadius.lg,
    padding: 4,
    gap: 6,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Theme.borderRadius.md,
  },
  segmentBtnActive: {
    backgroundColor: '#0F172A',
    ...Theme.shadows.sm,
  },
  segmentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  segmentSubtext: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  segmentSubtextActive: {
    color: '#94A3B8',
  },
  directionExplanation: {
    marginTop: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Theme.colors.borderSubtle,
  },
  directionExplanationText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    lineHeight: 16,
  },
  fieldCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.borderSubtle,
    padding: 14,
    marginBottom: 14,
    ...Theme.shadows.sm,
  },
  fieldHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  requiredLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.textMuted,
    textTransform: 'uppercase',
  },
  currencyBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.textMuted,
  },
  textInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: Theme.colors.borderSubtle,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: Theme.colors.textPrimary,
  },
  contactsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
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
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactChipInitialText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  contactChipName: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: 12,
    height: 52,
    borderWidth: 1,
    borderColor: Theme.colors.borderSubtle,
  },
  currencySymbol: {
    fontSize: 22,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  presetGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.borderSubtle,
  },
  presetChipSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
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
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.borderSubtle,
  },
  datePillPrimary: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  datePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  datePillTextPrimary: {
    color: '#FFFFFF',
  },
  dateHintText: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    marginTop: 8,
    lineHeight: 15,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
    marginBottom: 16,
  },
  privacyText: {
    fontSize: 11,
    color: Theme.colors.textMuted,
  },
  actionsContainer: {
    gap: 8,
  },
  saveButton: {
    backgroundColor: '#0F172A',
    borderRadius: Theme.borderRadius.lg,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.card,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelBtn: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textMuted,
  },
});
