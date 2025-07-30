import {} from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useThemeStore,
  useSystemThemeDetector,
} from './src/app/stores/themeStore';
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
        style={[
          styles.loadingContainer,
          { backgroundColor: activeTheme.colors.background },
        ]}
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
    <GestureHandlerRootView style={styles.rootContainer}>
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

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
