import React from 'react';
import { StyleSheet, View, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ActivityIndicator, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppTheme } from '@/app/styles/theme';
import type { OrdersStackParamList } from '../navigation/types';
import { useGlobalShift } from '@/app/hooks/useGlobalShift';
import { NAVIGATION_PATHS } from '@/app/constants/navigationPaths';

function OrdersScreen() {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const navigation =
    useNavigation<NativeStackNavigationProp<OrdersStackParamList>>();

  const { data: shift, isLoading, isFetching, refetch } = useGlobalShift();
  const [isManualRefreshing, setIsManualRefreshing] = React.useState(false);

  // Manejar el pull to refresh
  const handleRefresh = React.useCallback(async () => {
    setIsManualRefreshing(true);
    await refetch();
    setIsManualRefreshing(false);
  }, [refetch]);

  const handleOpenOrders = () => {
    if (shift && shift.status === 'OPEN') {
      navigation.navigate(NAVIGATION_PATHS.OPEN_ORDERS);
    }
  };

  const handleCreateOrder = () => {
    if (shift && shift.status === 'OPEN') {
      navigation.navigate(NAVIGATION_PATHS.CREATE_ORDER);
    }
  };

  const isShiftOpen = shift && shift.status === 'OPEN';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isManualRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          {/* Indicador de carga */}
          {(isLoading || (isFetching && !isManualRefreshing)) && (
            <View style={styles.loadingIndicator}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text variant="bodySmall" style={styles.loadingText}>
                Actualizando estado del turno...
              </Text>
            </View>
          )}
          {/* Botón Crear Orden */}
          <Button
            mode="contained"
            onPress={handleCreateOrder}
            style={[styles.button, !isShiftOpen && styles.buttonDisabled]}
            contentStyle={styles.buttonContent}
            icon="plus-circle-outline"
            disabled={!isShiftOpen}
          >
            Crear Orden
          </Button>

          {/* Botón Órdenes Abiertas */}
          <Button
            mode="contained"
            onPress={handleOpenOrders}
            style={[styles.button, !isShiftOpen && styles.buttonDisabled]}
            contentStyle={styles.buttonContent}
            icon="folder-open-outline"
            disabled={!isShiftOpen}
          >
            Órdenes Abiertas
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.l,
    },
    loadingIndicator: {
      position: 'absolute',
      top: theme.spacing.m,
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceVariant,
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
      borderRadius: theme.roundness * 2,
      gap: theme.spacing.s,
    },
    loadingText: {
      color: theme.colors.onSurfaceVariant,
    },
    title: {
      marginBottom: theme.spacing.l,
      color: theme.colors.onBackground,
    },
    button: {
      width: '90%',
      marginVertical: theme.spacing.l,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonContent: {
      paddingVertical: theme.spacing.m,
    },
  });

export default OrdersScreen;
