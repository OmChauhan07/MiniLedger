// Purpose: Modal displaying full loan details, timeline metrics, and repayment actions matching MiniLedger Stitch specifications.
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
  Platform,
} from 'react-native';
import { Loan } from '../types/index.js';
import { Theme } from '../theme/index.js';
import {
  formatCurrencyCompact,
  formatDisplayDate,
  checkIsOverdue,
  getRelativeDueLabel,
  getInitials,
} from '../utils/format.js';

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
  const [previewRepaid, setPreviewRepaid] = useState(false);
  const { height } = useWindowDimensions();

  if (!loan) return null;

  const isActuallyRepaid = loan.isRepaid || previewRepaid;
  const isOverdue = !isActuallyRepaid && checkIsOverdue(loan.dueDate, false);
  const relativeBadge = getRelativeDueLabel(loan.dueDate, isActuallyRepaid);
  const initials = getInitials(loan.friendName);

  const handleMarkRepaid = async () => {
    setIsRepaying(true);
    try {
      await onRepay(loan.id);
      onClose();
    } finally {
      setIsRepaying(false);
    }
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
            {/* Interactive View Toggle Pill */}
            <View style={styles.togglePillContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleTab,
                  !previewRepaid && styles.toggleTabActive,
                ]}
                onPress={() => setPreviewRepaid(false)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.toggleDot,
                    { backgroundColor: isOverdue ? Theme.colors.statusOverdue : Theme.colors.statusPending },
                  ]}
                />
                <Text
                  style={[
                    styles.toggleTabText,
                    !previewRepaid && styles.toggleTabTextActive,
                  ]}
                >
                  {isOverdue ? 'Overdue Status' : 'Pending Status'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.toggleTab,
                  previewRepaid && styles.toggleTabActive,
                ]}
                onPress={() => setPreviewRepaid(true)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.toggleDot,
                    { backgroundColor: Theme.colors.statusRepaid },
                  ]}
                />
                <Text
                  style={[
                    styles.toggleTabText,
                    previewRepaid && styles.toggleTabTextActive,
                  ]}
                >
                  Settled Preview
                </Text>
              </TouchableOpacity>
            </View>

            {/* Profile & Amount Card */}
            <View style={styles.heroCard}>
              {/* Settled Stamp (conditionally displayed) */}
              {isActuallyRepaid && (
                <View style={styles.settledStamp}>
                  <Text style={styles.settledStampText}>✓ SETTLED</Text>
                </View>
              )}

              {/* Borrower Info Row */}
              <View style={styles.borrowerRow}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <View style={styles.borrowerCol}>
                  <Text style={styles.borrowerName}>{loan.friendName}</Text>
                  <Text style={styles.borrowerSubtitle}>Personal Lending</Text>
                </View>
              </View>

              {/* Lent Amount Hero */}
              <View style={styles.amountHeroBox}>
                <Text style={styles.amountHeroKicker}>LENT AMOUNT</Text>
                <Text style={styles.amountHeroValue}>
                  {formatCurrencyCompact(loan.amount)}
                </Text>
              </View>

              {/* Dynamic Status Banner */}
              {isActuallyRepaid ? (
                <View style={styles.repaidBanner}>
                  <Text style={styles.bannerIconText}>✓</Text>
                  <View style={styles.bannerTextCol}>
                    <Text style={styles.repaidBannerHeading}>Fully Settled</Text>
                    <Text style={styles.bannerSubtext}>
                      {loan.repaidAt
                        ? `Payment confirmed on ${formatDisplayDate(loan.repaidAt.slice(0, 10))}`
                        : 'Settlement confirmed via UPI transfer'}
                    </Text>
                  </View>
                </View>
              ) : isOverdue ? (
                <View style={styles.overdueBanner}>
                  <Text style={styles.bannerIconText}>⚠</Text>
                  <View style={styles.bannerTextCol}>
                    <Text style={styles.overdueBannerHeading}>
                      {relativeBadge.text} • Priority
                    </Text>
                    <Text style={styles.bannerSubtext}>
                      Target due date was {formatDisplayDate(loan.dueDate)}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.pendingBanner}>
                  <Text style={styles.bannerIconText}>⏱</Text>
                  <View style={styles.bannerTextCol}>
                    <Text style={styles.pendingBannerHeading}>
                      Active Loan • {relativeBadge.text}
                    </Text>
                    <Text style={styles.bannerSubtext}>
                      Due on {formatDisplayDate(loan.dueDate)}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Key Metrics Bento (from Stitch) */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <View style={styles.metricIconBox}>
                  <Text style={styles.metricGlyph}>💳</Text>
                </View>
                <View style={styles.metricTextCol}>
                  <Text style={styles.metricLabel}>Channel</Text>
                  <Text style={styles.metricValue}>UPI / Net Banking</Text>
                </View>
              </View>

              <View style={styles.metricCard}>
                <View style={styles.metricIconBox}>
                  <Text style={styles.metricGlyph}>🗓</Text>
                </View>
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
                  {loan.notes && loan.notes.trim() ? loan.notes : 'Friend loan split'}
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
                  onPress={handleMarkRepaid}
                  disabled={isRepaying}
                  activeOpacity={0.85}
                >
                  {isRepaying ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.markRepaidBtnText}>✓ Mark as Fully Repaid</Text>
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
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  scrollBody: {
    padding: 18,
    paddingBottom: 36,
  },
  togglePillContainer: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.borderRadius.full,
    padding: 4,
    marginBottom: 16,
  },
  toggleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: Theme.borderRadius.full,
    gap: 6,
  },
  toggleTabActive: {
    backgroundColor: '#FFFFFF',
    ...Theme.shadows.sm,
  },
  toggleDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  toggleTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textMuted,
  },
  toggleTabTextActive: {
    color: Theme.colors.textPrimary,
    fontWeight: '700',
  },
  heroCard: {
    position: 'relative',
    backgroundColor: Theme.colors.surfaceCard,
    borderRadius: Theme.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.borderSubtle,
    marginBottom: 14,
    ...Theme.shadows.card,
  },
  settledStamp: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: Theme.colors.statusRepaidTint,
    borderWidth: 1,
    borderColor: Theme.colors.statusRepaidBorder,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.borderRadius.sm,
    transform: [{ rotate: '8deg' }],
  },
  settledStampText: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.statusRepaid,
    letterSpacing: 0.5,
  },
  borrowerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  borrowerCol: {
    flex: 1,
  },
  borrowerName: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  borrowerSubtitle: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  amountHeroBox: {
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.borderRadius.lg,
    paddingVertical: 14,
    marginBottom: 14,
  },
  amountHeroKicker: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.textMuted,
    letterSpacing: 0.6,
  },
  amountHeroValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Theme.colors.primary,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  repaidBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.statusRepaidTint,
    borderRadius: Theme.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: Theme.colors.statusRepaidBorder,
  },
  overdueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.statusOverdueTint,
    borderRadius: Theme.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: Theme.colors.statusOverdueBorder,
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.statusPendingTint,
    borderRadius: Theme.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: Theme.colors.statusPendingBorder,
  },
  bannerIconText: {
    fontSize: 16,
    marginRight: 10,
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
    marginTop: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  metricCard: {
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
  metricIconBox: {
    width: 32,
    height: 32,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Theme.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  metricGlyph: {
    fontSize: 14,
  },
  metricTextCol: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Theme.colors.textMuted,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginTop: 1,
  },
  breakdownCard: {
    backgroundColor: Theme.colors.surfaceCard,
    borderRadius: Theme.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.borderSubtle,
    marginBottom: 18,
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
    maxWidth: '60%',
    textAlign: 'right',
  },
  breakdownValueMuted: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: Theme.colors.borderLight,
    marginVertical: 8,
  },
  actionsContainer: {
    gap: 10,
  },
  markRepaidBtn: {
    height: 48,
    backgroundColor: Theme.colors.statusRepaid,
    borderRadius: Theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.sm,
  },
  markRepaidBtnDisabled: {
    opacity: 0.6,
  },
  markRepaidBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeActionBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeActionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
});
