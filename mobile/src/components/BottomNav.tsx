// Purpose: Bottom tab navigation bar with centered elevated '+' action button matching MiniLedger Stitch specifications.
// Imported by: App.tsx or main layout container

import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { Theme } from '../theme/index.js';

export type TabKey = 'dashboard' | 'all-loans' | 'account';

interface BottomNavProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  onAddLoanPress: () => void;
}

export function BottomNav({ currentTab, onSelectTab, onAddLoanPress }: BottomNavProps) {
  return (
    <View style={styles.navWrapper}>
      <View style={styles.navBar}>
        {/* Tab 1: Dashboard */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onSelectTab('dashboard')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabIcon,
              currentTab === 'dashboard' && styles.tabIconActive,
            ]}
          >
            🏠
          </Text>
          <Text
            style={[
              styles.tabLabel,
              currentTab === 'dashboard' && styles.tabLabelActive,
            ]}
          >
            Dashboard
          </Text>
        </TouchableOpacity>

        {/* Tab 2: All Loans */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onSelectTab('all-loans')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabIcon,
              currentTab === 'all-loans' && styles.tabIconActive,
            ]}
          >
            📄
          </Text>
          <Text
            style={[
              styles.tabLabel,
              currentTab === 'all-loans' && styles.tabLabelActive,
            ]}
          >
            All Loans
          </Text>
        </TouchableOpacity>

        {/* Center Elevated '+' FAB */}
        <View style={styles.fabWrapper}>
          <TouchableOpacity
            style={styles.fabButton}
            onPress={onAddLoanPress}
            activeOpacity={0.85}
          >
            <Text style={styles.fabPlusText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Tab 3: Account */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onSelectTab('account')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabIcon,
              currentTab === 'account' && styles.tabIconActive,
            ]}
          >
            👤
          </Text>
          <Text
            style={[
              styles.tabLabel,
              currentTab === 'account' && styles.tabLabelActive,
            ]}
          >
            Account
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navWrapper: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Theme.colors.borderSubtle,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    ...Theme.shadows.card,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 2,
    opacity: 0.6,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.textMuted,
  },
  tabLabelActive: {
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  fabWrapper: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
  },
  fabButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  fabPlusText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: -2,
  },
});
