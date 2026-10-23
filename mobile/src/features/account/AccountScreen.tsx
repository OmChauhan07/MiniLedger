// Purpose: Account settings screen displaying user profile, editable details, mutual counterparties, and PDF ledger export matching MiniLedger specifications.
// Imported by: App.tsx

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Switch,
  ScrollView,
  SafeAreaView,
  Alert,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { User, Summary, Loan } from '../../types/index';
import {
  ShieldIcon,
  CheckIcon,
  ExportIcon,
  FilePdfIcon,
  LogoutIcon,
  ChatIcon,
  InfoIcon,
  ArrowUpRightIcon,
  ArrowDownLeftIcon,
  EditIcon,
  CameraIcon,
} from '../../components/Icons';
import { EditProfileModal } from '../../components/EditProfileModal';
import { ExportPdfModal } from '../../components/ExportPdfModal';
import { AvatarPickerModal } from '../../components/AvatarPickerModal';
import { Theme, STATUS_BAR_HEIGHT } from '../../theme/index';
import { formatCurrencyCompact, getInitials } from '../../utils/format';

interface AccountScreenProps {
  user: User;
  summary: Summary | null;
  loans?: Loan[];
  totalLoansCount: number;
  onLogout: () => void;
  onUpdateUser?: (updatedUser: User) => void;
  onViewRelationship?: (counterpartyId: string) => void;
  onShowToast?: (message: string) => void;
}

export function AccountScreen({
  user,
  summary,
  loans = [],
  totalLoansCount,
  onLogout,
  onUpdateUser,
  onViewRelationship,
  onShowToast,
}: AccountScreenProps) {
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [isEditProfileVisible, setIsEditProfileVisible] = useState(false);
  const [isExportPdfVisible, setIsExportPdfVisible] = useState(false);
  const [isAvatarPickerVisible, setIsAvatarPickerVisible] = useState(false);

  const totalLent = parseFloat(summary?.totalLent ?? '0') || 0;
  const totalBorrowed = parseFloat(summary?.totalBorrowed ?? '0') || 0;
  const outstandingLent = parseFloat(summary?.outstandingLent ?? summary?.outstandingAmount ?? '0') || 0;
  const outstandingBorrowed = parseFloat(summary?.outstandingBorrowed ?? '0') || 0;

  const lentLoans = loans.filter((l) => (l.type ?? 'LENT') === 'LENT');
  const borrowedLoans = loans.filter((l) => l.type === 'BORROWED');
  const lentCount = lentLoans.length;
  const borrowedCount = borrowedLoans.length;

  const registeredCounterparties = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string; maskedPhone: string }>();
    for (const loan of loans) {
      if (loan.counterpartyUser && loan.counterpartyUserId) {
        if (!map.has(loan.counterpartyUser.id)) {
          map.set(loan.counterpartyUser.id, loan.counterpartyUser);
        }
      }
    }
    return Array.from(map.values());
  }, [loans]);

  const displayName = user.name || 'MiniLedger User';
  const userInitials = user.name ? getInitials(user.name) : user.phone ? user.phone.slice(-2) : 'ML';

  const handleConfirmLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of MiniLedger? Your local cached session will be cleared.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: onLogout },
      ]
    );
  };

  const handleProfileUpdated = (updatedUser: User) => {
    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    }
    if (onShowToast) {
      onShowToast('Profile details updated successfully!');
    }
  };

  const handleAvatarUpdated = (updatedUser: User) => {
    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    }
    if (onShowToast) {
      onShowToast(updatedUser.avatarUrl ? 'Profile picture updated successfully!' : 'Profile picture removed.');
    }
  };

  const handleExportSuccess = (filename: string, recordCount: number) => {
    if (onShowToast) {
      onShowToast(`Exported ${recordCount} records to ${filename}`);
    } else {
      Alert.alert(
        'Ledger Export Complete',
        `Generated statement with ${recordCount} records. You can view or save ${filename} via your device.`
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Header Bar */}
      <View style={styles.topHeader}>
        <View style={styles.titleRow}>
          <Text style={styles.headerKicker}>MiniLedger</Text>
          <Text style={styles.headerTitle}>Account</Text>
        </View>
      </View>

      <ScrollView
        style={styles.mainContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Bento Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileTopRow}>
            <TouchableOpacity
              style={styles.avatarCircle}
              activeOpacity={0.8}
              onPress={() => setIsAvatarPickerVisible(true)}
            >
              {user.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.avatarText}>{userInitials}</Text>
              )}
              <View style={styles.cameraCheckBadge}>
                <CameraIcon size={9} color="#FFFFFF" strokeWidth={2.4} />
              </View>
            </TouchableOpacity>

            <View style={styles.profileDetailsCol}>
              <View style={styles.profileNameRow}>
                <Text style={styles.userNameText}>{displayName}</Text>
                <View style={styles.accountTypeBadge}>
                  <Text style={styles.accountTypeText}>Personal</Text>
                </View>
              </View>
              <Text style={styles.userPhoneText}>{user.phone}</Text>
              {user.email ? <Text style={styles.userEmailText}>{user.email}</Text> : null}

              <View style={styles.badgeAndActionRow}>
                <View style={styles.verifiedBadgeRow}>
                  <ShieldIcon size={11} color="#0F172A" />
                  <Text style={styles.verifiedBadgeText}>Phone Verified</Text>
                </View>

                {/* Edit Profile Button */}
                <TouchableOpacity
                  style={styles.editProfileBtn}
                  activeOpacity={0.7}
                  onPress={() => setIsEditProfileVisible(true)}
                >
                  <EditIcon size={11} color="#0F172A" />
                  <Text style={styles.editProfileBtnText}>Edit Profile</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Quick Stat Strip: Lent vs Borrowed */}
          <View style={styles.statStrip}>
            <View style={styles.statCol}>
              <View style={styles.statKickerRow}>
                <ArrowUpRightIcon size={11} color="#059669" strokeWidth={2.4} />
                <Text style={styles.statLabelLent}>Lent Portfolio</Text>
              </View>
              <Text style={styles.statValue}>{formatCurrencyCompact(totalLent)}</Text>
              <Text style={styles.statSubText}>
                {lentCount} {lentCount === 1 ? 'loan' : 'loans'} · {formatCurrencyCompact(outstandingLent)} to receive
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={[styles.statCol, styles.statColRight]}>
              <View style={[styles.statKickerRow, styles.statKickerRowRight]}>
                <ArrowDownLeftIcon size={11} color="#D97706" strokeWidth={2.4} />
                <Text style={styles.statLabelBorrowed}>Borrowed Portfolio</Text>
              </View>
              <Text style={styles.statValueHighlight}>
                {formatCurrencyCompact(totalBorrowed)}
              </Text>
              <Text style={[styles.statSubText, styles.statSubTextRight]}>
                {borrowedCount} {borrowedCount === 1 ? 'loan' : 'loans'} · {formatCurrencyCompact(outstandingBorrowed)} to pay
              </Text>
            </View>
          </View>
        </View>

        {/* Registered Counterparties Mutual Ledgers */}
        {registeredCounterparties.length > 0 && (
          <View style={{ marginBottom: 14 }}>
            <Text style={styles.sectionHeaderLabel}>
              REGISTERED COUNTERPARTIES ({registeredCounterparties.length})
            </Text>
            <View style={styles.menuCard}>
              {registeredCounterparties.map((cp, idx) => (
                <React.Fragment key={cp.id}>
                  {idx > 0 && <View style={styles.menuDivider} />}
                  <TouchableOpacity
                    style={styles.menuRow}
                    activeOpacity={0.7}
                    onPress={() => onViewRelationship?.(cp.id)}
                  >
                    <View style={styles.menuIconBox}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A' }}>
                        {getInitials(cp.name)}
                      </Text>
                    </View>
                    <View style={styles.menuTextCol}>
                      <Text style={styles.menuTitle}>{cp.name}</Text>
                      <Text style={styles.menuSubtitle}>{cp.maskedPhone} • View mutual ledger</Text>
                    </View>
                    <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#0284C7' }}>Ledger ↗</Text>
                    </View>
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </View>
          </View>
        )}

        {/* Section 1: Preferences */}
        <Text style={styles.sectionHeaderLabel}>LEDGER & PREFERENCES</Text>
        <View style={styles.menuCard}>
          {/* Base Currency Row */}
          <View style={styles.menuRow}>
            <View style={styles.menuIconBox}>
              <Text style={styles.menuIconText}>₹</Text>
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Base Currency</Text>
              <Text style={styles.menuSubtitle}>Indian Rupee (₹ INR)</Text>
            </View>
            <View style={styles.defaultPill}>
              <Text style={styles.defaultPillText}>Default</Text>
            </View>
          </View>

          <View style={styles.menuDivider} />

          {/* WhatsApp Reminders Row */}
          <View style={styles.menuRow}>
            <View style={styles.menuIconBox}>
              <ChatIcon size={16} color="#0F172A" />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Friendly Reminders</Text>
              <Text style={styles.menuSubtitle}>Gentle auto-reminder tone template</Text>
            </View>
            <Switch
              value={remindersEnabled}
              onValueChange={setRemindersEnabled}
              trackColor={{ false: Theme.colors.borderSubtle, true: Theme.colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Section 2: Data & Portability (Biometrics removed; PDF export added) */}
        <Text style={styles.sectionHeaderLabel}>DATA & PORTABILITY</Text>
        <View style={styles.menuCard}>
          {/* Export Records as PDF Row */}
          <TouchableOpacity
            onPress={() => setIsExportPdfVisible(true)}
            style={styles.menuRow}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconBox}>
              <FilePdfIcon size={16} color="#0F172A" />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Export Ledger as PDF</Text>
              <Text style={styles.menuSubtitle}>Download, view, or share personal statement</Text>
            </View>
            <Text style={styles.chevronArrow}>➔</Text>
          </TouchableOpacity>
        </View>

        {/* Section 3: App info and sign out */}
        <Text style={styles.sectionHeaderLabel}>SESSION</Text>
        <View style={styles.menuCard}>
          <View style={styles.menuRow}>
            <View style={styles.menuIconBox}>
              <InfoIcon size={16} color="#0F172A" />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>MiniLedger Mobile</Text>
              <Text style={styles.menuSubtitle}>Version 1.0.0 (Expo SDK 58)</Text>
            </View>
          </View>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            onPress={handleConfirmLogout}
            style={styles.menuRow}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconBox, styles.menuIconBoxDanger]}>
              <LogoutIcon size={16} color="#DC2626" />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitleDanger}>Sign Out</Text>
              <Text style={styles.menuSubtitle}>Log out of current device session</Text>
            </View>
            <Text style={styles.chevronArrowDanger}>➔</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal (with phone OTP verification) */}
      <EditProfileModal
        visible={isEditProfileVisible}
        user={user}
        onClose={() => setIsEditProfileVisible(false)}
        onProfileUpdated={handleProfileUpdated}
      />

      {/* Export PDF Modal (with filters and native sharing) */}
      <ExportPdfModal
        visible={isExportPdfVisible}
        onClose={() => setIsExportPdfVisible(false)}
        onExportSuccess={handleExportSuccess}
      />

      {/* Avatar Picker Modal */}
      <AvatarPickerModal
        visible={isAvatarPickerVisible}
        user={user}
        onClose={() => setIsAvatarPickerVisible(false)}
        onAvatarUpdated={handleAvatarUpdated}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: STATUS_BAR_HEIGHT,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.borderSubtle,
    ...Theme.shadows.sm,
  },
  titleRow: {
    justifyContent: 'center',
  },
  headerKicker: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 96,
  },
  profileCard: {
    backgroundColor: Theme.colors.surfaceCard,
    borderRadius: Theme.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.borderSubtle,
    marginBottom: 20,
    ...Theme.shadows.card,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    position: 'relative',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    ...Theme.shadows.sm,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  cameraCheckBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  verifiedCheckBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Theme.colors.statusRepaid,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileDetailsCol: {
    flex: 1,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  accountTypeBadge: {
    backgroundColor: Theme.colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.full,
  },
  accountTypeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.primary,
  },
  userPhoneText: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  userEmailText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  badgeAndActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    gap: 8,
  },
  verifiedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.borderRadius.full,
    gap: 4,
    ...Theme.shadows.sm,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Theme.colors.borderSubtle,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Theme.borderRadius.full,
    gap: 4,
  },
  editProfileBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
  },
  statStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.borderRadius.lg,
    padding: 12,
    marginTop: 16,
  },
  statCol: {
    flex: 1,
  },
  statColRight: {
    alignItems: 'flex-end',
  },
  statKickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statKickerRowRight: {
    justifyContent: 'flex-end',
  },
  statLabelLent: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statLabelBorrowed: {
    fontSize: 10,
    color: '#D97706',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginTop: 2,
  },
  statValueHighlight: {
    fontSize: 15,
    fontWeight: '700',
    color: '#D97706',
    marginTop: 2,
  },
  statSubText: {
    fontSize: 10,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  statSubTextRight: {
    textAlign: 'right',
  },
  statDivider: {
    width: 1,
    height: 38,
    backgroundColor: Theme.colors.borderSubtle,
    marginHorizontal: 10,
  },
  sectionHeaderLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: Theme.colors.borderSubtle,
    marginBottom: 18,
    overflow: 'hidden',
    ...Theme.shadows.sm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuIconBoxDanger: {
    backgroundColor: Theme.colors.statusOverdueTint,
  },
  menuIconText: {
    fontSize: 16,
  },
  menuTextCol: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  menuTitleDanger: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.statusOverdue,
  },
  menuSubtitle: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginTop: 1,
  },
  defaultPill: {
    backgroundColor: Theme.colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.borderRadius.sm,
  },
  defaultPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  chevronArrow: {
    fontSize: 14,
    color: Theme.colors.textMuted,
  },
  chevronArrowDanger: {
    fontSize: 14,
    color: Theme.colors.statusOverdue,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Theme.colors.borderLight,
    marginLeft: 62,
  },
});
