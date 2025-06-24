import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
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
  IconButton,} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OrderCard } from '../components/OrderCard';
import { OrderDetailsModal } from '../components/OrderDetailsModal';
import {
  useOrdersForFinalization,
  useFinalizeOrders,
} from '../hooks/useOrderFinalizationQueries';
import {
  OrderFinalizationFilter,
  OrderSelectionState,
  OrderForFinalization,
} from '../types/orderFinalization.types';
import EmptyState from '@/app/components/common/EmptyState';
import { useAppTheme } from '@/app/styles/theme';

export const OrderFinalizationScreen: React.FC = () => {
  const theme = useAppTheme();
  const [filter, setFilter] = useState<OrderFinalizationFilter>('takeout');
  const [selectionState, setSelectionState] = useState<OrderSelectionState>({
    selectedOrders: new Set(),
    totalAmount: 0,
  });
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [selectedOrderForDetails, setSelectedOrderForDetails] =
    useState<OrderForFinalization | null>(null);

  const {
    data: orders = [],
    isLoading,
    refetch,
    error,
  } = useOrdersForFinalization();

  // Debug removido - la funcionalidad está funcionando correctamente

  const finalizeOrdersMutation = useFinalizeOrders();

  // Filtrar órdenes según el filtro seleccionado
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (filter === 'takeout')
        return order.orderType === 'TAKEOUT' || order.orderType === 'DELIVERY';
      return order.orderType === 'DINE_IN';
    });
  }, [orders, filter]);

  // Limpiar selección cuando cambia el filtro
  useEffect(() => {
    setSelectionState({
      selectedOrders: new Set(),
      totalAmount: 0,
    });
  }, [filter]);

  // Ya no necesitamos agrupar porque filtramos desde el inicio

  const handleToggleOrderSelection = useCallback(
    (orderId: string) => {
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

  const handleShowOrderDetails = useCallback((order: OrderForFinalization) => {
    setSelectedOrderForDetails(order);
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
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerContent}>
          <SegmentedButtons
            value={filter}
            onValueChange={setFilter as any}
            buttons={[
              { value: 'takeout', label: 'Para llevar', icon: 'bag-personal' },
              {
                value: 'dine_in',
                label: 'Mesa',
                icon: 'silverware-fork-knife',
              },
            ]}
            style={styles.segmentedButtons}
          />
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
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
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
            <Text style={{ marginBottom: 16 }}>
              ¿Finalizar {selectionState.selectedOrders.size}{' '}
              {selectionState.selectedOrders.size === 1 ? 'orden' : 'órdenes'}{' '}
              por un total de ${(selectionState.totalAmount || 0).toFixed(2)}?
            </Text>

            <Text style={{ marginBottom: 8, fontWeight: '600' }}>
              Método de pago:
            </Text>
            <RadioButton.Group
              onValueChange={setPaymentMethod}
              value={paymentMethod}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <RadioButton value="cash" />
                <Text>Efectivo</Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <RadioButton value="card" />
                <Text>Tarjeta</Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <RadioButton value="transfer" />
                <Text>Transferencia</Text>
              </View>
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
        visible={selectedOrderForDetails !== null}
        onDismiss={() => setSelectedOrderForDetails(null)}
        order={selectedOrderForDetails}
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
    paddingVertical: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  segmentedButtons: {
    flex: 1,
  },
  refreshButton: {
    margin: 0,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    borderRadius: 12,
    padding: 8,
  },
  finalizeButton: {
    borderRadius: 8,
  },
  finalizeButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
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
    paddingVertical: 8,
    paddingBottom: 80, // Espacio para el botón flotante
  },
});
