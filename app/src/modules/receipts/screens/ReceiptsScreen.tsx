import React, { useState, useCallback, useMemo } from 'react';
import { View, FlatList, RefreshControl, StyleSheet } from 'react-native';
import {
  Text,
  Searchbar,
  Chip,
  Surface,
  ActivityIndicator,
  Menu,
  IconButton,
  Divider,
  Badge,
  Card,
} from 'react-native-paper';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import {
  useReceiptsInfinite,
  useRecoverOrder,
} from '../hooks/useReceiptsQueries';
import { Order } from '@/app/schemas/domain/order.schema';
import { useRefreshModuleOnFocus } from '@/app/hooks/useRefreshOnFocus';
import EmptyState from '@/app/components/common/EmptyState';
import { ReceiptDetailModal } from '../components/ReceiptDetailModal';
import { ConfirmRecoverModal } from '../components/ConfirmRecoverModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DatePickerModal } from 'react-native-paper-dates';
import { OrderTypeEnum } from '@/modules/orders/types/orders.types';

type StatusFilter = 'all' | 'COMPLETED' | 'CANCELLED';

export const ReceiptsScreen: React.FC = () => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  // Estados para filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Estado para el modal de detalle
  const [selectedReceipt, setSelectedReceipt] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Estado para recuperación de orden
  const [orderToRecover, setOrderToRecover] = useState<Order | null>(null);
  const [showRecoverConfirm, setShowRecoverConfirm] = useState(false);

  // Mutation para recuperar orden
  const recoverOrderMutation = useRecoverOrder();

  // Preparar filtros para la query
  const filters = useMemo(() => {
    const baseFilters: any = {};

    if (searchQuery.trim()) {
      baseFilters.search = searchQuery.trim();
    }

    if (statusFilter !== 'all') {
      baseFilters.status = statusFilter;
    }

    if (startDate) {
      baseFilters.startDate = startDate;
    }

    if (endDate) {
      baseFilters.endDate = endDate;
    }

    return baseFilters;
  }, [searchQuery, statusFilter, startDate, endDate]);

  // Query para obtener recibos
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isRefetching,
  } = useReceiptsInfinite(filters);

  // Recargar automáticamente cuando la pantalla recibe foco
  useRefreshModuleOnFocus('receipts');

  // Aplanar los datos paginados
  const receipts = useMemo(() => {
    return data?.pages.flatMap((page: any) => page.data) || [];
  }, [data]);

  // Handlers
  const handleReceiptPress = useCallback((receipt: Order) => {
    setSelectedReceipt(receipt);
    setShowDetailModal(true);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setStartDate(undefined);
    setEndDate(undefined);
  }, []);

  const handleRecoverPress = useCallback((order: Order) => {
    setOrderToRecover(order);
    setShowRecoverConfirm(true);
  }, []);

  const handleConfirmRecover = useCallback(async () => {
    if (!orderToRecover) return;

    try {
      await recoverOrderMutation.mutateAsync(orderToRecover.id);
      setShowRecoverConfirm(false);
      setOrderToRecover(null);
    } catch (error) {
      console.error('Error al recuperar orden:', error);
    }
  }, [orderToRecover, recoverOrderMutation]);

  const formatOrderTypeShort = (type: string): string => {
    switch (type) {
      case OrderTypeEnum.DINE_IN:
        return '🍽️ Local';
      case OrderTypeEnum.DELIVERY:
        return '🚚 Envío';
      case OrderTypeEnum.TAKE_AWAY:
        return '🥡 Llevar';
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
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

  // Renderizar item de recibo
  const renderReceiptItem = ({ item }: { item: Order }) => {
    // Construir el título según el tipo de orden
    let orderTitle = `#${item.shiftOrderNumber} • ${formatOrderTypeShort(item.orderType)}`;

    if (item.orderType === OrderTypeEnum.DINE_IN && item.table) {
      // Para mesas temporales, mostrar solo el nombre sin prefijo "Mesa"
      const tableDisplay = item.table.isTemporary
        ? item.table.name
        : `Mesa ${item.table.name || item.table.number || 'N/A'}`;
      orderTitle += ` • ${item.table.area?.name || 'Sin área'} • ${tableDisplay}`;
    } else if (item.orderType === OrderTypeEnum.TAKE_AWAY) {
      if (item.deliveryInfo?.recipientName) {
        orderTitle += ` • ${item.deliveryInfo.recipientName}`;
      }
      if (item.deliveryInfo?.recipientPhone) {
        orderTitle += ` • ${item.deliveryInfo.recipientPhone}`;
      }
    } else if (item.orderType === OrderTypeEnum.DELIVERY) {
      if (item.deliveryInfo?.fullAddress) {
        orderTitle += ` • ${item.deliveryInfo.fullAddress}`;
      }
      if (item.deliveryInfo?.recipientPhone) {
        orderTitle += ` • ${item.deliveryInfo.recipientPhone}`;
      }
    }

    return (
      <Card
        style={styles.orderCard}
        mode="elevated"
        onPress={() => handleReceiptPress(item)}
      >
        <Card.Content style={styles.cardContent}>
          {/* Main Container */}
          <View style={styles.mainContainer}>
            {/* Left Side - Title and Time */}
            <View style={styles.leftContainer}>
              <Text style={styles.orderNumber} numberOfLines={2}>
                {orderTitle}
                <Text style={styles.orderPrice}>
                  {' '}
                  • ${parseFloat(item.total?.toString() || '0').toFixed(2)}
                </Text>
              </Text>
              <View style={styles.timeAndPaymentRow}>
                <Text style={styles.orderTime}>
                  Creado: {format(new Date(item.createdAt), 'p', { locale: es })}
                </Text>
                <Text style={styles.dateText}>
                  {format(new Date(item.createdAt), "d 'de' MMMM", {
                    locale: es,
                  })}
                </Text>
              </View>
              {item.finalizedAt && (
                <View style={styles.timeAndPaymentRow}>
                  <Text style={styles.orderTimeFinal}>
                    Finalizado: {format(new Date(item.finalizedAt), 'p', { locale: es })}
                  </Text>
                  <Text style={styles.dateText}>
                    {format(new Date(item.finalizedAt), "d 'de' MMMM", {
                      locale: es,
                    })}
                  </Text>
                </View>
              )}
            </View>

            {/* Right Side - Status and Actions */}
            <View style={styles.rightContainer}>
              <Chip
                mode="flat"
                style={[
                  styles.statusChip,
                  { backgroundColor: getStatusColor(item.orderStatus) },
                ]}
                textStyle={styles.statusChipText}
              >
                {getStatusLabel(item.orderStatus)}
              </Chip>
              {/* Botón de recuperar solo para órdenes completadas o canceladas */}
              {(item.orderStatus === 'COMPLETED' ||
                item.orderStatus === 'CANCELLED') && (
                <IconButton
                  icon="restore"
                  size={28}
                  style={[
                    styles.restoreButton,
                    { backgroundColor: theme.colors.primaryContainer },
                  ]}
                  iconColor={theme.colors.primary}
                  onPress={() => handleRecoverPress(item)}
                  disabled={recoverOrderMutation.isPending}
                />
              )}
            </View>
          </View>

          {/* Notes - if present */}
          {item.notes && (
            <Text style={styles.notes} numberOfLines={2}>
              📝 {item.notes}
            </Text>
          )}
        </Card.Content>
      </Card>
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

  // Renderizar footer de la lista
  const renderFooter = () => {
    if (!isFetchingNextPage) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header con búsqueda y filtros */}
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

        {/* Chips de filtros activos */}
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

      {/* Lista de recibos */}
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
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={renderEmptyComponent}
        ListFooterComponent={renderFooter}
      />

      {/* Modal de detalle */}
      <ReceiptDetailModal
        visible={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedReceipt(null);
        }}
        order={selectedReceipt}
      />

      {/* Modal de confirmación de recuperación */}
      <ConfirmRecoverModal
        visible={showRecoverConfirm}
        onClose={() => {
          setShowRecoverConfirm(false);
          setOrderToRecover(null);
        }}
        onConfirm={handleConfirmRecover}
        orderNumber={orderToRecover?.shiftOrderNumber?.toString()}
        isLoading={recoverOrderMutation.isPending}
      />

      {/* Date range picker */}
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
      padding: theme.spacing.s, // Reducido de 16 a theme.spacing.s
      paddingBottom: theme.spacing.l * 2,
      flexGrow: 1,
    },
    orderCard: {
      marginBottom: theme.spacing.s, // Reducido para coincidir con órdenes abiertas
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
    orderTime: {
      ...theme.fonts.titleMedium,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    orderTimeFinal: {
      ...theme.fonts.titleMedium,
      color: theme.colors.secondary,
      fontWeight: '600',
    },
    dateText: {
      ...theme.fonts.bodyMedium,
      color: theme.colors.onSurfaceVariant,
      marginLeft: theme.spacing.xs,
    },
    timeAndPaymentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.s,
    },
    printButton: {
      margin: 0,
      padding: theme.spacing.xs,
    },
    restoreButton: {
      margin: 0,
      padding: theme.spacing.xs,
      borderRadius: theme.roundness * 2,
      elevation: 1,
    },
    notes: {
      ...theme.fonts.bodySmall,
      color: theme.colors.onSurfaceVariant,
      marginTop: theme.spacing.xs,
      fontStyle: 'italic',
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    footerLoader: {
      paddingVertical: 16,
      alignItems: 'center',
    },
  });
