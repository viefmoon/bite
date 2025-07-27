import React, { useMemo, useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Text, Button } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useAppTheme } from '@/app/styles/theme';
import apiClient from '@/app/services/apiClient';
import { API_PATHS } from '@/app/constants/apiPaths';
import { HistoryItem } from '../types/orderHistory';
import { HistoryItemComponent } from './HistoryItemComponent';
import { createStyles } from '../styles/orderHistoryStyles';

interface OrderHistoryContentProps {
  orderId: string;
  orderNumber?: number | null;
  showHeaderInfo?: boolean;
  contentContainerStyle?: Record<string, any>;
  emptyContainerStyle?: Record<string, any>;
}

export const OrderHistoryContent: React.FC<OrderHistoryContentProps> = ({
  orderId,
  orderNumber,
  showHeaderInfo = false,
  contentContainerStyle,
  emptyContainerStyle,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Query para obtener historial de la orden
  const {
    data: historyData,
    isError,
    refetch,
    isLoading,
  } = useQuery({
    queryKey: ['combinedHistory', orderId],
    queryFn: async () => {
      if (!orderId) throw new Error('No order ID');

      // Obtener historial consolidado de la orden
      const url = `${API_PATHS.ORDERS_HISTORY.replace(':orderId', orderId)}?page=1&limit=100`;
      const orderHistoryResponse = await apiClient.get(url);

      const orderHistory = orderHistoryResponse.data?.data
        ? orderHistoryResponse.data.data.map(
            (item: Record<string, unknown>) => ({
              ...item,
              type: 'order' as const,
            }),
          )
        : [];

      return orderHistory;
    },
    enabled: !!orderId,
    staleTime: 30000,
  });

  const renderHistoryItem = useCallback(
    ({ item }: { item: HistoryItem }) => {
      return <HistoryItemComponent item={item} theme={theme} />;
    },
    [theme],
  );

  const renderEmpty = useCallback(
    () => (
      <View style={[styles.emptyContainer, emptyContainerStyle]}>
        <Text
          style={[styles.emptyIcon, { color: theme.colors.onSurfaceDisabled }]}
        >
          📋
        </Text>
        <Text
          variant="bodyLarge"
          style={{
            color: theme.colors.onSurfaceDisabled,
            marginTop: theme.spacing.m,
          }}
        >
          No hay historial disponible
        </Text>
        <Text
          variant="bodySmall"
          style={[
            styles.emptyText,
            {
              color: theme.colors.onSurfaceVariant,
              marginTop: theme.spacing.s,
            },
          ]}
        >
          Los cambios realizados en esta orden aparecerán aquí
        </Text>
      </View>
    ),
    [
      styles.emptyContainer,
      styles.emptyIcon,
      styles.emptyText,
      emptyContainerStyle,
      theme,
    ],
  );

  const renderHeaderInfo = () => {
    if (!showHeaderInfo) return null;

    return (
      <View style={styles.headerInfoContainer}>
        <Text
          variant="titleMedium"
          style={[styles.headerTitle, { color: theme.colors.onSurface }]}
        >
          Historial de Orden #{orderNumber || ''}
        </Text>
        <Text
          variant="bodySmall"
          style={[
            styles.headerSubtitle,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          {historyData?.length || 0} cambios registrados
        </Text>
      </View>
    );
  };

  if (isError) {
    return (
      <View style={[styles.emptyContainer, emptyContainerStyle]}>
        <Text style={[styles.errorIcon, { color: theme.colors.error }]}>
          ⚠️
        </Text>
        <Text
          variant="bodyLarge"
          style={[
            styles.emptyText,
            {
              color: theme.colors.error,
              marginTop: theme.spacing.m,
            },
          ]}
        >
          Error al cargar el historial
        </Text>
        <Button
          onPress={() => refetch()}
          mode="text"
          style={styles.retryButton}
        >
          Reintentar
        </Button>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Cargando historial...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeaderInfo()}
      <FlashList
        data={historyData || []}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id.toString()}
        estimatedItemSize={120}
        contentContainerStyle={contentContainerStyle}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};
