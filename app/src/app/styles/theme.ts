import { MD3LightTheme, MD3DarkTheme, useTheme } from 'react-native-paper';
import type { MD3Typescale } from 'react-native-paper/lib/typescript/types';
import { lightColors, darkColors } from './colors';
import { typography } from './typography';
import { BREAKPOINTS, DEVICE_TYPES, RESPONSIVE_DIMENSIONS } from './responsive';

declare global {
  namespace ReactNativePaper {
    interface MD3Colors {
      success: string;
      successContainer: string;
      onSuccessContainer: string;
      warning: string;
      warningContainer: string;
      onWarningContainer: string;
      info: string;
      infoContainer: string;
      onInfoContainer: string;
    }
  }
}

const spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 40,
};

// Sistema responsive integrado con el tema
const responsive = {
  breakpoints: BREAKPOINTS,
  deviceTypes: DEVICE_TYPES,
  dimensions: RESPONSIVE_DIMENSIONS,
};

const typescale: MD3Typescale = {
  default: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontWeight: 'normal',
    letterSpacing: typography.bodyMedium.letterSpacing,
  },
  displayLarge: { ...typography.displayLarge, fontWeight: 'normal' },
  displayMedium: { ...typography.displayMedium, fontWeight: 'normal' },
  displaySmall: { ...typography.displaySmall, fontWeight: 'normal' },
  headlineLarge: { ...typography.headlineLarge, fontWeight: 'normal' },
  headlineMedium: { ...typography.headlineMedium, fontWeight: 'normal' },
  headlineSmall: { ...typography.headlineSmall, fontWeight: 'normal' },
  titleLarge: { ...typography.titleLarge, fontWeight: 'normal' },
  titleMedium: { ...typography.titleMedium, fontWeight: '500' },
  titleSmall: { ...typography.titleSmall, fontWeight: '500' },
  bodyLarge: { ...typography.bodyLarge, fontWeight: 'normal' },
  bodyMedium: { ...typography.bodyMedium, fontWeight: 'normal' },
  bodySmall: { ...typography.bodySmall, fontWeight: 'normal' },
  labelLarge: { ...typography.labelLarge, fontWeight: '500' },
  labelMedium: { ...typography.labelMedium, fontWeight: '500' },
  labelSmall: { ...typography.labelSmall, fontWeight: '500' },
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...lightColors,
  },
  fonts: typescale,
  spacing,
  responsive,
  roundness: 8,
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...darkColors,
  },
  fonts: typescale,
  spacing,
  responsive,
  roundness: 8,
};

export type AppTheme = typeof lightTheme;

export const useAppTheme = () => {
  try {
    const theme = useTheme();
    // Verificar que el tema sea un objeto válido
    if (!theme || typeof theme !== 'object') {
      return lightTheme;
    }
    return theme as AppTheme;
  } catch (error) {
    return lightTheme;
  }
};
