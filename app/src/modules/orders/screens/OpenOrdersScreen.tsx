import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, FlatList, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  ActivityIndicator,
  Appbar,
  IconButton,
  Portal,
  Card,
  Chip,
  Icon,
  Surface,
} from 'react-native-paper';
import { useAppTheme, AppTheme } from '../../../app/styles/theme'; // Corregida ruta
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OrdersStackParamList } from '../../../app/navigation/types'; // Corregida ruta
import { useRoute } from '@react-navigation/native';
import { shiftsService, type Shift } from '../../../services/shifts';
import { ShiftStatusBanner } from '../components/ShiftStatusBanner';
import { useAuthStore } from '../../../app/store/authStore';
import { canOpenShift } from '../../../app/utils/roleUtils';
import {
  useGetOpenOrdersQuery,
  usePrintKitchenTicketMutation,
  useUpdateOrderMutation,
  useCancelOrderMutation,
} from '../hooks/useOrdersQueries'; // Importar hooks y mutaciones
import { useCreateBulkAdjustmentsMutation } from '../hooks/useAdjustmentQueries'; // Importar mutations de ajustes
import {
  Order,
  OrderStatusEnum,
  type OrderStatus,
  OrderType,
  OrderTypeEnum,
} from '../types/orders.types'; // Importar OrderStatusEnum y el tipo OrderStatus
import { format } from 'date-fns'; // Para formatear fechas
import { es } from 'date-fns/locale'; // Locale español
import PrinterSelectionModal from '../components/PrinterSelectionModal'; // Importar el modal
import type { ThermalPrinter } from '../../printers/types/printer.types';
// Importar OrderCartDetail y el tipo de payload
import OrderCartDetail, {
  OrderDetailsForBackend,
} from '../components/OrderCartDetail';
import { useListState } from '../../../app/hooks/useListState'; // Para estado de lista consistente
import { CartItem, CartProvider } from '../context/CartContext'; // Para el tipo CartItem y CartProvider

type OpenOrdersScreenProps = NativeStackScreenProps<
  OrdersStackParamList,
  'OpenOrders'
>;

// Helper para formatear el estado de la orden
const formatOrderStatus = (status: OrderStatus): string => {
  switch (status) {
    case OrderStatusEnum.PENDING:
      return 'Pendiente';
    case OrderStatusEnum.IN_PROGRESS:
      return 'En Progreso';
    case OrderStatusEnum.IN_PREPARATION:
      return 'En Preparación';
    case OrderStatusEnum.READY:
      return 'Lista';
    case OrderStatusEnum.DELIVERED:
      return 'Entregada';
    case OrderStatusEnum.COMPLETED:
      return 'Completada';
    case OrderStatusEnum.CANCELLED:
      return 'Cancelada';
    default:
      return status;
  }
};

// Helper para formatear el tipo de orden
const formatOrderType = (type: OrderType): string => {
  switch (type) {
    case OrderTypeEnum.DINE_IN:
      return '🍽️ Para Comer Aquí';
    case OrderTypeEnum.TAKE_AWAY:
      return '🥡 Para Llevar';
    case OrderTypeEnum.DELIVERY:
      return '🚚 Domicilio';
    default:
      return type;
  }
};

// Helper para formatear el tipo de orden corto (para el título)
const formatOrderTypeShort = (type: OrderType): string => {
  switch (type) {
    case OrderTypeEnum.DINE_IN:
      return '🍽️ Local';
    case OrderTypeEnum.TAKE_AWAY:
      return '🥡 Llevar';
    case OrderTypeEnum.DELIVERY:
      return '🚚 Envío';
    default:
      return type;
  }
};

// Helper para determinar el estado de pago de una orden
const getPaymentStatus = (order: Order): 'unpaid' | 'partial' | 'paid' => {
  if (!order.payments || order.payments.length === 0) {
    return 'unpaid';
  }

  // Sumar todos los pagos completados
  const totalPaid = order.payments
    .filter((payment: any) => payment.paymentStatus === 'COMPLETED')
    .reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0);

  const orderTotal = order.total || 0;

  if (totalPaid === 0) {
    return 'unpaid';
  } else if (totalPaid >= orderTotal) {
    return 'paid';
  } else {
    return 'partial';
  }
};

const OpenOrdersScreen: React.FC<OpenOrdersScreenProps> = ({ navigation }) => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const route = useRoute<OpenOrdersScreenProps['route']>();
  const [isPrinterModalVisible, setIsPrinterModalVisible] = useState(false);
  const [orderToPrintId, setOrderToPrintId] = useState<string | null>(null);
  const printKitchenTicketMutation = usePrintKitchenTicketMutation();

  // Estado para turno
  const user = useAuthStore((state) => state.user);
  const [shift, setShift] = useState<Shift | null>(null);
  const [shiftLoading, setShiftLoading] = useState(true);

  // Verificar si el usuario puede abrir el turno usando la utilidad centralizada
  const userCanOpenShift = canOpenShift(user);

  // Estados para el modal de edición
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null); // Cambiado a ID
  const [pendingProductsToAdd, setPendingProductsToAdd] = useState<CartItem[]>(
    [],
  );
  // Estado para mantener productos temporales mientras se navega
  const [temporaryProducts, setTemporaryProducts] = useState<{
    [orderId: string]: CartItem[];
  }>({});
  // Estado para rastrear el conteo de items existentes en cada orden
  const [existingItemsCount, setExistingItemsCount] = useState<{
    [orderId: string]: number;
  }>({});

  // Estado para filtro de tipo de orden
  const [selectedOrderType, setSelectedOrderType] = useState<OrderType | 'ALL'>(
    'ALL',
  );

  // Instanciar las mutaciones
  const updateOrderMutation = useUpdateOrderMutation();
  const cancelOrderMutation = useCancelOrderMutation();
  const createBulkAdjustmentsMutation = useCreateBulkAdjustmentsMutation();

  const {
    data: ordersData, // Renombrar para claridad, ahora es Order[] | undefined
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useGetOpenOrdersQuery(); // Usar el hook para obtener órdenes abiertas

  // Cargar estado del turno
  const loadShift = async () => {
    try {
      setShiftLoading(true);
      const currentShift = await shiftsService.getCurrentShift();
      setShift(currentShift);
    } catch (error) {
      // Error silenciado en producción
    } finally {
      setShiftLoading(false);
    }
  };

  useEffect(() => {
    loadShift();
  }, []);

  // No necesitamos useRefreshModuleOnFocus aquí porque el hook useGetOpenOrdersQuery
  // ya tiene configurado refetchInterval, refetchOnMount y refetchOnWindowFocus

  // Filtrar órdenes por tipo
  const filteredOrders = React.useMemo(() => {
    if (!ordersData) return [];
    if (selectedOrderType === 'ALL') return ordersData;
    return ordersData.filter((order) => order.orderType === selectedOrderType);
  }, [ordersData, selectedOrderType]);

  // Ya no necesitamos procesar items agregados porque la actualización se hace directamente en CreateOrderScreen
  // Este efecto se puede eliminar o simplificar

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatusEnum.PENDING:
        return '#FFA000'; // Orange
      case OrderStatusEnum.IN_PROGRESS:
        return theme.colors.primary;
      case OrderStatusEnum.READY:
        return '#4CAF50'; // Green
      case OrderStatusEnum.DELIVERED:
        return theme.colors.tertiary;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Función para abrir el modal de selección de impresora
  const handleOpenPrinterModal = useCallback((orderId: string) => {
    setOrderToPrintId(orderId);
    setIsPrinterModalVisible(true);
  }, []);

  const handleOrderItemPress = (order: Order) => {
    // Guardar solo el ID y abrir el modal
    setEditingOrderId(order.id);
    setIsEditModalVisible(true);
  };

  const renderOrderItem = useCallback(
    ({ item: order }: { item: Order }) => {
      // Construir el título según el tipo de orden
      let orderTitle = `#${order.shiftOrderNumber} • ${formatOrderTypeShort(order.orderType)}`;

      if (order.orderType === OrderTypeEnum.DINE_IN && order.table) {
        // Para mesas temporales, mostrar solo el nombre sin prefijo "Mesa"
        const tableDisplay = order.table.isTemporary
          ? order.table.name
          : `Mesa ${order.table.name || order.table.number || 'N/A'}`;
        orderTitle += ` • ${order.table.area?.name || 'Sin área'} • ${tableDisplay}`;
      } else if (order.orderType === OrderTypeEnum.TAKE_AWAY) {
        if (order.deliveryInfo?.recipientName) {
          orderTitle += ` • ${order.deliveryInfo.recipientName}`;
        }
        if (order.deliveryInfo?.recipientPhone) {
          orderTitle += ` • ${order.deliveryInfo.recipientPhone}`;
        }
      } else if (order.orderType === OrderTypeEnum.DELIVERY) {
        if (order.deliveryInfo?.fullAddress) {
          orderTitle += ` • ${order.deliveryInfo.fullAddress}`;
        }
        if (order.deliveryInfo?.recipientPhone) {
          orderTitle += ` • ${order.deliveryInfo.recipientPhone}`;
        }
      }

      return (
        <Card
          style={styles.orderCard}
          mode="elevated"
          onPress={() => handleOrderItemPress(order)}
        >
          <Card.Content style={styles.cardContent}>
            {/* Main Container */}
            <View style={styles.mainContainer}>
              {/* Left Side - Title and Time */}
              <View style={styles.leftContainer}>
                <Text style={styles.orderNumber} numberOfLines={2}>
                  {orderTitle}
                  <Text style={styles.orderPrice}> • ${order.total}</Text>
                </Text>
                <View style={styles.timeAndPaymentRow}>
                  <Text style={styles.orderTime}>
                    {format(new Date(order.createdAt), 'p', { locale: es })}
                  </Text>
                  {order.scheduledAt && (
                    <Text style={styles.estimatedTime}>
                      📅{' '}
                      {format(new Date(order.scheduledAt), 'p', {
                        locale: es,
                      })}
                    </Text>
                  )}
                  {(() => {
                    const paymentStatus = getPaymentStatus(order);
                    if (paymentStatus === 'paid') {
                      return (
                        <View
                          style={[
                            styles.paymentBadge,
                            { backgroundColor: '#10B981' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.paymentBadgeText,
                              { color: '#FFFFFF' },
                            ]}
                          >
                            💵 Pagado
                          </Text>
                        </View>
                      );
                    } else if (paymentStatus === 'partial') {
                      return (
                        <View
                          style={[
                            styles.paymentBadge,
                            { backgroundColor: '#F59E0B' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.paymentBadgeText,
                              { color: '#FFFFFF' },
                            ]}
                          >
                            💵 Parcial
                          </Text>
                        </View>
                      );
                    } else {
                      return (
                        <View
                          style={[
                            styles.paymentBadge,
                            { backgroundColor: '#EF4444' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.paymentBadgeText,
                              { color: '#FFFFFF' },
                            ]}
                          >
                            💵 Pendiente
                          </Text>
                        </View>
                      );
                    }
                  })()}
                </View>
              </View>

              {/* Right Side - Status and Print */}
              <View style={styles.rightContainer}>
                <Chip
                  mode="flat"
                  style={[
                    styles.statusChip,
                    { backgroundColor: getStatusColor(order.orderStatus) },
                  ]}
                  textStyle={styles.statusChipText}
                >
                  {formatOrderStatus(order.orderStatus)}
                </Chip>
                <IconButton
                  icon="printer"
                  size={28}
                  style={styles.printButton}
                  onPress={() => handleOpenPrinterModal(order.id)}
                  disabled={
                    printKitchenTicketMutation.isPending &&
                    printKitchenTicketMutation.variables?.orderId === order.id
                  }
                />
              </View>
            </View>

            {/* Notes if any */}
            {order.notes ? (
              <Text style={styles.notes} numberOfLines={2}>
                📝 {order.notes}
              </Text>
            ) : null}
          </Card.Content>
        </Card>
      );
    },
    [
      handleOrderItemPress,
      handleOpenPrinterModal,
      printKitchenTicketMutation.isPending,
      printKitchenTicketMutation.variables?.orderId,
      theme,
      styles,
    ],
  );

  const { ListEmptyComponent } = useListState({
    isLoading,
    isError,
    data: filteredOrders,
    emptyConfig: {
      title:
        selectedOrderType === 'ALL'
          ? 'No hay órdenes abiertas'
          : `No hay órdenes de tipo ${formatOrderType(
              selectedOrderType as OrderType,
            )
              .replace(/[\u{1F37D}]|[\u{FE0F}]|[\u{1F961}]|[\u{1F69A}]/gu, '')
              .trim()}`,
      message:
        selectedOrderType === 'ALL'
          ? 'No hay órdenes abiertas en este momento.'
          : `No hay órdenes de este tipo en este momento.`,
      icon: 'clipboard-text-outline',
    },
    errorConfig: {
      title: 'Error al cargar órdenes',
      message: 'No se pudieron cargar las órdenes. Verifica tu conexión.',
      icon: 'wifi-off',
      actionLabel: 'Reintentar',
      onAction: () => refetch(),
    },
  });

  // Efecto para configurar el botón de refrescar en el header
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Appbar.Action
          icon="refresh"
          iconColor={theme.colors.onPrimary}
          size={28}
          onPress={handleRefresh}
          disabled={isFetching} // Deshabilitar mientras se refresca
          style={{ marginRight: 8 }} // Agregar margen para mejor accesibilidad
        />
      ),
    });
  }, [navigation, handleRefresh, isFetching, theme.colors.onPrimary]); // Añadir dependencias

  // Efecto para sincronizar productos temporales con pendientes
  useEffect(() => {
    if (
      isEditModalVisible &&
      editingOrderId &&
      temporaryProducts[editingOrderId]
    ) {
      setPendingProductsToAdd(temporaryProducts[editingOrderId]);
    }
  }, [isEditModalVisible, editingOrderId, temporaryProducts]);

  // Función que se ejecuta al seleccionar una impresora en el modal
  const handlePrinterSelect = useCallback(
    (printer: ThermalPrinter) => {
      setIsPrinterModalVisible(false);
      if (orderToPrintId) {
        // Llamar a la mutación para imprimir
        printKitchenTicketMutation.mutate({
          orderId: orderToPrintId,
          printerId: printer.id,
        });
        setOrderToPrintId(null); // Limpiar el ID de la orden
      }
    },
    [orderToPrintId, printKitchenTicketMutation],
  ); // Dependencias

  // Función para manejar la cancelación de una orden
  const handleCancelOrder = useCallback(
    async (orderId: string) => {
      try {
        await cancelOrderMutation.mutateAsync(orderId);
        // Cerrar el modal después de cancelar exitosamente
        setIsEditModalVisible(false);
        setEditingOrderId(null);
      } catch (error) {
        // El error se muestra a través del hook useCancelOrderMutation
      }
    },
    [cancelOrderMutation],
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {!shiftLoading && (!shift || shift.status !== 'OPEN') ? (
        <View style={styles.container}>
          <ShiftStatusBanner
            shift={shift}
            loading={shiftLoading}
            onOpenShift={() => navigation.goBack()}
            canOpenShift={userCanOpenShift}
          />
          <View style={styles.emptyStateContainer}>
            <Text variant="bodyLarge" style={styles.emptyStateText}>
              {userCanOpenShift
                ? 'Regresa a la pantalla anterior para abrir el turno.'
                : 'Solicita a un administrador que abra el turno.'}
            </Text>
          </View>
        </View>
      ) : isLoading && !ordersData ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Cargando órdenes...</Text>
        </View>
      ) : (
        <>
          {/* Filtros de tipo de orden con el mismo diseño que finalización */}
          <Surface style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.filterContainer}>
                <Pressable
                  style={[
                    styles.filterButton,
                    selectedOrderType === 'ALL' && styles.filterButtonActive,
                    { backgroundColor: selectedOrderType === 'ALL' ? theme.colors.primaryContainer : theme.colors.surface },
                  ]}
                  onPress={() => setSelectedOrderType('ALL')}
                >
                  <Icon
                    source="view-grid"
                    size={26}
                    color={selectedOrderType === 'ALL' ? theme.colors.primary : theme.colors.onSurfaceVariant}
                  />
                  {ordersData && ordersData.length > 0 && (
                    <View 
                      style={[
                        styles.countBadge,
                        { 
                          backgroundColor: selectedOrderType === 'ALL' ? theme.colors.error : theme.colors.errorContainer,
                          borderColor: selectedOrderType === 'ALL' ? theme.colors.error : theme.colors.outline,
                        }
                      ]}
                    >
                      <Text style={[
                        styles.countBadgeText,
                        { color: selectedOrderType === 'ALL' ? theme.colors.onError : theme.colors.onErrorContainer }
                      ]}>{ordersData.length}</Text>
                    </View>
                  )}
                </Pressable>
                <Pressable
                  style={[
                    styles.filterButton,
                    selectedOrderType === OrderTypeEnum.DINE_IN && styles.filterButtonActive,
                    { backgroundColor: selectedOrderType === OrderTypeEnum.DINE_IN ? theme.colors.primaryContainer : theme.colors.surface },
                  ]}
                  onPress={() => setSelectedOrderType(OrderTypeEnum.DINE_IN)}
                >
                  <Icon
                    source="silverware-fork-knife"
                    size={26}
                    color={selectedOrderType === OrderTypeEnum.DINE_IN ? theme.colors.primary : theme.colors.onSurfaceVariant}
                  />
                  {ordersData && ordersData.filter(o => o.orderType === OrderTypeEnum.DINE_IN).length > 0 && (
                    <View 
                      style={[
                        styles.countBadge,
                        { 
                          backgroundColor: selectedOrderType === OrderTypeEnum.DINE_IN ? theme.colors.error : theme.colors.errorContainer,
                          borderColor: selectedOrderType === OrderTypeEnum.DINE_IN ? theme.colors.error : theme.colors.outline,
                        }
                      ]}
                    >
                      <Text style={[
                        styles.countBadgeText,
                        { color: selectedOrderType === OrderTypeEnum.DINE_IN ? theme.colors.onError : theme.colors.onErrorContainer }
                      ]}>{ordersData.filter(o => o.orderType === OrderTypeEnum.DINE_IN).length}</Text>
                    </View>
                  )}
                </Pressable>
                <Pressable
                  style={[
                    styles.filterButton,
                    selectedOrderType === OrderTypeEnum.TAKE_AWAY && styles.filterButtonActive,
                    { backgroundColor: selectedOrderType === OrderTypeEnum.TAKE_AWAY ? theme.colors.primaryContainer : theme.colors.surface },
                  ]}
                  onPress={() => setSelectedOrderType(OrderTypeEnum.TAKE_AWAY)}
                >
                  <Icon
                    source="bag-personal"
                    size={26}
                    color={selectedOrderType === OrderTypeEnum.TAKE_AWAY ? theme.colors.primary : theme.colors.onSurfaceVariant}
                  />
                  {ordersData && ordersData.filter(o => o.orderType === OrderTypeEnum.TAKE_AWAY).length > 0 && (
                    <View 
                      style={[
                        styles.countBadge,
                        { 
                          backgroundColor: selectedOrderType === OrderTypeEnum.TAKE_AWAY ? theme.colors.error : theme.colors.errorContainer,
                          borderColor: selectedOrderType === OrderTypeEnum.TAKE_AWAY ? theme.colors.error : theme.colors.outline,
                        }
                      ]}
                    >
                      <Text style={[
                        styles.countBadgeText,
                        { color: selectedOrderType === OrderTypeEnum.TAKE_AWAY ? theme.colors.onError : theme.colors.onErrorContainer }
                      ]}>{ordersData.filter(o => o.orderType === OrderTypeEnum.TAKE_AWAY).length}</Text>
                    </View>
                  )}
                </Pressable>
                <Pressable
                  style={[
                    styles.filterButton,
                    selectedOrderType === OrderTypeEnum.DELIVERY && styles.filterButtonActive,
                    { backgroundColor: selectedOrderType === OrderTypeEnum.DELIVERY ? theme.colors.primaryContainer : theme.colors.surface },
                  ]}
                  onPress={() => setSelectedOrderType(OrderTypeEnum.DELIVERY)}
                >
                  <Icon
                    source="moped"
                    size={26}
                    color={selectedOrderType === OrderTypeEnum.DELIVERY ? theme.colors.primary : theme.colors.onSurfaceVariant}
                  />
                  {ordersData && ordersData.filter(o => o.orderType === OrderTypeEnum.DELIVERY).length > 0 && (
                    <View 
                      style={[
                        styles.countBadge,
                        { 
                          backgroundColor: selectedOrderType === OrderTypeEnum.DELIVERY ? theme.colors.error : theme.colors.errorContainer,
                          borderColor: selectedOrderType === OrderTypeEnum.DELIVERY ? theme.colors.error : theme.colors.outline,
                        }
                      ]}
                    >
                      <Text style={[
                        styles.countBadgeText,
                        { color: selectedOrderType === OrderTypeEnum.DELIVERY ? theme.colors.onError : theme.colors.onErrorContainer }
                      ]}>{ordersData.filter(o => o.orderType === OrderTypeEnum.DELIVERY).length}</Text>
                    </View>
                  )}
                </Pressable>
              </View>
            </View>
          </Surface>

          {/* Lista de órdenes */}
          <View style={styles.listContainer}>
            <FlatList
              data={filteredOrders}
              keyExtractor={(item) => item.id}
              renderItem={renderOrderItem}
              refreshing={isFetching}
              onRefresh={handleRefresh}
              contentContainerStyle={styles.listContentContainer}
              ListEmptyComponent={ListEmptyComponent}
            />
          </View>
        </>
      )}
      {/* Modal de Selección de Impresora */}
      <Portal>
        <PrinterSelectionModal
          visible={isPrinterModalVisible}
          onDismiss={() => setIsPrinterModalVisible(false)}
          onPrinterSelect={handlePrinterSelect}
        />
        {/* Modal de Edición de Orden usando OrderCartDetail */}
        {editingOrderId && (
          <CartProvider>
            <OrderCartDetail
              visible={isEditModalVisible}
              isEditMode={true}
              orderId={editingOrderId}
              orderNumber={
                ordersData?.find((o) => o.id === editingOrderId)
                  ?.shiftOrderNumber
              }
              orderDate={
                ordersData?.find((o) => o.id === editingOrderId)?.createdAt
                  ? new Date(
                      ordersData.find(
                        (o) => o.id === editingOrderId,
                      )!.createdAt,
                    )
                  : undefined
              }
              navigation={navigation}
              pendingProductsToAdd={
                editingOrderId && temporaryProducts[editingOrderId]
                  ? temporaryProducts[editingOrderId]
                  : pendingProductsToAdd
              }
              onItemsCountChanged={(count) => {
                // Actualizar el conteo de items existentes para esta orden
                setExistingItemsCount((prev) => ({
                  ...prev,
                  [editingOrderId]: count,
                }));
              }}
              onClose={() => {
                setIsEditModalVisible(false);
                setEditingOrderId(null);
                setPendingProductsToAdd([]);
                // NO limpiar temporaryProducts aquí para mantener los productos
                // NO llamar refetch() aquí porque ya se maneja con invalidateQueries
                // y el refetchInterval automático
              }}
              onAddProducts={() => {
                // Cerrar el modal temporalmente para navegar
                setIsEditModalVisible(false);

                const orderId = editingOrderId;
                const orderNumber = ordersData?.find(
                  (o) => o.id === editingOrderId,
                )?.shiftOrderNumber;

                // Navegar a añadir productos
                setTimeout(() => {
                  const existingProducts = temporaryProducts[orderId!] || [];
                  navigation.navigate('AddProductsToOrder', {
                    orderId: orderId!,
                    orderNumber: orderNumber!,
                    // Pasar productos temporales existentes si los hay
                    existingTempProducts: existingProducts,
                    existingOrderItemsCount: existingItemsCount[orderId!] || 0, // Usar el conteo rastreado
                    onProductsAdded: (newProducts) => {
                      // Actualizar productos temporales para esta orden
                      setTemporaryProducts((prev) => ({
                        ...prev,
                        [orderId!]: newProducts,
                      }));
                      // NO establecer pendingProductsToAdd aquí, se hará en el useEffect
                      // Reabrir el modal cuando regresemos
                      setIsEditModalVisible(true);
                    },
                  });
                }, 100);
              }}
              onConfirmOrder={async (details: OrderDetailsForBackend) => {
                // Adaptar el formato de OrderDetailsForBackend a UpdateOrderPayload
                const payload = {
                  orderType: details.orderType,
                  items: details.items, // Enviar items para actualizar
                  tableId: details.tableId || null,
                  isTemporaryTable: details.isTemporaryTable || false,
                  temporaryTableName: details.temporaryTableName || null,
                  temporaryTableAreaId: details.temporaryTableAreaId || null,
                  scheduledAt: details.scheduledAt || null,
                  // Enviar null cuando deliveryInfo está vacío para indicar limpieza
                  deliveryInfo: (() => {
                    if (!details.deliveryInfo) return null;
                    
                    // Filtrar solo las propiedades que tienen valores reales (no undefined)
                    const filteredDeliveryInfo = Object.entries(details.deliveryInfo)
                      .filter(([_, value]) => value !== undefined)
                      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
                    
                    // Si no quedan propiedades con valores, enviar null
                    return Object.keys(filteredDeliveryInfo).length > 0 ? filteredDeliveryInfo : null;
                  })(),
                  notes: details.notes || null,
                  total: details.total,
                  subtotal: details.subtotal,
                  adjustments: details.adjustments || [], // Incluir ajustes en el payload
                };

                try {
                  // Actualizar la orden (ahora incluye los ajustes)
                  await updateOrderMutation.mutateAsync({
                    orderId: editingOrderId,
                    payload,
                  });

                  // Limpiar estados después de actualización exitosa
                  setIsEditModalVisible(false);
                  setEditingOrderId(null);
                  // Limpiar productos temporales y conteo para esta orden
                  if (editingOrderId) {
                    setTemporaryProducts((prev) => {
                      const newState = { ...prev };
                      delete newState[editingOrderId];
                      return newState;
                    });
                    setExistingItemsCount((prev) => {
                      const newState = { ...prev };
                      delete newState[editingOrderId];
                      return newState;
                    });
                  }
                } catch (error) {
                  // No cerrar el modal en caso de error para que el usuario pueda reintentar
                }
              }}
              onCancelOrder={() => {
                if (editingOrderId) {
                  handleCancelOrder(editingOrderId);
                }
              }}
            />
          </CartProvider>
        )}
      </Portal>
    </SafeAreaView>
  );
};

const createStyles = (
  theme: AppTheme, // Usar AppTheme directamente
) =>
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
    header: {
      paddingHorizontal: 0,
      paddingVertical: 0,
      backgroundColor: 'transparent',
      elevation: 0,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 0,
    },
    filterContainer: {
      flex: 1,
      flexDirection: 'row',
      gap: 0,
    },
    filterButton: {
      flex: 1,
      height: 52,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 0,
      elevation: 1,
      position: 'relative',
    },
    filterButtonActive: {
      elevation: 3,
    },
    countBadge: {
      position: 'absolute',
      top: 6,
      right: 6,
      minWidth: 22,
      height: 22,
      borderRadius: 11,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
      borderWidth: 1,
      elevation: 2,
    },
    countBadgeText: {
      fontSize: 12,
      fontWeight: '700',
    },
    listContainer: {
      flex: 1,
    },
    listContentContainer: {
      padding: theme.spacing.s, // Reducido de theme.spacing.m
      paddingBottom: theme.spacing.l * 2,
      flexGrow: 1,
    },
    orderCard: {
      marginBottom: theme.spacing.s, // Reducido de theme.spacing.m
      backgroundColor: theme.colors.surface,
    },
    cardContent: {
      paddingBottom: theme.spacing.s,
    },
    mainContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    leftContainer: {
      flex: 1,
      paddingRight: theme.spacing.s,
    },
    rightContainer: {
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
    orderNumber: {
      ...theme.fonts.bodyLarge,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
      lineHeight: 22,
      marginBottom: theme.spacing.xs,
    },
    orderPrice: {
      color: theme.colors.primary,
      fontWeight: '700',
    },
    statusChip: {
      height: 28,
      minHeight: 28,
      marginBottom: theme.spacing.xs,
    },
    statusChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: 'white',
      lineHeight: 16,
    },
    paidChip: {
      height: 28,
      minHeight: 28,
      marginBottom: theme.spacing.xs,
    },
    paidChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: 'white',
      lineHeight: 16,
    },
    orderTime: {
      ...theme.fonts.titleMedium,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    estimatedTime: {
      ...theme.fonts.bodyMedium,
      color: theme.colors.onSurfaceVariant,
      marginLeft: theme.spacing.xs,
    },
    timeAndPaymentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.s,
    },
    paymentBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    paymentBadgeText: {
      ...theme.fonts.labelSmall,
      fontWeight: '600',
      fontSize: 11,
      lineHeight: 14,
    },
    printButton: {
      margin: 0,
      padding: theme.spacing.xs, // Aumentar el área táctil
    },
    customerInfo: {
      ...theme.fonts.bodyMedium,
      color: theme.colors.onSurfaceVariant,
      marginBottom: theme.spacing.xs, // Reducido de theme.spacing.s
    },
    phoneInfo: {
      ...theme.fonts.bodySmall,
      color: theme.colors.onSurfaceVariant,
      marginBottom: theme.spacing.xs,
    },
    notes: {
      ...theme.fonts.bodySmall,
      color: theme.colors.onSurfaceVariant,
      marginTop: theme.spacing.xs, // Reducido de theme.spacing.s
      fontStyle: 'italic',
    },
    emptyStateContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.l,
    },
    emptyStateText: {
      textAlign: 'center',
      color: theme.colors.onSurfaceVariant,
    },
  });

export default OpenOrdersScreen;
