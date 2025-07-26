import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import {
  Surface,
  Text,
  Divider,
  Appbar,
  ActivityIndicator,
  IconButton,
  Chip,
} from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Receipt } from '@/modules/receipts/schema/receipt.schema';
import {
  CustomizationTypeEnum,
  PizzaHalfEnum,
  CustomizationActionEnum,
} from '@/modules/pizzaCustomizations/schema/pizzaCustomization.schema';

interface OrderDetailsViewProps {
  order: Receipt | null;
  onBack: () => void;
  onShowHistory?: () => void;
  isLoading?: boolean;
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
  onBack,
  onShowHistory,
  isLoading = false,
}) => {
  const theme = useAppTheme();
  const [showPrintHistory, setShowPrintHistory] = useState(false);

  const getOrderTypeLabel = (type: string) => {
    switch (type) {
      case 'DINE_IN':
        return '🍽️ Local';
      case 'TAKE_AWAY':
        return '🥡 Llevar';
      case 'DELIVERY':
        return '🚚 Envío';
      default:
        return type;
    }
  };

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

  const getPaymentStatus = () => {
    if (
      order?.payments &&
      Array.isArray(order.payments) &&
      order.payments.length > 0
    ) {
      const totalPaid = order.payments.reduce((sum, p) => sum + p.amount, 0);
      const totalAmount =
        typeof order.total === 'string'
          ? parseFloat(order.total)
          : order.total || 0;

      if (totalPaid >= totalAmount) {
        return { label: 'Pagado', color: '#10B981' };
      } else if (totalPaid > 0) {
        return { label: 'Parcial', color: '#F59E0B' };
      }
    }
    return { label: 'Pendiente', color: '#EF4444' };
  };

  const paymentStatus = order
    ? getPaymentStatus()
    : { label: 'Pendiente', color: '#EF4444' };

  const renderItem = (item: any) => {
    const quantity = item.quantity || 1;
    const unitPrice = parseFloat(item.finalPrice);
    const totalPrice = unitPrice * quantity;
    const preparationStatusColors = {
      PENDING: '#FFA726',
      IN_PROGRESS: '#42A5F5',
      READY: '#66BB6A',
      DELIVERED: '#26A69A',
      CANCELLED: '#EF5350',
    };
    const statusColor =
      preparationStatusColors[
        item.preparationStatus as keyof typeof preparationStatusColors
      ] || theme.colors.onSurfaceVariant;

    return (
      <Surface
        key={`${item.id}`}
        style={[
          styles.itemCard,
          { backgroundColor: theme.colors.elevation.level1, marginBottom: 8 },
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
                {item.productVariant?.name || item.product.name}
              </Text>
            </View>
            {item.preparationStatus && (
              <View
                style={[styles.statusChip, { backgroundColor: statusColor }]}
              >
                <Text style={styles.statusChipText}>
                  {item.preparationStatus === 'PENDING' && 'Pendiente'}
                  {item.preparationStatus === 'IN_PROGRESS' && 'Preparando'}
                  {item.preparationStatus === 'READY' && 'Listo'}
                  {item.preparationStatus === 'DELIVERED' && 'Entregado'}
                  {item.preparationStatus === 'CANCELLED' && 'Cancelado'}
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

            {item.productModifiers && item.productModifiers.length > 0 && (
              <View style={styles.modifiersContainer}>
                {item.productModifiers.map((modifier: any) => (
                  <View key={modifier.id} style={styles.modifierRow}>
                    <Text
                      style={[
                        styles.modifierText,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                    >
                      • {modifier.name}
                    </Text>
                    {modifier.price && Number(modifier.price) > 0 && (
                      <Text
                        style={[
                          styles.modifierPrice,
                          { color: theme.colors.tertiary },
                        ]}
                      >
                        +${Number(modifier.price).toFixed(2)}
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
      <View style={styles.container}>
        <Appbar.Header style={styles.appbarHeader}>
          <Appbar.BackAction onPress={onBack} />
          <Appbar.Content title="Cargando..." />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            style={[
              styles.loadingText,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Cargando detalles del recibo...
          </Text>
        </View>
      </View>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header style={styles.appbarHeader}>
        <Appbar.BackAction onPress={onBack} />
        <Appbar.Content title={`Recibo #${order?.shiftOrderNumber || ''}`} />
        <Appbar.Action
          icon="history"
          size={28}
          onPress={onShowHistory}
          disabled={!onShowHistory}
        />
      </Appbar.Header>

      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeft}>
              <Text style={[styles.orderType, { color: theme.colors.primary }]}>
                {order ? getOrderTypeLabel(order.orderType as string) : ''}
              </Text>
            </View>
          </View>
          <View style={styles.headerBottomRow}>
            <View style={styles.chipsRow}>
              <View
                style={[
                  styles.headerStatusChip,
                  {
                    backgroundColor: order
                      ? getStatusColor(order.orderStatus as string)
                      : theme.colors.surfaceVariant,
                  },
                ]}
              >
                <Text style={styles.headerStatusChipText}>
                  {order
                    ? getOrderStatusLabel(order.orderStatus as string)
                    : ''}
                </Text>
              </View>
              {order?.preparationScreens &&
              Array.isArray(order.preparationScreens)
                ? (order.preparationScreens as any[]).map(
                    (screen: any, index: number) => (
                      <Chip
                        key={index}
                        mode="outlined"
                        compact
                        style={styles.screenChip}
                        textStyle={styles.screenChipText}
                      >
                        🍳 {screen}
                      </Chip>
                    ),
                  )
                : null}
            </View>
          </View>
          <View style={styles.headerDatesRow}>
            <Text
              style={[
                styles.headerDate,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Creado:{' '}
              {order?.createdAt
                ? format(
                    new Date(order.createdAt as string),
                    'dd/MM/yyyy HH:mm',
                    {
                      locale: es,
                    },
                  )
                : ''}
            </Text>
            {order?.finalizedAt ? (
              <Text
                style={[styles.headerDate, { color: theme.colors.primary }]}
              >
                Finalizado:{' '}
                {format(
                  new Date(order.finalizedAt as string),
                  'dd/MM/yyyy HH:mm',
                  {
                    locale: es,
                  },
                )}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.infoSection}>
          {order?.deliveryInfo &&
          typeof order.deliveryInfo === 'object' &&
          'recipientName' in order.deliveryInfo &&
          order.deliveryInfo.recipientName ? (
            <View style={styles.infoRow}>
              <Text
                style={[styles.contactText, { color: theme.colors.onSurface }]}
              >
                👤 Nombre del Cliente:{' '}
                {String(order.deliveryInfo.recipientName)}
              </Text>
            </View>
          ) : null}

          {order?.deliveryInfo &&
          typeof order.deliveryInfo === 'object' &&
          'recipientPhone' in order.deliveryInfo &&
          order.deliveryInfo.recipientPhone ? (
            <View style={styles.infoRow}>
              <Text
                style={[styles.contactText, { color: theme.colors.onSurface }]}
              >
                📞 Teléfono: {String(order.deliveryInfo.recipientPhone)}
              </Text>
            </View>
          ) : null}

          {order?.orderType === 'DELIVERY' &&
          order?.deliveryInfo &&
          typeof order.deliveryInfo === 'object' &&
          'fullAddress' in order.deliveryInfo &&
          order.deliveryInfo.fullAddress ? (
            <View style={styles.infoRow}>
              <Text
                style={[
                  styles.addressText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                📦 Dirección de Entrega:{' '}
                {String(order.deliveryInfo.fullAddress)}
              </Text>
            </View>
          ) : null}

          {order?.orderType === 'DINE_IN' &&
          order?.table &&
          typeof order.table === 'object' ? (
            <View style={styles.infoRow}>
              <Text
                style={[styles.tableText, { color: theme.colors.onSurface }]}
              >
                🏛️ Mesa: {(order.table as any)?.area?.name || 'Sin área'} -{' '}
                {(order.table as any)?.name}
              </Text>
            </View>
          ) : null}

          {order?.scheduledAt ? (
            <View style={styles.infoRow}>
              <Text
                style={[
                  styles.contactText,
                  { color: theme.colors.primary, fontWeight: '600' },
                ]}
              >
                ⏰ Hora de Entrega Programada:{' '}
                {order.scheduledAt
                  ? format(new Date(order.scheduledAt as string), 'HH:mm', {
                      locale: es,
                    })
                  : 'No especificada'}
              </Text>
            </View>
          ) : null}

          {order?.user ? (
            <View style={styles.infoRow}>
              <Text
                style={[
                  styles.contactText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                👨‍💼 Atendido por: {(order.user as any)?.firstName}{' '}
                {(order.user as any)?.lastName}
              </Text>
            </View>
          ) : null}

          {order?.notes ? (
            <View style={styles.infoRow}>
              <Text
                style={[
                  styles.notesText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                📋 Notas: {order.notes as string}
              </Text>
            </View>
          ) : null}
        </View>

        <Divider style={styles.divider} />

        <View style={styles.itemsList}>
          {Array.isArray(order?.orderItems)
            ? order.orderItems.map((item) => renderItem(item))
            : []}
        </View>

        <Divider style={styles.divider} />

        {order?.payments &&
          Array.isArray(order.payments) &&
          order.payments.length > 0 && (
            <>
              <View style={styles.paymentsSection}>
                <View style={styles.paymentSummaryCompact}>
                  <View style={styles.summaryCompactRow}>
                    <Text
                      style={[
                        styles.summaryCompactLabel,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                    >
                      Total: $
                      {typeof order.total === 'string'
                        ? parseFloat(order.total).toFixed(2)
                        : typeof order.total === 'number'
                          ? order.total.toFixed(2)
                          : '0.00'}
                    </Text>
                    <Text
                      style={[styles.summaryCompactLabel, { color: '#10B981' }]}
                    >
                      Pagado: $
                      {Array.isArray(order.payments)
                        ? order.payments
                            .reduce(
                              (sum, p) => sum + (Number(p.amount) || 0),
                              0,
                            )
                            .toFixed(2)
                        : '0.00'}
                    </Text>
                    {(() => {
                      const totalAmount =
                        typeof order.total === 'string'
                          ? parseFloat(order.total)
                          : typeof order.total === 'number'
                            ? order.total
                            : 0;
                      const totalPaid = Array.isArray(order.payments)
                        ? order.payments.reduce(
                            (sum, p) => sum + (Number(p.amount) || 0),
                            0,
                          )
                        : 0;
                      const remaining = totalAmount - totalPaid;
                      if (remaining > 0) {
                        return (
                          <Text
                            style={[
                              styles.summaryCompactLabel,
                              {
                                color: theme.colors.error,
                                fontWeight: '600',
                              },
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

                {Array.isArray(order.payments)
                  ? order.payments.map((payment, index) => {
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
                                  getPaymentStatusColor(payment.paymentStatus) +
                                  '20',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.paymentStatusTextCompact,
                                {
                                  color: getPaymentStatusColor(
                                    payment.paymentStatus,
                                  ),
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
                            ${Number(payment.amount).toFixed(2)}
                          </Text>
                        </View>
                      );
                    })
                  : null}
              </View>
              <Divider style={styles.divider} />
            </>
          )}

        {order?.ticketImpressions &&
          Array.isArray(order.ticketImpressions) &&
          order.ticketImpressions.length > 0 && (
            <>
              <View style={styles.ticketImpressionsSection}>
                <TouchableOpacity
                  style={styles.collapsibleHeader}
                  onPress={() => setShowPrintHistory(!showPrintHistory)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: theme.colors.primary },
                    ]}
                  >
                    🖨️ Historial de Impresiones (
                    {Array.isArray(order.ticketImpressions)
                      ? order.ticketImpressions.length
                      : 0}
                    )
                  </Text>
                  <IconButton
                    icon={showPrintHistory ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    style={styles.collapseIcon}
                  />
                </TouchableOpacity>

                {showPrintHistory && (
                  <View style={styles.collapsibleContent}>
                    {Array.isArray(order.ticketImpressions)
                      ? order.ticketImpressions.map((impression, index) => {
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
                                {format(
                                  new Date(impression.impressionTime),
                                  'HH:mm:ss',
                                  { locale: es },
                                )}
                              </Text>
                            </View>
                          );
                        })
                      : null}
                  </View>
                )}
              </View>
            </>
          )}
      </ScrollView>

      <Divider style={styles.divider} />

      <View style={styles.footer}>
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
            $
            {order
              ? typeof order.total === 'string'
                ? parseFloat(order.total).toFixed(2)
                : typeof order.total === 'number'
                  ? order.total.toFixed(2)
                  : '0.00'
              : '0.00'}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appbarHeader: {
    elevation: 0,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerLeft: {
    flex: 1,
  },
  headerBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerDatesRow: {
    gap: 8,
    marginTop: 4,
  },
  chipsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  headerSeparator: {
    fontSize: 14,
    marginHorizontal: 6,
  },
  orderType: {
    fontSize: 15,
    fontWeight: '600',
  },
  headerDate: {
    fontSize: 13,
  },
  headerInfo: {
    // Contenedor para toda la información del header
  },
  infoSection: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 6,
    gap: 4,
  },
  infoRow: {
    marginVertical: 2,
  },
  contactText: {
    fontSize: 14,
  },
  addressText: {
    fontSize: 14,
    lineHeight: 18,
  },
  tableText: {
    fontSize: 14,
  },
  screenChip: {
    height: 24,
  },
  screenChipText: {
    fontSize: 12,
    marginVertical: -2,
  },
  paymentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
    backgroundColor: 'inherit',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    marginVertical: 2,
  },
  headerStatusChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  headerStatusChipText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  scrollView: {
    flexGrow: 0,
    flexShrink: 1,
    maxHeight: '70%',
  },
  scrollContent: {
    paddingBottom: 8,
  },
  itemsList: {
    padding: 12,
    paddingBottom: 16,
  },
  itemCard: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  itemContent: {
    padding: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  nameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  itemQuantity: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 6,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusChipText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  itemDetailsContainer: {
    marginBottom: 6,
  },
  customizationContainer: {
    marginBottom: 4,
  },
  pizzaCustomizationText: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 16,
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
    fontSize: 13,
    flex: 1,
    lineHeight: 16,
  },
  modifierPrice: {
    fontSize: 13,
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
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  priceContainer: {
    marginTop: 6,
    paddingTop: 6,
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
    fontSize: 13,
    opacity: 0.7,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  paymentsSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    fontSize: 14,
    fontWeight: '500',
  },
  paymentRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  paymentMethodCompact: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  paymentDateCompact: {
    fontSize: 12,
  },
  paymentAmountCompact: {
    fontSize: 14,
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
    fontSize: 11,
    fontWeight: '600',
  },
  ticketImpressionsSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    fontSize: 16,
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
    fontSize: 14,
    fontWeight: '500',
  },
  impressionDetails: {
    gap: 2,
  },
  impressionUser: {
    fontSize: 13,
    opacity: 0.7,
  },
  impressionPrinter: {
    fontSize: 13,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  impressionTime: {
    fontSize: 13,
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});
