// Purpose: Add Loan modal bottom sheet with direction selector, registered user search, and external contact fallback.
// Imported by: DashboardScreen.tsx, AllLoansScreen.tsx, App.tsx

import React, { useState, useEffect } from 'react';
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
import { CreateLoanPayload, LoanDirection, PublicUserResult } from '../types/index';
import { searchUsersApi } from '../api/users.api';
import { Theme } from '../theme/index';
import { WalletIcon, ClockIcon, CheckIcon, AlertTriangleIcon, LockIcon } from './Icons';

interface AddLoanModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateLoanPayload) => Promise<void>;
  defaultDirection?: LoanDirection;
}

const PRESET_AMOUNTS = [500, 1000, 2000, 5000];

export function AddLoanModal({
  visible,
  onClose,
  onSubmit,
  defaultDirection = 'LENT',
}: AddLoanModalProps) {
  const [loanType, setLoanType] = useState<LoanDirection>(defaultDirection);
  const [isExternalMode, setIsExternalMode] = useState(false);

  // Counterparty state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PublicUserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PublicUserResult | null>(null);

  // External person state
  const [externalName, setExternalName] = useState('');
  const [externalPhone, setExternalPhone] = useState('');

  // Loan fields
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
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { height } = useWindowDimensions();

  useEffect(() => {
    if (visible) {
      setLoanType(defaultDirection);
      setError(null);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUser(null);
      setExternalName('');
      setExternalPhone('');
      setIsExternalMode(false);
    }
  }, [visible, defaultDirection]);

  // Debounced search for registered users
  useEffect(() => {
    if (isExternalMode || selectedUser) return;
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const results = await searchUsersApi(trimmed);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery, isExternalMode, selectedUser]);

  const setQuickDate = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setDueDate(`${y}-${m}-${day}`);
  };

  const isLent = loanType === 'LENT';

  const handleSelectRegisteredUser = (user: PublicUserResult) => {
    setSelectedUser(user);
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
  };

  const handleRemoveSelectedUser = () => {
    setSelectedUser(null);
    setSearchQuery('');
  };

  const handleSave = async () => {
    setError(null);

    // Validate Counterparty
    let friendName = '';
    let counterpartyUserId: string | undefined = undefined;
    let counterpartyPhone: string | undefined = undefined;

    if (!isExternalMode && selectedUser) {
      friendName = selectedUser.name;
      counterpartyUserId = selectedUser.id;
    } else if (isExternalMode) {
      friendName = externalName.trim();
      if (!friendName) {
        setError('Please enter contact name.');
        return;
      }
      if (externalPhone.trim()) {
        counterpartyPhone = externalPhone.trim();
      }
    } else {
      // User hasn't chosen from search or switched to external
      if (searchQuery.trim().length > 0) {
        // Fallback: use search query as external name
        friendName = searchQuery.trim();
      } else {
        setError('Please select a registered user or enter contact name.');
        return;
      }
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
        friendName,
        amount: trimmedAmount,
        dueDate: trimmedDate,
        type: loanType,
        counterpartyUserId,
        counterpartyPhone,
        notes: notes.trim() ? notes.trim() : undefined,
      });

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
          {/* Drag Handle */}
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

            {/* 1. Direction Selector */}
            <View style={styles.directionSection}>
              <Text style={styles.sectionKicker}>CHOOSE LOAN DIRECTION</Text>
              <View style={styles.segmentedControl}>
                {/* Lent Option */}
                <TouchableOpacity
                  style={[styles.segmentBtn, isLent && styles.segmentBtnActive]}
                  onPress={() => setLoanType('LENT')}
                  activeOpacity={0.8}
                >
                  <View style={styles.segmentContent}>
                    <WalletIcon size={14} color={isLent ? '#FFFFFF' : '#0F172A'} />
                    <Text style={[styles.segmentText, isLent && styles.segmentTextActive]}>
                      I've Lent
                    </Text>
                  </View>
                  <Text style={[styles.segmentSubtext, isLent && styles.segmentSubtextActive]}>
                    Receivable
                  </Text>
                </TouchableOpacity>

                {/* Borrowed Option */}
                <TouchableOpacity
                  style={[styles.segmentBtn, !isLent && styles.segmentBtnActive]}
                  onPress={() => setLoanType('BORROWED')}
                  activeOpacity={0.8}
                >
                  <View style={styles.segmentContent}>
                    <ClockIcon size={14} color={!isLent ? '#FFFFFF' : '#0F172A'} strokeWidth={1.8} />
                    <Text style={[styles.segmentText, !isLent && styles.segmentTextActive]}>
                      I've Borrowed
                    </Text>
                  </View>
                  <Text style={[styles.segmentSubtext, !isLent && styles.segmentSubtextActive]}>
                    Payable
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 2. Counterparty Selection (Registered Search vs External Contact) */}
            <View style={styles.fieldCard}>
              <View style={styles.fieldHeaderRow}>
                <Text style={styles.fieldLabel}>
                  {isLent ? 'Counterparty (Borrower)' : 'Counterparty (Lender)'}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setIsExternalMode(!isExternalMode);
                    setSelectedUser(null);
                    setSearchQuery('');
                    setError(null);
                  }}
                >
                  <Text style={styles.switchModeLink}>
                    {isExternalMode ? '🔍 Search Registered Users' : '👤 Add Outside Contact'}
                  </Text>
                </TouchableOpacity>
              </View>

              {!isExternalMode ? (
                /* Registered User Search Mode */
                <View>
                  {selectedUser ? (
                    /* Selected Registered User Card */
                    <View style={styles.selectedUserCard}>
                      <View style={styles.userAvatarBadge}>
                        <Text style={styles.userAvatarText}>{selectedUser.name[0] || 'U'}</Text>
                      </View>
                      <View style={styles.selectedUserInfo}>
                        <View style={styles.selectedUserNameRow}>
                          <Text style={styles.selectedUserName}>{selectedUser.name}</Text>
                          <View style={styles.verifiedTag}>
                            <Text style={styles.verifiedTagText}>Registered</Text>
                          </View>
                        </View>
                        <Text style={styles.selectedUserPhone}>{selectedUser.maskedPhone}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={handleRemoveSelectedUser}
                        style={styles.removeUserBtn}
                      >
                        <Text style={styles.removeUserText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    /* Search Input Box */
                    <View>
                      <View style={styles.textInputBox}>
                        <TextInput
                          style={styles.textInput}
                          placeholder="Search registered user by name or phone..."
                          placeholderTextColor={Theme.colors.textMuted}
                          value={searchQuery}
                          onChangeText={(val) => {
                            setSearchQuery(val);
                            if (error) setError(null);
                          }}
                        />
                        {isSearching && <ActivityIndicator size="small" color="#0F172A" />}
                      </View>

                      {/* Search Results Dropdown List */}
                      {searchResults.length > 0 && (
                        <View style={styles.searchResultsContainer}>
                          {searchResults.map((user) => (
                            <TouchableOpacity
                              key={user.id}
                              style={styles.searchResultRow}
                              onPress={() => handleSelectRegisteredUser(user)}
                              activeOpacity={0.7}
                            >
                              <View style={styles.resultAvatar}>
                                <Text style={styles.resultAvatarText}>{user.name[0] || 'U'}</Text>
                              </View>
                              <View style={styles.resultInfo}>
                                <Text style={styles.resultName}>{user.name}</Text>
                                <Text style={styles.resultPhone}>{user.maskedPhone}</Text>
                              </View>
                              <View style={styles.resultBadge}>
                                <Text style={styles.resultBadgeText}>Select</Text>
                              </View>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}

                      {searchQuery.trim().length >= 2 && searchResults.length === 0 && !isSearching && (
                        <View style={styles.noResultsBox}>
                          <Text style={styles.noResultsText}>No registered user found.</Text>
                          <TouchableOpacity
                            onPress={() => {
                              setIsExternalMode(true);
                              setExternalName(searchQuery.trim());
                            }}
                          >
                            <Text style={styles.addExternalPrompt}>
                              Add "{searchQuery.trim()}" as outside contact ➔
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              ) : (
                /* External / Outside Person Form */
                <View style={styles.externalForm}>
                  <View style={styles.externalBadgeBanner}>
                    <Text style={styles.externalBadgeText}>
                      Outside Contact • Kept in your private ledger
                    </Text>
                  </View>

                  <Text style={styles.subInputLabel}>Contact Name *</Text>
                  <View style={styles.textInputBox}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Ramesh Uncle, Roommate"
                      placeholderTextColor={Theme.colors.textMuted}
                      value={externalName}
                      onChangeText={(val) => {
                        setExternalName(val);
                        if (error) setError(null);
                      }}
                      autoFocus
                    />
                  </View>

                  <Text style={styles.subInputLabel}>Phone Number (Optional)</Text>
                  <View style={styles.textInputBox}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. +91 98765 43210"
                      placeholderTextColor={Theme.colors.textMuted}
                      keyboardType="phone-pad"
                      value={externalPhone}
                      onChangeText={setExternalPhone}
                    />
                  </View>
                </View>
              )}
            </View>

            {/* 3. Amount Section */}
            <View style={styles.fieldCard}>
              <View style={styles.fieldHeaderRow}>
                <Text style={styles.fieldLabel}>
                  {isLent ? 'Lent Principal Amount' : 'Borrowed Principal Amount'}
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

              {/* Preset Amount Chips */}
              <View style={styles.presetGrid}>
                {PRESET_AMOUNTS.map((val) => {
                  const isSelected = amount === val.toString();
                  return (
                    <TouchableOpacity
                      key={val}
                      style={[styles.presetChip, isSelected && styles.presetChipSelected]}
                      onPress={() => setAmount(val.toString())}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.presetChipText, isSelected && styles.presetChipTextSelected]}>
                        ₹{val.toLocaleString('en-IN')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 4. Due Date Section */}
            <View style={styles.fieldCard}>
              <Text style={styles.fieldLabel}>
                {isLent ? 'Expected Repayment Date' : 'Payment Due Date'}
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
                <TouchableOpacity style={styles.datePill} onPress={() => setQuickDate(7)}>
                  <Text style={styles.datePillText}>+7 Days</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.datePill} onPress={() => setQuickDate(14)}>
                  <Text style={styles.datePillText}>+14 Days</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.datePill, styles.datePillPrimary]} onPress={() => setQuickDate(30)}>
                  <Text style={[styles.datePillText, styles.datePillTextPrimary]}>+30 Days</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 5. Purpose / Note Field */}
            <View style={styles.fieldCard}>
              <Text style={styles.fieldLabel}>Reason or Purpose (Optional)</Text>
              <View style={styles.textInputBox}>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Dinner split, trip advance, rent share"
                  placeholderTextColor={Theme.colors.textMuted}
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>
            </View>

            {/* Privacy notice */}
            <View style={styles.privacyNote}>
              <LockIcon size={13} color={Theme.colors.textMuted} />
              <Text style={styles.privacyText}>
                Original records are immutable. Mutual balances will auto-net.
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

              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={submitting}>
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
  switchModeLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
    textDecorationLine: 'underline',
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
  selectedUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: Theme.borderRadius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  userAvatarBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  userAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  selectedUserInfo: {
    flex: 1,
  },
  selectedUserNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectedUserName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  verifiedTag: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  verifiedTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#334155',
  },
  selectedUserPhone: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  removeUserBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeUserText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  searchResultsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginTop: 6,
    overflow: 'hidden',
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  resultAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  resultAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  resultPhone: {
    fontSize: 11,
    color: '#64748B',
  },
  resultBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  resultBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  noResultsBox: {
    padding: 10,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 12,
    color: '#64748B',
  },
  addExternalPrompt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
    textDecorationLine: 'underline',
  },
  externalForm: {
    gap: 8,
  },
  externalBadgeBanner: {
    backgroundColor: '#F8FAFC',
    padding: 6,
    borderRadius: 4,
    marginBottom: 4,
  },
  externalBadgeText: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
  },
  subInputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
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
    color: Theme.colors.textSecondary,
  },
});
