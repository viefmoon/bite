import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
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
import { OrderCard } from '../components/OrderCard';
import { OrderDetailsModal } from '../components/OrderDetailsModal';
import { PrintTicketModal } from '@/modules/shared/components/PrintTicketModal';
import {
  useOrdersForFinalizationList,
  useOrderForFinalizationDetail,
} from '../hooks/useOrderFinalizationQueries';
import {
  OrderFinalizationFilter,
  OrderSelectionState,
  OrderForFinalizationList,
} from '../types/orderFinalization.types';
import EmptyState from '@/app/components/common/EmptyState';
import ConfirmationModal from '@/app/components/common/ConfirmationModal';
import { useAppTheme } from '@/app/styles/theme';
import { useSnackbarStore } from '@/app/store/snackbarStore';
import { orderFinalizationService } from '../services/orderFinalizationService';

export const OrderFinalizationScreen: React.FC = () => {
  const theme = useAppTheme();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);
  const [filter, setFilter] = useState<OrderFinalizationFilter>('delivery');
  const [selectionState, setSelectionState] = useState<OrderSelectionState>({
    selectedOrders: new Set(),
    totalAmount: 0,
  });
  const [selectedOrderIdForDetails, setSelectedOrderIdForDetails] = useState<
    string | null
  >(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [isFinalizingOrders, setIsFinalizingOrders] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedOrderForPrint, setSelectedOrderForPrint] =
    useState<OrderForFinalizationList | null>(null);

  const {
    data: orders = [],
    isLoading,
    refetch,
  } = useOrdersForFinalizationList();

  const { data: selectedOrderDetails, isLoading: isLoadingDetails } =
    useOrderForFinalizationDetail(selectedOrderIdForDetails);

  const { data: orderForPrint } = useOrderForFinalizationDetail(
    selectedOrderForPrint?.id || null,
  );

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
        const orderTotal =
          typeof order.total === 'string'
            ? parseFloat(order.total)
            : order.total;
        const paymentsSummary = order.paymentsSummary;
        const paid = paymentsSummary?.totalPaid || 0;
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
      .filter(Boolean) as OrderForFinalizationList[];

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
      await orderFinalizationService.quickFinalizeMultipleOrders(
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

  const handleShowOrderDetails = useCallback(
    (order: OrderForFinalizationList) => {
      setSelectedOrderIdForDetails(null);
      setTimeout(() => {
        setSelectedOrderIdForDetails(order.id);
      }, 50);
    },
    [],
  );

  const handlePrintPress = useCallback(() => {
    setShowPrintModal(true);
  }, []);

  const handlePrintFromList = useCallback(
    async (order: OrderForFinalizationList) => {
      setSelectedOrderForPrint(order);
      setShowPrintModal(true);
    },
    [],
  );

  const handlePrint = useCallback(
    async (printerId: string, ticketType: 'GENERAL' | 'BILLING') => {
      const orderToUse = orderForPrint || selectedOrderDetails;
      if (!orderToUse) return;

      try {
        await orderFinalizationService.printTicket(orderToUse.id, {
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
    [orderForPrint, selectedOrderDetails, showSnackbar, refetch],
  );

  const renderOrderCard = useCallback(
    ({ item }) => (
      <OrderCard
        order={item}
        isSelected={selectionState.selectedOrders.has(item.id)}
        onToggleSelection={handleToggleOrderSelection}
        onShowDetails={handleShowOrderDetails}
        onPrintPress={handlePrintFromList}
      />
    ),
    [
      selectionState.selectedOrders,
      handleToggleOrderSelection,
      handleShowOrderDetails,
      handlePrintFromList,
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
                size={26}
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
                size={26}
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
                size={26}
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
              size={24}
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
            description="Las órdenes aparecerán aquí cuando estén listas para finalizar"
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
          />
        )}
      </View>

      {selectionState.selectedOrders.size > 0 && (
        <Surface style={styles.floatingButton} elevation={8}>
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

      <OrderDetailsModal
        visible={selectedOrderIdForDetails !== null}
        onDismiss={() => setSelectedOrderIdForDetails(null)}
        order={selectedOrderDetails}
        isLoading={isLoadingDetails}
        onPrintPress={handlePrintPress}
      />

      <PrintTicketModal
        visible={showPrintModal}
        onDismiss={() => {
          setShowPrintModal(false);
          setSelectedOrderForPrint(null);
        }}
        order={orderForPrint || selectedOrderDetails}
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

const styles = StyleSheet.create({
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
    paddingHorizontal: 8,
  },
  refreshButton: {
    margin: 0,
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
  floatingButton: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    borderRadius: 16,
    padding: 8,
    elevation: 8,
  },
  finalizeButton: {
    borderRadius: 12,
    paddingVertical: 4,
  },
  finalizeButtonLabel: {
    fontSize: 16,
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
    marginTop: 12,
    fontSize: 14,
  },
  listContent: {
    padding: 8,
    paddingBottom: 100,
    flexGrow: 1,
  },
});
