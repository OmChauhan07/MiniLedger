// Purpose: High-end bottom navigation footer bar featuring symmetrical 5-column layout, pure Royal Obsidian Black vector icons, dedicated Lent and Borrowed tabs, smooth gliding active indicator, elevated '+' action button, and spacious gesture bar padding.
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

export type TabKey = 'dashboard' | 'lent' | 'borrowed' | 'account' | 'all-loans';

interface BottomNavProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  onAddLoanPress: () => void;
}

// 1. Sleek Royal Black Home Icon
function HomeIcon({ active }: { active: boolean }) {
  const color = active ? '#0F172A' : '#94A3B8';
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
        <View
          style={[
            iconStyles.doorHole,
            { backgroundColor: active ? '#FFFFFF' : color },
          ]}
        />
      </View>
    </View>
  );
}

// 2. Lent Nav Icon (Money Out ↗)
function LentNavIcon({ active }: { active: boolean }) {
  const color = active ? '#059669' : '#94A3B8';
  return (
    <View style={iconStyles.container}>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          borderWidth: active ? 1.8 : 1.5,
          borderColor: color,
          backgroundColor: active ? '#ECFDF5' : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Diagonal Stem */}
        <View
          style={{
            width: 9,
            height: 1.8,
            backgroundColor: color,
            transform: [{ rotate: '-45deg' }],
          }}
        />
        {/* Arrowhead */}
        <View
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 4.5,
            height: 4.5,
            borderTopWidth: 1.8,
            borderRightWidth: 1.8,
            borderColor: color,
          }}
        />
      </View>
    </View>
  );
}

// 3. Borrowed Nav Icon (Money In ↙)
function BorrowedNavIcon({ active }: { active: boolean }) {
  const color = active ? '#D97706' : '#94A3B8';
  return (
    <View style={iconStyles.container}>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          borderWidth: active ? 1.8 : 1.5,
          borderColor: color,
          backgroundColor: active ? '#FFFBEB' : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Diagonal Stem */}
        <View
          style={{
            width: 9,
            height: 1.8,
            backgroundColor: color,
            transform: [{ rotate: '-45deg' }],
          }}
        />
        {/* Arrowhead */}
        <View
          style={{
            position: 'absolute',
            bottom: 4,
            left: 4,
            width: 4.5,
            height: 4.5,
            borderBottomWidth: 1.8,
            borderLeftWidth: 1.8,
            borderColor: color,
          }}
        />
      </View>
    </View>
  );
}

// 4. Sleek Royal Black User Silhouette Icon
function UserIcon({ active }: { active: boolean }) {
  const color = active ? '#0F172A' : '#94A3B8';
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

// 5. Centered Plus Vector Icon
function PlusVectorIcon() {
  return (
    <View style={iconStyles.plusBox}>
      <View style={iconStyles.plusH} />
      <View style={iconStyles.plusV} />
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
    width: 14,
    height: 14,
    borderTopWidth: 2.2,
    borderLeftWidth: 2.2,
    transform: [{ rotate: '45deg' }],
    marginTop: 2,
    borderTopLeftRadius: 1.5,
  },
  base: {
    width: 15,
    height: 10,
    borderWidth: 2,
    borderTopWidth: 0,
    marginTop: -4.5,
    borderBottomLeftRadius: 2.5,
    borderBottomRightRadius: 2.5,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  doorHole: {
    width: 4,
    height: 5,
    borderTopLeftRadius: 1.5,
    borderTopRightRadius: 1.5,
  },
  userHead: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
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
  plusBox: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  plusH: {
    width: 14,
    height: 2.4,
    backgroundColor: '#FFFFFF',
    borderRadius: 1.2,
  },
  plusV: {
    width: 2.4,
    height: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 1.2,
    position: 'absolute',
  },
});

const INDICATOR_WIDTH = 24;

export function BottomNav({ currentTab, onSelectTab, onAddLoanPress }: BottomNavProps) {
  // Measurements for sliding indicator
  const [tabLayouts, setTabLayouts] = useState<{ [key in TabKey]?: { x: number; width: number } }>({});
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const indicatorOpacity = useRef(new Animated.Value(0)).current;

  // Tab bounce scales
  const dashboardScale = useRef(new Animated.Value(1)).current;
  const lentScale = useRef(new Animated.Value(1)).current;
  const borrowedScale = useRef(new Animated.Value(1)).current;
  const accountScale = useRef(new Animated.Value(1)).current;
  const addScale = useRef(new Animated.Value(1)).current;

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
          friction: 8,
          tension: 75,
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
        friction: 6,
        tension: 110,
        useNativeDriver: true,
      }),
    ]).start();
    callback();
  };

  return (
    <View style={styles.navWrapper}>
      <View style={styles.navBar}>
        {/* Animated Gliding Active Indicator Line */}
        <Animated.View
          style={[
            styles.glidingIndicator,
            {
              opacity: indicatorOpacity,
              transform: [{ translateX: indicatorAnim }],
            },
          ]}
        />

        {/* Tab 1: Dashboard */}
        <TouchableOpacity
          style={styles.tabItem}
          onLayout={(e) => handleTabLayout('dashboard', e)}
          onPress={() => animatePress(dashboardScale, () => onSelectTab('dashboard'))}
          activeOpacity={0.75}
        >
          <Animated.View
            style={[
              styles.tabInner,
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
              Home
            </Text>
            {currentTab === 'dashboard' && <View style={styles.activeDotPill} />}
          </Animated.View>
        </TouchableOpacity>

        {/* Tab 2: Lent (They Owe You) */}
        <TouchableOpacity
          style={styles.tabItem}
          onLayout={(e) => handleTabLayout('lent', e)}
          onPress={() => animatePress(lentScale, () => onSelectTab('lent'))}
          activeOpacity={0.75}
        >
          <Animated.View
            style={[
              styles.tabInner,
              { transform: [{ scale: lentScale }] },
            ]}
          >
            <LentNavIcon active={currentTab === 'lent'} />
            <Text
              style={[
                styles.tabLabel,
                currentTab === 'lent' && styles.tabLabelActiveLent,
              ]}
            >
              Lent
            </Text>
            {currentTab === 'lent' && <View style={[styles.activeDotPill, styles.activeDotLent]} />}
          </Animated.View>
        </TouchableOpacity>

        {/* Tab 3: Action - New Loan (+) */}
        <TouchableOpacity
          style={styles.actionTabItem}
          onPress={() => animatePress(addScale, onAddLoanPress)}
          activeOpacity={0.85}
        >
          <Animated.View
            style={[
              styles.actionInner,
              { transform: [{ scale: addScale }] },
            ]}
          >
            <View style={styles.actionFabButton}>
              <PlusVectorIcon />
            </View>
            <Text style={styles.actionLabel}>New</Text>
          </Animated.View>
        </TouchableOpacity>

        {/* Tab 4: Borrowed (You Owe Them) */}
        <TouchableOpacity
          style={styles.tabItem}
          onLayout={(e) => handleTabLayout('borrowed', e)}
          onPress={() => animatePress(borrowedScale, () => onSelectTab('borrowed'))}
          activeOpacity={0.75}
        >
          <Animated.View
            style={[
              styles.tabInner,
              { transform: [{ scale: borrowedScale }] },
            ]}
          >
            <BorrowedNavIcon active={currentTab === 'borrowed'} />
            <Text
              style={[
                styles.tabLabel,
                currentTab === 'borrowed' && styles.tabLabelActiveBorrowed,
              ]}
            >
              Borrowed
            </Text>
            {currentTab === 'borrowed' && <View style={[styles.activeDotPill, styles.activeDotBorrowed]} />}
          </Animated.View>
        </TouchableOpacity>

        {/* Tab 5: Account */}
        <TouchableOpacity
          style={styles.tabItem}
          onLayout={(e) => handleTabLayout('account', e)}
          onPress={() => animatePress(accountScale, () => onSelectTab('account'))}
          activeOpacity={0.75}
        >
          <Animated.View
            style={[
              styles.tabInner,
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
            {currentTab === 'account' && <View style={styles.activeDotPill} />}
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
    paddingBottom: Platform.OS === 'ios' ? 24 : 20,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    paddingHorizontal: 4,
    position: 'relative',
  },
  glidingIndicator: {
    position: 'absolute',
    top: -1,
    left: 0,
    width: INDICATOR_WIDTH,
    height: 3,
    backgroundColor: '#0F172A',
    borderRadius: 1.5,
    zIndex: 10,
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
    paddingVertical: 2,
    gap: 3,
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#94A3B8',
    letterSpacing: -0.1,
  },
  tabLabelActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  tabLabelActiveLent: {
    color: '#059669',
    fontWeight: '700',
  },
  tabLabelActiveBorrowed: {
    color: '#D97706',
    fontWeight: '700',
  },
  activeDotPill: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0F172A',
    marginTop: 1,
  },
  activeDotLent: {
    backgroundColor: '#059669',
  },
  activeDotBorrowed: {
    backgroundColor: '#D97706',
  },
  actionTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  actionInner: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -8,
  },
  actionFabButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  actionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 3,
  },
});
