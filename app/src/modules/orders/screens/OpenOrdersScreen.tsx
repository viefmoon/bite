import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, ActivityIndicator, Button, Appbar, IconButton, Portal, Card, Chip, List, Surface } from 'react-native-paper';
import { useAppTheme, AppTheme } from '../../../app/styles/theme'; // Corregida ruta
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OrdersStackParamList } from '../../../app/navigation/types'; // Corregida ruta
import { useGetOpenOrdersQuery, usePrintKitchenTicketMutation, useUpdateOrderMutation } from '../hooks/useOrdersQueries'; // Importar hooks y mutaciones
import { Order, OrderStatusEnum, type OrderStatus, OrderType, OrderTypeEnum } from '../types/orders.types'; // Importar OrderStatusEnum y el tipo OrderStatus
import { getApiErrorMessage } from '../../../app/lib/errorMapping'; // Importar mapeo de errores
import { format } from 'date-fns'; // Para formatear fechas
import { es } from 'date-fns/locale'; // Locale español
import PrinterSelectionModal from '../components/PrinterSelectionModal'; // Importar el modal
import type { ThermalPrinter } from '../../printers/types/printer.types';
// Importar el nuevo modal y el tipo de payload
import EditOrderModal, { UpdateOrderPayload } from '../components/EditOrderModal';
// Importar el hook de mutación (lo crearemos después)
// import { useUpdateOrderMutation } from '../hooks/useOrdersQueries';
import { useSnackbarStore } from '../../../app/store/snackbarStore'; // Para mostrar mensajes
import { useListState } from '../../../app/hooks/useListState'; // Para estado de lista consistente

type OpenOrdersScreenProps = NativeStackScreenProps<OrdersStackParamList, 'OpenOrders'>;

// Helper para formatear el estado de la orden
const formatOrderStatus = (status: OrderStatus): string => {
  switch (status) {
    case OrderStatusEnum.PENDING: return 'Pendiente';
    case OrderStatusEnum.IN_PROGRESS: return 'En Progreso';
    case OrderStatusEnum.READY: return 'Lista';
    case OrderStatusEnum.DELIVERED: return 'Entregada';
    case OrderStatusEnum.COMPLETED: return 'Completada';
    case OrderStatusEnum.CANCELLED: return 'Cancelada';
    default: return status;
  }
};

// Helper para formatear el tipo de orden
const formatOrderType = (type: OrderType): string => {
  switch (type) {
    case OrderTypeEnum.DINE_IN: return '🍽️ Para Comer Aquí';
    case OrderTypeEnum.TAKE_AWAY: return '🥡 Para Llevar';
    case OrderTypeEnum.DELIVERY: return '🚚 Domicilio';
    default: return type;
  }
};

const OpenOrdersScreen: React.FC<OpenOrdersScreenProps> = ({ navigation }) => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const [isPrinterModalVisible, setIsPrinterModalVisible] = useState(false);
  const [orderToPrintId, setOrderToPrintId] = useState<string | null>(null);
  const printKitchenTicketMutation = usePrintKitchenTicketMutation();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar); // Hook para snackbar (Corregido)

  // Estados para el modal de edición
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null); // Cambiado a ID

  // TODO: Instanciar la mutación de actualización cuando esté creada
  const updateOrderMutation = useUpdateOrderMutation(); // Instanciar la mutación

  const {
    data: ordersData, // Renombrar para claridad, ahora es Order[] | undefined
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useGetOpenOrdersQuery(); // Usar el hook para obtener órdenes abiertas

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatusEnum.PENDING: return '#FFA000'; // Orange
      case OrderStatusEnum.IN_PROGRESS: return theme.colors.primary;
      case OrderStatusEnum.READY: return '#4CAF50'; // Green
      case OrderStatusEnum.DELIVERED: return theme.colors.tertiary;
      default: return theme.colors.onSurfaceVariant;
    }
  };

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleOrderItemPress = (order: Order) => {
    // Guardar solo el ID y abrir el modal
    setEditingOrderId(order.id);
    setIsEditModalVisible(true);
  };

  const renderOrderItem = useCallback(({ item: order }: { item: Order }) => {
    const itemsCount = order.orderItems?.length || 0;
    const itemsText = itemsCount === 1 ? '1 producto' : `${itemsCount} productos`;
    
    // Get customer info based on order type
    let customerInfo = '';
    if (order.orderType === OrderTypeEnum.DELIVERY) {
      customerInfo = order.deliveryAddress || '';
    } else if (order.orderType === OrderTypeEnum.TAKE_AWAY) {
      customerInfo = order.customerName || '';
    } else if (order.orderType === OrderTypeEnum.DINE_IN && order.table) {
      customerInfo = `Mesa ${order.table.name || order.table.number || 'N/A'}`;
    }

    return (
      <Card 
        style={styles.orderCard} 
        mode="elevated"
        onPress={() => handleOrderItemPress(order)}
      >
        <Card.Content>
          {/* Header Row */}
          <View style={styles.orderHeader}>
            <Text style={styles.orderNumber}>Orden #{order.dailyNumber}</Text>
            <Chip 
              mode="flat" 
              style={[styles.statusChip, { backgroundColor: getStatusColor(order.orderStatus) }]}
              textStyle={styles.statusChipText}
            >
              {formatOrderStatus(order.orderStatus)}
            </Chip>
          </View>

          {/* Order Type Row */}
          <View style={styles.orderTypeRow}>
            <Text style={styles.orderType}>{formatOrderType(order.orderType)}</Text>
            <Text style={styles.orderTime}>
              {format(new Date(order.createdAt), 'p', { locale: es })}
            </Text>
          </View>

          {/* Customer Info */}
          {customerInfo ? (
            <Text style={styles.customerInfo} numberOfLines={1}>
              📍 {customerInfo}
            </Text>
          ) : null}

          {/* Items Summary */}
          <View style={styles.itemsSummary}>
            <Text style={styles.itemsCount}>{itemsText}</Text>
            <Text style={styles.totalAmount}>Total: ${order.total}</Text>
          </View>

          {/* Notes if any */}
          {order.notes ? (
            <Text style={styles.notes} numberOfLines={2}>
              📝 {order.notes}
            </Text>
          ) : null}
        </Card.Content>

        {/* Action Buttons */}
        <Card.Actions style={styles.cardActions}>
          <IconButton
            icon="pencil-outline"
            size={20}
            onPress={() => handleOrderItemPress(order)}
          />
          <IconButton
            icon="printer-outline"
            size={20}
            onPress={() => handleOpenPrinterModal(order.id)}
            disabled={printKitchenTicketMutation.isPending && printKitchenTicketMutation.variables?.orderId === order.id}
          />
        </Card.Actions>
      </Card>
    );
  }, [handleOrderItemPress, handleOpenPrinterModal, printKitchenTicketMutation.isPending, printKitchenTicketMutation.variables?.orderId, theme, styles]);

  const { ListEmptyComponent } = useListState({
    isLoading,
    isError,
    data: ordersData,
    emptyConfig: {
      title: 'No hay órdenes abiertas',
      message: 'No hay órdenes abiertas en este momento.',
      icon: 'clipboard-text-outline',
    },
  });

  // Efecto para configurar el botón de refrescar en el header
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Appbar.Action
          icon="refresh"
          onPress={handleRefresh}
          disabled={isFetching} // Deshabilitar mientras se refresca
          color={theme.colors.onPrimary} // Usar color del header
        />
      ),
    });
  }, [navigation, handleRefresh, isFetching, theme.colors.onPrimary]); // Añadir dependencias

  // Función para abrir el modal de selección de impresora
  const handleOpenPrinterModal = useCallback((orderId: string) => {
    setOrderToPrintId(orderId);
    setIsPrinterModalVisible(true);
  }, []);

  // Función que se ejecuta al seleccionar una impresora en el modal
  const handlePrinterSelect = useCallback((printer: ThermalPrinter) => {
    setIsPrinterModalVisible(false);
    if (orderToPrintId) {
      // Llamar a la mutación para imprimir
      printKitchenTicketMutation.mutate({ orderId: orderToPrintId, printerId: printer.id });
      setOrderToPrintId(null); // Limpiar el ID de la orden
    } else {
      console.warn("Se seleccionó una impresora pero no había ID de orden guardado.");
    }
  }, [orderToPrintId]); // Dependencia: orderToPrintId

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {isLoading && !ordersData ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Cargando órdenes...</Text>
        </View>
      ) : (
        <FlatList
          data={ordersData || []}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          refreshing={isFetching}
          onRefresh={handleRefresh}
          contentContainerStyle={styles.listContentContainer}
          ListEmptyComponent={ListEmptyComponent}
        />
      )}
      {/* Modal de Selección de Impresora */}
      <Portal>
        <PrinterSelectionModal
          visible={isPrinterModalVisible}
          onDismiss={() => setIsPrinterModalVisible(false)}
          onPrinterSelect={handlePrinterSelect}
        />
        {/* Modal de Edición de Orden */}
        <EditOrderModal
          visible={isEditModalVisible}
          orderId={editingOrderId} // Pasar ID en lugar del objeto
          onClose={() => {
            setIsEditModalVisible(false);
            setEditingOrderId(null); // Limpiar ID
          }}
          onSaveChanges={async (orderId, payload) => { // orderId ya viene como argumento
            // Llamar a la mutación de actualización
            try {
              await updateOrderMutation.mutateAsync({ orderId, payload });
              // El hook useUpdateOrderMutation ya muestra el snackbar de éxito
              setIsEditModalVisible(false);
              setEditingOrderId(null); // Limpiar ID
            } catch (error) {
              // El hook useUpdateOrderMutation ya muestra el snackbar de error
              console.error("Error al actualizar la orden desde el modal:", error);
            }
          }}
        />
      </Portal>
    </SafeAreaView>
  );
};

const createStyles = (theme: AppTheme) => // Usar AppTheme directamente
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: theme.spacing.m,
      color: theme.colors.onSurfaceVariant,
    },
    listContentContainer: {
      padding: theme.spacing.m,
      paddingBottom: theme.spacing.l * 2,
    },
    orderCard: {
      marginBottom: theme.spacing.m,
      backgroundColor: theme.colors.surface,
    },
    orderHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    orderNumber: {
      ...theme.fonts.titleMedium,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
    },
    statusChip: {
      height: 24,
    },
    statusChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: 'white',
    },
    orderTypeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.s,
    },
    orderType: {
      ...theme.fonts.bodyMedium,
      color: theme.colors.onSurface,
      fontWeight: '500',
    },
    orderTime: {
      ...theme.fonts.bodySmall,
      color: theme.colors.onSurfaceVariant,
    },
    customerInfo: {
      ...theme.fonts.bodyMedium,
      color: theme.colors.onSurfaceVariant,
      marginBottom: theme.spacing.s,
    },
    itemsSummary: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: theme.spacing.xs,
    },
    itemsCount: {
      ...theme.fonts.bodyMedium,
      color: theme.colors.onSurfaceVariant,
    },
    totalAmount: {
      ...theme.fonts.titleSmall,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    notes: {
      ...theme.fonts.bodySmall,
      color: theme.colors.onSurfaceVariant,
      marginTop: theme.spacing.s,
      fontStyle: 'italic',
    },
    cardActions: {
      justifyContent: 'flex-end',
      paddingTop: 0,
    },
  });

export default OpenOrdersScreen;