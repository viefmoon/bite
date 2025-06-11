import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
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
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/app/styles/theme';
import { useReceiptsInfinite } from '../hooks/useReceiptsQueries';
import { Order } from '@/app/schemas/domain/order.schema';
import EmptyState from '@/app/components/common/EmptyState';
import { ReceiptDetailModal } from '../components/ReceiptDetailModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { OrderTypeEnum } from '@/modules/orders/types/orders.types';

type StatusFilter = 'all' | 'COMPLETED' | 'CANCELLED';

export const ReceiptsScreen: React.FC = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  // Estados para filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Estado para el modal de detalle
  const [selectedReceipt, setSelectedReceipt] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

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

  const getOrderTypeLabel = (type: string) => {
    switch (type) {
      case OrderTypeEnum.DINE_IN:
        return 'Mesa';
      case OrderTypeEnum.DELIVERY:
        return 'Domicilio';
      case OrderTypeEnum.TAKE_AWAY:
        return 'Para llevar';
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
  const renderReceiptItem = ({ item }: { item: Order }) => (
    <TouchableOpacity onPress={() => handleReceiptPress(item)}>
      <Surface style={styles.receiptCard} elevation={1}>
        <View style={styles.receiptHeader}>
          <View style={styles.receiptInfo}>
            <Text variant="titleMedium" style={styles.orderNumber}>
              Orden #{item.dailyNumber}
            </Text>
            <Text variant="bodySmall" style={styles.dateText}>
              {format(new Date(item.createdAt), "d 'de' MMMM, HH:mm", {
                locale: es,
              })}
            </Text>
          </View>
          <Chip
            mode="flat"
            compact
            style={{
              backgroundColor: getStatusColor(item.orderStatus),
            }}
            textStyle={{ color: theme.colors.onPrimary, fontSize: 12 }}
          >
            {getStatusLabel(item.orderStatus)}
          </Chip>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.receiptBody}>
          <View style={styles.receiptDetails}>
            <Text variant="bodyMedium">
              {getOrderTypeLabel(item.orderType)}
              {item.table && ` - ${item.table.area?.name} ${item.table.name}`}
            </Text>
            {item.customerName && (
              <Text variant="bodySmall" style={styles.customerText}>
                Cliente: {item.customerName}
              </Text>
            )}
            <Text variant="bodySmall" style={styles.itemsCountText}>
              {item.orderItems?.length || item.items?.length || 0} productos
            </Text>
          </View>
          <Text variant="titleLarge" style={styles.totalText}>
            ${parseFloat(item.total || '0').toFixed(2)}
          </Text>
        </View>
      </Surface>
    </TouchableOpacity>
  );

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
            placeholder="Buscar por número o cliente..."
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
                  startDate ? format(startDate, 'd/M/yyyy') : 'Fecha inicio'
                }
                onPress={() => {
                  setShowStartDatePicker(true);
                  setShowFilterMenu(false);
                }}
                leadingIcon="calendar-start"
              />
              <Menu.Item
                title={endDate ? format(endDate, 'd/M/yyyy') : 'Fecha fin'}
                onPress={() => {
                  setShowEndDatePicker(true);
                  setShowFilterMenu(false);
                }}
                leadingIcon="calendar-end"
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

      {/* Date pickers */}
      <DateTimePickerModal
        isVisible={showStartDatePicker}
        mode="date"
        onConfirm={(date) => {
          setStartDate(date);
          setShowStartDatePicker(false);
        }}
        onCancel={() => setShowStartDatePicker(false)}
        date={startDate || new Date()}
        maximumDate={endDate || new Date()}
      />

      <DateTimePickerModal
        isVisible={showEndDatePicker}
        mode="date"
        onConfirm={(date) => {
          setEndDate(date);
          setShowEndDatePicker(false);
        }}
        onCancel={() => setShowEndDatePicker(false)}
        date={endDate || new Date()}
        minimumDate={startDate || undefined}
        maximumDate={new Date()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
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
    padding: 16,
    paddingBottom: 32,
  },
  receiptCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  receiptInfo: {
    flex: 1,
  },
  orderNumber: {
    fontWeight: 'bold',
  },
  dateText: {
    opacity: 0.7,
    marginTop: 2,
  },
  divider: {
    marginVertical: 12,
  },
  receiptBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  receiptDetails: {
    flex: 1,
  },
  customerText: {
    opacity: 0.8,
    marginTop: 2,
  },
  itemsCountText: {
    opacity: 0.6,
    marginTop: 4,
  },
  totalText: {
    fontWeight: 'bold',
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
