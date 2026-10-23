// Purpose: Centralized design system tokens, color palettes, spacing, and typography derived from MiniLedger Stitch specifications.
// Imported by: Components across mobile/src (screens, cards, modals, navigation)

import { Platform, Dimensions, StatusBar as RNStatusBar } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 28) : 0;

export const Theme = {
  colors: {
    // Primary brand identity: Royal Black / Obsidian Luxe
    primary: '#0F172A', // Slate 900 / Royal Obsidian Black
    primaryContainer: '#1E293B', // Slate 800 / Matte Charcoal
    primaryLight: '#F1F5F9', // Slate 100 / Subtle Light Tint
    onPrimary: '#FFFFFF', // Crisp White
    onPrimaryContainer: '#F8FAFC', // Slate 50
    primaryFixed: '#334155', // Slate 700
    onPrimaryFixed: '#0F172A',

    // Neutral surfaces and cards (Clean luxury slate, no blue tint)
    background: '#F8FAFC',
    surface: '#F8FAFC',
    surfaceCard: '#FFFFFF',
    surfaceContainerLow: '#F8FAFC',
    surfaceContainer: '#F1F5F9',
    surfaceContainerHigh: '#E2E8F0',
    surfaceContainerHighest: '#CBD5E1',

    // Text & Labels
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#64748B',
    textInverse: '#FFFFFF',

    // Structural borders
    borderSubtle: '#E2E8F0',
    borderLight: '#F1F5F9',
    outlineVariant: '#CBD5E1',

    // Semantic Status: Overdue
    statusOverdue: '#DC2626',
    statusOverdueTint: '#FEF2F2',
    statusOverdueBorder: '#FECACA',

    // Semantic Status: Repaid / Settled
    statusRepaid: '#16A34A',
    statusRepaidTint: '#ECFDF5',
    statusRepaidBorder: '#A7F3D0',

    // Semantic Status: Pending / Active
    statusPending: '#D97706',
    statusPendingTint: '#FFFBEB',
    statusPendingBorder: '#FDE68A',
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  borderRadius: {
    sm: 6,
    md: 10,
    lg: 12,
    xl: 16,
    xxl: 20,
    full: 9999,
  },

  typography: {
    hero: {
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 38,
      letterSpacing: -0.5,
    },
    h1: {
      fontSize: 24,
      fontWeight: '700' as const,
      lineHeight: 32,
      letterSpacing: -0.3,
    },
    h2: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 26,
    },
    h3: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 22,
    },
    bodyLarge: {
      fontSize: 15,
      fontWeight: '400' as const,
      lineHeight: 22,
    },
    body: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    bodySmall: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
    },
    labelLarge: {
      fontSize: 14,
      fontWeight: '600' as const,
      lineHeight: 20,
    },
    label: {
      fontSize: 12,
      fontWeight: '600' as const,
      lineHeight: 16,
    },
    caption: {
      fontSize: 11,
      fontWeight: '500' as const,
      lineHeight: 14,
    },
  },

  shadows: {
    sm: Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
      default: {},
    }),
    card: Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
    floating: Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
      default: {},
    }),
  },

  dimensions: {
    screenWidth: SCREEN_WIDTH,
    screenHeight: SCREEN_HEIGHT,
    isSmallDevice: SCREEN_WIDTH < 360,
  },
};
