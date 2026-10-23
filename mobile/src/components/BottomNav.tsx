// Purpose: Modernized bottom navigation footer bar featuring sleek royal black vector icons, animated active page indicator, and centered elevated '+' action button.
// Imported by: App.tsx

import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Animated,
  LayoutChangeEvent,
} from 'react-native';
import { Theme } from '../theme/index';

export type TabKey = 'dashboard' | 'all-loans' | 'account';

interface BottomNavProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  onAddLoanPress: () => void;
}

// Minimalist Royal Black Home Icon
function HomeIcon({ active }: { active: boolean }) {
  const color = active ? Theme.colors.primary : Theme.colors.textMuted;
  return (
    <View style={iconStyles.container}>
      {/* Roof Chevron */}
      <View
        style={[
          iconStyles.roof,
          {
            borderColor: color,
            backgroundColor: active ? color : 'transparent',
          },
        ]}
      />
      {/* House Base */}
      <View
        style={[
          iconStyles.base,
          {
            borderColor: color,
            backgroundColor: active ? color : 'transparent',
          },
        ]}
      >
        {active && <View style={iconStyles.doorHole} />}
      </View>
    </View>
  );
}

// Minimalist Royal Black Ledger / Receipts Icon
function LedgerIcon({ active }: { active: boolean }) {
  const color = active ? Theme.colors.primary : Theme.colors.textMuted;
  const lineBg = active ? '#FFFFFF' : color;
  return (
    <View
      style={[
        iconStyles.docContainer,
        {
          borderColor: color,
          backgroundColor: active ? color : 'transparent',
        },
      ]}
    >
      <View style={[iconStyles.docLine, { backgroundColor: lineBg }]} />
      <View style={[iconStyles.docLine, { backgroundColor: lineBg }]} />
      <View style={[iconStyles.docLineShort, { backgroundColor: lineBg }]} />
    </View>
  );
}

// Minimalist Royal Black User Silhouette Icon
function UserIcon({ active }: { active: boolean }) {
  const color = active ? Theme.colors.primary : Theme.colors.textMuted;
  return (
    <View style={iconStyles.container}>
      {/* Head */}
      <View
        style={[
          iconStyles.userHead,
          {
            borderColor: color,
            backgroundColor: active ? color : 'transparent',
          },
        ]}
      />
      {/* Shoulder Arch */}
      <View
        style={[
          iconStyles.userShoulders,
          {
            borderColor: color,
            backgroundColor: active ? color : 'transparent',
          },
        ]}
      />
    </View>
  );
}

const iconStyles = StyleSheet.create({
  container: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roof: {
    width: 13,
    height: 13,
    borderTopWidth: 2.2,
    borderLeftWidth: 2.2,
    transform: [{ rotate: '45deg' }],
    marginTop: 2,
    borderTopLeftRadius: 1.5,
  },
  base: {
    width: 14,
    height: 10,
    borderWidth: 2,
    borderTopWidth: 0,
    marginTop: -4,
    borderBottomLeftRadius: 2.5,
    borderBottomRightRadius: 2.5,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  doorHole: {
    width: 4,
    height: 4.5,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1,
  },
  docContainer: {
    width: 18,
    height: 22,
    borderRadius: 3,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2.5,
    paddingVertical: 3,
  },
  docLine: {
    width: '100%',
    height: 2,
    borderRadius: 1,
    marginBottom: 2.5,
  },
  docLineShort: {
    width: '60%',
    height: 2,
    borderRadius: 1,
    alignSelf: 'flex-start',
  },
  userHead: {
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 2,
    marginBottom: 2,
  },
  userShoulders: {
    width: 17,
    height: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 2,
    borderBottomWidth: 0,
  },
});

const INDICATOR_WIDTH = 34;

export function BottomNav({ currentTab, onSelectTab, onAddLoanPress }: BottomNavProps) {
  // Measurements for sliding indicator
  const [tabLayouts, setTabLayouts] = useState<{ [key in TabKey]?: { x: number; width: number } }>({});
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const indicatorOpacity = useRef(new Animated.Value(0)).current;

  // Tab bounce scales
  const dashboardScale = useRef(new Animated.Value(1)).current;
  const allLoansScale = useRef(new Animated.Value(1)).current;
  const accountScale = useRef(new Animated.Value(1)).current;

  const handleTabLayout = (tab: TabKey, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    setTabLayouts((prev) => {
      const updated = { ...prev, [tab]: { x, width } };
      return updated;
    });
  };

  useEffect(() => {
    const layout = tabLayouts[currentTab];
    if (layout) {
      const targetX = layout.x + (layout.width - INDICATOR_WIDTH) / 2;
      Animated.parallel([
        Animated.spring(indicatorAnim, {
          toValue: targetX,
          friction: 7,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(indicatorOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [currentTab, tabLayouts, indicatorAnim, indicatorOpacity]);

  const animatePress = (scaleVal: Animated.Value, callback: () => void) => {
    Animated.sequence([
      Animated.timing(scaleVal, {
        toValue: 0.92,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.spring(scaleVal, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
    callback();
  };

  return (
    <View style={styles.navWrapper}>
      {/* Gliding Top Active Indicator Line */}
      <Animated.View
        style={[
          styles.glidingIndicator,
          {
            opacity: indicatorOpacity,
            transform: [{ translateX: indicatorAnim }],
          },
        ]}
      />

      <View style={styles.navBar}>
        {/* Tab 1: Dashboard */}
        <TouchableOpacity
          style={styles.tabItem}
          onLayout={(e) => handleTabLayout('dashboard', e)}
          onPress={() => animatePress(dashboardScale, () => onSelectTab('dashboard'))}
          activeOpacity={0.8}
        >
          <Animated.View
            style={[
              styles.tabInner,
              currentTab === 'dashboard' && styles.tabInnerActive,
              { transform: [{ scale: dashboardScale }] },
            ]}
          >
            <HomeIcon active={currentTab === 'dashboard'} />
            <Text
              style={[
                styles.tabLabel,
                currentTab === 'dashboard' && styles.tabLabelActive,
              ]}
            >
              Dashboard
            </Text>
          </Animated.View>
        </TouchableOpacity>

        {/* Tab 2: All Loans */}
        <TouchableOpacity
          style={styles.tabItem}
          onLayout={(e) => handleTabLayout('all-loans', e)}
          onPress={() => animatePress(allLoansScale, () => onSelectTab('all-loans'))}
          activeOpacity={0.8}
        >
          <Animated.View
            style={[
              styles.tabInner,
              currentTab === 'all-loans' && styles.tabInnerActive,
              { transform: [{ scale: allLoansScale }] },
            ]}
          >
            <LedgerIcon active={currentTab === 'all-loans'} />
            <Text
              style={[
                styles.tabLabel,
                currentTab === 'all-loans' && styles.tabLabelActive,
              ]}
            >
              All Loans
            </Text>
          </Animated.View>
        </TouchableOpacity>

        {/* Center Elevated '+' FAB Button in Royal Black */}
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
          onLayout={(e) => handleTabLayout('account', e)}
          onPress={() => animatePress(accountScale, () => onSelectTab('account'))}
          activeOpacity={0.8}
        >
          <Animated.View
            style={[
              styles.tabInner,
              currentTab === 'account' && styles.tabInnerActive,
              { transform: [{ scale: accountScale }] },
            ]}
          >
            <UserIcon active={currentTab === 'account'} />
            <Text
              style={[
                styles.tabLabel,
                currentTab === 'account' && styles.tabLabelActive,
              ]}
            >
              Account
            </Text>
          </Animated.View>
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
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  glidingIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: INDICATOR_WIDTH,
    height: 3,
    backgroundColor: Theme.colors.primary,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    zIndex: 10,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 58,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Theme.borderRadius.lg,
    gap: 2,
  },
  tabInnerActive: {
    backgroundColor: '#F1F5F9', // Soft subtle royal black background pill
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.textMuted,
    letterSpacing: -0.1,
  },
  tabLabelActive: {
    color: Theme.colors.primary,
    fontWeight: '800',
  },
  fabWrapper: {
    width: 62,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
  },
  fabButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Theme.colors.primary, // Obsidian Royal Black
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  fabPlusText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: -2,
    lineHeight: 30,
  },
});
