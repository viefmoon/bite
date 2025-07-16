import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useThemeStore,
  useSystemThemeDetector,
} from './src/app/store/themeStore';
import { AppNavigator } from './src/app/navigation/AppNavigator';
import GlobalSnackbar from './src/app/components/common/GlobalSnackbar';
import { useInitializeAuth } from './src/app/hooks/useInitializeAuth';
import { useServerConnection } from './src/app/hooks/useServerConnection';
import { es, registerTranslation } from 'react-native-paper-dates';

// Registrar la traducción al español para react-native-paper-dates
registerTranslation('es', es);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Los datos se consideran frescos por 5 minutos
      gcTime: 10 * 60 * 1000, // Mantener en caché por 10 minutos (antes cacheTime en v4)
      refetchOnMount: false, // No refrescar automáticamente al montar si los datos están frescos
      refetchOnWindowFocus: false, // No refrescar automáticamente al enfocar
      refetchOnReconnect: 'always', // Siempre refrescar al reconectar
      retry: 0, // No reintentar, ya lo maneja axios-retry
      refetchInterval: false, // No refrescar automáticamente por intervalo
    },
    mutations: {
      retry: 0, // No reintentar, ya lo maneja axios-retry
    },
  },
});

function AppContent() {
  const isInitializingAuth = useInitializeAuth();
  useServerConnection(); // Mantener el hook activo para el monitoreo de conexión
  const activeTheme = useThemeStore((state) => state.activeTheme);

  // Muestra pantalla de carga durante la inicialización de autenticación
  if (isInitializingAuth) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: activeTheme.colors.background,
        }}
      >
        <ActivityIndicator size="large" color={activeTheme.colors.primary} />
      </View>
    );
  }

  // Renderiza la app con indicador de conexión no bloqueante
  return (
    <>
      <AppNavigator />
      <GlobalSnackbar />
    </>
  );
}

export default function App() {
  useSystemThemeDetector(); // Detecta y actualiza el tema del sistema en el store
  const activeTheme = useThemeStore((state) => state.activeTheme); // Lee el tema activo del store

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={activeTheme}>
            <AppContent />
          </PaperProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
