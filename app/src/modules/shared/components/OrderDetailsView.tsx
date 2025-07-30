// app/src/modules/shared/components/OrderDetailsView.tsx

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import {
  Surface,
  Text,
  Divider,
  IconButton,
  ActivityIndicator,
} from 'react-native-paper';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAppTheme } from '@/app/styles/theme';
import {
  UnifiedOrderDetails,
  UnifiedOrderItem,
  UnifiedPreparationScreenStatus,
  UnifiedTicketImpression,
} from '../types/unified-order.types';
import {
  PreparationScreenStatusColors,
  PreparationScreenStatusLabels,
} from '../types/preparation-screen-status.enum';
import {
  CustomizationTypeEnum,
  PizzaHalfEnum,
  CustomizationActionEnum,
} from '@/modules/pizzaCustomizations/schema/pizzaCustomization.schema';

interface OrderDetailsViewProps {
  order: UnifiedOrderDetails | null;
  isLoading?: boolean;
  headerActions?: React.ReactNode;
  showFinalizationDate?: boolean;
  showPrintHistory?: boolean;
  onTogglePrintHistory?: () => void;
  noPadding?: boolean;
  compactMode?: boolean;
}

const formatPizzaCustomizations = (customizations: any[]): string => {
  if (!customizations || customizations.length === 0) return '';

  const groupedByHalf = customizations.reduce(
    (acc, curr) => {
      const half =
        curr.half === PizzaHalfEnum.HALF_1
          ? 'HALF_1'
          : curr.half === PizzaHalfEnum.HALF_2
            ? 'HALF_2'
            : 'FULL';

      if (!acc[half]) {
        acc[half] = {
          flavors: [],
          addedIngredients: [],
          removedIngredients: [],
        };
      }

      const name = curr.pizzaCustomization?.name || curr.pizzaCustomizationId;
      const type = curr.pizzaCustomization?.type;

      if (type === 'FLAVOR' || type === CustomizationTypeEnum.FLAVOR) {
        acc[half].flavors.push(name);
      } else if (
        type === 'INGREDIENT' ||
        type === CustomizationTypeEnum.INGREDIENT
      ) {
        if (curr.action === CustomizationActionEnum.ADD) {
          acc[half].addedIngredients.push(name);
        } else {
          acc[half].removedIngredients.push(name);
        }
      }

      return acc;
    },
    {} as Record<
      string,
      {
        flavors: string[];
        addedIngredients: string[];
        removedIngredients: string[];
      }
    >,
  );

  if (groupedByHalf.FULL) {
    const parts: string[] = [];
    if (groupedByHalf.FULL.flavors.length > 0) {
      parts.push(groupedByHalf.FULL.flavors.join(', '));
    }
    if (groupedByHalf.FULL.addedIngredients.length > 0) {
      parts.push(`con: ${groupedByHalf.FULL.addedIngredients.join(', ')}`);
    }
    if (groupedByHalf.FULL.removedIngredients.length > 0) {
      parts.push(`sin: ${groupedByHalf.FULL.removedIngredients.join(', ')}`);
    }
    return parts.join(' - ');
  } else if (groupedByHalf.HALF_1 || groupedByHalf.HALF_2) {
    const formatHalf = (halfData: {
      flavors: string[];
      addedIngredients: string[];
      removedIngredients: string[];
    }) => {
      const parts: string[] = [];
      if (halfData.flavors.length > 0) {
        parts.push(halfData.flavors.join(', '));
      }
      if (halfData.addedIngredients.length > 0) {
        parts.push(`con: ${halfData.addedIngredients.join(', ')}`);
      }
      if (halfData.removedIngredients.length > 0) {
        parts.push(`sin: ${halfData.removedIngredients.join(', ')}`);
      }
      return parts.join(' - ');
    };

    const half1 = groupedByHalf.HALF_1 ? formatHalf(groupedByHalf.HALF_1) : '';
    const half2 = groupedByHalf.HALF_2 ? formatHalf(groupedByHalf.HALF_2) : '';

    return half1 && half2 ? `(${half1} / ${half2})` : half1 || half2;
  }

  return '';
};

export const OrderDetailsView: React.FC<OrderDetailsViewProps> = ({
  order,
  isLoading = false,
  headerActions,
  showFinalizationDate = false,
  showPrintHistory = false,
  onTogglePrintHistory,
  noPadding = false,
  compactMode = false,
}) => {
  const theme = useAppTheme();
  const [localShowPrintHistory, setLocalShowPrintHistory] = useState(false);

  // Calcular padding basado en las props
  const contentPadding = noPadding ? 0 : compactMode ? 8 : 14;
  const verticalSpacing = compactMode ? 6 : 10;
  const cardSpacing = compactMode ? 4 : 8;

  // Estilos dinámicos basados en props
  const dynamicStyles = {
    headerInfo: {
      paddingHorizontal: contentPadding,
      paddingVertical: verticalSpacing,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0,0,0,0.08)',
      marginBottom: compactMode ? 6 : 12,
    },
    infoSection: {
      paddingHorizontal: contentPadding,
      gap: 5,
      marginBottom: verticalSpacing,
      paddingVertical: verticalSpacing,
    },
    itemsList: {
      paddingHorizontal: contentPadding,
      paddingVertical: compactMode ? 8 : 12,
      marginBottom: verticalSpacing,
    },
    paymentsSection: {
      paddingHorizontal: contentPadding,
      marginBottom: compactMode ? 8 : 12,
    },
    ticketImpressionsSection: {
      paddingHorizontal: contentPadding,
      marginBottom: compactMode ? 8 : 12,
    },
    footer: {
      paddingHorizontal: contentPadding,
      paddingVertical: compactMode ? 10 : 14,
      borderTopWidth: 1,
      borderTopColor: 'rgba(0,0,0,0.08)',
    },
  };

  const shouldShowPrintHistory = onTogglePrintHistory
    ? showPrintHistory
    : localShowPrintHistory;
  const handleTogglePrintHistory = onTogglePrintHistory
    ? onTogglePrintHistory
    : () => setLocalShowPrintHistory(!localShowPrintHistory);

  const getOrderStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pendiente';
      case 'IN_PROGRESS':
        return 'En preparación';
      case 'READY':
        return 'Listo';
      case 'DELIVERED':
        return 'Entregado';
      case 'COMPLETED':
        return 'Completado';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#FFA726';
      case 'IN_PROGRESS':
        return theme.colors.primary;
      case 'READY':
        return '#66BB6A';
      case 'DELIVERED':
        return '#9C27B0';
      case 'COMPLETED':
        return '#10B981';
      case 'CANCELLED':
        return theme.colors.error;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const getPreparationStatusColor = (status?: string) => {
    const preparationStatusColors = {
      PENDING: '#FFA726',
      IN_PROGRESS: '#42A5F5',
      READY: '#66BB6A',
      DELIVERED: '#26A69A',
      CANCELLED: '#EF5350',
    };
    return (
      preparationStatusColors[status as keyof typeof preparationStatusColors] ||
      theme.colors.onSurfaceVariant
    );
  };

  const getPreparationStatusLabel = (status?: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pendiente';
      case 'IN_PROGRESS':
        return 'Preparando';
      case 'READY':
        return 'Listo';
      case 'DELIVERED':
        return 'Entregado';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return status || '';
    }
  };

  const getPaymentStatus = () => {
    if (order?.payments && order.payments.length > 0) {
      const totalPaid = order.payments.reduce((sum, p) => sum + p.amount, 0);
      const totalAmount = order.total || 0;

      if (totalPaid >= totalAmount) {
        return { label: 'Pagado', color: '#10B981' };
      } else if (totalPaid > 0) {
        return { label: 'Parcial', color: '#F59E0B' };
      }
    }
    return { label: 'Pendiente', color: '#EF4444' };
  };

  const renderItem = (item: UnifiedOrderItem) => {
    const quantity = item.quantity || 1;
    const unitPrice = item.finalPrice;
    const totalPrice = unitPrice * quantity;
    const statusColor = getPreparationStatusColor(item.preparationStatus);

    return (
      <Surface
        style={[
          styles.itemCard,
          {
            backgroundColor: theme.colors.elevation.level1,
            marginBottom: cardSpacing,
          },
        ]}
        elevation={1}
      >
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <View style={styles.nameContainer}>
              <Text
                style={[styles.itemQuantity, { color: theme.colors.primary }]}
              >
                {quantity}x
              </Text>
              <Text
                style={[styles.itemName, { color: theme.colors.onSurface }]}
                numberOfLines={1}
              >
                {item.variantName || item.productName}
              </Text>
            </View>
            {item.preparationStatus && (
              <View
                style={[styles.statusChip, { backgroundColor: statusColor }]}
              >
                <Text style={styles.statusChipText}>
                  {getPreparationStatusLabel(item.preparationStatus)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.itemDetailsContainer}>
            {item.selectedPizzaCustomizations &&
              item.selectedPizzaCustomizations.length > 0 && (
                <View style={styles.customizationContainer}>
                  <Text
                    style={[
                      styles.pizzaCustomizationText,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {formatPizzaCustomizations(
                      item.selectedPizzaCustomizations,
                    )}
                  </Text>
                </View>
              )}

            {item.modifiers && item.modifiers.length > 0 && (
              <View style={styles.modifiersContainer}>
                {item.modifiers.map((modifier) => (
                  <View key={modifier.id} style={styles.modifierRow}>
                    <Text
                      style={[
                        styles.modifierText,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                    >
                      • {modifier.name}
                    </Text>
                    {modifier.price && modifier.price > 0 && (
                      <Text
                        style={[
                          styles.modifierPrice,
                          { color: theme.colors.tertiary },
                        ]}
                      >
                        +${modifier.price.toFixed(2)}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {item.preparationNotes && (
              <View style={styles.notesContainer}>
                <Text
                  style={[
                    styles.notesText,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  📝 {item.preparationNotes}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.priceContainer}>
            <View style={styles.priceRow}>
              <Text
                style={[
                  styles.priceLabel,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                P. unitario:
              </Text>
              <Text
                style={[styles.priceValue, { color: theme.colors.onSurface }]}
              >
                ${unitPrice.toFixed(2)}
              </Text>
            </View>
            {quantity > 1 && (
              <View style={styles.priceRow}>
                <Text
                  style={[
                    styles.priceLabel,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  Total ×{quantity}:
                </Text>
                <Text
                  style={[styles.totalPrice, { color: theme.colors.primary }]}
                >
                  ${totalPrice.toFixed(2)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Surface>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text
          style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}
        >
          Cargando detalles de la orden...
        </Text>
      </View>
    );
  }

  if (!order) {
    return null;
  }

  const paymentStatus = getPaymentStatus();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Info */}
      <View style={dynamicStyles.headerInfo}>
        <View style={styles.chipsRow}>
          <View
            style={[
              styles.headerStatusChip,
              {
                backgroundColor: getStatusColor(order.orderStatus),
              },
            ]}
          >
            <Text style={styles.headerStatusChipText}>
              {getOrderStatusLabel(order.orderStatus)}
            </Text>
          </View>
          {order.preparationScreenStatuses &&
            order.preparationScreenStatuses.map(
              (screenStatus: UnifiedPreparationScreenStatus) => {
                const getStatusColor = (status: string) => {
                  return (
                    PreparationScreenStatusColors[
                      status as keyof typeof PreparationScreenStatusColors
                    ] || theme.colors.onSurfaceVariant
                  );
                };

                const getStatusLabel = (status: string) => {
                  return (
                    PreparationScreenStatusLabels[
                      status as keyof typeof PreparationScreenStatusLabels
                    ] || status
                  );
                };

                return (
                  <View
                    key={screenStatus.id}
                    style={[
                      styles.preparationScreenStatus,
                      {
                        backgroundColor:
                          getStatusColor(screenStatus.status) + '20',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.preparationScreenName,
                        { color: getStatusColor(screenStatus.status) },
                      ]}
                    >
                      🍳 {screenStatus.preparationScreenName}
                    </Text>
                    <Text
                      style={[
                        styles.preparationScreenStatusText,
                        { color: getStatusColor(screenStatus.status) },
                      ]}
                    >
                      {getStatusLabel(screenStatus.status)}
                    </Text>
                  </View>
                );
              },
            )}
        </View>
        <View style={styles.headerDatesRow}>
          <Text
            style={[
              styles.headerDate,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Creado:{' '}
            {order.createdAt
              ? format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm', {
                  locale: es,
                })
              : ''}
          </Text>
          {showFinalizationDate && order.finalizedAt && (
            <Text style={[styles.headerDate, { color: theme.colors.primary }]}>
              Finalizado:{' '}
              {format(new Date(order.finalizedAt), 'dd/MM/yyyy HH:mm', {
                locale: es,
              })}
            </Text>
          )}
        </View>
        {headerActions && (
          <View style={styles.headerActions}>{headerActions}</View>
        )}
      </View>

      {/* Order Info Section */}
      <View style={dynamicStyles.infoSection}>
        {order.deliveryInfo?.recipientName && (
          <View style={styles.infoRow}>
            <Text
              style={[styles.contactText, { color: theme.colors.onSurface }]}
            >
              👤 Nombre del Cliente: {order.deliveryInfo.recipientName}
            </Text>
          </View>
        )}

        {order.deliveryInfo?.recipientPhone && (
          <View style={styles.infoRow}>
            <Text
              style={[styles.contactText, { color: theme.colors.onSurface }]}
            >
              📞 Teléfono: {order.deliveryInfo.recipientPhone}
            </Text>
          </View>
        )}

        {order.orderType === 'DELIVERY' && order.deliveryInfo?.fullAddress && (
          <View style={styles.infoRow}>
            <Text
              style={[
                styles.addressText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              📦 Dirección de Entrega: {order.deliveryInfo.fullAddress}
            </Text>
          </View>
        )}

        {order.orderType === 'DINE_IN' && order.table && (
          <View style={styles.infoRow}>
            <Text style={[styles.tableText, { color: theme.colors.onSurface }]}>
              🏛️ Mesa: {order.table.area?.name || 'Sin área'} -{' '}
              {order.table.name || order.table.number}
            </Text>
          </View>
        )}

        {order.scheduledAt && (
          <View style={styles.infoRow}>
            <Text
              style={[
                styles.contactText,
                styles.scheduledTimeText,
                { color: theme.colors.primary },
              ]}
            >
              ⏰ Hora de Entrega Programada:{' '}
              {format(new Date(order.scheduledAt), 'HH:mm', {
                locale: es,
              })}
            </Text>
          </View>
        )}

        {order.user && (
          <View style={styles.infoRow}>
            <Text
              style={[
                styles.contactText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              👨‍💼 Atendido por: {order.user.firstName} {order.user.lastName}
            </Text>
          </View>
        )}

        {order.notes && (
          <View style={styles.infoRow}>
            <Text
              style={[
                styles.notesText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              📋 Notas: {order.notes}
            </Text>
          </View>
        )}
      </View>

      <Divider style={styles.divider} />

      {/* Order Items */}
      <View style={dynamicStyles.itemsList}>
        {order.orderItems?.map((item) => (
          <React.Fragment key={item.id || `item-${item.productName}`}>
            {renderItem(item)}
          </React.Fragment>
        ))}
      </View>

      <Divider style={styles.divider} />

      {/* Payments Section */}
      {order.payments && order.payments.length > 0 && (
        <>
          <View style={dynamicStyles.paymentsSection}>
            <View style={styles.paymentSummaryCompact}>
              <View style={styles.summaryCompactRow}>
                <Text
                  style={[
                    styles.summaryCompactLabel,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  Total: ${(order.total || 0).toFixed(2)}
                </Text>
                <Text
                  style={[styles.summaryCompactLabel, styles.paidAmountText]}
                >
                  Pagado: $
                  {order.payments
                    .reduce((sum, p) => sum + p.amount, 0)
                    .toFixed(2)}
                </Text>
                {(() => {
                  const totalPaid = order.payments!.reduce(
                    (sum, p) => sum + p.amount,
                    0,
                  );
                  const remaining = (order.total || 0) - totalPaid;
                  if (remaining > 0) {
                    return (
                      <Text
                        style={[
                          styles.summaryCompactLabel,
                          styles.remainingAmountText,
                          { color: theme.colors.error },
                        ]}
                      >
                        Resta: ${remaining.toFixed(2)}
                      </Text>
                    );
                  }
                  return null;
                })()}
              </View>
            </View>

            {order.payments.map((payment, index) => {
              const getPaymentMethodLabel = (method: string) => {
                switch (method) {
                  case 'CASH':
                  case 'cash':
                    return 'Efectivo';
                  case 'CREDIT_CARD':
                  case 'card':
                    return 'Tarjeta de Crédito';
                  case 'DEBIT_CARD':
                    return 'Tarjeta de Débito';
                  case 'TRANSFER':
                  case 'transfer':
                    return 'Transferencia';
                  case 'OTHER':
                    return 'Otro';
                  default:
                    return method;
                }
              };

              const getPaymentStatusColor = (status: string) => {
                switch (status) {
                  case 'COMPLETED':
                    return '#10B981';
                  case 'PENDING':
                    return '#F59E0B';
                  case 'FAILED':
                    return theme.colors.error;
                  case 'REFUNDED':
                    return '#6B7280';
                  case 'CANCELLED':
                    return theme.colors.error;
                  default:
                    return theme.colors.onSurfaceVariant;
                }
              };

              const getPaymentStatusLabel = (status: string) => {
                switch (status) {
                  case 'COMPLETED':
                    return 'Completado';
                  case 'PENDING':
                    return 'Pendiente';
                  case 'FAILED':
                    return 'Fallido';
                  case 'REFUNDED':
                    return 'Reembolsado';
                  case 'CANCELLED':
                    return 'Cancelado';
                  default:
                    return status;
                }
              };

              return (
                <View
                  key={payment.id || index}
                  style={styles.paymentRowCompact}
                >
                  <Text
                    style={[
                      styles.paymentMethodCompact,
                      { color: theme.colors.onSurface },
                    ]}
                  >
                    💳 {getPaymentMethodLabel(payment.paymentMethod)}
                  </Text>
                  <Text
                    style={[
                      styles.paymentDateCompact,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {format(new Date(payment.createdAt), 'HH:mm', {
                      locale: es,
                    })}
                  </Text>
                  <View
                    style={[
                      styles.paymentStatusBadgeCompact,
                      {
                        backgroundColor:
                          getPaymentStatusColor(payment.paymentStatus) + '20',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.paymentStatusTextCompact,
                        {
                          color: getPaymentStatusColor(payment.paymentStatus),
                        },
                      ]}
                    >
                      {getPaymentStatusLabel(payment.paymentStatus)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.paymentAmountCompact,
                      { color: theme.colors.primary },
                    ]}
                  >
                    ${payment.amount.toFixed(2)}
                  </Text>
                </View>
              );
            })}
          </View>
          <Divider style={styles.divider} />
        </>
      )}

      {/* Ticket Impressions Section */}
      {order.ticketImpressions && order.ticketImpressions.length > 0 && (
        <>
          <View style={dynamicStyles.ticketImpressionsSection}>
            <TouchableOpacity
              style={styles.collapsibleHeader}
              onPress={handleTogglePrintHistory}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.sectionTitle, { color: theme.colors.primary }]}
              >
                🖨️ Historial de Impresiones ({order.ticketImpressions.length})
              </Text>
              <IconButton
                icon={shouldShowPrintHistory ? 'chevron-up' : 'chevron-down'}
                size={20}
                style={styles.collapseIcon}
              />
            </TouchableOpacity>

            {shouldShowPrintHistory && (
              <View style={styles.collapsibleContent}>
                {order.ticketImpressions.map(
                  (impression: UnifiedTicketImpression, index) => {
                    const getTicketTypeLabel = (type: string) => {
                      switch (type) {
                        case 'KITCHEN':
                          return '🍳 Cocina';
                        case 'BAR':
                          return '🍺 Barra';
                        case 'BILLING':
                          return '💵 Cuenta';
                        case 'CUSTOMER_COPY':
                          return '📄 Copia Cliente';
                        case 'GENERAL':
                          return '📋 General';
                        default:
                          return type;
                      }
                    };

                    return (
                      <View
                        key={impression.id || index}
                        style={styles.impressionRow}
                      >
                        <View style={styles.impressionLeft}>
                          <Text
                            style={[
                              styles.impressionType,
                              { color: theme.colors.onSurface },
                            ]}
                          >
                            {getTicketTypeLabel(impression.ticketType)}
                          </Text>
                          <View style={styles.impressionDetails}>
                            {impression.user && (
                              <Text
                                style={[
                                  styles.impressionUser,
                                  {
                                    color: theme.colors.onSurfaceVariant,
                                  },
                                ]}
                              >
                                por {impression.user.firstName || ''}{' '}
                                {impression.user.lastName || ''}
                              </Text>
                            )}
                            {impression.printer && (
                              <Text
                                style={[
                                  styles.impressionPrinter,
                                  {
                                    color: theme.colors.onSurfaceVariant,
                                  },
                                ]}
                              >
                                🖨️ {impression.printer.name}
                              </Text>
                            )}
                          </View>
                        </View>
                        <Text
                          style={[
                            styles.impressionTime,
                            { color: theme.colors.onSurfaceVariant },
                          ]}
                        >
                          {impression.impressionTime
                            ? format(
                                new Date(impression.impressionTime),
                                'HH:mm:ss',
                                { locale: es },
                              )
                            : 'N/A'}
                        </Text>
                      </View>
                    );
                  },
                )}
              </View>
            )}
          </View>
        </>
      )}

      {/* Footer with Payment Status */}
      <View style={dynamicStyles.footer}>
        <View style={styles.footerLeft}>
          <Text
            style={[
              styles.totalLabel,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Total:
          </Text>
          <Text style={[styles.totalAmount, { color: theme.colors.primary }]}>
            ${(order.total || 0).toFixed(2)}
          </Text>
        </View>
        <View
          style={[
            styles.paymentBadge,
            { backgroundColor: paymentStatus.color },
          ]}
        >
          <Text style={styles.paymentBadgeText}>💵 {paymentStatus.label}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  headerInfo: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
    marginBottom: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  headerStatusChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  headerStatusChipText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  preparationScreenStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    marginRight: 6,
    marginBottom: 4,
  },
  preparationScreenName: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 1,
  },
  preparationScreenStatusText: {
    fontSize: 9,
    fontWeight: '500',
  },
  headerDatesRow: {
    gap: 4,
  },
  headerDate: {
    fontSize: 11,
  },
  headerActions: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  infoSection: {
    paddingHorizontal: 14,
    gap: 5,
    marginBottom: 10,
    paddingVertical: 10,
  },
  infoRow: {
    marginVertical: 1,
  },
  contactText: {
    fontSize: 12,
  },
  addressText: {
    fontSize: 12,
    lineHeight: 16,
  },
  tableText: {
    fontSize: 12,
  },
  scheduledTimeText: {
    fontWeight: '600',
  },
  divider: {
    marginVertical: 2,
  },
  itemsList: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  itemCard: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  itemCardWithBackground: {
    marginBottom: 8,
  },
  itemContent: {
    padding: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  nameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: '700',
    marginRight: 6,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusChipText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  itemDetailsContainer: {
    marginBottom: 3,
  },
  customizationContainer: {
    marginBottom: 4,
  },
  pizzaCustomizationText: {
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 14,
  },
  modifiersContainer: {
    marginTop: 2,
  },
  modifierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 1,
  },
  modifierText: {
    fontSize: 11,
    flex: 1,
    lineHeight: 14,
  },
  modifierPrice: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 4,
  },
  notesContainer: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  notesText: {
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 14,
  },
  priceContainer: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  priceLabel: {
    fontSize: 11,
    opacity: 0.7,
  },
  priceValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  totalPrice: {
    fontSize: 14,
    fontWeight: '700',
  },
  paymentsSection: {
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  paymentSummaryCompact: {
    marginBottom: 8,
  },
  summaryCompactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryCompactLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  paidAmountText: {
    color: '#10B981',
  },
  remainingAmountText: {
    fontWeight: '600',
  },
  paymentRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  paymentMethodCompact: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  paymentDateCompact: {
    fontSize: 10,
  },
  paymentAmountCompact: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'right',
  },
  paymentStatusBadgeCompact: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  paymentStatusTextCompact: {
    fontSize: 9,
    fontWeight: '600',
  },
  ticketImpressionsSection: {
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 4,
  },
  collapseIcon: {
    margin: -8,
  },
  collapsibleContent: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 0,
  },
  impressionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingLeft: 8,
  },
  impressionLeft: {
    flex: 1,
    gap: 2,
  },
  impressionType: {
    fontSize: 12,
    fontWeight: '500',
  },
  impressionDetails: {
    gap: 2,
  },
  impressionUser: {
    fontSize: 11,
    opacity: 0.7,
  },
  impressionPrinter: {
    fontSize: 11,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  impressionTime: {
    fontSize: 11,
    opacity: 0.7,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  paymentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});
