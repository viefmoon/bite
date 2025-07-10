import React, { useEffect } from 'react';
import {
  NavigationContainer,
  Theme as NavigationTheme,
} from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { AuthStack } from './AuthStack';
import { ConditionalAppNavigator } from './ConditionalAppNavigator';
import { useAppTheme } from '../styles/theme';
import { initImageCache } from '../lib/imageCache';

export function AppNavigator() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const paperTheme = useAppTheme();

  useEffect(() => {
    initImageCache();
  }, []);

  const navigationTheme: NavigationTheme = {
    dark: paperTheme.dark,
    colors: {
      primary: paperTheme.colors.primary,
      background: paperTheme.colors.background,
      card: paperTheme.colors.surface,
      text: paperTheme.colors.onBackground,
      border: paperTheme.colors.outline,
      notification: paperTheme.colors.error,
    },
    fonts: {
      regular: {
        ...paperTheme.fonts.bodyMedium,
        fontWeight: paperTheme.fonts.bodyMedium.fontWeight ?? 'normal',
      },
      medium: {
        ...paperTheme.fonts.titleMedium,
        fontWeight: paperTheme.fonts.titleMedium.fontWeight ?? 'normal',
      },
      bold: {
        ...paperTheme.fonts.titleLarge,
        fontWeight: paperTheme.fonts.titleLarge.fontWeight ?? 'bold',
      },
      heavy: {
        ...paperTheme.fonts.titleLarge,
        fontWeight: paperTheme.fonts.titleLarge.fontWeight ?? '900',
      },
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      {isAuthenticated ? <ConditionalAppNavigator /> : <AuthStack />}
    </NavigationContainer>
  );
}
