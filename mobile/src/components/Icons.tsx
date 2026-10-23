// Purpose: Centralized, zero-dependency SVG-like vector icon components rendered purely with React Native primitives.
// Replaces platform emojis with crisp, elegant Royal Black vector glyphs.
// Imported by: SummaryCards.tsx, LoanCard.tsx, DashboardScreen.tsx, BottomNav.tsx, AllLoansScreen.tsx

import React from 'react';
import { StyleSheet, View } from 'react-native';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

// 1. Wallet / Lending Icon (Replaces 👛)
export function WalletIcon({ size = 18, color = '#0F172A', strokeWidth = 1.8 }: IconProps) {
  const width = size;
  const height = size * 0.78;
  return (
    <View style={{ width, height, justifyContent: 'center' }}>
      {/* Wallet Body */}
      <View
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 3.5,
          borderWidth: strokeWidth,
          borderColor: color,
          backgroundColor: 'transparent',
          position: 'relative',
        }}
      >
        {/* Wallet Flap & Clasp on Right */}
        <View
          style={{
            position: 'absolute',
            right: -1,
            top: '25%',
            width: size * 0.38,
            height: '50%',
            borderTopLeftRadius: 3,
            borderBottomLeftRadius: 3,
            borderWidth: strokeWidth,
            borderRightWidth: 0,
            borderColor: color,
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Latch Dot */}
          <View
            style={{
              width: 2.5,
              height: 2.5,
              borderRadius: 1.25,
              backgroundColor: color,
            }}
          />
        </View>
      </View>
    </View>
  );
}

// 2. Checkmark Icon (Replaces ✓)
export function CheckIcon({ size = 14, color = '#0F172A', strokeWidth = 2 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.42,
          height: size * 0.72,
          borderBottomWidth: strokeWidth,
          borderRightWidth: strokeWidth,
          borderColor: color,
          transform: [{ rotate: '45deg' }],
          marginTop: -size * 0.18,
        }}
      />
    </View>
  );
}

// 3. Eye / Visibility Icon (Replaces 👁)
export function EyeIcon({ size = 16, color = '#0F172A', strokeWidth = 1.6 }: IconProps) {
  const w = size;
  const h = size * 0.65;
  return (
    <View style={{ width: w, height: h, alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer Eye Shell */}
      <View
        style={{
          width: w,
          height: h,
          borderRadius: h / 2,
          borderWidth: strokeWidth,
          borderColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Center Pupil */}
        <View
          style={{
            width: h * 0.45,
            height: h * 0.45,
            borderRadius: (h * 0.45) / 2,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
}

// 4. Lightning Bolt / Flash Icon (Replaces ⚡)
export function BoltIcon({ size = 16, color = '#FFFFFF' }: IconProps) {
  const w = size * 0.8;
  const h = size * 1.1;
  return (
    <View style={{ width: w, height: h, alignItems: 'center', justifyContent: 'center' }}>
      {/* Upper diagonal segment */}
      <View
        style={{
          width: w * 0.35,
          height: h * 0.52,
          backgroundColor: color,
          transform: [{ skewX: '-28deg' }],
          marginLeft: 2,
          borderTopLeftRadius: 1,
          borderTopRightRadius: 1,
        }}
      />
      {/* Horizontal transition wedge */}
      <View
        style={{
          width: w * 0.85,
          height: 2.5,
          backgroundColor: color,
          borderRadius: 1,
          marginVertical: -2,
          zIndex: 2,
        }}
      />
      {/* Lower diagonal segment */}
      <View
        style={{
          width: w * 0.35,
          height: h * 0.52,
          backgroundColor: color,
          transform: [{ skewX: '-28deg' }],
          marginRight: 2,
          borderBottomLeftRadius: 1,
          borderBottomRightRadius: 1,
        }}
      />
    </View>
  );
}

// 5. Alert Triangle Icon (Replaces ⚠)
export function AlertTriangleIcon({ size = 14, color = '#DC2626' }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Triangle */}
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: size / 2,
          borderRightWidth: size / 2,
          borderBottomWidth: size * 0.9,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
          position: 'relative',
          alignItems: 'center',
        }}
      >
        {/* Exclamation point inside triangle */}
        <View
          style={{
            width: 1.6,
            height: size * 0.32,
            backgroundColor: '#FFFFFF',
            marginTop: size * 0.22,
            borderRadius: 0.8,
          }}
        />
        <View
          style={{
            width: 1.6,
            height: 1.6,
            backgroundColor: '#FFFFFF',
            marginTop: 1.5,
            borderRadius: 0.8,
          }}
        />
      </View>
    </View>
  );
}

// 6. Clock / Due Time Icon (Replaces ⏱)
export function ClockIcon({ size = 14, color = '#0F172A', strokeWidth = 1.8 }: IconProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Hour hand */}
      <View
        style={{
          position: 'absolute',
          top: strokeWidth + 0.5,
          width: strokeWidth,
          height: size / 2 - strokeWidth - 0.5,
          backgroundColor: color,
          borderRadius: strokeWidth / 2,
        }}
      />
      {/* Minute hand */}
      <View
        style={{
          position: 'absolute',
          right: strokeWidth + 0.5,
          height: strokeWidth,
          width: size / 2 - strokeWidth - 1,
          backgroundColor: color,
          borderRadius: strokeWidth / 2,
        }}
      />
    </View>
  );
}

// 7. Search / Magnifier Icon (Replaces 🔍)
export function SearchIcon({ size = 14, color = '#64748B', strokeWidth = 1.8 }: IconProps) {
  const circleSize = size * 0.72;
  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      {/* Lens Circle */}
      <View
        style={{
          width: circleSize,
          height: circleSize,
          borderRadius: circleSize / 2,
          borderWidth: strokeWidth,
          borderColor: color,
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />
      {/* Diagonal Handle */}
      <View
        style={{
          width: strokeWidth,
          height: size * 0.42,
          backgroundColor: color,
          position: 'absolute',
          bottom: 0,
          right: 1,
          transform: [{ rotate: '-45deg' }],
          borderRadius: 1,
        }}
      />
    </View>
  );
}

// 8. Shield Icon (Replaces 🛡)
export function ShieldIcon({ size = 14, color = '#0F172A', strokeWidth = 1.8 }: IconProps) {
  return (
    <View
      style={{
        width: size,
        height: size * 1.1,
        borderWidth: strokeWidth,
        borderColor: color,
        borderTopLeftRadius: size * 0.4,
        borderTopRightRadius: size * 0.4,
        borderBottomLeftRadius: size * 0.5,
        borderBottomRightRadius: size * 0.5,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: strokeWidth,
          height: '60%',
          backgroundColor: color,
        }}
      />
    </View>
  );
}
