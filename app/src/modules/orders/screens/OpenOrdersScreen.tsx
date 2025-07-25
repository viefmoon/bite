import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
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
  Button,
} from 'react-native-paper';
import { useAppTheme, AppTheme } from '../../../app/styles/theme';
import { useResponsive } from '../../../app/hooks/useResponsive';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OrdersStackParamList } from '../../../app/navigation/types';
import { useAuthStore } from '../../../app/store/authStore';
import { canOpenShift } from '../../../app/utils/roleUtils';
import { useGlobalShift } from '../../../app/hooks/useGlobalShift';
import { useSnackbarStore } from '../../../app/store/snackbarStore';
import { NAVIGATION_PATHS } from '@/app/constants/navigationPaths';
import {
  useGetOpenOrdersListQuery,
  useUpdateOrderMutation,
  useCancelOrderMutation,
} from '../hooks/useOrdersQueries';
import {
  OrderOpenList,
  OrderType,
  OrderTypeEnum,
  OrderStatusEnum,
} from '../types/orders.types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PrintTicketModal } from '@/modules/shared/components/PrintTicketModal';
import { orderPrintService } from '../services/orderPrintService';
import OrderCartDetail from '../components/OrderCartDetail';
import { useListState } from '../../../app/hooks/useListState';
import { CartItem } from '../stores/useOrderCreationStore';
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
  const responsive = useResponsive();
  const styles = React.useMemo(
    () => createStyles(theme, responsive),
    [theme, responsive],
  );
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);
  const [isPrintModalVisible, setIsPrintModalVisible] = useState(false);
  const [orderToPrint, setOrderToPrint] = useState<OrderOpenList | null>(null);
  const [acceptingOrderId, setAcceptingOrderId] = useState<string | null>(null);

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

  const [selectedOrderType, setSelectedOrderType] = useState<
    OrderType | 'ALL' | 'WHATSAPP'
  >('ALL');

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

    if (selectedOrderType === 'ALL') {
      // En ALL, excluir pedidos de WhatsApp pendientes
      return ordersData.filter(
        (order) =>
          !(
            order.isFromWhatsApp &&
            order.orderStatus === OrderStatusEnum.PENDING
          ),
      );
    }

    if (selectedOrderType === 'WHATSAPP') {
      // Filtrar solo pedidos de WhatsApp con estado PENDING
      return ordersData.filter(
        (order) =>
          order.isFromWhatsApp && order.orderStatus === OrderStatusEnum.PENDING,
      );
    }

    // Para otros filtros (DINE_IN, TAKE_AWAY, DELIVERY), excluir pedidos de WhatsApp pendientes
    return ordersData.filter(
      (order) =>
        order.orderType === selectedOrderType &&
        !(
          order.isFromWhatsApp && order.orderStatus === OrderStatusEnum.PENDING
        ),
    );
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

      const totalAmount =
        typeof order.total === 'string' ? parseFloat(order.total) : order.total;
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
                          color:
                            pendingAmount > 0 ? theme.colors.error : '#10B981',
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
                        {' • '}
                        {order.notes}
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
                      const color =
                        paymentStatus === 'paid'
                          ? '#10B981'
                          : paymentStatus === 'partial'
                            ? '#F59E0B'
                            : '#EF4444';
                      const icon =
                        paymentStatus === 'paid'
                          ? '✓'
                          : paymentStatus === 'partial'
                            ? '½'
                            : '•';
                      return (
                        <View
                          style={[
                            styles.miniPaymentBadge,
                            { backgroundColor: color },
                          ]}
                        >
                          <Text style={styles.miniPaymentText}>{icon}</Text>
                        </View>
                      );
                    })()}

                    {/* Badge de WhatsApp */}
                    {order.isFromWhatsApp && (
                      <View
                        style={[
                          styles.inlinePreparationBadge,
                          {
                            backgroundColor: '#25D366',
                            borderColor: '#25D366',
                          },
                        ]}
                      >
                        <Icon source="whatsapp" size={12} color="#FFFFFF" />
                      </View>
                    )}

                    {order.preparationScreenStatuses &&
                      order.preparationScreenStatuses.length > 0 && (
                        <>
                          {order.preparationScreenStatuses.map(
                            (screen, index) => {
                              const backgroundColor =
                                screen.status === 'READY'
                                  ? '#4CAF50'
                                  : screen.status === 'IN_PROGRESS'
                                    ? '#FFA000'
                                    : theme.colors.surfaceVariant;

                              const textColor =
                                screen.status === 'READY' ||
                                screen.status === 'IN_PROGRESS'
                                  ? '#FFFFFF'
                                  : theme.colors.onSurfaceVariant;

                              return (
                                <View
                                  key={`${order.id}-screen-${index}`}
                                  style={[
                                    styles.inlinePreparationBadge,
                                    {
                                      backgroundColor,
                                      borderColor:
                                        backgroundColor ===
                                        theme.colors.surfaceVariant
                                          ? theme.colors.outline
                                          : backgroundColor,
                                    },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.inlinePreparationText,
                                      { color: textColor },
                                    ]}
                                  >
                                    {screen.status === 'READY'
                                      ? '✓ '
                                      : screen.status === 'IN_PROGRESS'
                                        ? '⏳ '
                                        : ''}
                                    🍳 {screen.name}
                                  </Text>
                                </View>
                              );
                            },
                          )}
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
                    compact
                    style={[
                      styles.statusChip,
                      {
                        backgroundColor: getStatusColor(
                          order.orderStatus,
                          theme,
                        ),
                      },
                    ]}
                    textStyle={styles.statusChipText}
                  >
                    {formatOrderStatus(order.orderStatus)}
                  </Chip>
                  <View style={styles.actionsContainer}>
                    {selectedOrderType === 'WHATSAPP' &&
                    order.orderStatus === OrderStatusEnum.PENDING ? (
                      <Button
                        mode="contained"
                        icon="check"
                        onPress={() => handleAcceptWhatsAppOrder(order.id)}
                        disabled={acceptingOrderId === order.id}
                        loading={acceptingOrderId === order.id}
                        compact
                      >
                        Aceptar
                      </Button>
                    ) : (
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
                    )}
                  </View>
                </View>
              </View>
            </Card.Content>
          </Card>
        </TouchableOpacity>
      );
    },
    [
      handleOrderItemPress,
      handleOpenPrintModal,
      handleAcceptWhatsAppOrder,
      selectedOrderType,
      acceptingOrderId,
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
          : selectedOrderType === 'WHATSAPP'
            ? 'No hay pedidos de WhatsApp pendientes'
            : `No hay órdenes de tipo ${formatOrderType(
                selectedOrderType as OrderType,
              )
                .replace(/[\u{1F37D}]|[\u{FE0F}]|[\u{1F961}]|[\u{1F69A}]/gu, '')
                .trim()}`,
      message:
        selectedOrderType === 'ALL'
          ? 'No hay órdenes abiertas en este momento.'
          : selectedOrderType === 'WHATSAPP'
            ? 'No hay pedidos de WhatsApp esperando aceptación.'
            : `No hay órdenes de este tipo en este momento.`,
      icon:
        selectedOrderType === 'WHATSAPP'
          ? 'whatsapp'
          : 'clipboard-text-outline',
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
          style={styles.headerRefreshButton} // Agregar margen para mejor accesibilidad
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
        showSnackbar({
          message: 'Error al imprimir el ticket',
          type: 'error',
        });
      }
    },
    [orderToPrint, refetch, showSnackbar],
  );

  // Función para aceptar un pedido de WhatsApp
  const handleAcceptWhatsAppOrder = useCallback(
    async (orderId: string) => {
      if (acceptingOrderId !== null) return;

      setAcceptingOrderId(orderId);

      try {
        await updateOrderMutation.mutateAsync({
          orderId,
          payload: {
            orderStatus: OrderStatusEnum.IN_PROGRESS,
          },
        });

        showSnackbar({
          message: 'Pedido aceptado exitosamente',
          type: 'success',
        });

        refetch();
      } catch (error) {
        showSnackbar({
          message: 'Error al aceptar el pedido',
          type: 'error',
        });
      } finally {
        setAcceptingOrderId(null);
      }
    },
    [acceptingOrderId, updateOrderMutation, refetch, showSnackbar],
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
                  {ordersData &&
                    ordersData.filter(
                      (o) =>
                        !(
                          o.isFromWhatsApp &&
                          o.orderStatus === OrderStatusEnum.PENDING
                        ),
                    ).length > 0 && (
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
                          {
                            ordersData.filter(
                              (o) =>
                                !(
                                  o.isFromWhatsApp &&
                                  o.orderStatus === OrderStatusEnum.PENDING
                                ),
                            ).length
                          }
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
                      (o) =>
                        o.orderType === OrderTypeEnum.DINE_IN &&
                        !(
                          o.isFromWhatsApp &&
                          o.orderStatus === OrderStatusEnum.PENDING
                        ),
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
                              (o) =>
                                o.orderType === OrderTypeEnum.DINE_IN &&
                                !(
                                  o.isFromWhatsApp &&
                                  o.orderStatus === OrderStatusEnum.PENDING
                                ),
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
                      (o) =>
                        o.orderType === OrderTypeEnum.TAKE_AWAY &&
                        !(
                          o.isFromWhatsApp &&
                          o.orderStatus === OrderStatusEnum.PENDING
                        ),
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
                              (o) =>
                                o.orderType === OrderTypeEnum.TAKE_AWAY &&
                                !(
                                  o.isFromWhatsApp &&
                                  o.orderStatus === OrderStatusEnum.PENDING
                                ),
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
                      (o) =>
                        o.orderType === OrderTypeEnum.DELIVERY &&
                        !(
                          o.isFromWhatsApp &&
                          o.orderStatus === OrderStatusEnum.PENDING
                        ),
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
                              (o) =>
                                o.orderType === OrderTypeEnum.DELIVERY &&
                                !(
                                  o.isFromWhatsApp &&
                                  o.orderStatus === OrderStatusEnum.PENDING
                                ),
                            ).length
                          }
                        </Text>
                      </View>
                    )}
                </Pressable>
                <Pressable
                  style={[
                    styles.filterButton,
                    selectedOrderType === 'WHATSAPP' &&
                      styles.filterButtonActive,
                    {
                      backgroundColor:
                        selectedOrderType === 'WHATSAPP'
                          ? theme.colors.primaryContainer
                          : theme.colors.surface,
                    },
                  ]}
                  onPress={() => setSelectedOrderType('WHATSAPP')}
                >
                  <Icon
                    source="whatsapp"
                    size={26}
                    color={
                      selectedOrderType === 'WHATSAPP'
                        ? theme.colors.primary
                        : theme.colors.onSurfaceVariant
                    }
                  />
                  {ordersData &&
                    ordersData.filter(
                      (o) =>
                        o.isFromWhatsApp &&
                        o.orderStatus === OrderStatusEnum.PENDING,
                    ).length > 0 && (
                      <View
                        style={[
                          styles.countBadge,
                          {
                            backgroundColor:
                              selectedOrderType === 'WHATSAPP'
                                ? theme.colors.error
                                : theme.colors.errorContainer,
                            borderColor:
                              selectedOrderType === 'WHATSAPP'
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
                                selectedOrderType === 'WHATSAPP'
                                  ? theme.colors.onError
                                  : theme.colors.onErrorContainer,
                            },
                          ]}
                        >
                          {
                            ordersData.filter(
                              (o) =>
                                o.isFromWhatsApp &&
                                o.orderStatus === OrderStatusEnum.PENDING,
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
            <FlashList
              data={filteredOrders}
              keyExtractor={(item) => item.id}
              renderItem={renderOrderItem}
              refreshing={isFetching}
              onRefresh={handleRefresh}
              contentContainerStyle={styles.listContentContainer}
              ListEmptyComponent={ListEmptyComponent}
              estimatedItemSize={120}
              removeClippedSubviews={true}
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
          <OrderCartDetail
            visible={isEditModalVisible}
            isEditMode={true}
            orderId={editingOrderId}
            orderNumber={
              ordersData?.find((o) => o.id === editingOrderId)?.shiftOrderNumber
            }
            orderDate={
              ordersData?.find((o) => o.id === editingOrderId)?.createdAt
                ? new Date(
                    ordersData.find((o) => o.id === editingOrderId)!.createdAt,
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
                const existingProducts =
                  temporaryProducts[editingOrderId!] || [];
                navigation.navigate(NAVIGATION_PATHS.ADD_PRODUCTS_TO_ORDER, {
                  orderId: editingOrderId!,
                  orderNumber: orderNumber!,
                  // Pasar productos temporales existentes si los hay
                  existingTempProducts: existingProducts,
                  existingOrderItemsCount:
                    existingItemsCount[editingOrderId!] || 0, // Usar el conteo rastreado
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
        )}
      </Portal>
    </SafeAreaView>
  );
};

const createStyles = (
  theme: AppTheme,
  responsive: ReturnType<typeof useResponsive>,
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
      marginTop: responsive.isTablet ? theme.spacing.s : theme.spacing.m,
      color: theme.colors.onSurfaceVariant,
      fontSize: responsive.isTablet ? 14 : 16,
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
      height: responsive.isTablet ? 44 : 52,
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
      top: responsive.isTablet ? 3 : 6,
      right: responsive.isTablet ? 3 : 6,
      minWidth: responsive.isTablet ? 18 : 22,
      height: responsive.isTablet ? 18 : 22,
      borderRadius: responsive.isTablet ? 9 : 11,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: responsive.isTablet ? 4 : 6,
      borderWidth: 1,
      elevation: 2,
    },
    countBadgeText: {
      fontSize: responsive.isTablet ? 10 : 12,
      fontWeight: '700',
    },
    listContainer: {
      flex: 1,
    },
    listContentContainer: {
      padding: responsive.isTablet ? theme.spacing.xs : theme.spacing.s,
      paddingBottom: responsive.isTablet
        ? theme.spacing.l
        : theme.spacing.l * 2,
    },
    orderCard: {
      marginBottom: responsive.isTablet ? 6 : 8,
    },
    cardContent: {
      paddingBottom: responsive.isTablet ? 6 : 8,
      paddingHorizontal: responsive.isTablet ? 12 : 16,
      paddingTop: responsive.isTablet ? 12 : 16,
    },
    mainContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    leftContainer: {
      flex: 1,
      paddingRight: responsive.isTablet ? 6 : 8,
    },
    rightContainer: {
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      minWidth: responsive.isTablet ? 120 : 140,
      gap: responsive.isTablet ? 6 : 8,
    },
    actionsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: responsive.isTablet ? 2 : 4,
    },
    orderNumber: {
      fontSize: responsive.isTablet ? 14 : 16,
      fontWeight: 'bold',
      lineHeight: responsive.isTablet ? 20 : 22,
      marginBottom: responsive.isTablet ? 2 : 4,
    },
    orderPrice: {
      fontSize: responsive.isTablet ? 13 : 15,
      fontWeight: '700',
    },
    statusChip: {
      minHeight: responsive.isTablet ? 22 : 24,
      alignSelf: 'flex-end',
      paddingVertical: responsive.isTablet ? 1 : 2,
    },
    statusChipText: {
      fontSize: responsive.isTablet ? 11 : 12,
      fontWeight: '600',
      color: 'white',
      lineHeight: responsive.isTablet ? 13 : 14,
      marginVertical: 0,
      paddingVertical: 0,
    },
    paidChip: {
      height: responsive.isTablet ? 24 : 28,
      minHeight: responsive.isTablet ? 24 : 28,
      marginBottom: responsive.isTablet
        ? theme.spacing.xs * 0.7
        : theme.spacing.xs,
    },
    paidChipText: {
      fontSize: responsive.isTablet ? 11 : 12,
      fontWeight: '600',
      color: 'white',
      lineHeight: responsive.isTablet ? 14 : 16,
    },
    orderTime: {
      fontSize: responsive.isTablet ? 14 : 16,
      fontWeight: '600',
    },
    estimatedTime: {
      fontSize: responsive.isTablet ? 12 : 14,
      marginLeft: responsive.isTablet ? 3 : 4,
    },
    timeAndPaymentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 0,
    },
    paymentBadge: {
      paddingHorizontal: responsive.isTablet ? 6 : 8,
      paddingVertical: responsive.isTablet ? 1 : 2,
      borderRadius: responsive.isTablet ? 10 : 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    paymentBadgeText: {
      fontSize: responsive.isTablet ? 10 : 11,
      fontWeight: '600',
      lineHeight: responsive.isTablet ? 12 : 14,
    },
    printButton: {
      margin: responsive.isTablet ? -6 : -4,
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
      borderRadius: responsive.isTablet ? 8 : 10,
      minWidth: responsive.isTablet ? 18 : 20,
      height: responsive.isTablet ? 18 : 20,
      paddingHorizontal: responsive.isTablet ? 3 : 4,
      alignItems: 'center',
      justifyContent: 'center',
    },
    printCountText: {
      color: '#FFFFFF',
      fontSize: responsive.isTablet ? 9 : 10,
      fontWeight: 'bold',
    },
    customerInfo: {
      ...theme.fonts.bodyMedium,
      fontSize: responsive.isTablet ? 13 : 14,
      color: theme.colors.onSurfaceVariant,
      marginBottom: responsive.isTablet
        ? theme.spacing.xs * 0.7
        : theme.spacing.xs,
    },
    phoneInfo: {
      ...theme.fonts.bodySmall,
      fontSize: responsive.isTablet ? 11 : 12,
      color: theme.colors.onSurfaceVariant,
      marginBottom: responsive.isTablet
        ? theme.spacing.xs * 0.7
        : theme.spacing.xs,
    },
    notesInline: {
      fontSize: responsive.isTablet ? 11 : 12,
      fontStyle: 'italic',
    },
    inlinePreparationBadge: {
      paddingHorizontal: responsive.isTablet ? 4 : 6,
      paddingVertical: responsive.isTablet ? 1 : 2,
      borderRadius: responsive.isTablet ? 8 : 10,
      borderWidth: 0.5,
      marginLeft: responsive.isTablet ? 3 : 4,
    },
    inlinePreparationText: {
      fontSize: responsive.isTablet ? 9 : 10,
      fontWeight: '500',
    },
    miniPaymentBadge: {
      width: responsive.isTablet ? 18 : 20,
      height: responsive.isTablet ? 18 : 20,
      borderRadius: responsive.isTablet ? 9 : 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: responsive.isTablet ? 4 : 6,
    },
    miniPaymentText: {
      fontSize: responsive.isTablet ? 9 : 10,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    miniPreparationBadge: {
      width: responsive.isTablet ? 18 : 20,
      height: responsive.isTablet ? 18 : 20,
      borderRadius: responsive.isTablet ? 9 : 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: responsive.isTablet ? 3 : 4,
    },
    miniPreparationText: {
      fontSize: responsive.isTablet ? 9 : 10,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    moreIndicator: {
      fontSize: responsive.isTablet ? 9 : 10,
      color: theme.colors.onSurfaceVariant,
      marginLeft: responsive.isTablet ? 3 : 4,
    },
    createdByText: {
      fontSize: responsive.isTablet ? 9 : 10,
      color: theme.colors.onSurfaceVariant,
      marginBottom: responsive.isTablet ? 3 : 4,
      textAlign: 'right',
    },
    emptyStateContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: responsive.isTablet ? theme.spacing.m : theme.spacing.l,
    },
    emptyStateTitle: {
      marginTop: responsive.isTablet ? theme.spacing.m : theme.spacing.l,
      marginBottom: responsive.isTablet ? theme.spacing.s : theme.spacing.m,
      textAlign: 'center',
      color: theme.colors.onSurface,
      fontWeight: '600',
      fontSize: responsive.isTablet ? 20 : 24,
    },
    emptyStateText: {
      textAlign: 'center',
      color: theme.colors.onSurfaceVariant,
      maxWidth: responsive.isTablet ? 280 : 320,
      lineHeight: responsive.isTablet ? 20 : 24,
      fontSize: responsive.isTablet ? 14 : 16,
    },
    // Estilo adicional para eliminar inline style
    headerRefreshButton: {
      marginRight: 8,
    },
  });

export default OpenOrdersScreen;
