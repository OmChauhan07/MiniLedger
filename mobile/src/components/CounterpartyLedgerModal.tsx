// Purpose: Modal sheet displaying the mutual relationship, bilateral netting, and chronological ledger between two registered users.
// Imported by: AddLoanModal.tsx, LoanDetailsModal.tsx, App.tsx

import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { CounterpartyRelationship, Loan } from '../types/index';
import { fetchCounterpartyRelationshipApi } from '../api/users.api';
import { Theme } from '../theme/index';
import {
  formatCurrencyCompact,
  formatDisplayDate,
  getInitials,
  checkIsOverdue,
  getRelativeDueLabel,
} from '../utils/format';
import {
  CheckIcon,
  AlertTriangleIcon,
  ClockIcon,
  WalletIcon,
  ArrowUpRightIcon,
  LockIcon,
} from './Icons';

interface CounterpartyLedgerModalProps {
  visible: boolean;
  counterpartyId: string | null;
  onClose: () => void;
  onSelectLoan?: (loan: Loan) => void;
  onRecordNewLoan?: (counterpartyId: string, counterpartyName: string) => void;
}

export function CounterpartyLedgerModal({
  visible,
  counterpartyId,
  onClose,
  onSelectLoan,
  onRecordNewLoan,
}: CounterpartyLedgerModalProps) {
  const [data, setData] = useState<CounterpartyRelationship | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { height } = useWindowDimensions();

  useEffect(() => {
    if (visible && counterpartyId) {
      setLoading(true);
      setError(null);
      fetchCounterpartyRelationshipApi(counterpartyId)
        .then((res) => {
          setData(res);
        })
        .catch((err) => {
          setError(err.message || 'Failed to load counterparty relationship.');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setData(null);
    }
  }, [visible, counterpartyId]);

  if (!visible) return null;

  const counterparty = data?.counterparty;
  const netting = data?.netting;
  const metrics = data?.metrics;
  const loans = data?.loans || [];
  const initials = counterparty ? getInitials(counterparty.name) : 'U';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheetContainer, { maxHeight: height * 0.94 }]}>
          {/* Drag Handle */}
          <View style={styles.dragHandleWrapper}>
            <View style={styles.dragHandle} />
          </View>

          {/* Top Bar */}
          <View style={styles.topBar}>
            <View style={styles.topBarLeft}>
              <Text style={styles.topBarKicker}>MiniLedger • Mutual Relationship</Text>
              <Text style={styles.topBarTitle}>Counterparty Ledger</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Theme.colors.primary} />
              <Text style={styles.loadingText}>Fetching mutual ledger...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <AlertTriangleIcon size={32} color={Theme.colors.statusOverdue} />
              <Text style={styles.errorTitle}>Could Not Load Relationship</Text>
              <Text style={styles.errorMessage}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={onClose}>
                <Text style={styles.retryBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          ) : counterparty && netting && metrics ? (
            <ScrollView
              contentContainerStyle={styles.scrollBody}
              showsVerticalScrollIndicator={false}
            >
              {/* Profile Card */}
              <View style={styles.profileCard}>
                <View style={styles.profileRow}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                  <View style={styles.profileDetails}>
                    <View style={styles.nameBadgeRow}>
                      <Text style={styles.userName}>{counterparty.name}</Text>
                      <View style={styles.registeredBadge}>
                        <CheckIcon size={10} color="#15803D" strokeWidth={2.4} />
                        <Text style={styles.registeredBadgeText}>Registered User</Text>
                      </View>
                    </View>
                    <Text style={styles.userPhone}>{counterparty.maskedPhone}</Text>
                  </View>
                </View>

                {/* Quick Record CTA */}
                {onRecordNewLoan && (
                  <TouchableOpacity
                    style={styles.recordNewLoanBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      onClose();
                      onRecordNewLoan(counterparty.id, counterparty.name);
                    }}
                  >
                    <ArrowUpRightIcon size={14} color="#FFFFFF" strokeWidth={2.2} />
                    <Text style={styles.recordNewLoanBtnText}>Record Loan with {counterparty.name}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Bilateral Netting Hero Card */}
              <View style={styles.nettingCard}>
                <View style={styles.nettingHeader}>
                  <Text style={styles.nettingHeaderKicker}>AUTOMATIC PAIRWISE NETTING</Text>
                  <View
                    style={[
                      styles.netStatusChip,
                      netting.netStatus === 'RECEIVABLE'
                        ? styles.netStatusChipReceivable
                        : netting.netStatus === 'PAYABLE'
                        ? styles.netStatusChipPayable
                        : styles.netStatusChipSettled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.netStatusChipText,
                        netting.netStatus === 'RECEIVABLE'
                          ? styles.netStatusChipReceivableText
                          : netting.netStatus === 'PAYABLE'
                          ? styles.netStatusChipPayableText
                          : styles.netStatusChipSettledText,
                      ]}
                    >
                      {netting.netStatus}
                    </Text>
                  </View>
                </View>

                {/* Net Amount Display */}
                <View style={styles.netAmountRow}>
                  <Text style={styles.netAmountLabel}>Mutual Net Balance:</Text>
                  <Text style={styles.netAmountValue}>₹{netting.netAmount}</Text>
                </View>

                {/* Explanation */}
                <View style={styles.explanationBox}>
                  <Text style={styles.explanationText}>{netting.explanation}</Text>
                </View>

                {/* Grid breakdown */}
                <View style={styles.breakdownGrid}>
                  <View style={styles.breakdownCol}>
                    <Text style={styles.breakdownLabel}>You Lent (Outstanding)</Text>
                    <Text style={[styles.breakdownValue, { color: '#059669' }]}>
                      ₹{netting.lentPrincipal}
                    </Text>
                  </View>
                  <View style={styles.breakdownDivider} />
                  <View style={styles.breakdownCol}>
                    <Text style={styles.breakdownLabel}>You Borrowed (Outstanding)</Text>
                    <Text style={[styles.breakdownValue, { color: '#E11D48' }]}>
                      ₹{netting.borrowedPrincipal}
                    </Text>
                  </View>
                </View>

                {/* Mini Stats Ribbon */}
                <View style={styles.statsRibbon}>
                  <Text style={styles.statsRibbonItem}>
                    Active Lent: <Text style={styles.statsRibbonBold}>{metrics.activeLentCount}</Text>
                  </Text>
                  <Text style={styles.statsRibbonDot}>•</Text>
                  <Text style={styles.statsRibbonItem}>
                    Active Borrowed: <Text style={styles.statsRibbonBold}>{metrics.activeBorrowedCount}</Text>
                  </Text>
                  <Text style={styles.statsRibbonDot}>•</Text>
                  <Text style={styles.statsRibbonItem}>
                    Settled: <Text style={styles.statsRibbonBold}>{metrics.settledCount}</Text>
                  </Text>
                </View>

                <Text style={styles.auditDisclaimer}>
                  ℹ Derived calculation. Original transaction records and due dates remain unchanged for financial auditability.
                </Text>
              </View>

              {/* Shared Loans Section Header */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>Shared Transaction History</Text>
                <Text style={styles.sectionCountBadge}>{loans.length} records</Text>
              </View>

              {/* Loans List */}
              {loans.length === 0 ? (
                <View style={styles.emptyLoansBox}>
                  <WalletIcon size={28} color="#94A3B8" />
                  <Text style={styles.emptyLoansTitle}>No Shared Transactions</Text>
                  <Text style={styles.emptyLoansSubtitle}>
                    You haven't recorded any loans with {counterparty.name} yet.
                  </Text>
                </View>
              ) : (
                loans.map((loan) => {
                  const isLent = loan.type === 'LENT';
                  const isRepaid = loan.isRepaid;
                  const isOverdue = !isRepaid && checkIsOverdue(loan.dueDate, false);
                  const relativeBadge = getRelativeDueLabel(loan.dueDate, isRepaid);

                  return (
                    <TouchableOpacity
                      key={loan.id}
                      style={styles.loanRowCard}
                      activeOpacity={0.7}
                      onPress={() => {
                        onClose();
                        onSelectLoan?.(loan);
                      }}
                    >
                      <View style={styles.loanRowLeft}>
                        <View
                          style={[
                            styles.directionBadge,
                            isLent ? styles.directionBadgeLent : styles.directionBadgeBorrowed,
                          ]}
                        >
                          {isLent ? (
                            <WalletIcon size={12} color="#059669" />
                          ) : (
                            <ClockIcon size={12} color="#DC2626" strokeWidth={1.8} />
                          )}
                          <Text
                            style={[
                              styles.directionBadgeText,
                              isLent ? styles.directionBadgeTextLent : styles.directionBadgeTextBorrowed,
                            ]}
                          >
                            {isLent ? 'LENT' : 'BORROWED'}
                          </Text>
                        </View>

                        <Text style={styles.loanAmount}>
                          {formatCurrencyCompact(loan.amount)}
                        </Text>

                        {/* Provenance Tag */}
                        <View style={styles.provenanceTag}>
                          <Text style={styles.provenanceText}>
                            Recorded by {loan.recordedByName ?? 'You'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.loanRowRight}>
                        {isRepaid ? (
                          <View style={styles.statusPillRepaid}>
                            <CheckIcon size={10} color="#15803D" strokeWidth={2.4} />
                            <Text style={styles.statusPillRepaidText}>Settled</Text>
                          </View>
                        ) : isOverdue ? (
                          <View style={styles.statusPillOverdue}>
                            <AlertTriangleIcon size={10} color="#B91C1C" strokeWidth={2.2} />
                            <Text style={styles.statusPillOverdueText}>Overdue</Text>
                          </View>
                        ) : (
                          <View style={styles.statusPillPending}>
                            <ClockIcon size={10} color="#D97706" strokeWidth={2.0} />
                            <Text style={styles.statusPillPendingText}>{relativeBadge.text}</Text>
                          </View>
                        )}
                        <Text style={styles.loanDueDate}>
                          Due {formatDisplayDate(loan.dueDate)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 15, 29, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: '#334155',
    paddingBottom: 24,
  },
  dragHandleWrapper: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#475569',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  topBarLeft: {
    flex: 1,
  },
  topBarKicker: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '700',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 12,
  },
  errorContainer: {
    padding: 32,
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 12,
  },
  errorMessage: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  retryBtn: {
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#F8FAFC',
    fontWeight: '600',
    fontSize: 13,
  },
  scrollBody: {
    padding: 20,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
  },
  avatarText: {
    color: '#38BDF8',
    fontSize: 16,
    fontWeight: '800',
  },
  profileDetails: {
    marginLeft: 14,
    flex: 1,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  registeredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 12,
  },
  registeredBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  userPhone: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  recordNewLoanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  recordNewLoanBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  nettingCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    marginBottom: 20,
  },
  nettingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  nettingHeaderKicker: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.8,
  },
  netStatusChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  netStatusChipReceivable: {
    backgroundColor: '#064E3B',
  },
  netStatusChipPayable: {
    backgroundColor: '#881337',
  },
  netStatusChipSettled: {
    backgroundColor: '#1E3A8A',
  },
  netStatusChipText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  netStatusChipReceivableText: {
    color: '#34D399',
  },
  netStatusChipPayableText: {
    color: '#FB7185',
  },
  netStatusChipSettledText: {
    color: '#93C5FD',
  },
  netAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  netAmountLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  netAmountValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  explanationBox: {
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  explanationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  breakdownGrid: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  breakdownCol: {
    flex: 1,
    alignItems: 'center',
  },
  breakdownDivider: {
    width: 1,
    backgroundColor: '#334155',
  },
  breakdownLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  breakdownValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  statsRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  statsRibbonItem: {
    fontSize: 11,
    color: '#94A3B8',
  },
  statsRibbonBold: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  statsRibbonDot: {
    color: '#475569',
    fontSize: 10,
  },
  auditDisclaimer: {
    fontSize: 10,
    color: '#64748B',
    lineHeight: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  sectionCountBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  emptyLoansBox: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyLoansTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 8,
  },
  emptyLoansSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
  loanRowCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loanRowLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  directionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  directionBadgeLent: {
    backgroundColor: '#064E3B',
  },
  directionBadgeBorrowed: {
    backgroundColor: '#881337',
  },
  directionBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  directionBadgeTextLent: {
    color: '#34D399',
  },
  directionBadgeTextBorrowed: {
    color: '#FB7185',
  },
  loanAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  provenanceTag: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  provenanceText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#94A3B8',
  },
  loanRowRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusPillRepaid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusPillRepaidText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  statusPillOverdue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusPillOverdueText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B91C1C',
  },
  statusPillPending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusPillPendingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  loanDueDate: {
    fontSize: 10,
    color: '#94A3B8',
  },
});
