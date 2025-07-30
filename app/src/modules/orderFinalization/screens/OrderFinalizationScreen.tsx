import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import {
  Surface,
  Text,
  ActivityIndicator,
  Icon,
  Button,
  IconButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import OrderSummaryCard from '../../shared/components/OrderSummaryCard';
import { OrderStatusInfo } from '../../orders/utils/formatters';
import { UnifiedOrderDetailsModal } from '@/modules/shared/components/UnifiedOrderDetailsModal';
import { PrintTicketModal } from '@/modules/shared/components/PrintTicketModal';
import { useOrdersForFinalizationList } from '../hooks/useOrderFinalizationQueries';
import {
  OrderFinalizationFilter,
  OrderSelectionState,
} from '../schema/orderFinalization.schema';
import type { Order } from '@/app/schemas/domain/order.schema';
import EmptyState from '@/app/components/common/EmptyState';
import ConfirmationModal from '@/app/components/common/ConfirmationModal';
import { useAppTheme } from '@/app/styles/theme';
import { useResponsive } from '@/app/hooks/useResponsive';
import { useSnackbarStore } from '@/app/stores/snackbarStore';
import { orderService } from '@/app/services/orderService';

export const OrderFinalizationScreen: React.FC = () => {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);
  const styles = useMemo(() => createStyles(responsive), [responsive]);
  const [filter, setFilter] = useState<OrderFinalizationFilter>('delivery');
  const [selectionState, setSelectionState] = useState<OrderSelectionState>({
    selectedOrders: new Set(),
    totalAmount: 0,
  });
  const [selectedOrderIdForDetails, setSelectedOrderIdForDetails] = useState<
    string | null
  >(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [isFinalizingOrders, setIsFinalizingOrders] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedOrderForPrint, setSelectedOrderForPrint] =
    useState<Order | null>(null);

  const {
    data: orders = [],
    isLoading,
    refetch,
  } = useOrdersForFinalizationList();

  const filteredOrders = useMemo(() => {
    if (!orders || !Array.isArray(orders)) return [];

    return orders.filter((order) => {
      switch (filter) {
        case 'delivery':
          return order.orderType === 'DELIVERY';
        case 'take_away':
          return order.orderType === 'TAKE_AWAY';
        case 'dine_in':
          return order.orderType === 'DINE_IN';
        default:
          return false;
      }
    });
  }, [orders, filter]);

  const orderCounts = useMemo(() => {
    if (!orders || !Array.isArray(orders)) {
      return {
        delivery: 0,
        take_away: 0,
        dine_in: 0,
      };
    }

    return orders.reduce(
      (counts, order) => {
        switch (order.orderType) {
          case 'DELIVERY':
            counts.delivery++;
            break;
          case 'TAKE_AWAY':
            counts.take_away++;
            break;
          case 'DINE_IN':
            counts.dine_in++;
            break;
        }
        return counts;
      },
      { delivery: 0, take_away: 0, dine_in: 0 },
    );
  }, [orders]);

  useEffect(() => {
    setSelectionState({
      selectedOrders: new Set(),
      totalAmount: 0,
    });
  }, [filter]);

  const handleToggleOrderSelection = useCallback(
    (orderId: string) => {
      if (!orders || !Array.isArray(orders)) return;

      const order = orders.find((o) => o.id === orderId);
      if (!order) return;

      setSelectionState((prevState) => {
        const newSelectedOrders = new Set(prevState.selectedOrders);
        let newTotalAmount = prevState.totalAmount;
        const orderTotal = order.total || 0;
        // Calcular pagos desde el array de payments
        const paid =
          order.payments?.reduce((sum, payment) => sum + payment.amount, 0) ||
          0;
        const pendingAmount = orderTotal - paid;

        if (newSelectedOrders.has(orderId)) {
          newSelectedOrders.delete(orderId);
          newTotalAmount -= pendingAmount;
        } else {
          newSelectedOrders.add(orderId);
          newTotalAmount += pendingAmount;
        }

        return {
          selectedOrders: newSelectedOrders,
          totalAmount: newTotalAmount,
        };
      });
    },
    [orders],
  );

  const ordersNotReady = useMemo(() => {
    if (selectionState.selectedOrders.size === 0) return [];

    const selectedOrdersList = Array.from(selectionState.selectedOrders)
      .map((id) => orders.find((o) => o.id === id))
      .filter(Boolean) as Order[];

    return selectedOrdersList.filter((order) => order.orderStatus !== 'READY');
  }, [selectionState.selectedOrders, orders]);

  const confirmationMessage = useMemo(() => {
    let message = `¿Desea finalizar ${selectionState.selectedOrders.size} ${
      selectionState.selectedOrders.size === 1 ? 'orden' : 'órdenes'
    }?\n\nTotal a cobrar: $${selectionState.totalAmount.toFixed(2)}`;

    if (ordersNotReady.length > 0) {
      message += `\n\n⚠️ ADVERTENCIA: ${ordersNotReady.length} ${
        ordersNotReady.length === 1 ? 'orden no está' : 'órdenes no están'
      } en estado "Listo"`;
    }

    return message;
  }, [selectionState, ordersNotReady]);

  const handleQuickFinalizeOrders = useCallback(() => {
    if (selectionState.selectedOrders.size === 0) return;
    setShowConfirmationModal(true);
  }, [selectionState.selectedOrders.size]);

  const handleConfirmFinalization = useCallback(async () => {
    setIsFinalizingOrders(true);
    try {
      await orderService.quickFinalizeMultipleOrders(
        Array.from(selectionState.selectedOrders),
      );

      showSnackbar({
        message: 'Órdenes finalizadas exitosamente',
        type: 'success',
      });

      setSelectionState({
        selectedOrders: new Set(),
        totalAmount: 0,
      });

      setShowConfirmationModal(false);
      refetch();
    } catch (error) {
      showSnackbar({
        message: 'Error al finalizar las órdenes',
        type: 'error',
      });
    } finally {
      setIsFinalizingOrders(false);
    }
  }, [selectionState.selectedOrders, showSnackbar, refetch]);

  const handleShowOrderDetails = useCallback((order: Order) => {
    setSelectedOrder(order);
    setSelectedOrderIdForDetails(order.id);
  }, []);

  const handlePrintFromList = useCallback(async (order: Order) => {
    setSelectedOrderForPrint(order);
    setShowPrintModal(true);
  }, []);

  const handlePrint = useCallback(
    async (printerId: string, ticketType: 'GENERAL' | 'BILLING') => {
      const orderToUse = selectedOrderForPrint;
      if (!orderToUse) return;

      try {
        await orderService.printTicket(orderToUse.id, {
          printerId,
          ticketType,
        });

        showSnackbar({
          message: 'Ticket impreso exitosamente',
          type: 'success',
        });

        await refetch();
        setSelectedOrderForPrint(null);
      } catch (error) {
        showSnackbar({
          message: 'Error al imprimir el ticket',
          type: 'error',
        });
      }
    },
    [selectedOrderForPrint, showSnackbar, refetch],
  );

  const renderOrderCard = useCallback(
    ({ item }: { item: Order }) => (
      <OrderSummaryCard
        item={{
          ...item,
          notes: item.notes || undefined,
          payments: item.payments
            ? item.payments
                .filter((p: any) => p && typeof p.amount === 'number')
                .map((p: any) => ({ amount: p.amount }))
            : undefined,
        }}
        onPress={() => handleShowOrderDetails(item)}
        showCreatedBy={true}
        getStatusColor={(status) => OrderStatusInfo.getColor(status, theme)}
        getStatusLabel={OrderStatusInfo.getLabel}
        renderActions={(orderItem) => (
          <View style={styles.actionsContainer}>
            {handlePrintFromList && (
              <TouchableOpacity
                style={styles.printContainer}
                onPress={() => handlePrintFromList(orderItem as Order)}
                activeOpacity={0.7}
              >
                <IconButton
                  icon="printer"
                  size={32}
                  style={styles.printButton}
                  disabled
                />
                {(((orderItem as any).ticketImpressions?.length ?? 0) > 0 ||
                  ((orderItem as any).ticketImpressionCount ?? 0) > 0) && (
                  <View style={styles.printCountBadge}>
                    <Text style={styles.printCountText}>
                      {(orderItem as any).ticketImpressions?.length ||
                        (orderItem as any).ticketImpressionCount ||
                        0}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            <Pressable
              style={styles.checkboxContainer}
              onPress={() => handleToggleOrderSelection(orderItem.id as string)}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <View
                style={[
                  styles.customCheckbox,
                  selectionState.selectedOrders.has(orderItem.id as string) && {
                    backgroundColor: theme.colors.primary,
                    borderColor: theme.colors.primary,
                  },
                  !selectionState.selectedOrders.has(
                    orderItem.id as string,
                  ) && [
                    styles.customCheckboxUnselected,
                    {
                      borderColor: theme.colors.onSurfaceVariant,
                    },
                  ],
                ]}
              >
                {selectionState.selectedOrders.has(orderItem.id as string) && (
                  <Icon
                    source="check"
                    size={responsive.isTablet ? 18 : 22}
                    color={theme.colors.onPrimary}
                  />
                )}
              </View>
            </Pressable>
          </View>
        )}
      />
    ),
    [
      selectionState.selectedOrders,
      handleToggleOrderSelection,
      handleShowOrderDetails,
      handlePrintFromList,
      theme,
      styles,
      responsive,
    ],
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text
          style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}
        >
          Cargando órdenes...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <Surface style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.filterContainer}>
            <Pressable
              style={[
                styles.filterButton,
                filter === 'delivery' && styles.filterButtonActive,
                {
                  backgroundColor:
                    filter === 'delivery'
                      ? theme.colors.primaryContainer
                      : theme.colors.surface,
                },
              ]}
              onPress={() => setFilter('delivery')}
            >
              <Icon
                source="moped"
                size={responsive.isTablet ? 22 : 26}
                color={
                  filter === 'delivery'
                    ? theme.colors.primary
                    : theme.colors.onSurfaceVariant
                }
              />
              {orderCounts.delivery > 0 && (
                <View
                  style={[
                    styles.countBadge,
                    {
                      backgroundColor:
                        filter === 'delivery'
                          ? theme.colors.error
                          : theme.colors.errorContainer,
                      borderColor:
                        filter === 'delivery'
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
                          filter === 'delivery'
                            ? theme.colors.onError
                            : theme.colors.onErrorContainer,
                      },
                    ]}
                  >
                    {orderCounts.delivery}
                  </Text>
                </View>
              )}
            </Pressable>
            <Pressable
              style={[
                styles.filterButton,
                filter === 'take_away' && styles.filterButtonActive,
                {
                  backgroundColor:
                    filter === 'take_away'
                      ? theme.colors.primaryContainer
                      : theme.colors.surface,
                },
              ]}
              onPress={() => setFilter('take_away')}
            >
              <Icon
                source="bag-personal"
                size={responsive.isTablet ? 22 : 26}
                color={
                  filter === 'take_away'
                    ? theme.colors.primary
                    : theme.colors.onSurfaceVariant
                }
              />
              {orderCounts.take_away > 0 && (
                <View
                  style={[
                    styles.countBadge,
                    {
                      backgroundColor:
                        filter === 'take_away'
                          ? theme.colors.error
                          : theme.colors.errorContainer,
                      borderColor:
                        filter === 'take_away'
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
                          filter === 'take_away'
                            ? theme.colors.onError
                            : theme.colors.onErrorContainer,
                      },
                    ]}
                  >
                    {orderCounts.take_away}
                  </Text>
                </View>
              )}
            </Pressable>
            <Pressable
              style={[
                styles.filterButton,
                filter === 'dine_in' && styles.filterButtonActive,
                {
                  backgroundColor:
                    filter === 'dine_in'
                      ? theme.colors.primaryContainer
                      : theme.colors.surface,
                },
              ]}
              onPress={() => setFilter('dine_in')}
            >
              <Icon
                source="silverware-fork-knife"
                size={responsive.isTablet ? 22 : 26}
                color={
                  filter === 'dine_in'
                    ? theme.colors.primary
                    : theme.colors.onSurfaceVariant
                }
              />
              {orderCounts.dine_in > 0 && (
                <View
                  style={[
                    styles.countBadge,
                    {
                      backgroundColor:
                        filter === 'dine_in'
                          ? theme.colors.error
                          : theme.colors.errorContainer,
                      borderColor:
                        filter === 'dine_in'
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
                          filter === 'dine_in'
                            ? theme.colors.onError
                            : theme.colors.onErrorContainer,
                      },
                    ]}
                  >
                    {orderCounts.dine_in}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
          <View style={styles.refreshButtonContainer}>
            <IconButton
              icon="refresh"
              size={responsive.isTablet ? 20 : 24}
              mode="contained"
              containerColor={theme.colors.surfaceVariant}
              iconColor={theme.colors.onSurfaceVariant}
              onPress={() => refetch()}
              style={styles.refreshButton}
            />
          </View>
        </View>
      </Surface>

      <View style={styles.content}>
        {filteredOrders.length === 0 ? (
          <EmptyState
            title="No hay órdenes para finalizar"
            message="Las órdenes aparecerán aquí cuando estén listas para finalizar"
            icon="clipboard-check-outline"
          />
        ) : (
          <FlashList
            data={filteredOrders}
            keyExtractor={(item) => item.id}
            renderItem={renderOrderCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => null}
            onRefresh={refetch}
            refreshing={isLoading}
            estimatedItemSize={150}
            removeClippedSubviews={true}
            extraData={selectionState}
          />
        )}
      </View>

      {selectionState.selectedOrders.size > 0 && (
        <Surface style={styles.floatingButton} elevation={4}>
          <Button
            mode="contained"
            onPress={handleQuickFinalizeOrders}
            style={styles.finalizeButton}
            labelStyle={styles.finalizeButtonLabel}
            disabled={isFinalizingOrders}
          >
            Finalizar ({selectionState.selectedOrders.size}) - $
            {(selectionState.totalAmount || 0).toFixed(2)}
          </Button>
        </Surface>
      )}

      <UnifiedOrderDetailsModal
        visible={selectedOrderIdForDetails !== null}
        onDismiss={() => {
          setSelectedOrderIdForDetails(null);
          setSelectedOrder(null);
        }}
        orderId={selectedOrderIdForDetails}
        orderNumber={selectedOrder?.shiftOrderNumber}
        dataSource="finalization"
        showHistoryButton={false}
      />

      <PrintTicketModal
        visible={showPrintModal}
        onDismiss={() => {
          setShowPrintModal(false);
          setSelectedOrderForPrint(null);
        }}
        order={selectedOrderForPrint}
        onPrint={handlePrint}
      />

      <ConfirmationModal
        visible={showConfirmationModal}
        title="Finalizar Órdenes"
        message={confirmationMessage}
        onConfirm={handleConfirmFinalization}
        onCancel={() => setShowConfirmationModal(false)}
        onDismiss={() => setShowConfirmationModal(false)}
        confirmText={isFinalizingOrders ? 'Finalizando...' : 'Finalizar'}
        confirmButtonColor={
          ordersNotReady.length > 0 ? theme.colors.error : theme.colors.primary
        }
      />
    </SafeAreaView>
  );
};

const createStyles = (responsive: ReturnType<typeof useResponsive>) =>
  StyleSheet.create({
    container: {
      flex: 1,
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
    refreshButtonContainer: {
      paddingHorizontal: responsive.isTablet ? 6 : 8,
    },
    refreshButton: {
      margin: 0,
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
      top: responsive.isTablet ? 4 : 6,
      right: responsive.isTablet ? 4 : 6,
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
    floatingButton: {
      position: 'absolute',
      bottom: responsive.isTablet ? 12 : 16,
      left: responsive.isTablet ? 12 : 16,
      right: responsive.isTablet ? 12 : 16,
      borderRadius: responsive.isTablet ? 12 : 16,
      padding: responsive.isTablet ? 6 : 8,
      elevation: 8,
    },
    finalizeButton: {
      borderRadius: responsive.isTablet ? 10 : 12,
      paddingVertical: responsive.isTablet ? 3 : 4,
    },
    finalizeButtonLabel: {
      fontSize: responsive.isTablet ? 14 : 16,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    content: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: responsive.isTablet ? 8 : 12,
      fontSize: responsive.isTablet ? 12 : 14,
    },
    listContent: {
      padding: responsive.isTablet ? 6 : 8,
      paddingBottom: responsive.isTablet ? 80 : 100,
    },
    actionsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 4,
    },
    printContainer: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    printButton: {
      margin: -4,
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
    checkboxContainer: {
      padding: 12,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    customCheckbox: {
      width: responsive.isTablet ? 24 : 28,
      height: responsive.isTablet ? 24 : 28,
      borderRadius: 6,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    customCheckboxSelected: {
      backgroundColor: 'transparent', // Se sobrescribe dinámicamente
    },
    customCheckboxUnselected: {
      backgroundColor: 'transparent',
    },
  });
