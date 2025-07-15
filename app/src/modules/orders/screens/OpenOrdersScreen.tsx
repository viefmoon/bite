import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, FlatList, Pressable, TouchableOpacity } from 'react-native';
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
import { useAppTheme, AppTheme } from '../../../app/styles/theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OrdersStackParamList } from '../../../app/navigation/types';
import { useAuthStore } from '../../../app/store/authStore';
import { canOpenShift } from '../../../app/utils/roleUtils';
import { useGlobalShift } from '../../../app/hooks/useGlobalShift';
import { useSnackbarStore } from '../../../app/store/snackbarStore';
import {
  useGetOpenOrdersListQuery,
  useUpdateOrderMutation,
  useCancelOrderMutation,
} from '../hooks/useOrdersQueries';
import {
  OrderOpenList,
  OrderStatusEnum,
  OrderType,
  OrderTypeEnum,
} from '../types/orders.types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PrintTicketModal } from '@/modules/shared/components/PrintTicketModal';
import { orderPrintService } from '../services/orderPrintService';
import OrderCartDetail from '../components/OrderCartDetail';
import { useListState } from '../../../app/hooks/useListState';
import { CartItem, CartProvider } from '../context/CartContext';
import {
  formatOrderStatus,
  formatOrderType,
  formatOrderTypeShort,
  getPaymentStatus,
  getStatusColor,
} from '../../../app/utils/orderFormatters';

type OpenOrdersScreenProps = NativeStackScreenProps<
  OrdersStackParamList,
  'OpenOrders'
>;


const OpenOrdersScreen: React.FC<OpenOrdersScreenProps> = ({ navigation }) => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);
  const [isPrintModalVisible, setIsPrintModalVisible] = useState(false);
  const [orderToPrint, setOrderToPrint] = useState<OrderOpenList | null>(null);

  const user = useAuthStore((state) => state.user);
  const { data: shift, isLoading: shiftLoading } = useGlobalShift();
  const userCanOpenShift = canOpenShift(user);

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [pendingProductsToAdd, setPendingProductsToAdd] = useState<CartItem[]>(
    [],
  );
  const [temporaryProducts, setTemporaryProducts] = useState<{
    [orderId: string]: CartItem[];
  }>({});
  const [existingItemsCount, setExistingItemsCount] = useState<{
    [orderId: string]: number;
  }>({});

  const [selectedOrderType, setSelectedOrderType] = useState<OrderType | 'ALL'>(
    'ALL',
  );

  const updateOrderMutation = useUpdateOrderMutation();
  const cancelOrderMutation = useCancelOrderMutation();

  const {
    data: ordersData,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useGetOpenOrdersListQuery();
  const filteredOrders = React.useMemo(() => {
    if (!ordersData) return [];
    if (selectedOrderType === 'ALL') return ordersData;
    return ordersData.filter((order) => order.orderType === selectedOrderType);
  }, [ordersData, selectedOrderType]);


  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Función para abrir el modal de impresión
  const handleOpenPrintModal = useCallback((order: OrderOpenList) => {
    setOrderToPrint(order);
    setIsPrintModalVisible(true);
  }, []);

  const handleOrderItemPress = (order: OrderOpenList) => {
    // Guardar solo el ID y abrir el modal
    setEditingOrderId(order.id);
    setIsEditModalVisible(true);
  };

  const renderOrderItem = useCallback(
    ({ item: order }: { item: OrderOpenList }) => {
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

      const totalAmount = typeof order.total === 'string' ? parseFloat(order.total) : order.total;
      const totalPaid = order.paymentsSummary?.totalPaid || 0;
      const pendingAmount = totalAmount - totalPaid;

      return (
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={() => handleOrderItemPress(order)}
        >
          <Card
            style={[
              styles.orderCard,
              {
                backgroundColor: theme.colors.surface,
              },
            ]}
            mode="elevated"
          >
            <Card.Content style={styles.cardContent}>
              <View style={styles.mainContainer}>
                <View style={styles.leftContainer}>
                  <Text
                    style={[
                      styles.orderNumber,
                      { color: theme.colors.onSurface },
                    ]}
                  >
                    {orderTitle}
                    <Text
                      style={[
                        styles.orderPrice,
                        {
                          color: pendingAmount > 0 ? theme.colors.error : '#10B981',
                        },
                      ]}
                    >
                      {' • '}
                      {pendingAmount > 0
                        ? `Por pagar: $${pendingAmount.toFixed(2)}`
                        : `Pagado: $${totalAmount.toFixed(2)}`}
                    </Text>
                    {order.notes && (
                      <Text
                        style={[
                          styles.notesInline,
                          { color: theme.colors.onSurfaceVariant },
                        ]}
                        numberOfLines={1}
                      >
                        {' • '}{order.notes}
                      </Text>
                    )}
                  </Text>
                  <View style={styles.timeAndPaymentRow}>
                    <Text
                      style={[
                        styles.orderTime,
                        { color: theme.colors.primary },
                      ]}
                    >
                      {format(new Date(order.createdAt), 'p', { locale: es })}
                    </Text>
                    {(() => {
                      const paymentStatus = getPaymentStatus(order);
                      const color = paymentStatus === 'paid' ? '#10B981' : 
                                  paymentStatus === 'partial' ? '#F59E0B' : '#EF4444';
                      const icon = paymentStatus === 'paid' ? '✓' : 
                                 paymentStatus === 'partial' ? '½' : '•';
                      return (
                        <View
                          style={[
                            styles.miniPaymentBadge,
                            { backgroundColor: color },
                          ]}
                        >
                          <Text style={styles.miniPaymentText}>
                            {icon}
                          </Text>
                        </View>
                      );
                    })()}
                    {order.preparationScreenStatuses && order.preparationScreenStatuses.length > 0 && (
                      <>
                        {order.preparationScreenStatuses.map((screen, index) => {
                          const backgroundColor = 
                            screen.status === 'READY' ? '#4CAF50' :
                            screen.status === 'IN_PROGRESS' ? '#FFA000' :
                            theme.colors.surfaceVariant;
                          
                          const textColor = 
                            screen.status === 'READY' || screen.status === 'IN_PROGRESS' ? '#FFFFFF' :
                            theme.colors.onSurfaceVariant;
                            
                          return (
                            <View
                              key={`${order.id}-screen-${index}`}
                              style={[
                                styles.inlinePreparationBadge,
                                {
                                  backgroundColor,
                                  borderColor: backgroundColor === theme.colors.surfaceVariant ? theme.colors.outline : backgroundColor,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.inlinePreparationText,
                                  { color: textColor },
                                ]}
                              >
                                {screen.status === 'READY' ? '✓ ' : 
                                 screen.status === 'IN_PROGRESS' ? '⏳ ' : ''}
                                🍳 {screen.name}
                              </Text>
                            </View>
                          );
                        })}
                      </>
                    )}
                  </View>
                </View>

                <View style={styles.rightContainer}>
                  {order.createdBy && (
                    <Text style={styles.createdByText} numberOfLines={1}>
                      {order.createdBy.firstName && order.createdBy.lastName
                        ? `${order.createdBy.firstName} ${order.createdBy.lastName}`
                        : order.createdBy.username}
                    </Text>
                  )}
                  <Chip
                    mode="flat"
                    style={[
                      styles.statusChip,
                      { backgroundColor: getStatusColor(order.orderStatus, theme) },
                    ]}
                    textStyle={styles.statusChipText}
                  >
                    {formatOrderStatus(order.orderStatus)}
                  </Chip>
                  <View style={styles.actionsContainer}>
                    <TouchableOpacity
                      style={styles.printContainer}
                      onPress={() => handleOpenPrintModal(order)}
                      activeOpacity={0.7}
                    >
                      <IconButton
                        icon="printer"
                        size={32}
                        style={styles.printButton}
                        disabled
                      />
                      {(order.ticketImpressionCount ?? 0) > 0 && (
                        <View style={styles.printCountBadge}>
                          <Text style={styles.printCountText}>
                            {order.ticketImpressionCount}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

            </Card.Content>
          </Card>
        </TouchableOpacity>
      );
    },
    [handleOrderItemPress, handleOpenPrintModal, theme, styles],
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

  // Función para manejar la impresión del ticket
  const handlePrint = useCallback(
    async (printerId: string, ticketType: 'GENERAL' | 'BILLING') => {
      if (!orderToPrint) return;

      try {
        await orderPrintService.printTicket(orderToPrint.id, {
          printerId,
          ticketType,
        });

        showSnackbar({
          message: 'Ticket impreso exitosamente',
          type: 'success',
        });

        // Refrescar la lista
        refetch();

        // Limpiar estado
        setOrderToPrint(null);
      } catch (error) {
        console.error('Error al imprimir el ticket:', error);
        showSnackbar({
          message: 'Error al imprimir el ticket',
          type: 'error',
        });
      }
    },
    [orderToPrint, refetch, showSnackbar],
  );

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
          <View style={styles.emptyStateContainer}>
            <Icon
              source="store-alert"
              size={64}
              color={theme.colors.onSurfaceVariant}
            />
            <Text variant="headlineSmall" style={styles.emptyStateTitle}>
              Turno Cerrado
            </Text>
            <Text variant="bodyLarge" style={styles.emptyStateText}>
              {userCanOpenShift
                ? 'Para ver las órdenes abiertas, primero debes abrir el turno usando el indicador en la barra superior.'
                : 'El turno debe estar abierto para ver las órdenes. Contacta a un administrador.'}
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
                    {
                      backgroundColor:
                        selectedOrderType === 'ALL'
                          ? theme.colors.primaryContainer
                          : theme.colors.surface,
                    },
                  ]}
                  onPress={() => setSelectedOrderType('ALL')}
                >
                  <Icon
                    source="view-grid"
                    size={26}
                    color={
                      selectedOrderType === 'ALL'
                        ? theme.colors.primary
                        : theme.colors.onSurfaceVariant
                    }
                  />
                  {ordersData && ordersData.length > 0 && (
                    <View
                      style={[
                        styles.countBadge,
                        {
                          backgroundColor:
                            selectedOrderType === 'ALL'
                              ? theme.colors.error
                              : theme.colors.errorContainer,
                          borderColor:
                            selectedOrderType === 'ALL'
                              ? theme.colors.error
                              : theme.colors.outline,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.countBadgeText,
                          {
                            color:
                              selectedOrderType === 'ALL'
                                ? theme.colors.onError
                                : theme.colors.onErrorContainer,
                          },
                        ]}
                      >
                        {ordersData.length}
                      </Text>
                    </View>
                  )}
                </Pressable>
                <Pressable
                  style={[
                    styles.filterButton,
                    selectedOrderType === OrderTypeEnum.DINE_IN &&
                      styles.filterButtonActive,
                    {
                      backgroundColor:
                        selectedOrderType === OrderTypeEnum.DINE_IN
                          ? theme.colors.primaryContainer
                          : theme.colors.surface,
                    },
                  ]}
                  onPress={() => setSelectedOrderType(OrderTypeEnum.DINE_IN)}
                >
                  <Icon
                    source="silverware-fork-knife"
                    size={26}
                    color={
                      selectedOrderType === OrderTypeEnum.DINE_IN
                        ? theme.colors.primary
                        : theme.colors.onSurfaceVariant
                    }
                  />
                  {ordersData &&
                    ordersData.filter(
                      (o) => o.orderType === OrderTypeEnum.DINE_IN,
                    ).length > 0 && (
                      <View
                        style={[
                          styles.countBadge,
                          {
                            backgroundColor:
                              selectedOrderType === OrderTypeEnum.DINE_IN
                                ? theme.colors.error
                                : theme.colors.errorContainer,
                            borderColor:
                              selectedOrderType === OrderTypeEnum.DINE_IN
                                ? theme.colors.error
                                : theme.colors.outline,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.countBadgeText,
                            {
                              color:
                                selectedOrderType === OrderTypeEnum.DINE_IN
                                  ? theme.colors.onError
                                  : theme.colors.onErrorContainer,
                            },
                          ]}
                        >
                          {
                            ordersData.filter(
                              (o) => o.orderType === OrderTypeEnum.DINE_IN,
                            ).length
                          }
                        </Text>
                      </View>
                    )}
                </Pressable>
                <Pressable
                  style={[
                    styles.filterButton,
                    selectedOrderType === OrderTypeEnum.TAKE_AWAY &&
                      styles.filterButtonActive,
                    {
                      backgroundColor:
                        selectedOrderType === OrderTypeEnum.TAKE_AWAY
                          ? theme.colors.primaryContainer
                          : theme.colors.surface,
                    },
                  ]}
                  onPress={() => setSelectedOrderType(OrderTypeEnum.TAKE_AWAY)}
                >
                  <Icon
                    source="bag-personal"
                    size={26}
                    color={
                      selectedOrderType === OrderTypeEnum.TAKE_AWAY
                        ? theme.colors.primary
                        : theme.colors.onSurfaceVariant
                    }
                  />
                  {ordersData &&
                    ordersData.filter(
                      (o) => o.orderType === OrderTypeEnum.TAKE_AWAY,
                    ).length > 0 && (
                      <View
                        style={[
                          styles.countBadge,
                          {
                            backgroundColor:
                              selectedOrderType === OrderTypeEnum.TAKE_AWAY
                                ? theme.colors.error
                                : theme.colors.errorContainer,
                            borderColor:
                              selectedOrderType === OrderTypeEnum.TAKE_AWAY
                                ? theme.colors.error
                                : theme.colors.outline,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.countBadgeText,
                            {
                              color:
                                selectedOrderType === OrderTypeEnum.TAKE_AWAY
                                  ? theme.colors.onError
                                  : theme.colors.onErrorContainer,
                            },
                          ]}
                        >
                          {
                            ordersData.filter(
                              (o) => o.orderType === OrderTypeEnum.TAKE_AWAY,
                            ).length
                          }
                        </Text>
                      </View>
                    )}
                </Pressable>
                <Pressable
                  style={[
                    styles.filterButton,
                    selectedOrderType === OrderTypeEnum.DELIVERY &&
                      styles.filterButtonActive,
                    {
                      backgroundColor:
                        selectedOrderType === OrderTypeEnum.DELIVERY
                          ? theme.colors.primaryContainer
                          : theme.colors.surface,
                    },
                  ]}
                  onPress={() => setSelectedOrderType(OrderTypeEnum.DELIVERY)}
                >
                  <Icon
                    source="moped"
                    size={26}
                    color={
                      selectedOrderType === OrderTypeEnum.DELIVERY
                        ? theme.colors.primary
                        : theme.colors.onSurfaceVariant
                    }
                  />
                  {ordersData &&
                    ordersData.filter(
                      (o) => o.orderType === OrderTypeEnum.DELIVERY,
                    ).length > 0 && (
                      <View
                        style={[
                          styles.countBadge,
                          {
                            backgroundColor:
                              selectedOrderType === OrderTypeEnum.DELIVERY
                                ? theme.colors.error
                                : theme.colors.errorContainer,
                            borderColor:
                              selectedOrderType === OrderTypeEnum.DELIVERY
                                ? theme.colors.error
                                : theme.colors.outline,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.countBadgeText,
                            {
                              color:
                                selectedOrderType === OrderTypeEnum.DELIVERY
                                  ? theme.colors.onError
                                  : theme.colors.onErrorContainer,
                            },
                          ]}
                        >
                          {
                            ordersData.filter(
                              (o) => o.orderType === OrderTypeEnum.DELIVERY,
                            ).length
                          }
                        </Text>
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
      {/* Modal de Impresión de Ticket */}
      <Portal>
        <PrintTicketModal
          visible={isPrintModalVisible}
          onDismiss={() => {
            setIsPrintModalVisible(false);
            setOrderToPrint(null);
          }}
          order={orderToPrint}
          onPrint={handlePrint}
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

                const orderNumber = ordersData?.find(
                  (o) => o.id === editingOrderId,
                )?.shiftOrderNumber;

                // Navegar a añadir productos
                setTimeout(() => {
                  const existingProducts = temporaryProducts[editingOrderId!] || [];
                  navigation.navigate('AddProductsToOrder', {
                    orderId: editingOrderId!,
                    orderNumber: orderNumber!,
                    // Pasar productos temporales existentes si los hay
                    existingTempProducts: existingProducts,
                    existingOrderItemsCount: existingItemsCount[editingOrderId!] || 0, // Usar el conteo rastreado
                    onProductsAdded: (newProducts) => {
                      // Actualizar productos temporales para esta orden
                      setTemporaryProducts((prev) => ({
                        ...prev,
                        [editingOrderId!]: newProducts,
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
                    const filteredDeliveryInfo = Object.entries(
                      details.deliveryInfo,
                    )
                      .filter(([_, value]) => value !== undefined)
                      .reduce(
                        (acc, [key, value]) => ({ ...acc, [key]: value }),
                        {},
                      );

                    // Si no quedan propiedades con valores, enviar null
                    return Object.keys(filteredDeliveryInfo).length > 0
                      ? filteredDeliveryInfo
                      : null;
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
      padding: theme.spacing.s,
      paddingBottom: theme.spacing.l * 2,
      flexGrow: 1,
    },
    orderCard: {
      marginBottom: 8,
    },
    cardContent: {
      paddingBottom: 8,
    },
    mainContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    leftContainer: {
      flex: 1,
      paddingRight: 8,
    },
    rightContainer: {
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      minWidth: 140,
      gap: 8,
    },
    actionsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 4,
    },
    orderNumber: {
      fontSize: 16,
      fontWeight: 'bold',
      lineHeight: 22,
      marginBottom: 4,
    },
    orderPrice: {
      fontSize: 15,
      fontWeight: '700',
    },
    statusChip: {
      height: 28,
      minHeight: 28,
      alignSelf: 'flex-end',
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
      fontSize: 16,
      fontWeight: '600',
    },
    estimatedTime: {
      fontSize: 14,
      marginLeft: 4,
    },
    timeAndPaymentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 0,
    },
    paymentBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    paymentBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      lineHeight: 14,
    },
    printButton: {
      margin: -4,
    },
    printContainer: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    printCountBadge: {
      position: 'absolute',
      top: 0,
      right: 0,
      backgroundColor: '#3B82F6',
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      paddingHorizontal: 4,
      alignItems: 'center',
      justifyContent: 'center',
    },
    printCountText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: 'bold',
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
    notesInline: {
      fontSize: 12,
      fontStyle: 'italic',
    },
    inlinePreparationBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
      borderWidth: 0.5,
      marginLeft: 4,
    },
    inlinePreparationText: {
      fontSize: 10,
      fontWeight: '500',
    },
    miniPaymentBadge: {
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 6,
    },
    miniPaymentText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    miniPreparationBadge: {
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 4,
    },
    miniPreparationText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    moreIndicator: {
      fontSize: 10,
      color: theme.colors.onSurfaceVariant,
      marginLeft: 4,
    },
    createdByText: {
      fontSize: 10,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 4,
      textAlign: 'right',
    },
    emptyStateContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.l,
    },
    emptyStateTitle: {
      marginTop: theme.spacing.l,
      marginBottom: theme.spacing.m,
      textAlign: 'center',
      color: theme.colors.onSurface,
      fontWeight: '600',
    },
    emptyStateText: {
      textAlign: 'center',
      color: theme.colors.onSurfaceVariant,
      maxWidth: 320,
      lineHeight: 24,
    },
  });

export default OpenOrdersScreen;
