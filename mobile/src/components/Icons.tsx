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
  const isLight = color === '#FFFFFF' || color === '#FFF';
  const claspBg = isLight ? 'rgba(255, 255, 255, 0.25)' : '#FFFFFF';
  const dotColor = isLight ? '#FFFFFF' : color;
  return (
    <View style={{ width, height, justifyContent: 'center' }}>
      {/* Wallet Body */}
      <View
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 4,
          borderWidth: strokeWidth,
          borderColor: color,
          backgroundColor: isLight ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
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
            backgroundColor: claspBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Latch Dot */}
          <View
            style={{
              width: strokeWidth + 1,
              height: strokeWidth + 1,
              borderRadius: (strokeWidth + 1) / 2,
              backgroundColor: dotColor,
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
  const radius = size / 2;
  const centerSize = Math.max(strokeWidth + 0.6, 2.4);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        borderWidth: strokeWidth,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Hour hand (pointing up to 12) */}
      <View
        style={{
          position: 'absolute',
          top: strokeWidth + 0.5,
          width: strokeWidth,
          height: radius - strokeWidth,
          backgroundColor: color,
          borderRadius: strokeWidth / 2,
        }}
      />
      {/* Minute hand (pointing right to 3) */}
      <View
        style={{
          position: 'absolute',
          left: radius - strokeWidth / 2,
          top: radius - strokeWidth / 2,
          height: strokeWidth,
          width: radius - strokeWidth - 0.5,
          backgroundColor: color,
          borderRadius: strokeWidth / 2,
        }}
      />
      {/* Center Pin */}
      <View
        style={{
          width: centerSize,
          height: centerSize,
          borderRadius: centerSize / 2,
          backgroundColor: color,
          position: 'absolute',
        }}
      />
    </View>
  );
}

// 7. Search / Magnifier Icon (Replaces 🔍)
export function SearchIcon({ size = 16, color = '#64748B', strokeWidth = 1.8 }: IconProps) {
  const circleSize = size * 0.7;
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
          height: size * 0.45,
          backgroundColor: color,
          position: 'absolute',
          bottom: 0,
          right: 1,
          transform: [{ rotate: '-45deg' }],
          borderRadius: strokeWidth / 2,
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

// 9. Padlock Icon (Replaces 🔒)
export function LockIcon({ size = 15, color = '#0F172A', strokeWidth = 1.8 }: IconProps) {
  const w = size;
  const h = size * 1.15;
  const shackleW = w * 0.65;
  const shackleH = h * 0.42;
  return (
    <View style={{ width: w, height: h, alignItems: 'center' }}>
      {/* Shackle */}
      <View
        style={{
          width: shackleW,
          height: shackleH,
          borderTopLeftRadius: shackleW / 2,
          borderTopRightRadius: shackleW / 2,
          borderWidth: strokeWidth,
          borderBottomWidth: 0,
          borderColor: color,
        }}
      />
      {/* Body */}
      <View
        style={{
          width: w,
          height: h - shackleH + 1,
          marginTop: -1,
          borderRadius: 3,
          borderWidth: strokeWidth,
          borderColor: color,
          backgroundColor: 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{ width: 2, height: 3, backgroundColor: color, borderRadius: 1 }} />
      </View>
    </View>
  );
}

// 10. Export / Tray Download Icon (Replaces 📥)
export function ExportIcon({ size = 15, color = '#0F172A', strokeWidth = 1.8 }: IconProps) {
  const w = size;
  const h = size;
  return (
    <View style={{ width: w, height: h, alignItems: 'center', justifyContent: 'center' }}>
      {/* Arrow shaft */}
      <View style={{ width: strokeWidth, height: h * 0.48, backgroundColor: color, marginBottom: -2 }} />
      {/* Arrow head */}
      <View
        style={{
          width: w * 0.42,
          height: w * 0.42,
          borderBottomWidth: strokeWidth,
          borderRightWidth: strokeWidth,
          borderColor: color,
          transform: [{ rotate: '45deg' }],
          marginTop: -w * 0.22,
          marginBottom: 3,
        }}
      />
      {/* Bottom tray */}
      <View
        style={{
          width: w,
          height: h * 0.35,
          borderLeftWidth: strokeWidth,
          borderRightWidth: strokeWidth,
          borderBottomWidth: strokeWidth,
          borderColor: color,
          borderBottomLeftRadius: 2.5,
          borderBottomRightRadius: 2.5,
        }}
      />
    </View>
  );
}

// 11. Logout / Exit Icon (Replaces 🚪)
export function LogoutIcon({ size = 15, color = '#DC2626', strokeWidth = 1.8 }: IconProps) {
  const w = size;
  const h = size;
  return (
    <View style={{ width: w, height: h, flexDirection: 'row', alignItems: 'center' }}>
      {/* Door Frame */}
      <View
        style={{
          width: w * 0.55,
          height: h,
          borderLeftWidth: strokeWidth,
          borderTopWidth: strokeWidth,
          borderBottomWidth: strokeWidth,
          borderColor: color,
          borderTopLeftRadius: 2.5,
          borderBottomLeftRadius: 2.5,
        }}
      />
      {/* Exit Arrow */}
      <View style={{ position: 'absolute', right: 0, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: w * 0.65, height: strokeWidth, backgroundColor: color }} />
        <View
          style={{
            position: 'absolute',
            right: 0,
            width: w * 0.35,
            height: w * 0.35,
            borderTopWidth: strokeWidth,
            borderRightWidth: strokeWidth,
            borderColor: color,
            transform: [{ rotate: '45deg' }],
          }}
        />
      </View>
    </View>
  );
}

// 12. Chat / Reminders Bubble Icon (Replaces 💬)
export function ChatIcon({ size = 15, color = '#0F172A', strokeWidth = 1.8 }: IconProps) {
  const w = size;
  const h = size * 0.8;
  return (
    <View style={{ width: w, height: size, justifyContent: 'center' }}>
      <View
        style={{
          width: w,
          height: h,
          borderRadius: 4,
          borderWidth: strokeWidth,
          borderColor: color,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 2,
        }}
      >
        <View style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: color }} />
        <View style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: color }} />
        <View style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: color }} />
      </View>
    </View>
  );
}

// 13. Info Icon (Replaces ℹ)
export function InfoIcon({ size = 15, color = '#0F172A', strokeWidth = 1.8 }: IconProps) {
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
      <View style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: color, marginBottom: 1 }} />
      <View style={{ width: 2, height: size * 0.35, borderRadius: 1, backgroundColor: color }} />
    </View>
  );
}

// 14. Arrow Up-Right Icon (Outgoing / Lent - They owe you ↗)
export function ArrowUpRightIcon({ size = 14, color = '#0F172A', strokeWidth = 2 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Diagonal Stem */}
      <View
        style={{
          width: size * 0.85,
          height: strokeWidth,
          backgroundColor: color,
          transform: [{ rotate: '-45deg' }],
        }}
      />
      {/* Top and Right Arrowhead */}
      <View
        style={{
          position: 'absolute',
          top: 1,
          right: 1,
          width: size * 0.42,
          height: size * 0.42,
          borderTopWidth: strokeWidth,
          borderRightWidth: strokeWidth,
          borderColor: color,
        }}
      />
    </View>
  );
}

// 15. Arrow Down-Left Icon (Incoming / Borrowed - You owe them ↙)
export function ArrowDownLeftIcon({ size = 14, color = '#0F172A', strokeWidth = 2 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Diagonal Stem */}
      <View
        style={{
          width: size * 0.85,
          height: strokeWidth,
          backgroundColor: color,
          transform: [{ rotate: '-45deg' }],
        }}
      />
      {/* Bottom and Left Arrowhead */}
      <View
        style={{
          position: 'absolute',
          bottom: 1,
          left: 1,
          width: size * 0.42,
          height: size * 0.42,
          borderBottomWidth: strokeWidth,
          borderLeftWidth: strokeWidth,
          borderColor: color,
        }}
      />
    </View>
  );
}


