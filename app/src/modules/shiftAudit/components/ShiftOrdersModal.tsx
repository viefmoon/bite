import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  RefreshControl,
  FlatList,
} from 'react-native';
import {
  Portal,
  Appbar,
  Searchbar,
  ActivityIndicator,
} from 'react-native-paper';
import OrderSummaryCard from '@/modules/shared/components/OrderSummaryCard';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import { useShiftOrders } from '../hooks/useShiftOrders';
import EmptyState from '@/app/components/common/EmptyState';
import type { Order } from '@/app/schemas/domain/order.schema';
import { UnifiedOrderDetailsModal } from '@/modules/shared/components/UnifiedOrderDetailsModal';

interface ShiftOrdersModalProps {
  visible: boolean;
  onClose: () => void;
  shiftId: string;
}

export function ShiftOrdersModal({
  visible,
  onClose,
  shiftId,
}: ShiftOrdersModalProps) {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    data: orders,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useShiftOrders(shiftId);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleReceiptPress = (order: Order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  // Filtrar órdenes basado en búsqueda
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    if (!searchQuery.trim()) return orders;

    const search = searchQuery.toLowerCase().trim();
    return orders.filter((order) => {
      // Buscar por número de orden
      if (order.shiftOrderNumber?.toString().includes(search)) return true;

      // Buscar en información de entrega
      if (order.deliveryInfo) {
        // Campos alternativos que pueden venir del backend
        if (order.deliveryInfo.recipientName?.toLowerCase().includes(search))
          return true;
        if (order.deliveryInfo.recipientPhone?.includes(search)) return true;
        if (order.deliveryInfo.fullAddress?.toLowerCase().includes(search))
          return true;

        // Campos adicionales de dirección
        if (order.deliveryInfo.street?.toLowerCase().includes(search))
          return true;
        if (order.deliveryInfo.neighborhood?.toLowerCase().includes(search))
          return true;
        if (order.deliveryInfo.city?.toLowerCase().includes(search))
          return true;
      }

      // Buscar en mesa/área para órdenes locales
      if (order.table) {
        if (order.table.name?.toLowerCase().includes(search)) return true;
        if (order.table.area?.name?.toLowerCase().includes(search)) return true;
      }

      // Buscar en notas
      if (order.notes?.toLowerCase().includes(search)) return true;

      return false;
    });
  }, [orders, searchQuery]);

  // Función específica para el color de estado en recibos
  const getReceiptStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return theme.colors.primary;
      case 'CANCELLED':
        return theme.colors.error;
      case 'DELIVERED':
        return '#9333EA'; // Morado
      case 'IN_PROGRESS':
        return '#FF9800'; // Naranja
      case 'READY':
        return '#4CAF50'; // Verde
      case 'PENDING':
        return '#2196F3'; // Azul
      default:
        return theme.colors.onSurfaceDisabled;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Completada';
      case 'CANCELLED':
        return 'Cancelada';
      case 'DELIVERED':
        return 'Entregada';
      case 'IN_PROGRESS':
        return 'En progreso';
      case 'READY':
        return 'Lista';
      case 'PENDING':
        return 'Pendiente';
      default:
        return status;
    }
  };

  // Renderizar item de recibo usando el componente compartido
  const renderReceiptItem = ({ item }: { item: Order }) => {
    // Convertir Order a OrderItemType para compatibilidad
    const orderItem = {
      id: item.id,
      shiftOrderNumber: item.shiftOrderNumber,
      orderType: item.orderType as any,
      orderStatus: item.orderStatus as string,
      createdAt: item.createdAt,
      total: item.total,
      table: item.table as any,
      deliveryInfo: item.deliveryInfo as any,
      notes: item.notes || undefined,
      payments: item.payments as any,
      isFromWhatsApp: item.isFromWhatsApp,
      createdBy: item.user
        ? {
            username: item.user.username,
            firstName: item.user.firstName,
            lastName: item.user.lastName,
          }
        : undefined,
    };

    return (
      <OrderSummaryCard
        item={orderItem}
        onPress={() => handleReceiptPress(item)}
        getStatusColor={getReceiptStatusColor}
        getStatusLabel={getStatusLabel}
        showCreatedBy={true}
      />
    );
  };

  // Renderizar lista vacía
  const renderEmptyComponent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    return (
      <EmptyState
        icon="receipt"
        title="No hay órdenes"
        message={
          searchQuery
            ? 'No se encontraron órdenes con los criterios de búsqueda'
            : 'Este turno no tiene órdenes registradas'
        }
      />
    );
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onRequestClose={onClose}
        animationType="slide"
        presentationStyle="formSheet"
      >
        <View style={styles.container}>
          <Appbar.Header style={styles.header}>
            <Appbar.BackAction onPress={onClose} />
            <Appbar.Content title="Órdenes del Turno" />
            <Appbar.Action
              icon="refresh"
              onPress={handleRefresh}
              disabled={isLoading || isRefreshing}
            />
          </Appbar.Header>

          {/* Búsqueda */}
          <View style={styles.searchContainer}>
            <Searchbar
              placeholder="Buscar por nombre, teléfono o dirección..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchbar}
              elevation={0}
            />
          </View>

          {/* Lista de órdenes */}
          {error ? (
            <EmptyState
              icon="alert-circle"
              title="Error al cargar"
              message={error.message || 'No se pudieron cargar las órdenes'}
              actionLabel="Reintentar"
              onAction={refetch}
            />
          ) : (
            <FlatList
              data={filteredOrders}
              renderItem={renderReceiptItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={isRefetching}
                  onRefresh={refetch}
                  colors={[theme.colors.primary]}
                />
              }
              ListEmptyComponent={renderEmptyComponent}
            />
          )}
        </View>
      </Modal>

      <UnifiedOrderDetailsModal
        visible={showDetails}
        onDismiss={() => {
          setShowDetails(false);
          setSelectedOrder(null);
        }}
        orderId={selectedOrder?.id || null}
        orderNumber={selectedOrder?.shiftOrderNumber}
        dataSource="shiftAudit"
        showHistoryButton={true}
        shiftId={shiftId}
      />
    </Portal>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      backgroundColor: theme.colors.surface,
      elevation: 2,
    },
    searchContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.surface,
    },
    searchbar: {
      backgroundColor: theme.colors.background,
      elevation: 0,
    },
    listContent: {
      padding: theme.spacing.s,
      paddingBottom: theme.spacing.l * 2,
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
      paddingRight: 12,
      flexShrink: 1,
    },
    rightContainer: {
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      minWidth: 120,
      gap: 8,
      flexShrink: 0,
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
    orderTime: {
      fontSize: 16,
      fontWeight: '600',
    },
    timeAndPaymentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 0,
    },
    statusChip: {
      minHeight: 24,
      alignSelf: 'flex-end',
      paddingVertical: 2,
    },
    statusChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: 'white',
      lineHeight: 14,
      marginVertical: 0,
      paddingVertical: 0,
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
    },
    inlinePreparationText: {
      fontSize: 10,
      fontWeight: '500',
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
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
    createdByText: {
      fontSize: 10,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 4,
      textAlign: 'right',
    },
  });
