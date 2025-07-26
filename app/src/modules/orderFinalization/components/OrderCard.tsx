import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Card,
  Text,
  Checkbox,
  Chip,
  IconButton,
  Icon,
} from 'react-native-paper';
import { OrderForFinalizationList } from '../types/orderFinalization.types';
import { useAppTheme } from '@/app/styles/theme';
import { useResponsive } from '@/app/hooks/useResponsive';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  formatOrderTypeShort,
  formatOrderStatus,
  getOrderStatusColor,
  getPaymentStatus,
} from '@/modules/orders/utils/formatters';

interface OrderCardProps {
  order: OrderForFinalizationList;
  isSelected: boolean;
  onToggleSelection: (orderId: string) => void;
  onShowDetails: (order: OrderForFinalizationList) => void;
  onPrintPress?: (order: OrderForFinalizationList) => void;
}

export const OrderCard = React.memo<OrderCardProps>(
  ({ order, isSelected, onToggleSelection, onShowDetails, onPrintPress }) => {
    const theme = useAppTheme();
    const responsive = useResponsive();
    const styles = React.useMemo(() => createStyles(responsive), [responsive]);

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

    const totalAmount =
      typeof order.total === 'string' ? parseFloat(order.total) : order.total;
    const totalPaid = order.paymentsSummary?.totalPaid || 0;
    const pendingAmount = totalAmount - totalPaid;

    const paymentStatus = getPaymentStatus(order);

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
                        color:
                          pendingAmount > 0 ? theme.colors.error : '#10B981',
                      },
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
                        {
                          color: isSelected
                            ? theme.colors.onPrimaryContainer
                            : theme.colors.onSurfaceVariant,
                        },
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
                  {(() => {
                    const color =
                      paymentStatus === 'paid'
                        ? '#10B981'
                        : paymentStatus === 'partial'
                          ? '#F59E0B'
                          : '#EF4444';
                    const icon =
                      paymentStatus === 'paid'
                        ? '✓'
                        : paymentStatus === 'partial'
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
                        {
                          backgroundColor: '#25D366',
                          borderColor: '#25D366',
                        },
                      ]}
                    >
                      <Icon source="whatsapp" size={12} color="#FFFFFF" />
                    </View>
                  )}

                  {order.preparationScreenStatuses &&
                    order.preparationScreenStatuses.length > 0 && (
                      <>
                        {order.preparationScreenStatuses.map(
                          (screen, index) => {
                            const backgroundColor =
                              screen.status === 'READY'
                                ? '#4CAF50'
                                : screen.status === 'IN_PROGRESS'
                                  ? '#FFA000'
                                  : isSelected
                                    ? theme.colors.primaryContainer
                                    : theme.colors.surfaceVariant;

                            const textColor =
                              screen.status === 'READY' ||
                              screen.status === 'IN_PROGRESS'
                                ? '#FFFFFF'
                                : isSelected
                                  ? theme.colors.onPrimaryContainer
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
                          },
                        )}
                      </>
                    )}
                </View>
              </View>

              <View style={styles.rightContainer}>
                {order.createdBy && (
                  <Text
                    style={[
                      styles.createdByText,
                      {
                        color: isSelected
                          ? theme.colors.onPrimaryContainer
                          : theme.colors.onSurfaceVariant,
                      },
                    ]}
                    numberOfLines={1}
                  >
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
                      backgroundColor: getOrderStatusColor(order.orderStatus, theme),
                    },
                  ]}
                  textStyle={styles.statusChipText}
                >
                  {formatOrderStatus(order.orderStatus)}
                </Chip>
                <View style={styles.actionsContainer}>
                  {onPrintPress && (
                    <TouchableOpacity
                      style={styles.printContainer}
                      onPress={() => onPrintPress(order)}
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
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  },
);

OrderCard.displayName = 'OrderCard';

const createStyles = (responsive: ReturnType<typeof useResponsive>) =>
  StyleSheet.create({
    orderCard: {
      marginBottom: responsive.isTablet ? 6 : 8,
    },
    cardContent: {
      paddingBottom: responsive.isTablet ? 6 : 8,
      paddingTop: responsive.isTablet ? 8 : 12,
      paddingHorizontal: responsive.isTablet ? 12 : 16,
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
      minWidth: responsive.isTablet ? 120 : 140,
      gap: responsive.isTablet ? 4 : 8,
    },
    actionsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 4,
    },
    orderNumber: {
      fontSize: responsive.isTablet ? 14 : 16,
      fontWeight: 'bold',
      lineHeight: responsive.isTablet ? 18 : 22,
      marginBottom: responsive.isTablet ? 2 : 4,
    },
    orderPrice: {
      fontSize: responsive.isTablet ? 13 : 15,
      fontWeight: '700',
    },
    statusChip: {
      minHeight: 24,
      alignSelf: 'flex-end',
      paddingVertical: 2,
    },
    statusChipText: {
      fontSize: responsive.isTablet ? 10 : 12,
      fontWeight: '600',
      color: 'white',
      lineHeight: responsive.isTablet ? 12 : 14,
      marginVertical: 0,
      paddingVertical: 0,
    },
    orderTime: {
      fontSize: responsive.isTablet ? 13 : 16,
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
    checkboxContainer: {
      padding: 8,
      marginLeft: -8,
      marginRight: -12,
    },
    checkbox: {
      margin: 0,
      transform: [{ scale: 1.5 }],
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
      marginLeft: 4,
    },
    inlinePreparationText: {
      fontSize: 10,
      fontWeight: '500',
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
      marginLeft: 4,
    },
    createdByText: {
      fontSize: 10,
      marginBottom: 4,
      textAlign: 'right',
    },
    rightTopRow: {
      width: '100%',
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
