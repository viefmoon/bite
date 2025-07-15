import React, { useState, useCallback, useMemo } from 'react';
import { View, FlatList, RefreshControl, StyleSheet, TouchableOpacity } from 'react-native';
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
  Icon,
} from 'react-native-paper';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import {
  useReceipts,
  useRecoverOrder,
} from '../hooks/useReceiptsQueries';
import { Order } from '@/app/schemas/domain/order.schema';
import type { Receipt, ReceiptList, ReceiptsListResponse, ReceiptFilters } from '../types/receipt.types';
import { getPaymentStatus } from '@/app/utils/orderFormatters';
import { receiptService } from '../services/receiptService';
import { useRefreshModuleOnFocus } from '@/app/hooks/useRefreshOnFocus';
import EmptyState from '@/app/components/common/EmptyState';
import { ReceiptDetailModal } from '../components/ReceiptDetailModal';
import { ConfirmRecoverModal } from '../components/ConfirmRecoverModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DatePickerModal } from 'react-native-paper-dates';
import { OrderTypeEnum } from '@/modules/orders/types/orders.types';
import { formatOrderTypeShort, getStatusColor } from '@/app/utils/orderFormatters';

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

    if (startDate) {
      baseFilters.startDate = startDate.toISOString();
    }

    if (endDate) {
      baseFilters.endDate = endDate.toISOString();
    }

    return baseFilters;
  }, [startDate, endDate]);

  // Query para obtener recibos
  const {
    data: allReceipts,
    isLoading,
    refetch,
    isRefetching,
  } = useReceipts(filters);

  // Recargar automáticamente cuando la pantalla recibe foco
  useRefreshModuleOnFocus('receipts');

  // Filtrar recibos localmente
  const receipts = useMemo(() => {
    if (!allReceipts) return [];
    
    let filtered = [...allReceipts];
    
    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(receipt => receipt.orderStatus === statusFilter);
    }
    
    // Filtro por búsqueda
    if (searchQuery.trim()) {
      const search = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(receipt => {
        // Buscar por número de orden
        if (receipt.shiftOrderNumber.toString().includes(search)) return true;
        
        // Buscar en información de entrega
        if (receipt.deliveryInfo) {
          const { recipientName, recipientPhone, fullAddress } = receipt.deliveryInfo;
          if (recipientName?.toLowerCase().includes(search)) return true;
          if (recipientPhone?.includes(search)) return true;
          if (fullAddress?.toLowerCase().includes(search)) return true;
        }
        
        // Buscar en notas
        if (receipt.notes?.toLowerCase().includes(search)) return true;
        
        return false;
      });
    }
    
    return filtered;
  }, [allReceipts, statusFilter, searchQuery]);

  // Handlers
  const handleReceiptPress = useCallback((receipt: ReceiptList) => {
    // Fetch full order details when opening modal
    receiptService.getReceiptById(receipt.id).then((fullOrder) => {
      setSelectedReceipt(fullOrder);
      setShowDetailModal(true);
    });
  }, []);


  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setStartDate(undefined);
    setEndDate(undefined);
  }, []);

  const handleRecoverPress = useCallback((receipt: ReceiptList) => {
    // Fetch full order details before recovering
    receiptService.getReceiptById(receipt.id).then((fullOrder) => {
      setOrderToRecover(fullOrder);
      setShowRecoverConfirm(true);
    });
  }, []);

  const handleConfirmRecover = useCallback(async () => {
    if (!orderToRecover) return;

    try {
      await recoverOrderMutation.mutateAsync(orderToRecover.id);
      setShowRecoverConfirm(false);
      setOrderToRecover(null);
    } catch (error) {
      // Error ya manejado por el mutation hook
    }
  }, [orderToRecover, recoverOrderMutation]);


  // Función específica para el color de estado en recibos
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

  // Renderizar item de recibo
  const renderReceiptItem = ({ item }: { item: ReceiptList }) => {
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

    const totalAmount = typeof item.total === 'string' ? parseFloat(item.total) : item.total;
    const totalPaid = item.paymentsSummary?.totalPaid || 0;
    const pendingAmount = totalAmount - totalPaid;

    return (
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => handleReceiptPress(item)}
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
                        color: pendingAmount > 0 ? theme.colors.error : '#10B981',
                      },
                    ]}
                  >
                    {' • '}
                    {pendingAmount > 0
                      ? `Por pagar: $${pendingAmount.toFixed(2)}`
                      : `Pagado: $${totalAmount.toFixed(2)}`}
                  </Text>
                  {item.notes && (
                    <Text
                      style={[
                        styles.notesInline,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                      numberOfLines={1}
                    >
                      {' • '}{item.notes}
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
                    {format(new Date(item.createdAt), 'p', { locale: es })}
                  </Text>
                  {(() => {
                    const paymentStatus = getPaymentStatus(item as any);
                    const color = paymentStatus === 'paid' ? '#10B981' : 
                                paymentStatus === 'partial' ? '#F59E0B' : '#EF4444';
                    const icon = paymentStatus === 'paid' ? '✓' : 
                               paymentStatus === 'partial' ? '½' : '•';
                    return (
                      <View
                        style={[
                          styles.miniPaymentBadge,
                          { backgroundColor: color },
                        ]}
                      >
                        <Text style={styles.miniPaymentText}>
                          {icon}
                        </Text>
                      </View>
                    );
                  })()}
                  {item.preparationScreenStatuses && item.preparationScreenStatuses.length > 0 && (
                    <>
                      {item.preparationScreenStatuses.map((screen, index) => {
                        const backgroundColor = 
                          screen.status === 'READY' ? '#4CAF50' :
                          screen.status === 'IN_PROGRESS' ? '#FFA000' :
                          theme.colors.surfaceVariant;
                        
                        const textColor = 
                          screen.status === 'READY' || screen.status === 'IN_PROGRESS' ? '#FFFFFF' :
                          theme.colors.onSurfaceVariant;
                          
                        return (
                          <View
                            key={`${item.id}-screen-${index}`}
                            style={[
                              styles.inlinePreparationBadge,
                              {
                                backgroundColor,
                                borderColor: backgroundColor === theme.colors.surfaceVariant ? theme.colors.outline : backgroundColor,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.inlinePreparationText,
                                { color: textColor },
                              ]}
                            >
                              {screen.status === 'READY' ? '✓ ' : 
                               screen.status === 'IN_PROGRESS' ? '⏳' : ''}
                              🍳 {screen.name}
                            </Text>
                          </View>
                        );
                      })}
                    </>
                  )}
                </View>
              </View>

              <View style={styles.rightContainer}>
                {item.createdBy && (
                  <Text style={styles.createdByText} numberOfLines={1}>
                    {item.createdBy.firstName && item.createdBy.lastName
                      ? `${item.createdBy.firstName} ${item.createdBy.lastName}`
                      : item.createdBy.username}
                  </Text>
                )}
                <Chip
                  mode="flat"
                  compact
                  style={[
                    styles.statusChip,
                    { backgroundColor: getReceiptStatusColor(item.orderStatus) },
                  ]}
                  textStyle={styles.statusChipText}
                >
                  {getStatusLabel(item.orderStatus)}
                </Chip>
                <View style={styles.actionsContainer}>
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
                </View>
              </View>
            </View>

          </Card.Content>
        </Card>
      </TouchableOpacity>
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


  return (
    <View style={styles.container}>
      {/* Header con búsqueda y filtros */}
      <Surface style={styles.header} elevation={2}>
        <Surface style={styles.shiftIndicator} elevation={1}>
          <Icon source="cash-register" size={20} color={theme.colors.primary} />
          <Text style={styles.shiftText}>
            Recibos del turno actual
          </Text>
          <View style={styles.shiftBadge}>
            <Text style={styles.shiftBadgeText}>ACTIVO</Text>
          </View>
        </Surface>
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
        ListEmptyComponent={renderEmptyComponent}
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
    shiftIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 8,
      paddingHorizontal: 16,
      marginBottom: 8,
      borderRadius: 20,
      backgroundColor: theme.colors.primaryContainer,
    },
    shiftText: {
      ...theme.fonts.bodyMedium,
      color: theme.colors.onPrimaryContainer,
      fontWeight: '600',
    },
    shiftBadge: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    shiftBadgeText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: theme.colors.onPrimary,
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
