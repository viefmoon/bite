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
import { reconnectionSnackbarService } from '@/services/reconnectionSnackbarService';
import { serverConnectionService } from '../services/serverConnectionService';

export function AppNavigator() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const paperTheme = useAppTheme();

  // Inicializar servicios una sola vez al montar la app
  useEffect(() => {
    initImageCache();

    // Inicializar el servicio de conexión siempre, incluso sin autenticación
    // para que funcione en la pantalla de login
    serverConnectionService.initialize().catch((error) => {
      // Error inicializando servicio de conexión
    });

    return () => {
      // Limpiar cuando se desmonte toda la app
      serverConnectionService.cleanup();
    };
  }, []); // Sin dependencias para que solo se ejecute una vez

  // Manejar servicios de notificación basados en autenticación
  useEffect(() => {
    if (isAuthenticated) {
      reconnectionSnackbarService.start();
    } else {
      reconnectionSnackbarService.stop();
    }

    return () => {
      reconnectionSnackbarService.stop();
    };
  }, [isAuthenticated]);

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
