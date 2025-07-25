import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Chip, Card, Icon } from 'react-native-paper';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import { getPaymentStatus } from '@/app/utils/orderFormatters';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { OrderTypeEnum } from '@/modules/orders/types/orders.types';
import { formatOrderTypeShort } from '@/app/utils/orderFormatters';

interface OrderSummaryCardProps {
  item: any; // Union type for ReceiptList | Order
  onPress: () => void;
  renderActions?: (item: any) => React.ReactNode;
  getStatusColor?: (status: string) => string;
  getStatusLabel?: (status: string) => string;
}

const OrderSummaryCard: React.FC<OrderSummaryCardProps> = ({
  item,
  onPress,
  renderActions,
  getStatusColor,
  getStatusLabel,
}) => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

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

  const totalAmount =
    typeof item.total === 'string' ? parseFloat(item.total) : item.total;
  const totalPaid =
    item.paymentsSummary?.totalPaid ||
    item.payments?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) ||
    0;
  const pendingAmount = totalAmount - totalPaid;

  // Determinar colores y íconos de estado de pago
  const paymentStatus = getPaymentStatus(item as any);
  const paymentColor =
    paymentStatus === 'paid'
      ? '#10B981'
      : paymentStatus === 'partial'
        ? '#F59E0B'
        : '#EF4444';
  const paymentIcon =
    paymentStatus === 'paid' ? '✓' : paymentStatus === 'partial' ? '½' : '•';

  // Colores de estado por defecto si no se proporcionan
  const defaultGetStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return '#4CAF50';
      case 'CANCELLED':
        return '#F44336';
      case 'IN_PROGRESS':
        return '#FF9800';
      default:
        return theme.colors.surfaceVariant;
    }
  };

  const defaultGetStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Completada';
      case 'CANCELLED':
        return 'Cancelada';
      case 'IN_PROGRESS':
        return 'En proceso';
      default:
        return status;
    }
  };

  const statusColor = getStatusColor
    ? getStatusColor(item.orderStatus)
    : defaultGetStatusColor(item.orderStatus);
  const statusLabel = getStatusLabel
    ? getStatusLabel(item.orderStatus)
    : defaultGetStatusLabel(item.orderStatus);

  return (
    <TouchableOpacity activeOpacity={0.95} onPress={onPress}>
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
                style={[styles.orderNumber, { color: theme.colors.onSurface }]}
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
                    {' • '}
                    {item.notes}
                  </Text>
                )}
              </Text>
              <View style={styles.timeAndPaymentRow}>
                <Text
                  style={[styles.orderTime, { color: theme.colors.primary }]}
                >
                  {format(new Date(item.createdAt), 'p', { locale: es })}
                </Text>

                {/* Badge de estado de pago */}
                <View
                  style={[
                    styles.miniPaymentBadge,
                    { backgroundColor: paymentColor },
                  ]}
                >
                  <Text style={styles.miniPaymentText}>{paymentIcon}</Text>
                </View>

                {/* Badge de WhatsApp */}
                {item.isFromWhatsApp && (
                  <View
                    style={[
                      styles.inlinePreparationBadge,
                      {
                        backgroundColor: '#25D366',
                        borderColor: '#25D366',
                      },
                    ]}
                  >
                    <Icon source="whatsapp" size={12} color="#FFFFFF" />
                  </View>
                )}

                {/* Badges de pantallas de preparación */}
                {item.preparationScreenStatuses &&
                  item.preparationScreenStatuses.length > 0 && (
                    <>
                      {item.preparationScreenStatuses.map(
                        (screen: any, index: number) => {
                          const backgroundColor =
                            screen.status === 'READY'
                              ? '#4CAF50'
                              : screen.status === 'IN_PROGRESS'
                                ? '#FFA000'
                                : theme.colors.surfaceVariant;

                          const textColor =
                            screen.status === 'READY' ||
                            screen.status === 'IN_PROGRESS'
                              ? '#FFFFFF'
                              : theme.colors.onSurfaceVariant;

                          return (
                            <View
                              key={`${item.id}-screen-${index}`}
                              style={[
                                styles.inlinePreparationBadge,
                                {
                                  backgroundColor,
                                  borderColor:
                                    backgroundColor ===
                                    theme.colors.surfaceVariant
                                      ? theme.colors.outline
                                      : backgroundColor,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.inlinePreparationText,
                                  { color: textColor },
                                ]}
                              >
                                {screen.status === 'READY'
                                  ? '✓ '
                                  : screen.status === 'IN_PROGRESS'
                                    ? '⏳'
                                    : ''}
                                🍳 {screen.name}
                              </Text>
                            </View>
                          );
                        },
                      )}
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
                  {
                    backgroundColor: statusColor,
                  },
                ]}
                textStyle={styles.statusChipText}
              >
                {statusLabel}
              </Chip>

              {/* Contenedor de acciones personalizables */}
              {renderActions && (
                <View style={styles.actionsContainer}>
                  {renderActions(item)}
                </View>
              )}
            </View>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
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
      marginRight: 12,
    },
    rightContainer: {
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      minHeight: 60,
    },
    orderNumber: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 22,
      marginBottom: 4,
    },
    orderPrice: {
      fontSize: 14,
      fontWeight: '500',
    },
    notesInline: {
      fontSize: 13,
      fontStyle: 'italic',
    },
    timeAndPaymentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
    },
    orderTime: {
      fontSize: 13,
      fontWeight: '500',
    },
    miniPaymentBadge: {
      width: 16,
      height: 16,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    miniPaymentText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: 'bold',
    },
    inlinePreparationBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
      borderWidth: 1,
    },
    inlinePreparationText: {
      fontSize: 10,
      fontWeight: '500',
    },
    createdByText: {
      fontSize: 12,
      color: '#666',
      marginBottom: 4,
      maxWidth: 120,
    },
    statusChip: {
      marginBottom: 8,
    },
    statusChipText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    actionsContainer: {
      alignItems: 'center',
    },
  });

export default OrderSummaryCard;
