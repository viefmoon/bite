import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Checkbox, Chip } from 'react-native-paper';
import { OrderForFinalization } from '../types/orderFinalization.types';
import { useAppTheme } from '@/app/styles/theme';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface OrderCardProps {
  order: OrderForFinalization;
  isSelected: boolean;
  onToggleSelection: (orderId: string) => void;
  onShowDetails: (order: OrderForFinalization) => void;
}

// Helper para formatear el tipo de orden corto (copiado de OpenOrdersScreen)
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

    // Construir el título EXACTAMENTE como en OpenOrdersScreen
    let orderTitle = `#${order.shiftOrderNumber} • ${formatOrderTypeShort(order.orderType)}`;

    if (order.orderType === 'DINE_IN' && order.table) {
      // Para mesas temporales, mostrar solo el nombre sin prefijo "Mesa"
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
      // Si hay pagos, verificar el estado
      if (order.payments && order.payments.length > 0) {
        const totalPaid = order.payments.reduce((sum, p) => sum + p.amount, 0);
        const totalAmount =
          typeof order.total === 'string'
            ? parseFloat(order.total)
            : order.total;

        if (totalPaid >= totalAmount) {
          return 'paid';
        } else if (totalPaid > 0) {
          return 'partial';
        }
      }
      return 'pending';
    };

    return (
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
        onPress={() => onShowDetails(order)}
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
                numberOfLines={2}
              >
                {orderTitle}
                <Text
                  style={[styles.orderPrice, { color: theme.colors.primary }]}
                >
                  {' '}
                  • ${order.total}
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
});
