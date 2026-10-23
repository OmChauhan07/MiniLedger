// Purpose: Modal displaying full loan details, timeline metrics, direction awareness, and repayment actions matching MiniLedger Stitch specifications.
// Imported by: DashboardScreen.tsx, AllLoansScreen.tsx

import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
  Alert,
  Platform,
} from 'react-native';
import { Loan } from '../types/index';
import { Theme } from '../theme/index';
import {
  formatCurrencyCompact,
  formatDisplayDate,
  checkIsOverdue,
  getRelativeDueLabel,
  getInitials,
} from '../utils/format';
import { CheckIcon, AlertTriangleIcon, ClockIcon, WalletIcon } from './Icons';

interface LoanDetailsModalProps {
  loan: Loan | null;
  visible: boolean;
  onClose: () => void;
  onRepay: (loanId: string) => Promise<void>;
}

export function LoanDetailsModal({
  loan,
  visible,
  onClose,
  onRepay,
}: LoanDetailsModalProps) {
  const [isRepaying, setIsRepaying] = useState(false);
  const { height } = useWindowDimensions();

  if (!loan) return null;

  const isLent = loan.type === 'LENT';
  const isActuallyRepaid = loan.isRepaid;
  const isOverdue = !isActuallyRepaid && checkIsOverdue(loan.dueDate, false);
  const relativeBadge = getRelativeDueLabel(loan.dueDate, isActuallyRepaid);
  const initials = getInitials(loan.friendName);

  const confirmAndRepay = () => {
    const title = isLent ? 'Confirm Repayment' : 'Confirm Payment';
    const message = isLent
      ? `Confirm that you have received full repayment of ${formatCurrencyCompact(loan.amount)} from ${loan.friendName}?`
      : `Confirm that you have paid ${formatCurrencyCompact(loan.amount)} to ${loan.friendName}?`;

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: isLent ? 'Mark Repaid' : 'Mark as Paid',
        onPress: async () => {
          setIsRepaying(true);
          try {
            await onRepay(loan.id);
            onClose();
          } finally {
            setIsRepaying(false);
          }
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheetContainer, { maxHeight: height * 0.92 }]}>
          {/* Android Drag Handle */}
          <View style={styles.dragHandleWrapper}>
            <View style={styles.dragHandle} />
          </View>

          {/* Top Bar */}
          <View style={styles.topBar}>
            <View style={styles.topBarLeft}>
              <Text style={styles.topBarKicker}>MiniLedger</Text>
              <Text style={styles.topBarTitle}>Loan Details</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollBody}
            showsVerticalScrollIndicator={false}
          >
            {/* Direction Pill Banner */}
            <View
              style={[
                styles.directionPillBanner,
                isLent ? styles.directionPillBannerLent : styles.directionPillBannerBorrowed,
              ]}
            >
              <View style={styles.directionPillContent}>
                {isLent ? (
                  <WalletIcon size={14} color="#1D4ED8" />
                ) : (
                  <ClockIcon size={14} color="#DC2626" strokeWidth={1.8} />
                )}
                <Text
                  style={[
                    styles.directionPillText,
                    isLent ? styles.directionPillTextLent : styles.directionPillTextBorrowed,
                  ]}
                >
                  {isLent ? 'LENT • THEY OWE YOU' : 'BORROWED • YOU OWE THEM'}
                </Text>
              </View>
              <Text style={styles.directionPillSubtext}>
                {isLent ? 'Receivable' : 'Payable'}
              </Text>
            </View>

            {/* Profile & Amount Card */}
            <View style={styles.heroCard}>
              {/* Settled Stamp */}
              {isActuallyRepaid && (
                <View style={styles.settledStamp}>
                  <CheckIcon size={12} color="#15803D" strokeWidth={2.4} />
                  <Text style={styles.settledStampText}>
                    {isLent ? 'SETTLED (RECEIVED)' : 'SETTLED (PAID)'}
                  </Text>
                </View>
              )}

              {/* Contact Info Row */}
              <View style={styles.borrowerRow}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <View style={styles.borrowerCol}>
                  <Text style={styles.borrowerName}>{loan.friendName}</Text>
                  <Text style={styles.borrowerSubtitle}>
                    {isLent ? 'Borrower • Friendly Loan' : 'Lender • Friendly Loan'}
                  </Text>
                </View>
              </View>

              {/* Amount Hero Box */}
              <View style={styles.amountHeroBox}>
                <Text style={styles.amountHeroKicker}>
                  {isLent ? 'LENT AMOUNT (RECEIVABLE)' : 'BORROWED AMOUNT (PAYABLE)'}
                </Text>
                <Text style={styles.amountHeroValue}>
                  {formatCurrencyCompact(loan.amount)}
                </Text>
              </View>

              {/* Dynamic Status Banner */}
              {isActuallyRepaid ? (
                <View style={styles.repaidBanner}>
                  <CheckIcon size={14} color={Theme.colors.statusRepaid} strokeWidth={2.2} />
                  <View style={styles.bannerTextCol}>
                    <Text style={styles.repaidBannerHeading}>Fully Settled</Text>
                    <Text style={styles.bannerSubtext}>
                      {loan.repaidAt
                        ? `Payment recorded on ${formatDisplayDate(loan.repaidAt.slice(0, 10))}`
                        : 'Settlement confirmed via UPI transfer'}
                    </Text>
                  </View>
                </View>
              ) : isOverdue ? (
                <View style={styles.overdueBanner}>
                  <AlertTriangleIcon size={14} color={Theme.colors.statusOverdue} />
                  <View style={styles.bannerTextCol}>
                    <Text style={styles.overdueBannerHeading}>
                      {relativeBadge.text} • Priority
                    </Text>
                    <Text style={styles.bannerSubtext}>
                      {isLent
                        ? `Expected repayment was due on ${formatDisplayDate(loan.dueDate)}`
                        : `Payment due date was ${formatDisplayDate(loan.dueDate)}`}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.pendingBanner}>
                  <ClockIcon size={14} color={Theme.colors.statusPending} strokeWidth={1.8} />
                  <View style={styles.bannerTextCol}>
                    <Text style={styles.pendingBannerHeading}>
                      {isLent ? 'Active Receivable' : 'Active Payable'} • {relativeBadge.text}
                    </Text>
                    <Text style={styles.bannerSubtext}>
                      Due on {formatDisplayDate(loan.dueDate)}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Key Metrics Bento */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <View style={styles.metricTextCol}>
                  <Text style={styles.metricLabel}>Direction</Text>
                  <Text style={styles.metricValue}>
                    {isLent ? "I've Lent" : "I've Borrowed"}
                  </Text>
                </View>
              </View>

              <View style={styles.metricCard}>
                <View style={styles.metricTextCol}>
                  <Text style={styles.metricLabel}>Timeline</Text>
                  <Text style={styles.metricValue}>
                    {isActuallyRepaid ? 'Archived' : relativeBadge.text}
                  </Text>
                </View>
              </View>
            </View>

            {/* Transaction Breakdown Rows */}
            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownHeading}>TRANSACTION BREAKDOWN</Text>

              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Purpose</Text>
                <Text style={styles.breakdownValue}>
                  {loan.notes && loan.notes.trim() ? loan.notes : (isLent ? 'Friend loan' : 'Borrowed advance')}
                </Text>
              </View>

              <View style={styles.breakdownDivider} />

              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Origination Date</Text>
                <Text style={styles.breakdownValue}>
                  {formatDisplayDate(loan.createdAt.slice(0, 10))}
                </Text>
              </View>

              <View style={styles.breakdownDivider} />

              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Target Due Date</Text>
                <Text style={styles.breakdownValue}>{formatDisplayDate(loan.dueDate)}</Text>
              </View>

              <View style={styles.breakdownDivider} />

              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Reference ID</Text>
                <Text style={styles.breakdownValueMuted}>
                  {loan.id.slice(0, 8).toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Bottom Actions */}
            <View style={styles.actionsContainer}>
              {!loan.isRepaid && (
                <TouchableOpacity
                  style={[styles.markRepaidBtn, isRepaying && styles.markRepaidBtnDisabled]}
                  onPress={confirmAndRepay}
                  disabled={isRepaying}
                  activeOpacity={0.85}
                >
                  {isRepaying ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <View style={styles.markRepaidBtnContent}>
                      <CheckIcon size={14} color="#FFFFFF" strokeWidth={2.2} />
                      <Text style={styles.markRepaidBtnText}>
                        {isLent ? 'Mark as Repaid (Received)' : 'Mark as Paid'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.closeActionBtn}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.closeActionBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.borderLight,
  },
  topBarLeft: {
    justifyContent: 'center',
  },
  topBarKicker: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    fontWeight: '700',
  },
  scrollBody: {
    padding: 18,
    paddingBottom: 36,
  },
  directionPillBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    marginBottom: 14,
  },
  directionPillBannerLent: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  directionPillBannerBorrowed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  directionPillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  directionPillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  directionPillTextLent: {
    color: '#1D4ED8',
  },
  directionPillTextBorrowed: {
    color: '#DC2626',
  },
  directionPillSubtext: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.borderSubtle,
    position: 'relative',
    marginBottom: 14,
    ...Theme.shadows.sm,
  },
  settledStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.borderRadius.full,
    zIndex: 2,
  },
  settledStampText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  borrowerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  borrowerCol: {
    flex: 1,
  },
  borrowerName: {
    fontSize: 17,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  borrowerSubtitle: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  amountHeroBox: {
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.borderRadius.lg,
    padding: 14,
    marginBottom: 14,
  },
  amountHeroKicker: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.textMuted,
    letterSpacing: 0.5,
  },
  amountHeroValue: {
    fontSize: 26,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    marginTop: 4,
    letterSpacing: -0.4,
  },
  repaidBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.statusRepaidTint,
    borderRadius: Theme.borderRadius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: Theme.colors.statusRepaidBorder,
    gap: 8,
  },
  overdueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.statusOverdueTint,
    borderRadius: Theme.borderRadius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: Theme.colors.statusOverdueBorder,
    gap: 8,
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.statusPendingTint,
    borderRadius: Theme.borderRadius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: Theme.colors.statusPendingBorder,
    gap: 8,
  },
  bannerTextCol: {
    flex: 1,
  },
  repaidBannerHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.statusRepaid,
  },
  overdueBannerHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.statusOverdue,
  },
  pendingBannerHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.statusPending,
  },
  bannerSubtext: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: Theme.colors.borderSubtle,
    ...Theme.shadows.sm,
  },
  metricTextCol: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.textMuted,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginTop: 2,
  },
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.borderSubtle,
    marginBottom: 16,
    ...Theme.shadows.sm,
  },
  breakdownHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  breakdownLabel: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  breakdownValueMuted: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: Theme.colors.textMuted,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: Theme.colors.borderLight,
    marginVertical: 8,
  },
  actionsContainer: {
    gap: 8,
  },
  markRepaidBtn: {
    backgroundColor: '#0F172A',
    borderRadius: Theme.borderRadius.lg,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.card,
  },
  markRepaidBtnDisabled: {
    opacity: 0.6,
  },
  markRepaidBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  markRepaidBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeActionBtn: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeActionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textMuted,
  },
});
