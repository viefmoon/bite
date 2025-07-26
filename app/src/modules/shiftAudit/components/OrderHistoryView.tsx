import React, { useMemo, useCallback } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {
  Text,
  Button,
  Appbar,
} from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/app/services/apiClient';
import { API_PATHS } from '@/app/constants/apiPaths';
import { HistoryItem, OrderHistoryViewProps } from '../types/orderHistory';
import { HistoryItemComponent } from './HistoryItemComponent';
import { createStyles as createOrderHistoryStyles } from '../styles/orderHistoryStyles';

export const OrderHistoryView: React.FC<OrderHistoryViewProps> = ({
  orderId,
  orderNumber,
  onBack,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createOrderHistoryStyles(theme), [theme]);

  const titleText = useMemo(
    () => `Historial de Orden #${orderNumber || ''}`,
    [orderNumber],
  );

  // Query combinado para obtener ambos historiales
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
      <View style={styles.emptyContainer}>
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
    [styles.emptyContainer, styles.emptyIcon, styles.emptyText, theme],
  );

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={onBack} />
        <Appbar.Content
          title={titleText}
          subtitle={`${historyData?.length || 0} cambios registrados`}
        />
      </Appbar.Header>

      <View style={styles.content}>
        {isError ? (
          <View style={styles.emptyContainer}>
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
        ) : isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Cargando historial...</Text>
          </View>
        ) : (
          <FlatList
            data={historyData || []}
            renderItem={renderHistoryItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmpty}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
};
