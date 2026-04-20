import { createTamagui, createTokens } from 'tamagui';
import { createInterFont } from '@tamagui/font-inter';
import { createAnimations } from '@tamagui/animations-react-native';
import { colors, lightColors, darkColors } from './colors';
import { fontSizes, lineHeights, fontWeights, letterSpacings } from './typography';
import { spacing, borderRadius } from './spacing';

// Font configuration
const headingFont = createInterFont({
  size: fontSizes,
  weight: fontWeights,
  lineHeight: lineHeights,
  letterSpacing: letterSpacings,
});

const bodyFont = createInterFont({
  size: fontSizes,
  weight: fontWeights,
  lineHeight: lineHeights,
  letterSpacing: letterSpacings,
});

// Animations configuration
const animations = createAnimations({
  default: {
    damping: 20,
    stiffness: 200,
  },
  bouncy: {
    damping: 10,
    mass: 0.9,
    stiffness: 100,
  },
  lazy: {
    damping: 18,
    stiffness: 50,
  },
  quick: {
    damping: 20,
    stiffness: 250,
  },
});

// Tokens
const tokens = createTokens({
  size: {
    ...spacing,
    // Add font size semantic names for fontSize prop
    xs: fontSizes.xs, // 12
    sm: fontSizes.sm, // 14
    md: fontSizes.md, // 16
    lg: fontSizes.lg, // 18
    xl: fontSizes.xl, // 20
    '2xl': fontSizes['2xl'], // 24
    '3xl': fontSizes['3xl'], // 30
    '4xl': fontSizes['4xl'], // 36
    '5xl': fontSizes['5xl'], // 48
    '6xl': fontSizes['6xl'], // 60
    '7xl': fontSizes['7xl'], // 72
  },
  space: spacing,
  radius: borderRadius,
  zIndex: {
    0: 0,
    1: 10,
    2: 20,
    3: 30,
    4: 40,
    5: 50,
    modal: 100,
    tooltip: 200,
  },
  color: {
    ...colors.primary,
    ...colors.gray,
    ...colors.success,
    ...colors.warning,
    ...colors.error,
    // Light theme colors
    background: lightColors.background,
    surface: lightColors.surface,
    surfaceSecondary: lightColors.surfaceSecondary,
    text: lightColors.text,
    textSecondary: lightColors.textSecondary,
    textTertiary: lightColors.textTertiary,
    border: lightColors.border,
    borderLight: lightColors.borderLight,
    // Recording colors
    recordingActive: colors.recording.active,
    recordingPulse: colors.recording.pulse,
    recordingIdle: colors.recording.idle,
  },
});

// Theme configuration
const themes = {
  light: {
    background: lightColors.background,
    surface: lightColors.surface,
    surfaceSecondary: lightColors.surfaceSecondary,
    text: lightColors.text,
    textSecondary: lightColors.textSecondary,
    textTertiary: lightColors.textTertiary,
    border: lightColors.border,
    borderLight: lightColors.borderLight,
    primary: colors.primary[500],
    primaryHover: colors.primary[600],
    primaryActive: colors.primary[700],
    success: colors.success[500],
    warning: colors.warning[500],
    error: colors.error[500],
  },
  dark: {
    background: darkColors.background,
    surface: darkColors.surface,
    surfaceSecondary: darkColors.surfaceSecondary,
    text: darkColors.text,
    textSecondary: darkColors.textSecondary,
    textTertiary: darkColors.textTertiary,
    border: darkColors.border,
    borderLight: darkColors.borderLight,
    primary: colors.primary[400],
    primaryHover: colors.primary[300],
    primaryActive: colors.primary[500],
    success: colors.success[400],
    warning: colors.warning[400],
    error: colors.error[400],
  },
};

// Create Tamagui config
const config = createTamagui({
  animations: { default: animations },
  fonts: {
    heading: headingFont,
    body: bodyFont,
  },
  themes,
  tokens,
  settings: {
    allowedStyleValues: 'somewhat-strict-web',
    autocompleteSpecificTokens: 'except-special',
  },
  shorthands: {
    p: 'padding',
    px: 'paddingHorizontal',
    py: 'paddingVertical',
    m: 'margin',
    mx: 'marginHorizontal',
    my: 'marginVertical',
    bg: 'backgroundColor',
    rounded: 'borderRadius',
  },
});

export type AppConfig = typeof config;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;
