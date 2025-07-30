import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  Searchbar,
  Chip,
  Surface,
  ActivityIndicator,
  Menu,
  IconButton,
  Divider,
  Badge,
} from 'react-native-paper';
import OrderSummaryCard from '@/modules/shared/components/OrderSummaryCard';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import { useReceipts, useRecoverOrder } from '../hooks/useReceiptsQueries';
import type { Order } from '@/app/schemas/domain/order.schema';
import { orderService } from '@/app/services/orderService';
import { useRefreshModuleOnFocus } from '@/app/hooks/useRefreshOnFocus';
import EmptyState from '@/app/components/common/EmptyState';
import { UnifiedOrderDetailsModal } from '@/modules/shared/components/UnifiedOrderDetailsModal';
import ConfirmationModal from '@/app/components/common/ConfirmationModal';
import { format } from 'date-fns';
import { DatePickerModal } from 'react-native-paper-dates';

type StatusFilter = 'all' | 'COMPLETED' | 'CANCELLED';

export const ReceiptsScreen: React.FC = () => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const [selectedReceipt, setSelectedReceipt] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [orderToRecover, setOrderToRecover] = useState<Order | null>(null);
  const [showRecoverConfirm, setShowRecoverConfirm] = useState(false);

  const recoverOrderMutation = useRecoverOrder();

  const filters = useMemo(() => {
    const baseFilters: {
      startDate?: string;
      endDate?: string;
    } = {};

    if (startDate) {
      baseFilters.startDate = startDate.toISOString();
    }

    if (endDate) {
      baseFilters.endDate = endDate.toISOString();
    }

    return baseFilters;
  }, [startDate, endDate]);

  const {
    data: allReceipts,
    isLoading,
    refetch,
    isRefetching,
  } = useReceipts(filters);

  useRefreshModuleOnFocus('receipts');

  const receipts = useMemo(() => {
    if (!allReceipts || !Array.isArray(allReceipts)) return [];

    let filtered = [...allReceipts];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(
        (receipt) => receipt.orderStatus === statusFilter,
      );
    }

    if (searchQuery.trim()) {
      const search = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((receipt) => {
        if (receipt.shiftOrderNumber.toString().includes(search)) return true;

        if (receipt.deliveryInfo) {
          const { recipientName, recipientPhone, fullAddress } =
            receipt.deliveryInfo;
          if (recipientName?.toLowerCase().includes(search)) return true;
          if (recipientPhone?.includes(search)) return true;
          if (fullAddress?.toLowerCase().includes(search)) return true;
        }

        if (receipt.notes?.toLowerCase().includes(search)) return true;

        return false;
      });
    }

    return filtered;
  }, [allReceipts, statusFilter, searchQuery]);

  const handleReceiptPress = useCallback((receipt: Order) => {
    setSelectedReceipt(receipt);
    setShowDetailModal(true);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setStartDate(undefined);
    setEndDate(undefined);
  }, []);

  const handleRecoverPress = useCallback((receipt: Order) => {
    orderService
      .getOrderById(receipt.id)
      .then((fullOrder) => {
        setOrderToRecover(fullOrder);
        setShowRecoverConfirm(true);
      })
      .catch((error) => {
        console.error('Error al obtener detalles de la orden:', error);
      });
  }, []);

  const handleConfirmRecover = useCallback(async () => {
    if (!orderToRecover) return;

    try {
      await recoverOrderMutation.mutateAsync(orderToRecover.id);
      setShowRecoverConfirm(false);
      setOrderToRecover(null);
      // Refrescar la lista después de recuperar la orden
      refetch();
    } catch (error) {
      console.error('Error al recuperar la orden:', error);
      setShowRecoverConfirm(false);
      setOrderToRecover(null);
    }
  }, [orderToRecover, recoverOrderMutation, refetch]);

  const getReceiptStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return theme.colors.primary;
      case 'CANCELLED':
        return theme.colors.error;
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
      default:
        return status;
    }
  };

  const hasActiveFilters = statusFilter !== 'all' || startDate || endDate;

  const renderReceiptItem = ({ item }: { item: Order }) => (
    <OrderSummaryCard
      item={{
        ...item,
        notes: item.notes || undefined,
        payments: item.payments || undefined,
        shiftOrderNumber: item.shiftOrderNumber || undefined,
      }}
      onPress={() => handleReceiptPress(item)}
      renderActions={(_orderItem) => (
        <TouchableOpacity
          style={styles.restoreContainer}
          onPress={() => handleRecoverPress(item)}
          activeOpacity={0.7}
        >
          <Surface style={styles.restoreButtonSurface} elevation={2}>
            <IconButton
              icon="restore"
              size={36}
              iconColor={theme.colors.primary}
              style={styles.restoreButton}
            />
          </Surface>
        </TouchableOpacity>
      )}
      getStatusColor={getReceiptStatusColor}
      getStatusLabel={getStatusLabel}
      showCreatedBy={true}
    />
  );

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
        title="No hay recibos"
        message={
          hasActiveFilters
            ? 'No se encontraron recibos con los filtros seleccionados'
            : 'Los recibos de órdenes completadas o canceladas aparecerán aquí'
        }
        actionLabel={hasActiveFilters ? 'Limpiar filtros' : undefined}
        onAction={hasActiveFilters ? handleClearFilters : undefined}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.header} elevation={2}>
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Buscar por nombre, teléfono o dirección..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
            elevation={0}
          />
          <View style={styles.filterButton}>
            <Menu
              visible={showFilterMenu}
              onDismiss={() => setShowFilterMenu(false)}
              anchor={
                <IconButton
                  icon="filter-variant"
                  onPress={() => setShowFilterMenu(true)}
                  style={[
                    styles.filterIconButton,
                    hasActiveFilters && styles.filterIconButtonActive,
                  ]}
                />
              }
            >
              <Menu.Item
                title="Todos los estados"
                onPress={() => {
                  setStatusFilter('all');
                  setShowFilterMenu(false);
                }}
                leadingIcon={statusFilter === 'all' ? 'check' : undefined}
              />
              <Menu.Item
                title="Completadas"
                onPress={() => {
                  setStatusFilter('COMPLETED');
                  setShowFilterMenu(false);
                }}
                leadingIcon={statusFilter === 'COMPLETED' ? 'check' : undefined}
              />
              <Menu.Item
                title="Canceladas"
                onPress={() => {
                  setStatusFilter('CANCELLED');
                  setShowFilterMenu(false);
                }}
                leadingIcon={statusFilter === 'CANCELLED' ? 'check' : undefined}
              />
              <Divider />
              <Menu.Item
                title={
                  startDate && endDate
                    ? `${format(startDate, 'd/M/yyyy')} - ${format(endDate, 'd/M/yyyy')}`
                    : 'Seleccionar rango de fechas'
                }
                onPress={() => {
                  setShowDateRangePicker(true);
                  setShowFilterMenu(false);
                }}
                leadingIcon="calendar-range"
              />
              {hasActiveFilters && (
                <>
                  <Divider />
                  <Menu.Item
                    title="Limpiar filtros"
                    onPress={() => {
                      handleClearFilters();
                      setShowFilterMenu(false);
                    }}
                    leadingIcon="filter-remove"
                  />
                </>
              )}
            </Menu>
            {hasActiveFilters && <Badge size={8} style={styles.filterBadge} />}
          </View>
        </View>

        {hasActiveFilters && (
          <View style={styles.activeFilters}>
            {statusFilter !== 'all' && (
              <Chip
                mode="outlined"
                compact
                onClose={() => setStatusFilter('all')}
                style={styles.filterChip}
              >
                {statusFilter === 'COMPLETED' ? 'Completadas' : 'Canceladas'}
              </Chip>
            )}
            {startDate && (
              <Chip
                mode="outlined"
                compact
                onClose={() => setStartDate(undefined)}
                style={styles.filterChip}
              >
                Desde: {format(startDate, 'd/M')}
              </Chip>
            )}
            {endDate && (
              <Chip
                mode="outlined"
                compact
                onClose={() => setEndDate(undefined)}
                style={styles.filterChip}
              >
                Hasta: {format(endDate, 'd/M')}
              </Chip>
            )}
          </View>
        )}
      </Surface>

      <FlatList
        data={receipts}
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

      <UnifiedOrderDetailsModal
        visible={showDetailModal}
        onDismiss={() => {
          setShowDetailModal(false);
          setSelectedReceipt(null);
        }}
        orderId={selectedReceipt?.id || null}
        orderNumber={selectedReceipt?.shiftOrderNumber}
        dataSource="receipts"
        showHistoryButton={true}
      />

      <ConfirmationModal
        visible={showRecoverConfirm}
        title="Recuperar Orden"
        message={`¿Estás seguro de que deseas recuperar la orden #${orderToRecover?.shiftOrderNumber}?\n\nLa orden se marcará como lista y volverá a estar visible en las órdenes activas.`}
        onConfirm={handleConfirmRecover}
        onCancel={() => {
          setShowRecoverConfirm(false);
          setOrderToRecover(null);
        }}
        confirmText="Recuperar"
        cancelText="Cancelar"
        confirmColorPreset="primary"
        isConfirming={recoverOrderMutation.isPending}
      />

      <DatePickerModal
        visible={showDateRangePicker}
        mode="range"
        onDismiss={() => setShowDateRangePicker(false)}
        startDate={startDate}
        endDate={endDate}
        onConfirm={(params) => {
          setStartDate(params.startDate);
          setEndDate(params.endDate);
          setShowDateRangePicker(false);
        }}
        validRange={{
          endDate: new Date(),
        }}
        locale="es"
        saveLabel="Confirmar"
        startLabel="Desde"
        endLabel="Hasta"
        label="Seleccionar rango de fechas"
      />
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    searchbar: {
      flex: 1,
    },
    filterButton: {
      position: 'relative',
    },
    filterIconButton: {
      margin: 0,
    },
    filterIconButtonActive: {
      backgroundColor: 'rgba(0, 0, 0, 0.08)',
    },
    filterBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
    },
    activeFilters: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 12,
    },
    filterChip: {
      height: 32,
    },
    listContent: {
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
    actionsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 8,
      marginTop: 4,
    },
    restoreContainer: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    restoreButtonSurface: {
      borderRadius: 20,
      backgroundColor: theme.colors.primaryContainer,
      overflow: 'hidden',
    },
    restoreButton: {
      margin: 0,
      width: 44,
      height: 44,
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
  });
