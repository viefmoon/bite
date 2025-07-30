import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import {
  Text,
  ActivityIndicator,
  Appbar,
  Portal,
  Icon,
  Button,
  IconButton,
} from 'react-native-paper';
import { useAppTheme, AppTheme } from '../../../app/styles/theme';
import { useResponsive } from '../../../app/hooks/useResponsive';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OrdersStackParamList } from '../navigation/types';
import { useAuthStore } from '../../../app/stores/authStore';
import { canOpenShift } from '../../../app/utils/roleUtils';
import { useGlobalShift } from '../../../app/hooks/useGlobalShift';
import { useSnackbarStore } from '../../../app/stores/snackbarStore';
import { NAVIGATION_PATHS } from '../../../app/constants/navigationPaths';
import OrderSummaryCard from '../../shared/components/OrderSummaryCard';
import { OrderFilterHeader } from '../components/OrderFilterHeader';
import {
  useGetOpenOrdersListQuery,
  useUpdateOrderMutation,
  useCancelOrderMutation,
} from '../hooks/useOrdersQueries';
import {
  OrderOpenList,
  OrderType,
  OrderStatusEnum,
} from '../schema/orders.schema';
import { PrintTicketModal } from '../../shared/components/PrintTicketModal';
import { orderPrintService } from '../services/orderPrintService';
import OrderCartDetail from '../components/OrderCartDetail';
import { useListState } from '../../../app/hooks/useListState';
import { formatOrderType, OrderStatusInfo } from '../utils/formatters';

type OpenOrdersScreenProps = NativeStackScreenProps<
  OrdersStackParamList,
  typeof NAVIGATION_PATHS.OPEN_ORDERS
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

  const handleOrderItemPress = useCallback(async (order: OrderOpenList) => {
    // Cargar la orden en el store antes de abrir el modal
    setEditingOrderId(order.id);
    setIsEditModalVisible(true);
  }, []);

  // Función para aceptar un pedido de WhatsApp
  const handleAcceptWhatsAppOrder = useCallback(
    async (orderId: string) => {
      if (acceptingOrderId !== null) return;

      setAcceptingOrderId(orderId);

      try {
        await updateOrderMutation.mutateAsync({
          orderId,
          payload: {
            status: OrderStatusEnum.IN_PROGRESS,
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

  const renderOrderItem = useCallback(
    ({ item: order }: { item: OrderOpenList }) => (
      <OrderSummaryCard
        item={{
          ...order,
          deliveryInfo: order.deliveryInfo
            ? {
                recipientName: order.deliveryInfo.recipientName,
                recipientPhone: order.deliveryInfo.recipientPhone || undefined,
                fullAddress: order.deliveryInfo.fullAddress,
                address: order.deliveryInfo.address?.street
                  ? `${order.deliveryInfo.address.street} ${order.deliveryInfo.address.number}`
                  : undefined,
              }
            : undefined,
        }}
        onPress={() => handleOrderItemPress(order)}
        showCreatedBy={true}
        getStatusColor={(status) => OrderStatusInfo.getColor(status, theme)}
        getStatusLabel={OrderStatusInfo.getLabel}
        renderActions={(orderItem) => (
          <View style={styles.actionsContainer}>
            {selectedOrderType === 'WHATSAPP' &&
            orderItem.orderStatus === OrderStatusEnum.PENDING ? (
              <Button
                mode="contained"
                icon="check"
                onPress={() =>
                  handleAcceptWhatsAppOrder(orderItem.id as string)
                }
                disabled={acceptingOrderId === orderItem.id}
                loading={acceptingOrderId === orderItem.id}
                compact
              >
                Aceptar
              </Button>
            ) : (
              <TouchableOpacity
                style={styles.printContainer}
                onPress={() => handleOpenPrintModal(orderItem as OrderOpenList)}
                activeOpacity={0.7}
              >
                <IconButton
                  icon="printer"
                  size={32}
                  style={styles.printButton}
                  disabled
                />
                {((orderItem as OrderOpenList).ticketImpressionCount ?? 0) >
                  0 && (
                  <View style={styles.printCountBadge}>
                    <Text style={styles.printCountText}>
                      {(orderItem as OrderOpenList).ticketImpressionCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    ),
    [
      handleOrderItemPress,
      handleOpenPrintModal,
      handleAcceptWhatsAppOrder,
      acceptingOrderId,
      selectedOrderType,
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
  }, [
    navigation,
    handleRefresh,
    isFetching,
    theme.colors.onPrimary,
    styles.headerRefreshButton,
  ]); // Añadir dependencias

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
          <OrderFilterHeader
            selectedOrderType={selectedOrderType}
            ordersData={ordersData}
            onFilterChange={setSelectedOrderType}
          />

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
            onClose={() => {
              setIsEditModalVisible(false);
              setEditingOrderId(null);
            }}
            onAddProducts={() => {
              setIsEditModalVisible(false);

              const orderNumber = ordersData?.find(
                (o) => o.id === editingOrderId,
              )?.shiftOrderNumber;

              setTimeout(() => {
                navigation.navigate(NAVIGATION_PATHS.ADD_PRODUCTS_TO_ORDER, {
                  orderId: editingOrderId!,
                  orderNumber: orderNumber!,
                  onProductsAdded: () => {
                    setIsEditModalVisible(true);
                  },
                });
              }, 100);
            }}
            onConfirmOrder={async (details) => {
              const payload = {
                orderType: details.orderType,
                items: details.items,
                tableId: details.tableId || null,
                isTemporaryTable: details.isTemporaryTable || false,
                temporaryTableName: details.temporaryTableName || null,
                temporaryTableAreaId: details.temporaryTableAreaId || null,
                scheduledAt: details.scheduledAt || null,
                deliveryInfo: (() => {
                  if (!details.deliveryInfo) return null;

                  const filteredDeliveryInfo = Object.entries(
                    details.deliveryInfo,
                  )
                    .filter(([_, value]) => value !== undefined)
                    .reduce(
                      (acc, [key, value]) => ({ ...acc, [key]: value }),
                      {},
                    );

                  return Object.keys(filteredDeliveryInfo).length > 0
                    ? filteredDeliveryInfo
                    : null;
                })(),
                notes: details.notes || null,
                total: details.total,
                subtotal: details.subtotal,
                adjustments: details.adjustments || [],
              };

              try {
                await updateOrderMutation.mutateAsync({
                  orderId: editingOrderId,
                  payload,
                });

                setIsEditModalVisible(false);
                setEditingOrderId(null);
              } catch (error) {
                // El error se maneja en el hook
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
    listContainer: {
      flex: 1,
    },
    listContentContainer: {
      padding: responsive.isTablet ? theme.spacing.xs : theme.spacing.s,
      paddingBottom: responsive.isTablet
        ? theme.spacing.l
        : theme.spacing.l * 2,
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
    whatsappButton: {
      backgroundColor: '#25D366',
      borderColor: '#25D366',
    },
    actionsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: responsive.isTablet ? 2 : 4,
    },
    printContainer: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    printButton: {
      margin: responsive.isTablet ? -6 : -4,
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
  });

export default OpenOrdersScreen;
