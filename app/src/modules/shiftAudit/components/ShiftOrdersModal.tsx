import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  FlatList,
} from 'react-native';
import {
  Portal,
  Surface,
  Appbar,
  Searchbar,
  Text,
  Card,
  Chip,
  ActivityIndicator,
  IconButton,
  Icon,
} from 'react-native-paper';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import { useShiftOrders } from '../hooks/useShiftOrders';
import { formatCurrency } from '@/app/lib/formatters';
import EmptyState from '@/app/components/common/EmptyState';
import type { Order } from '@/app/schemas/domain/order.schema';
import { OrderTypeEnum } from '@/modules/orders/types/orders.types';
import { formatOrderTypeShort, getPaymentStatus } from '@/app/utils/orderFormatters';
import { receiptService } from '@/modules/receipts/services/receiptService';
import type { Receipt } from '@/modules/receipts/types/receipt.types';
import { OrderDetailsView } from './OrderDetailsView';
import { OrderHistoryView } from './OrderHistoryView';

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
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [showReceiptDetails, setShowReceiptDetails] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: orders, isLoading, error, refetch, isRefetching } = useShiftOrders(shiftId);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleReceiptPress = async (order: Order) => {
    try {
      const fullOrder = await receiptService.getReceiptById(order.id);
      setSelectedReceipt(fullOrder);
      setShowReceiptDetails(true);
    } catch (error) {
      console.error('Error loading receipt details:', error);
    }
  };

  // Filtrar órdenes basado en búsqueda
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    if (!searchQuery.trim()) return orders;

    const search = searchQuery.toLowerCase().trim();
    return orders.filter((order) => {
      // Buscar por número de orden
      if (order.shiftOrderNumber?.toString().includes(search)) return true;
      if (order.orderNumber?.toString().includes(search)) return true;
      
      // Buscar en información de entrega
      if (order.deliveryInfo) {
        // Campos principales
        if (order.deliveryInfo.customerName?.toLowerCase().includes(search)) return true;
        if (order.deliveryInfo.customerPhone?.includes(search)) return true;
        if (order.deliveryInfo.address?.toLowerCase().includes(search)) return true;
        
        // Campos alternativos que pueden venir del backend
        if (order.deliveryInfo.recipientName?.toLowerCase().includes(search)) return true;
        if (order.deliveryInfo.recipientPhone?.includes(search)) return true;
        if (order.deliveryInfo.fullAddress?.toLowerCase().includes(search)) return true;
        
        // Campos adicionales de dirección
        if (order.deliveryInfo.street?.toLowerCase().includes(search)) return true;
        if (order.deliveryInfo.neighborhood?.toLowerCase().includes(search)) return true;
        if (order.deliveryInfo.city?.toLowerCase().includes(search)) return true;
      }
      
      // Buscar en mesa/área para órdenes locales
      if (order.table) {
        if (order.table.name?.toLowerCase().includes(search)) return true;
        if (order.table.number?.toString().includes(search)) return true;
        if (order.table.area?.name?.toLowerCase().includes(search)) return true;
      }
      
      // Buscar en área directa
      if (order.area?.name?.toLowerCase().includes(search)) return true;
      
      // Buscar en notas
      if (order.notes?.toLowerCase().includes(search)) return true;
      
      // Buscar en nombre del usuario creador
      if (order.createdBy) {
        if (order.createdBy.firstName?.toLowerCase().includes(search)) return true;
        if (order.createdBy.lastName?.toLowerCase().includes(search)) return true;
        if (order.createdBy.username?.toLowerCase().includes(search)) return true;
      }
      
      // Buscar en user (campo alternativo)
      if (order.user) {
        if (order.user.firstName?.toLowerCase().includes(search)) return true;
        if (order.user.lastName?.toLowerCase().includes(search)) return true;
      }
      
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
      default:
        return status;
    }
  };

  // Renderizar item de recibo (COPIADO EXACTAMENTE DE ReceiptsScreen)
  const renderReceiptItem = ({ item }: { item: Order }) => {
    // Construir el título según el tipo de orden
    let orderTitle = `#${item.shiftOrderNumber || item.orderNumber} • ${formatOrderTypeShort(item.orderType)}`;

    if (item.orderType === OrderTypeEnum.DINE_IN && item.table) {
      // Para mesas temporales, mostrar solo el nombre sin prefijo "Mesa"
      const tableDisplay = item.table.isTemporary
        ? item.table.name
        : `Mesa ${item.table.name || item.table.number || 'N/A'}`;
      orderTitle += ` • ${item.table.area?.name || item.area?.name || 'Sin área'} • ${tableDisplay}`;
    } else if (item.orderType === OrderTypeEnum.TAKE_AWAY) {
      if (item.deliveryInfo?.recipientName || item.deliveryInfo?.customerName) {
        orderTitle += ` • ${item.deliveryInfo.recipientName || item.deliveryInfo.customerName}`;
      }
      if (item.deliveryInfo?.recipientPhone || item.deliveryInfo?.customerPhone) {
        orderTitle += ` • ${item.deliveryInfo.recipientPhone || item.deliveryInfo.customerPhone}`;
      }
    } else if (item.orderType === OrderTypeEnum.DELIVERY) {
      if (item.deliveryInfo?.fullAddress || item.deliveryInfo?.address) {
        orderTitle += ` • ${item.deliveryInfo.fullAddress || item.deliveryInfo.address}`;
      }
      if (item.deliveryInfo?.recipientPhone || item.deliveryInfo?.customerPhone) {
        orderTitle += ` • ${item.deliveryInfo.recipientPhone || item.deliveryInfo.customerPhone}`;
      }
    }

    const totalAmount = typeof item.total === 'string' ? parseFloat(item.total) : item.total;
    const totalPaid = item.paymentsSummary?.totalPaid || item.payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
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
                      : item.createdBy.username || item.user?.firstName || 'Usuario'}
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
          {showOrderHistory && selectedReceipt ? (
            <OrderHistoryView
              orderId={selectedReceipt.id}
              orderNumber={selectedReceipt.shiftOrderNumber || selectedReceipt.orderNumber}
              onBack={() => {
                setShowOrderHistory(false);
                setShowReceiptDetails(true);
              }}
            />
          ) : showReceiptDetails && selectedReceipt ? (
            <OrderDetailsView
              order={selectedReceipt}
              onBack={() => {
                setShowReceiptDetails(false);
                setSelectedReceipt(null);
              }}
              onShowHistory={() => {
                setShowReceiptDetails(false);
                setShowOrderHistory(true);
              }}
            />
          ) : (
            <>
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
            </>
          )}
        </View>
      </Modal>
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