import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Checkbox, Chip, IconButton } from 'react-native-paper';
import { OrderForFinalizationList } from '../types/orderFinalization.types';
import { useAppTheme } from '@/app/styles/theme';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface OrderCardProps {
  order: OrderForFinalizationList;
  isSelected: boolean;
  onToggleSelection: (orderId: string) => void;
  onShowDetails: (order: OrderForFinalizationList) => void;
  onPrintPress?: (order: OrderForFinalizationList) => void;
}

const formatOrderTypeShort = (type: string): string => {
  switch (type) {
    case 'DINE_IN':
      return '🍽️ Local';
    case 'TAKEOUT':
    case 'TAKE_AWAY':
      return '🥡 Llevar';
    case 'DELIVERY':
      return '🚚 Envío';
    default:
      return type;
  }
};

export const OrderCard = React.memo<OrderCardProps>(
  ({ order, isSelected, onToggleSelection, onShowDetails, onPrintPress }) => {
    const theme = useAppTheme();

    let orderTitle = `#${order.shiftOrderNumber} • ${formatOrderTypeShort(order.orderType)}`;

    if (order.orderType === 'DINE_IN' && order.table) {
      const tableDisplay = order.table.isTemporary
        ? order.table.name
        : `Mesa ${order.table.name || order.table.number || 'N/A'}`;
      orderTitle += ` • ${order.table.area?.name || 'Sin área'} • ${tableDisplay}`;
    } else if (order.orderType === 'TAKE_AWAY') {
      if (order.deliveryInfo?.recipientName) {
        orderTitle += ` • ${order.deliveryInfo.recipientName}`;
      }
      if (order.deliveryInfo?.recipientPhone) {
        orderTitle += ` • ${order.deliveryInfo.recipientPhone}`;
      }
    } else if (order.orderType === 'DELIVERY') {
      if (order.deliveryInfo?.fullAddress) {
        orderTitle += ` • ${order.deliveryInfo.fullAddress}`;
      }
      if (order.deliveryInfo?.recipientPhone) {
        orderTitle += ` • ${order.deliveryInfo.recipientPhone}`;
      }
    }

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'PENDING':
          return '#FFA000'; // Orange
        case 'IN_PROGRESS':
          return theme.colors.primary;
        case 'READY':
          return '#4CAF50'; // Green
        case 'DELIVERED':
          return '#9C27B0'; // Purple - better contrast
        default:
          return theme.colors.onSurfaceVariant;
      }
    };

    const formatOrderStatus = (status: string) => {
      switch (status) {
        case 'PENDING':
          return 'Pendiente';
        case 'IN_PROGRESS':
          return 'En preparación';
        case 'READY':
          return 'Listo';
        case 'DELIVERED':
          return 'Entregado';
        default:
          return status;
      }
    };

    const totalAmount =
      typeof order.total === 'string' ? parseFloat(order.total) : order.total;
    const totalPaid = order.paymentsSummary?.totalPaid || 0;
    const pendingAmount = totalAmount - totalPaid;

    const getPaymentStatus = () => {
      if (totalPaid >= totalAmount) {
        return 'paid';
      } else if (totalPaid > 0) {
        return 'partial';
      }
      return 'pending';
    };

    return (
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => onShowDetails(order)}
      >
          <Card
            style={[
              styles.orderCard,
              {
                backgroundColor: isSelected
                  ? theme.colors.primaryContainer
                  : theme.colors.surface,
                borderColor: isSelected ? theme.colors.primary : 'transparent',
                borderWidth: isSelected ? 2 : 0,
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
                      {
                        color: isSelected
                          ? theme.colors.onPrimaryContainer
                          : theme.colors.onSurface,
                      },
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
                  </Text>
                  <View style={styles.timeAndPaymentRow}>
                    <Text
                      style={[
                        styles.orderTime,
                        {
                          color: isSelected
                            ? theme.colors.primary
                            : theme.colors.primary,
                        },
                      ]}
                    >
                      {format(new Date(order.createdAt), 'p', { locale: es })}
                    </Text>
                    {order.scheduledAt && (
                      <Text
                        style={[
                          styles.estimatedTime,
                          {
                            color: isSelected
                              ? theme.colors.onPrimaryContainer
                              : theme.colors.onSurfaceVariant,
                          },
                        ]}
                      >
                        📅{' '}
                        {format(new Date(order.scheduledAt), 'p', {
                          locale: es,
                        })}
                      </Text>
                    )}
                    {(() => {
                      const paymentStatus = getPaymentStatus();
                      if (paymentStatus === 'paid') {
                        return (
                          <View
                            style={[
                              styles.paymentBadge,
                              { backgroundColor: '#10B981' },
                            ]}
                          >
                            <Text
                              style={[
                                styles.paymentBadgeText,
                                { color: '#FFFFFF' },
                              ]}
                            >
                              💵 Pagado
                            </Text>
                          </View>
                        );
                      } else if (paymentStatus === 'partial') {
                        return (
                          <View
                            style={[
                              styles.paymentBadge,
                              { backgroundColor: '#F59E0B' },
                            ]}
                          >
                            <Text
                              style={[
                                styles.paymentBadgeText,
                                { color: '#FFFFFF' },
                              ]}
                            >
                              💵 Parcial
                            </Text>
                          </View>
                        );
                      } else {
                        return (
                          <View
                            style={[
                              styles.paymentBadge,
                              { backgroundColor: '#EF4444' },
                            ]}
                          >
                            <Text
                              style={[
                                styles.paymentBadgeText,
                                { color: '#FFFFFF' },
                              ]}
                            >
                              💵 Pendiente
                            </Text>
                          </View>
                        );
                      }
                    })()}
                    {order.preparationScreens &&
                      order.preparationScreens.length > 0 && (
                        <>
                          {order.preparationScreens.map((screen, index) => (
                            <View
                              key={`${order.id}-screen-${index}`}
                              style={[
                                styles.inlinePreparationBadge,
                                {
                                  backgroundColor: isSelected
                                    ? theme.colors.primaryContainer
                                    : theme.colors.surfaceVariant,
                                  borderColor: theme.colors.outline,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.inlinePreparationText,
                                  {
                                    color: isSelected
                                      ? theme.colors.onPrimaryContainer
                                      : theme.colors.onSurfaceVariant,
                                  },
                                ]}
                              >
                                🍳 {screen}
                              </Text>
                            </View>
                          ))}
                        </>
                      )}
                  </View>
                </View>

                <View style={styles.rightContainer}>
                  <Chip
                    mode="flat"
                    style={[
                      styles.statusChip,
                      { backgroundColor: getStatusColor(order.orderStatus) },
                    ]}
                    textStyle={styles.statusChipText}
                  >
                    {formatOrderStatus(order.orderStatus)}
                  </Chip>
                  <View style={styles.actionsContainer}>
                    {onPrintPress && (
                      <View style={styles.printContainer}>
                        <IconButton
                          icon="printer"
                          size={32}
                          onPress={(e) => {
                            e.stopPropagation();
                            onPrintPress(order);
                          }}
                          style={styles.printButton}
                        />
                        {(order.ticketImpressionCount ?? 0) > 0 && (
                          <View style={styles.printCountBadge}>
                            <Text style={styles.printCountText}>
                              {order.ticketImpressionCount}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                    <View style={styles.checkboxContainer}>
                      <Checkbox
                        status={isSelected ? 'checked' : 'unchecked'}
                        onPress={() => {
                          onToggleSelection(order.id);
                        }}
                        color={theme.colors.primary}
                        style={styles.checkbox}
                      />
                    </View>
                  </View>
                </View>
              </View>

              {order.notes ? (
                <Text
                  style={[
                    styles.notes,
                    {
                      color: isSelected
                        ? theme.colors.onPrimaryContainer
                        : theme.colors.onSurfaceVariant,
                    },
                  ]}
                  numberOfLines={2}
                >
                  📝 {order.notes}
                </Text>
              ) : null}
            </Card.Content>
          </Card>
        </TouchableOpacity>
    );
  },
);

OrderCard.displayName = 'OrderCard';

const styles = StyleSheet.create({
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
    paddingRight: 8,
  },
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minWidth: 140,
    gap: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
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
  statusChip: {
    height: 28,
    minHeight: 28,
    alignSelf: 'flex-end',
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    lineHeight: 16,
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
    gap: 8,
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
  checkboxContainer: {
    padding: 8,
    marginLeft: -8,
    marginRight: -12,
  },
  checkbox: {
    margin: 0,
    transform: [{ scale: 1.5 }],
  },
  notes: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  inlinePreparationBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 0.5,
    marginLeft: 4,
  },
  inlinePreparationText: {
    fontSize: 10,
    fontWeight: '500',
  },
  printButton: {
    margin: -4,
  },
  printContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  printCountBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  printCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
