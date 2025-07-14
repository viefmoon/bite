import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Pressable } from 'react-native';
import {
  Surface,
  Text,
  SegmentedButtons,
  Button,
  ActivityIndicator,
  Portal,
  Dialog,
  TextInput,
  RadioButton,
  IconButton,
  Icon,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OrderCard } from '../components/OrderCard';
import { OrderDetailsModal } from '../components/OrderDetailsModal';
import {
  useOrdersForFinalizationList,
  useOrderForFinalizationDetail,
  useFinalizeOrders,
} from '../hooks/useOrderFinalizationQueries';
import {
  OrderFinalizationFilter,
  OrderSelectionState,
  OrderForFinalization,
  OrderForFinalizationList,
} from '../types/orderFinalization.types';
import EmptyState from '@/app/components/common/EmptyState';
import { useAppTheme } from '@/app/styles/theme';

export const OrderFinalizationScreen: React.FC = () => {
  const theme = useAppTheme();
  const [filter, setFilter] = useState<OrderFinalizationFilter>('delivery');
  const [selectionState, setSelectionState] = useState<OrderSelectionState>({
    selectedOrders: new Set(),
    totalAmount: 0,
  });
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [selectedOrderIdForDetails, setSelectedOrderIdForDetails] =
    useState<string | null>(null);

  const {
    data: orders = [],
    isLoading,
    refetch,
    error,
  } = useOrdersForFinalizationList();
  
  const { data: selectedOrderDetails, isLoading: isLoadingDetails } = useOrderForFinalizationDetail(selectedOrderIdForDetails);

  const finalizeOrdersMutation = useFinalizeOrders();

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
      { delivery: 0, take_away: 0, dine_in: 0 }
    );
  }, [orders]);

  // Limpiar selección cuando cambia el filtro
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

        if (newSelectedOrders.has(orderId)) {
          newSelectedOrders.delete(orderId);
          newTotalAmount -= orderTotal;
        } else {
          newSelectedOrders.add(orderId);
          newTotalAmount += orderTotal;
        }

        return {
          selectedOrders: newSelectedOrders,
          totalAmount: newTotalAmount,
        };
      });
    },
    [orders],
  );

  const handleFinalizeOrders = useCallback(async () => {
    if (selectionState.selectedOrders.size === 0) return;

    await finalizeOrdersMutation.mutateAsync({
      orderIds: Array.from(selectionState.selectedOrders),
      paymentMethod,
      notes: notes.trim() || undefined,
    });

    // Limpiar selección
    setSelectionState({
      selectedOrders: new Set(),
      totalAmount: 0,
    });
    setShowFinalizeDialog(false);
    setNotes('');
    setPaymentMethod('cash');
  }, [selectionState, paymentMethod, notes, finalizeOrdersMutation]);

  const handleShowOrderDetails = useCallback((order: OrderForFinalizationList) => {
    setSelectedOrderIdForDetails(null);
    setTimeout(() => {
      setSelectedOrderIdForDetails(order.id);
    }, 50);
  }, []);

  const renderOrderCard = useCallback(
    ({ item }) => (
      <OrderCard
        order={item}
        isSelected={selectionState.selectedOrders.has(item.id)}
        onToggleSelection={handleToggleOrderSelection}
        onShowDetails={handleShowOrderDetails}
      />
    ),
    [
      selectionState.selectedOrders,
      handleToggleOrderSelection,
      handleShowOrderDetails,
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
                { backgroundColor: filter === 'delivery' ? theme.colors.primaryContainer : theme.colors.surface },
              ]}
              onPress={() => setFilter('delivery')}
            >
              <Icon
                source="moped"
                size={32}
                color={filter === 'delivery' ? theme.colors.primary : theme.colors.onSurfaceVariant}
              />
              {orderCounts.delivery > 0 && (
                <View 
                  style={[
                    styles.countBadge,
                    { 
                      backgroundColor: filter === 'delivery' ? theme.colors.error : theme.colors.errorContainer,
                      borderColor: filter === 'delivery' ? theme.colors.error : theme.colors.outline,
                    }
                  ]}
                >
                  <Text style={[
                    styles.countBadgeText,
                    { color: filter === 'delivery' ? theme.colors.onError : theme.colors.onErrorContainer }
                  ]}>{orderCounts.delivery}</Text>
                </View>
              )}
            </Pressable>
            <Pressable
              style={[
                styles.filterButton,
                filter === 'take_away' && styles.filterButtonActive,
                { backgroundColor: filter === 'take_away' ? theme.colors.primaryContainer : theme.colors.surface },
              ]}
              onPress={() => setFilter('take_away')}
            >
              <Icon
                source="bag-personal"
                size={32}
                color={filter === 'take_away' ? theme.colors.primary : theme.colors.onSurfaceVariant}
              />
              {orderCounts.take_away > 0 && (
                <View 
                  style={[
                    styles.countBadge,
                    { 
                      backgroundColor: filter === 'take_away' ? theme.colors.error : theme.colors.errorContainer,
                      borderColor: filter === 'take_away' ? theme.colors.error : theme.colors.outline,
                    }
                  ]}
                >
                  <Text style={[
                    styles.countBadgeText,
                    { color: filter === 'take_away' ? theme.colors.onError : theme.colors.onErrorContainer }
                  ]}>{orderCounts.take_away}</Text>
                </View>
              )}
            </Pressable>
            <Pressable
              style={[
                styles.filterButton,
                filter === 'dine_in' && styles.filterButtonActive,
                { backgroundColor: filter === 'dine_in' ? theme.colors.primaryContainer : theme.colors.surface },
              ]}
              onPress={() => setFilter('dine_in')}
            >
              <Icon
                source="silverware-fork-knife"
                size={32}
                color={filter === 'dine_in' ? theme.colors.primary : theme.colors.onSurfaceVariant}
              />
              {orderCounts.dine_in > 0 && (
                <View 
                  style={[
                    styles.countBadge,
                    { 
                      backgroundColor: filter === 'dine_in' ? theme.colors.error : theme.colors.errorContainer,
                      borderColor: filter === 'dine_in' ? theme.colors.error : theme.colors.outline,
                    }
                  ]}
                >
                  <Text style={[
                    styles.countBadgeText,
                    { color: filter === 'dine_in' ? theme.colors.onError : theme.colors.onErrorContainer }
                  ]}>{orderCounts.dine_in}</Text>
                </View>
              )}
            </Pressable>
          </View>
          <IconButton
            icon="refresh"
            mode="contained-tonal"
            size={28}
            onPress={() => refetch()}
            loading={isLoading}
            style={styles.refreshButton}
            iconColor={theme.colors.primary}
          />
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
          <FlatList
            data={filteredOrders}
            keyExtractor={(item) => item.id}
            renderItem={renderOrderCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => null}
            onRefresh={refetch}
            refreshing={isLoading}
          />
        )}
      </View>

      {/* Botón flotante para finalizar */}
      {selectionState.selectedOrders.size > 0 && (
        <Surface style={styles.floatingButton} elevation={8}>
          <Button
            mode="contained"
            onPress={() => setShowFinalizeDialog(true)}
            loading={finalizeOrdersMutation.isPending}
            style={styles.finalizeButton}
            labelStyle={styles.finalizeButtonLabel}
          >
            Finalizar ({selectionState.selectedOrders.size}) - $
            {(selectionState.totalAmount || 0).toFixed(2)}
          </Button>
        </Surface>
      )}

      {/* Dialog de finalización */}
      <Portal>
        <Dialog
          visible={showFinalizeDialog}
          onDismiss={() => setShowFinalizeDialog(false)}
        >
          <Dialog.Title>Finalizar Órdenes</Dialog.Title>
          <Dialog.Content>
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 16,
                  marginBottom: 8,
                  color: theme.colors.onSurface,
                }}
              >
                ¿Finalizar {selectionState.selectedOrders.size}{' '}
                {selectionState.selectedOrders.size === 1 ? 'orden' : 'órdenes'}
                ?
              </Text>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: theme.colors.primary,
                }}
              >
                Total: ${(selectionState.totalAmount || 0).toFixed(2)}
              </Text>
            </View>

            <Text
              style={{
                marginBottom: 12,
                fontWeight: '600',
                fontSize: 16,
                color: theme.colors.onSurface,
              }}
            >
              Método de pago:
            </Text>
            <RadioButton.Group
              onValueChange={setPaymentMethod}
              value={paymentMethod}
            >
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 8,
                  marginBottom: 8,
                  borderRadius: 8,
                  backgroundColor:
                    paymentMethod === 'cash'
                      ? theme.colors.primaryContainer
                      : 'transparent',
                }}
                onPress={() => setPaymentMethod('cash')}
              >
                <RadioButton value="cash" />
                <Text
                  style={{ marginLeft: 8, fontSize: 16, fontWeight: '500' }}
                >
                  💵 Efectivo
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 8,
                  marginBottom: 8,
                  borderRadius: 8,
                  backgroundColor:
                    paymentMethod === 'card'
                      ? theme.colors.primaryContainer
                      : 'transparent',
                }}
                onPress={() => setPaymentMethod('card')}
              >
                <RadioButton value="card" />
                <Text
                  style={{ marginLeft: 8, fontSize: 16, fontWeight: '500' }}
                >
                  💳 Tarjeta
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 8,
                  marginBottom: 16,
                  borderRadius: 8,
                  backgroundColor:
                    paymentMethod === 'transfer'
                      ? theme.colors.primaryContainer
                      : 'transparent',
                }}
                onPress={() => setPaymentMethod('transfer')}
              >
                <RadioButton value="transfer" />
                <Text
                  style={{ marginLeft: 8, fontSize: 16, fontWeight: '500' }}
                >
                  📱 Transferencia
                </Text>
              </TouchableOpacity>
            </RadioButton.Group>

            <TextInput
              label="Notas (opcional)"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowFinalizeDialog(false)}>
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleFinalizeOrders}
              loading={finalizeOrdersMutation.isPending}
            >
              Confirmar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Modal de detalles de orden */}
      <OrderDetailsModal
        visible={selectedOrderIdForDetails !== null}
        onDismiss={() => setSelectedOrderIdForDetails(null)}
        order={selectedOrderDetails}
        isLoading={isLoadingDetails}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'transparent',
    elevation: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 2,
  },
  filterButton: {
    flex: 1,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 0,
    elevation: 1,
    position: 'relative',
  },
  filterButtonActive: {
    elevation: 3,
  },
  refreshButton: {
    margin: 0,
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
    paddingBottom: 100, // Espacio para el botón flotante
    flexGrow: 1,
  },
});
