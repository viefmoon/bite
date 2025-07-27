import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Card, Text, Chip, Icon, IconButton, Button } from 'react-native-paper';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAppTheme } from '../../../app/styles/theme';
import { useResponsive } from '../../../app/hooks/useResponsive';
import {
  OrderOpenList,
  OrderTypeEnum,
  OrderStatusEnum,
} from '../schema/orders.schema';

import {
  OrderStatusInfo,
  formatOrderTypeShort,
  getPaymentStatus,
} from '../utils/formatters';

interface OpenOrderItemCardProps {
  order: OrderOpenList;
  selectedOrderType: 'ALL' | 'WHATSAPP' | keyof typeof OrderTypeEnum;
  acceptingOrderId: string | null;
  onPress: (order: OrderOpenList) => void;
  onPrint: (order: OrderOpenList) => void;
  onAcceptWhatsApp: (orderId: string) => void;
}

export const OpenOrderItemCard: React.FC<OpenOrderItemCardProps> = ({
  order,
  selectedOrderType,
  acceptingOrderId,
  onPress,
  onPrint,
  onAcceptWhatsApp,
}) => {
  const theme = useAppTheme();
  const responsive = useResponsive();

  // Construir el título según el tipo de orden
  const orderNum = order.shiftOrderNumber || order.orderNumber;
  const orderType = order.orderType || order.type;
  let orderTitle = `#${orderNum} • ${formatOrderTypeShort(orderType)}`;

  if (orderType === OrderTypeEnum.DINE_IN && order.table) {
    // Para mesas temporales, mostrar solo el nombre sin prefijo "Mesa"
    const tableDisplay = order.table.isTemporary
      ? order.table.name
      : `Mesa ${order.table.name || order.table.number || 'N/A'}`;
    orderTitle += ` • ${order.table.area?.name || 'Sin área'} • ${tableDisplay}`;
  } else if (orderType === OrderTypeEnum.TAKE_AWAY) {
    if (order.deliveryInfo?.recipientName) {
      orderTitle += ` • ${order.deliveryInfo.recipientName}`;
    }
    if (order.deliveryInfo?.recipientPhone) {
      orderTitle += ` • ${order.deliveryInfo.recipientPhone}`;
    }
  } else if (orderType === OrderTypeEnum.DELIVERY) {
    if (order.deliveryInfo?.fullAddress) {
      orderTitle += ` • ${order.deliveryInfo.fullAddress}`;
    }
    if (order.deliveryInfo?.recipientPhone) {
      orderTitle += ` • ${order.deliveryInfo.recipientPhone}`;
    }
  }

  const orderTotal = order.total || order.totalAmount;
  const totalAmount =
    typeof orderTotal === 'string' ? parseFloat(orderTotal) : orderTotal || 0;
  const totalPaid = order.paymentsSummary?.totalPaid || 0;
  const pendingAmount = totalAmount - totalPaid;

  // Estilos inline (extraeremos después)
  const styles = {
    orderCard: {
      marginBottom: responsive.isTablet ? 6 : 8,
    },
    cardContent: {
      paddingBottom: responsive.isTablet ? 6 : 8,
      paddingHorizontal: responsive.isTablet ? 12 : 16,
      paddingTop: responsive.isTablet ? 12 : 16,
    },
    mainContainer: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'flex-start' as const,
    },
    leftContainer: {
      flex: 1,
      paddingRight: responsive.isTablet ? 6 : 8,
    },
    rightContainer: {
      alignItems: 'flex-end' as const,
      justifyContent: 'space-between' as const,
      minWidth: responsive.isTablet ? 120 : 140,
      gap: responsive.isTablet ? 6 : 8,
    },
    actionsContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'flex-end' as const,
      gap: responsive.isTablet ? 2 : 4,
    },
    orderNumber: {
      fontSize: responsive.isTablet ? 14 : 16,
      fontWeight: 'bold' as const,
      lineHeight: responsive.isTablet ? 20 : 22,
      marginBottom: responsive.isTablet ? 2 : 4,
    },
    orderPrice: {
      fontSize: responsive.isTablet ? 13 : 15,
      fontWeight: '700' as const,
    },
    orderPricePending: {
      color: theme.colors.error,
    },
    orderPricePaid: {
      color: '#10B981',
    },
    statusChip: {
      minHeight: responsive.isTablet ? 22 : 24,
      alignSelf: 'flex-end' as const,
      paddingVertical: responsive.isTablet ? 1 : 2,
    },
    statusChipText: {
      fontSize: responsive.isTablet ? 11 : 12,
      fontWeight: '600' as const,
      color: 'white',
      lineHeight: responsive.isTablet ? 13 : 14,
      marginVertical: 0,
      paddingVertical: 0,
    },
    orderTime: {
      fontSize: responsive.isTablet ? 14 : 16,
      fontWeight: '600' as const,
    },
    timeAndPaymentRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 0,
    },
    printButton: {
      margin: responsive.isTablet ? -6 : -4,
    },
    printContainer: {
      position: 'relative' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    printCountBadge: {
      position: 'absolute' as const,
      top: 0,
      right: 0,
      backgroundColor: '#3B82F6',
      borderRadius: responsive.isTablet ? 8 : 10,
      minWidth: responsive.isTablet ? 18 : 20,
      height: responsive.isTablet ? 18 : 20,
      paddingHorizontal: responsive.isTablet ? 3 : 4,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    printCountText: {
      color: '#FFFFFF',
      fontSize: responsive.isTablet ? 9 : 10,
      fontWeight: 'bold' as const,
    },
    notesInline: {
      fontSize: responsive.isTablet ? 11 : 12,
      fontStyle: 'italic' as const,
    },
    inlinePreparationBadge: {
      paddingHorizontal: responsive.isTablet ? 4 : 6,
      paddingVertical: responsive.isTablet ? 1 : 2,
      borderRadius: responsive.isTablet ? 8 : 10,
      borderWidth: 0.5,
      marginLeft: responsive.isTablet ? 3 : 4,
    },
    inlinePreparationText: {
      fontSize: responsive.isTablet ? 9 : 10,
      fontWeight: '500' as const,
    },
    miniPaymentBadge: {
      width: responsive.isTablet ? 18 : 20,
      height: responsive.isTablet ? 18 : 20,
      borderRadius: responsive.isTablet ? 9 : 10,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginLeft: responsive.isTablet ? 4 : 6,
    },
    miniPaymentText: {
      fontSize: responsive.isTablet ? 9 : 10,
      fontWeight: 'bold' as const,
      color: '#FFFFFF',
    },
    createdByText: {
      fontSize: responsive.isTablet ? 9 : 10,
      color: theme.colors.onSurfaceVariant,
      marginBottom: responsive.isTablet ? 3 : 4,
      textAlign: 'right' as const,
    },
    whatsappButton: {
      backgroundColor: '#25D366',
      borderColor: '#25D366',
    },
  };

  return (
    <TouchableOpacity activeOpacity={0.95} onPress={() => onPress(order)}>
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
                    pendingAmount > 0
                      ? styles.orderPricePending
                      : styles.orderPricePaid,
                  ]}
                >
                  {' • '}
                  {pendingAmount > 0
                    ? `Por pagar: $${pendingAmount.toFixed(2)}`
                    : `Pagado: $${totalAmount.toFixed(2)}`}
                </Text>
                {order.notes && (
                  <Text
                    style={[
                      styles.notesInline,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                    numberOfLines={1}
                  >
                    {' • '}
                    {order.notes}
                  </Text>
                )}
              </Text>
              <View style={styles.timeAndPaymentRow}>
                <Text
                  style={[styles.orderTime, { color: theme.colors.primary }]}
                >
                  {format(new Date(order.createdAt), 'p', { locale: es })}
                </Text>
                {(() => {
                  const paymentStatus = getPaymentStatus(order);
                  const color =
                    paymentStatus.status === 'paid'
                      ? '#10B981'
                      : paymentStatus.status === 'partial'
                        ? '#F59E0B'
                        : '#EF4444';
                  const icon =
                    paymentStatus.status === 'paid'
                      ? '✓'
                      : paymentStatus.status === 'partial'
                        ? '½'
                        : '•';
                  return (
                    <View
                      style={[
                        styles.miniPaymentBadge,
                        { backgroundColor: color },
                      ]}
                    >
                      <Text style={styles.miniPaymentText}>{icon}</Text>
                    </View>
                  );
                })()}

                {/* Badge de WhatsApp */}
                {order.isFromWhatsApp && (
                  <View
                    style={[
                      styles.inlinePreparationBadge,
                      styles.whatsappButton,
                    ]}
                  >
                    <Icon source="whatsapp" size={12} color="#FFFFFF" />
                  </View>
                )}

                {order.preparationScreenStatuses &&
                  order.preparationScreenStatuses.length > 0 && (
                    <>
                      {order.preparationScreenStatuses.map((screen, index) => {
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
                            key={`${order.id}-screen-${index}`}
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
                                  ? '⏳ '
                                  : ''}
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
              {order.createdBy && (
                <Text style={styles.createdByText} numberOfLines={1}>
                  {order.createdBy.firstName && order.createdBy.lastName
                    ? `${order.createdBy.firstName} ${order.createdBy.lastName}`
                    : order.createdBy.username}
                </Text>
              )}
              <Chip
                mode="flat"
                compact
                style={[
                  styles.statusChip,
                  {
                    backgroundColor: OrderStatusInfo.getColor(
                      order.orderStatus || order.status,
                      theme,
                    ),
                  },
                ]}
                textStyle={styles.statusChipText}
              >
                {OrderStatusInfo.getLabel(order.orderStatus || order.status)}
              </Chip>
              <View style={styles.actionsContainer}>
                {selectedOrderType === 'WHATSAPP' &&
                (order.orderStatus || order.status) ===
                  OrderStatusEnum.PENDING ? (
                  <Button
                    mode="contained"
                    icon="check"
                    onPress={() => onAcceptWhatsApp(order.id)}
                    disabled={acceptingOrderId === order.id}
                    loading={acceptingOrderId === order.id}
                    compact
                  >
                    Aceptar
                  </Button>
                ) : (
                  <TouchableOpacity
                    style={styles.printContainer}
                    onPress={() => onPrint(order)}
                    activeOpacity={0.7}
                  >
                    <IconButton
                      icon="printer"
                      size={32}
                      style={styles.printButton}
                      disabled
                    />
                    {(order.ticketImpressionCount ?? 0) > 0 && (
                      <View style={styles.printCountBadge}>
                        <Text style={styles.printCountText}>
                          {order.ticketImpressionCount}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};
