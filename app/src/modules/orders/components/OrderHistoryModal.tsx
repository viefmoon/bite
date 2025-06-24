import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {
Modal,
  Portal,
Text,
  IconButton,
  Card,
  Divider,
  Chip,
  Button,} from 'react-native-paper';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAppTheme } from '@/app/styles/theme';
import { useInfiniteQuery } from '@tanstack/react-query';
import apiClient from '@/app/services/apiClient';

interface OrderHistory {
  id: number;
  orderId: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  changedBy: string;
  changedAt: string;
  diff: Record<string, any> | null;
  snapshot: Record<string, any>;
  user?: {
    firstName: string;
    lastName: string;
  };
  changedByUser?: {
    firstName: string;
    lastName: string;
  };
}

interface OrderHistoryModalProps {
  visible: boolean;
  onDismiss: () => void;
  orderId: string | null;
  orderNumber?: number;
}

// Helper para formatear los cambios
const formatFieldName = (field: string): string => {
  const fieldNames: Record<string, string> = {
    orderStatus: 'Estado',
    orderType: 'Tipo de orden',
    tableId: 'Mesa',
    table: 'Mesa',
    customerName: 'Nombre del cliente',
    phoneNumber: 'Teléfono',
    deliveryAddress: 'Dirección de entrega',
    notes: 'Notas',
    total: 'Total',
    subtotal: 'Subtotal',
    scheduledAt: 'Hora programada',
    items: 'Productos',
    orderItems: 'Productos',
    productId: 'Producto',
    productVariantId: 'Variante',
    quantity: 'Cantidad',
    basePrice: 'Precio base',
    finalPrice: 'Precio final',
    preparationNotes: 'Notas de preparación',
    preparationStatus: 'Estado de preparación',
    modifiers: 'Modificadores',
  };
  return fieldNames[field] || field;
};

// Helper para formatear valores
const formatValue = (field: string, value: any): string => {
  if (value === null || value === undefined) return 'Sin valor';

  // Manejar específicamente el campo table/tableId
  if (field === 'table' || field === 'tableId') {
    if (typeof value === 'object' && value !== null) {
      return value.name || 'Sin mesa';
    }
    return value || 'Sin mesa';
  }

  // Si es un objeto (como el problema de table), manejarlo especialmente
  if (
    typeof value === 'object' &&
    !Array.isArray(value) &&
    !(value instanceof Date)
  ) {
    if (value.name) return value.name;
    if (value.id) return `ID: ${value.id}`;
    return 'Sin valor';
  }

  if (field === 'orderStatus' || field === 'preparationStatus') {
    const statusMap: Record<string, string> = {
      PENDING: 'Pendiente',
      IN_PROGRESS: 'En Progreso',
      READY: 'Lista',
      DELIVERED: 'Entregada',
      COMPLETED: 'Completada',
      CANCELLED: 'Cancelada',
    };
    return statusMap[value] || value;
  }

  if (field === 'orderType') {
    const typeMap: Record<string, string> = {
      DINE_IN: 'Para Comer Aquí',
      TAKE_AWAY: 'Para Llevar',
      DELIVERY: 'Domicilio',
    };
    return typeMap[value] || value;
  }

  if (
    field === 'total' ||
    field === 'subtotal' ||
    field === 'basePrice' ||
    field === 'finalPrice'
  ) {
    return `$${Number(value).toFixed(2)}`;
  }

  if (field === 'scheduledAt') {
    return format(new Date(value), 'PPp', { locale: es });
  }

  return String(value);
};

// Componente separado para cada item del historial
const HistoryItem: React.FC<{
  item: OrderHistory;
  theme: ReturnType<typeof useAppTheme>;
}> = ({ item, theme }) => {
  const [expanded, setExpanded] = useState(false);
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Función para obtener un resumen rápido de los cambios
  const getChangeSummary = () => {
    if (item.operation === 'INSERT') return 'Orden creada';
    if (item.operation === 'DELETE') return 'Orden eliminada';

    if (item.operation === 'UPDATE' && item.diff) {
      const changes = [];
      for (const [field, change] of Object.entries(item.diff || {})) {
        if (field === 'total' && Array.isArray(change) && change.length >= 2) {
          changes.push('Total actualizado');
        } else if (
          field === 'orderStatus' &&
          Array.isArray(change) &&
          change.length >= 2
        ) {
          changes.push('Estado cambiado');
        } else if (field === 'orderItems' && typeof change === 'object') {
          changes.push('Productos modificados');
        } else if (
          field === 'customerName' ||
          field === 'phoneNumber' ||
          field === 'deliveryAddress'
        ) {
          changes.push('Datos del cliente');
        }
      }
      return changes.length > 0 ? changes.join(' • ') : 'Cambios en la orden';
    }
    return '';
  };

  const renderChanges = () => {
    if (item.operation === 'INSERT') {
      return <Text style={styles.changeText}>Se creó una nueva orden</Text>;
    }

    if (item.operation === 'DELETE') {
      return <Text style={styles.changeText}>La orden fue eliminada</Text>;
    }

    if (item.operation === 'UPDATE' && item.diff) {
      const changes = [];

      // Procesar los cambios del diff
      for (const [field, change] of Object.entries(item.diff || {})) {
        // Manejar cambios en items (array de productos)
        if (field === 'orderItems' && typeof change === 'object') {
          const productDetails = [];

          // Extraer información de productos del snapshot si está disponible
          const currentItems = item.snapshot?.orderItems || [];

          for (const [key, value] of Object.entries(change as any)) {
            if (key === '_t' && value === 'a') continue; // Indicador de array

            // Si es un número, es un índice de item
            if (!isNaN(parseInt(key))) {
              const itemIndex = parseInt(key);

              // Verificar si es un item nuevo (array con un solo elemento)
              if (
                Array.isArray(value) &&
                value.length === 1 &&
                typeof value[0] === 'object'
              ) {
                // Es un item agregado
                const newItem = value[0];
                const productName = newItem.product?.name || 'Producto';
                const quantity = newItem.quantity || 1;
                const price = newItem.finalPrice || newItem.basePrice || 0;

                productDetails.push(
                  <View key={`item-${key}`} style={styles.changeRow}>
                    <Text style={styles.changeLabel}>Añadido:</Text>
                    <Text style={styles.changeValue}>
                      {productName} x{quantity} (${price})
                    </Text>
                  </View>,
                );
              } else if (
                Array.isArray(value) &&
                value.length === 3 &&
                value[1] === 0 &&
                value[2] === 0
              ) {
                // Item eliminado
                const removedItem = value[0];
                const productName = removedItem?.product?.name || 'Producto';
                productDetails.push(
                  <View key={`item-${key}`} style={styles.changeRow}>
                    <Text style={[styles.changeLabel, styles.removedLabel]}>
                      Eliminado:
                    </Text>
                    <Text style={[styles.changeValue, styles.removedText]}>
                      {productName}
                    </Text>
                  </View>,
                );
              } else if (typeof value === 'object' && value !== null) {
                // Item modificado - buscar cambios específicos
                const itemData = currentItems[itemIndex];
                const itemChanges = [];

                if ('quantity' in value && Array.isArray(value.quantity)) {
                  itemChanges.push(
                    `Cantidad: ${value.quantity[0]} → ${value.quantity[1]}`,
                  );
                }
                if ('finalPrice' in value && Array.isArray(value.finalPrice)) {
                  itemChanges.push(
                    `Precio: $${value.finalPrice[0]} → $${value.finalPrice[1]}`,
                  );
                }

                if (itemChanges.length > 0 && itemData?.product) {
                  productDetails.push(
                    <View key={`item-${key}`} style={styles.changeRow}>
                      <Text style={styles.changeLabel}>Modificado:</Text>
                      <View style={styles.changeValues}>
                        <Text style={styles.changeValue}>
                          {itemData.product.name}
                        </Text>
                        <Text style={styles.changeSubValue}>
                          {itemChanges.join(', ')}
                        </Text>
                      </View>
                    </View>,
                  );
                }
              }
            }
          }

          if (productDetails.length > 0) {
            changes.push(
              <View key={field} style={styles.changeSection}>
                <Text style={styles.sectionTitle}>Productos</Text>
                {productDetails}
              </View>,
            );
          }
        } else if (Array.isArray(change) && change.length >= 2) {
          // Cambio normal de campo: [oldValue, newValue]
          const oldValue = formatValue(field, change[0]);
          const newValue = formatValue(field, change[1]);

          changes.push(
            <View key={field} style={styles.changeRow}>
              <Text style={styles.changeLabel}>{formatFieldName(field)}:</Text>
              <View style={styles.changeValues}>
                <Text style={styles.oldValue}>{oldValue}</Text>
                <Text style={styles.changeArrow}>→</Text>
                <Text style={styles.newValue}>{newValue}</Text>
              </View>
            </View>,
          );
        } else if (Array.isArray(change) && change.length === 1) {
          // Campo añadido (no existía antes)
          const newValue = formatValue(field, change[0]);
          changes.push(
            <View key={field} style={styles.changeRow}>
              <Text style={styles.changeLabel}>{formatFieldName(field)}:</Text>
              <Text style={styles.newValue}>{newValue}</Text>
            </View>,
          );
        } else if (
          Array.isArray(change) &&
          change.length === 3 &&
          change[1] === 0 &&
          change[2] === 0
        ) {
          // Campo eliminado
          const oldValue = formatValue(field, change[0]);
          changes.push(
            <View key={field} style={styles.changeRow}>
              <Text style={[styles.changeLabel, styles.removedLabel]}>
                {formatFieldName(field)}:
              </Text>
              <Text style={styles.removedText}>{oldValue}</Text>
            </View>,
          );
        }
      }

      return changes.length > 0 ? (
        changes
      ) : (
        <Text style={styles.changeText}>Cambios en la orden</Text>
      );
    }

    return null;
  };

  return (
    <TouchableOpacity
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
      style={styles.historyCard}
    >
      <View style={styles.historyHeader}>
        <View style={styles.historyInfo}>
          <Text style={styles.changeSummary}>{getChangeSummary()}</Text>
          <Text style={styles.historyMeta}>
            {item.user
              ? `${item.user.firstName} ${item.user.lastName}`
              : item.changedByUser
                ? `${item.changedByUser.firstName} ${item.changedByUser.lastName}`
                : 'Sistema'}
            {' • '}
            {format(new Date(item.changedAt), 'HH:mm', { locale: es })}
          </Text>
        </View>
        <Text style={styles.expandIcon}>{expanded ? '−' : '+'}</Text>
      </View>

      {expanded && (
        <View style={styles.expandedContent}>
          <Divider style={styles.divider} />
          <View style={styles.changesContainer}>{renderChanges()}</View>
        </View>
      )}
    </TouchableOpacity>
  );
};

export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({
  visible,
  onDismiss,
  orderId,
  orderNumber,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const {
    data: orderHistoryData,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isLoading: isLoadingHistory,
  } = useInfiniteQuery({
    queryKey: ['orderHistory', orderId],
    queryFn: async ({ pageParam = 1 }) => {
      if (!orderId) throw new Error('No order ID');
      const url = `/api/v1/orders/${orderId}/history`;

      const response = await apiClient.get(url, { page: pageParam, limit: 20 });

      if (!response.ok) {
        throw new Error(response.problem || 'Error fetching history');
      }

      return response.data as { data: OrderHistory[]; hasNextPage: boolean };
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage) return undefined;
      return lastPage.hasNextPage ? allPages.length + 1 : undefined;
    },
    enabled: visible && !!orderId,
    initialPageParam: 1,
  });

  // Refrescar datos cuando se abre el modal
  useEffect(() => {
    if (visible && orderId) {
      refetch();
    }
  }, [visible, orderId, refetch]);

  // Aplanar todas las páginas de datos
  const allHistoryItems = useMemo(() => {
    if (!orderHistoryData?.pages) return [];
    return orderHistoryData.pages.flatMap(
      (page) => (page as { data: OrderHistory[] })?.data || [],
    );
  }, [orderHistoryData]);

  const renderHistoryItem = useCallback(
    ({ item }: { item: OrderHistory }) => {
      return <HistoryItem item={item} theme={theme} />;
    },
    [theme],
  );

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No hay historial de cambios</Text>
      <Text style={styles.emptySubText}>
        Los cambios en la orden se registrarán aquí
      </Text>
    </View>
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContent}
        dismissable={true}
        dismissableBackButton={true}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={onDismiss}
              iconColor={theme.colors.onSurface}
            />
            <Text style={styles.headerTitle}>
              Historial de Orden #{orderNumber || ''}
            </Text>
            <View style={{ width: 48 }} />
          </View>

          <Divider />

          {/* Historial de la orden */}
          {!orderId ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                No se pudo cargar el historial
              </Text>
              <Text style={styles.emptySubText}>ID de orden no disponible</Text>
            </View>
          ) : isLoadingHistory || !orderHistoryData ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Cargando historial...</Text>
            </View>
          ) : isError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Error al cargar el historial</Text>
              <Button onPress={() => refetch()} mode="text">
                Reintentar
              </Button>
            </View>
          ) : (
            <FlatList
              data={allHistoryItems}
              renderItem={renderHistoryItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContent}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={renderFooter}
              ListEmptyComponent={renderEmpty}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </Modal>
    </Portal>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    modalContent: {
      backgroundColor: theme.colors.background,
      margin: 20,
      borderRadius: theme.roundness * 2,
      maxHeight: '90%',
      minHeight: 400,
    },
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 4,
      paddingVertical: 8,
      backgroundColor: theme.colors.elevation.level2,
    },
    headerTitle: {
      ...theme.fonts.titleMedium,
      fontWeight: 'bold',
      textAlign: 'center',
      flex: 1,
      color: theme.colors.onSurface,
    },
    listContent: {
      padding: theme.spacing.m,
      paddingBottom: theme.spacing.l,
    },
    historyCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      marginBottom: theme.spacing.s,
      padding: theme.spacing.m,
      borderWidth: 1,
      borderColor: theme.colors.surfaceVariant,
    },
    historyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    historyInfo: {
      flex: 1,
    },
    changeSummary: {
      ...theme.fonts.bodyLarge,
      color: theme.colors.onSurface,
      fontWeight: '500',
    },
    historyMeta: {
      ...theme.fonts.bodySmall,
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
    },
    expandIcon: {
      ...theme.fonts.titleLarge,
      color: theme.colors.onSurfaceVariant,
      marginLeft: theme.spacing.s,
    },
    expandedContent: {
      marginTop: theme.spacing.s,
    },
    divider: {
      marginBottom: theme.spacing.s,
    },
    changesContainer: {
      gap: theme.spacing.xs,
    },
    changeText: {
      ...theme.fonts.bodyMedium,
      color: theme.colors.onSurfaceVariant,
    },
    changeSection: {
      marginBottom: theme.spacing.s,
    },
    sectionTitle: {
      ...theme.fonts.labelLarge,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.xs,
    },
    changeRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.xs,
      gap: theme.spacing.s,
    },
    changeLabel: {
      ...theme.fonts.bodyMedium,
      color: theme.colors.onSurfaceVariant,
      minWidth: 100,
    },
    changeValue: {
      ...theme.fonts.bodyMedium,
      color: theme.colors.onSurface,
      flex: 1,
    },
    changeValues: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: theme.spacing.xs,
      flexWrap: 'wrap',
    },
    changeSubValue: {
      ...theme.fonts.bodySmall,
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
    },
    oldValue: {
      ...theme.fonts.bodyMedium,
      color: theme.colors.onSurfaceVariant,
      textDecorationLine: 'line-through',
      opacity: 0.7,
    },
    newValue: {
      ...theme.fonts.bodyMedium,
      color: theme.colors.onSurface,
      fontWeight: '500',
    },
    changeArrow: {
      ...theme.fonts.bodyMedium,
      color: theme.colors.onSurfaceVariant,
      paddingHorizontal: 4,
    },
    removedLabel: {
      color: theme.colors.error,
    },
    removedText: {
      textDecorationLine: 'line-through',
      color: theme.colors.error,
      opacity: 0.7,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    loadingText: {
      marginTop: theme.spacing.m,
      color: theme.colors.onSurfaceVariant,
    },
    loadingFooter: {
      padding: theme.spacing.m,
      alignItems: 'center',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    errorText: {
      color: theme.colors.error,
      marginBottom: theme.spacing.m,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    emptyText: {
      ...theme.fonts.bodyLarge,
      color: theme.colors.onSurfaceDisabled,
      marginTop: theme.spacing.m,
    },
    emptySubText: {
      ...theme.fonts.bodyMedium,
      color: theme.colors.onSurfaceDisabled,
      marginTop: theme.spacing.xs,
      opacity: 0.7,
    },
  });

export default OrderHistoryModal;
