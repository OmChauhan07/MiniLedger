// Purpose: Account settings screen displaying user profile, security preferences, and ledger export matching MiniLedger Stitch specifications.
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { User, Summary } from '../../types/index';
import {
  ShieldIcon,
  CheckIcon,
  LockIcon,
  ExportIcon,
  LogoutIcon,
  ChatIcon,
  InfoIcon,
} from '../../components/Icons';
import { Theme, STATUS_BAR_HEIGHT } from '../../theme/index';
import { formatCurrencyCompact } from '../../utils/format';

interface AccountScreenProps {
  user: User;
  summary: Summary | null;
  totalLoansCount: number;
  onLogout: () => void;
  onExportCsv?: () => void;
}

export function AccountScreen({
  user,
  summary,
  totalLoansCount,
  onLogout,
  onExportCsv,
}: AccountScreenProps) {
  const [screenLockEnabled, setScreenLockEnabled] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(true);

  const totalTracked = parseFloat(summary?.totalLent ?? '0') || 0;
  const userInitials = user.phone ? user.phone.slice(-2) : 'RM';

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

  const handleExport = () => {
    if (onExportCsv) {
      onExportCsv();
    } else {
      Alert.alert(
        'Export Ledger',
        `Ready to export ${totalLoansCount} ledger records in standard CSV format.`,
        [{ text: 'OK' }]
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
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{userInitials}</Text>
              <View style={styles.verifiedCheckBadge}>
                <CheckIcon size={9} color="#FFFFFF" strokeWidth={2.4} />
              </View>
            </View>

            <View style={styles.profileDetailsCol}>
              <View style={styles.profileNameRow}>
                <Text style={styles.userNameText}>MiniLedger User</Text>
                <View style={styles.accountTypeBadge}>
                  <Text style={styles.accountTypeText}>Personal</Text>
                </View>
              </View>
              <Text style={styles.userPhoneText}>{user.phone}</Text>

              <View style={styles.verifiedBadgeRow}>
                <ShieldIcon size={11} color="#0F172A" />
                <Text style={styles.verifiedBadgeText}>Phone Verified</Text>
              </View>
            </View>
          </View>

          {/* Quick Stat Strip */}
          <View style={styles.statStrip}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Ledger Activity</Text>
              <Text style={styles.statValue}>{totalLoansCount} Active Loans</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={[styles.statCol, styles.statColRight]}>
              <Text style={styles.statLabel}>Capital Tracked</Text>
              <Text style={styles.statValueHighlight}>
                {formatCurrencyCompact(totalTracked)}
              </Text>
            </View>
          </View>
        </View>

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

        {/* Section 2: Security & Portability */}
        <Text style={styles.sectionHeaderLabel}>SECURITY & DATA</Text>
        <View style={styles.menuCard}>
          {/* Screen Lock Security Row */}
          <View style={styles.menuRow}>
            <View style={styles.menuIconBox}>
              <LockIcon size={16} color="#0F172A" />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Screen Lock Security</Text>
              <Text style={styles.menuSubtitle}>Biometric & Device PIN protection</Text>
            </View>
            <Switch
              value={screenLockEnabled}
              onValueChange={setScreenLockEnabled}
              trackColor={{ false: Theme.colors.borderSubtle, true: Theme.colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.menuDivider} />

          {/* Export Records Row */}
          <TouchableOpacity
            onPress={handleExport}
            style={styles.menuRow}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconBox}>
              <ExportIcon size={16} color="#0F172A" />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Export Ledger Records</Text>
              <Text style={styles.menuSubtitle}>Download as standard CSV format</Text>
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
  verifiedCheckText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
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
  verifiedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#0F172A',
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Theme.borderRadius.full,
    marginTop: 6,
    gap: 5,
    ...Theme.shadows.sm,
  },
  shieldIcon: {
    fontSize: 11,
  },
  verifiedBadgeText: {
    fontSize: 11,
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
  statLabel: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginTop: 2,
  },
  statValueHighlight: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.primary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
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
  menuIconDangerText: {
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
