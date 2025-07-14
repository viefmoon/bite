import React from 'react';
import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Card, Text, Checkbox, Chip } from 'react-native-paper';
import { OrderForFinalizationList } from '../types/orderFinalization.types';
import { useAppTheme } from '@/app/styles/theme';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface OrderCardProps {
  order: OrderForFinalizationList;
  isSelected: boolean;
  onToggleSelection: (orderId: string) => void;
  onShowDetails: (order: OrderForFinalizationList) => void;
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
  ({ order, isSelected, onToggleSelection, onShowDetails }) => {
    const theme = useAppTheme();
    const scaleAnim = React.useRef(new Animated.Value(1)).current;

    let orderTitle = `#${order.shiftOrderNumber} • ${formatOrderTypeShort(order.orderType)}`;

    if (order.orderType === 'DINE_IN' && order.table) {
      const tableDisplay = order.table.isTemporary
        ? order.table.name
        : `Mesa ${order.table.name || order.table.number || 'N/A'}`;
      orderTitle += ` • ${order.table.area?.name || 'Sin área'} • ${tableDisplay}`;
    } else if (
      order.orderType === 'TAKEOUT' ||
      order.orderType === 'TAKE_AWAY'
    ) {
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
          return theme.colors.tertiary;
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

    const getPaymentStatus = () => {
      const totalPaid = order.paymentsSummary?.totalPaid || 0;
      const totalAmount =
        typeof order.total === 'string'
          ? parseFloat(order.total)
          : order.total;

      if (totalPaid >= totalAmount) {
        return 'paid';
      } else if (totalPaid > 0) {
        return 'partial';
      }
      return 'pending';
    };

    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          activeOpacity={0.95}
          onPressIn={() => {
            Animated.spring(scaleAnim, {
              toValue: 0.98,
              useNativeDriver: true,
              speed: 50,
              bounciness: 0,
            }).start();
          }}
          onPressOut={() => {
            Animated.spring(scaleAnim, {
              toValue: 1,
              useNativeDriver: true,
              speed: 50,
              bounciness: 0,
            }).start();
          }}
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
          {/* Main Container */}
          <View style={styles.mainContainer}>
            {/* Left Side - Title and Time */}
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
                  style={[styles.orderPrice, { 
                    color: (() => {
                      const totalOrder = typeof order.total === 'string' ? parseFloat(order.total) : order.total;
                      const totalPaid = order.paymentsSummary?.totalPaid || 0;
                      const remaining = totalOrder - totalPaid;
                      return remaining > 0 ? theme.colors.error : '#10B981';
                    })()
                  }]}
                >
                  {' • '}
                  {(() => {
                    const totalOrder = typeof order.total === 'string' ? parseFloat(order.total) : order.total;
                    const totalPaid = order.paymentsSummary?.totalPaid || 0;
                    const remaining = totalOrder - totalPaid;
                    if (remaining > 0) {
                      return `Por pagar: $${remaining.toFixed(2)}`;
                    } else {
                      return `Pagado: $${totalOrder.toFixed(2)}`;
                    }
                  })()}
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
              </View>
            </View>

            {/* Right Side - Status and Checkbox */}
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
              <Checkbox
                status={isSelected ? 'checked' : 'unchecked'}
                onPress={() => onToggleSelection(order.id)}
                color={theme.colors.primary}
                style={styles.checkbox}
              />
            </View>
          </View>

          {/* Preparation screens if any */}
          {order.preparationScreens && order.preparationScreens.length > 0 && (
            <View style={styles.preparationScreensContainer}>
              {order.preparationScreens.map((screen, index) => (
                <View
                  key={`${order.id}-screen-${index}`}
                  style={[
                    styles.preparationScreenBadge,
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
                      styles.preparationScreenText,
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
            </View>
          )}

          {/* Notes if any */}
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
      </Animated.View>
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
    alignItems: 'center',
    justifyContent: 'flex-start',
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
    marginBottom: 4,
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
  checkbox: {
    margin: 0,
  },
  notes: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  preparationScreensContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    gap: 6,
  },
  preparationScreenBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  preparationScreenText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
