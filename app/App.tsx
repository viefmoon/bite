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

registerTranslation('es', es);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      retry: 0,
      refetchInterval: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

function AppContent() {
  const isInitializingAuth = useInitializeAuth();
  useServerConnection();
  const activeTheme = useThemeStore((state) => state.activeTheme);

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

  return (
    <>
      <AppNavigator />
      <GlobalSnackbar />
    </>
  );
}

export default function App() {
  useSystemThemeDetector();
  const activeTheme = useThemeStore((state) => state.activeTheme);

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
