export const colors = {
  // Primary palette
  primary: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },

  // Gray scale
  gray: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
  },

  // Semantic colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // Recording specific
  recording: {
    active: '#ef4444',
    pulse: '#fca5a5',
    idle: '#a1a1aa',
  },
} as const;

// Theme-specific color mappings
export const lightColors = {
  background: '#ffffff',
  surface: '#f4f4f5',
  surfaceSecondary: '#e4e4e7',
  text: '#18181b',
  textSecondary: '#52525b',
  textTertiary: '#a1a1aa',
  border: '#e4e4e7',
  borderLight: '#f4f4f5',
};

export const darkColors = {
  background: '#0a0a0a',
  surface: '#18181b',
  surfaceSecondary: '#27272a',
  text: '#fafafa',
  textSecondary: '#a1a1aa',
  textTertiary: '#52525b',
  border: '#27272a',
  borderLight: '#3f3f46',
};

export type ColorPalette = typeof colors;
