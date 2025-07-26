import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Surface,
  Text,
  Divider,
  IconButton,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import { Receipt } from '../types/receipt.types';
import { useAppTheme } from '@/app/styles/theme';
import { ResponsiveModal } from '@/app/components/responsive/ResponsiveModal';
import {
  CustomizationType,
  PizzaHalf,
  CustomizationAction,
} from '@/modules/pizzaCustomizations/types/pizzaCustomization.types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import OrderHistoryModal from '@/modules/shared/components/OrderHistoryModal';
import {
  OrderStatusInfo,
  PreparationStatusInfo,
} from '@/modules/orders/utils/formatters';

interface ReceiptDetailsModalProps {
  visible: boolean;
  onDismiss: () => void;
  receipt: Receipt | null;
  isLoading?: boolean;
}

const formatPizzaCustomizations = (customizations: any[]): string => {
  if (!customizations || customizations.length === 0) return '';

  const groupedByHalf = customizations.reduce(
    (acc, curr) => {
      const half =
        curr.half === PizzaHalf.HALF_1
          ? 'HALF_1'
          : curr.half === PizzaHalf.HALF_2
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

      if (type === 'FLAVOR' || type === CustomizationType.FLAVOR) {
        acc[half].flavors.push(name);
      } else if (
        type === 'INGREDIENT' ||
        type === CustomizationType.INGREDIENT
      ) {
        if (curr.action === CustomizationAction.ADD) {
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

export const ReceiptDetailsModal: React.FC<ReceiptDetailsModalProps> = ({
  visible,
  onDismiss,
  receipt,
  isLoading = false,
}) => {
  const theme = useAppTheme();
  const [showPrintHistory, setShowPrintHistory] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState(false);

  if (!receipt && !isLoading) return null;

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

  const getPaymentStatus = () => {
    if (receipt?.payments && receipt.payments.length > 0) {
      const totalPaid = receipt.payments.reduce((sum, p) => sum + p.amount, 0);
      const totalAmount =
        typeof receipt.total === 'string'
          ? parseFloat(receipt.total)
          : receipt.total || 0;

      if (totalPaid >= totalAmount) {
        return { label: 'Pagado', color: '#10B981' };
      } else if (totalPaid > 0) {
        return { label: 'Parcial', color: '#F59E0B' };
      }
    }
    return { label: 'Pendiente', color: '#EF4444' };
  };

  if (isLoading || !receipt) {
    return (
      <ResponsiveModal
        visible={visible}
        onDismiss={onDismiss}
        title="Cargando..."
      >
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
      </ResponsiveModal>
    );
  }

  const paymentStatus = getPaymentStatus();

  const headerActions = (
    <IconButton
      icon="history"
      size={24}
      onPress={() => setShowOrderHistory(true)}
      style={styles.historyButton}
    />
  );

  const modalTitle = `Recibo #${receipt?.shiftOrderNumber || ''} · ${getOrderTypeLabel(receipt?.orderType || '')}`;

  const footerContent = (
    <View style={styles.footer}>
      <View style={styles.footerLeft}>
        <Text
          style={[styles.totalLabel, { color: theme.colors.onSurfaceVariant }]}
        >
          Total:
        </Text>
        <Text style={[styles.totalAmount, { color: theme.colors.primary }]}>
          $
          {receipt
            ? typeof receipt.total === 'string'
              ? parseFloat(receipt.total).toFixed(2)
              : (receipt.total || 0).toFixed(2)
            : '0.00'}
        </Text>
      </View>
      <View
        style={[styles.paymentBadge, { backgroundColor: paymentStatus.color }]}
      >
        <Text style={styles.paymentBadgeText}>💵 {paymentStatus.label}</Text>
      </View>
    </View>
  );

  const renderItem = (item: any) => {
    const quantity = item.quantity || 1;
    const unitPrice = parseFloat(item.finalPrice);
    const totalPrice = unitPrice * quantity;
    const statusColor = PreparationStatusInfo.getColor(
      item.preparationStatus,
      theme,
    );

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
                  {PreparationStatusInfo.getLabel(item.preparationStatus)}
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
            {item.quantity > 1 && (
              <View style={styles.priceRow}>
                <Text
                  style={[
                    styles.priceLabel,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  Total ×{item.quantity}:
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

  return (
    <>
      <ResponsiveModal
        visible={visible}
        onDismiss={onDismiss}
        title={modalTitle}
        headerActions={headerActions}
        maxHeightTablet="90%"
        scrollable={true}
        footer={footerContent}
        footerStyle={{ paddingTop: 0 }}
      >
        {/* Header info con status y fechas */}
        <View style={styles.headerInfo}>
          <View style={styles.chipsRow}>
            <View
              style={[
                styles.headerStatusChip,
                {
                  backgroundColor: OrderStatusInfo.getColor(
                    receipt.orderStatus,
                    theme,
                  ),
                },
              ]}
            >
              <Text style={styles.headerStatusChipText}>
                {OrderStatusInfo.getLabel(receipt.orderStatus)}
              </Text>
            </View>
            {receipt.preparationScreens &&
              receipt.preparationScreens.map((screen, index) => (
                <Chip
                  key={index}
                  mode="outlined"
                  compact
                  style={styles.screenChip}
                  textStyle={styles.screenChipText}
                >
                  🍳 {screen}
                </Chip>
              ))}
          </View>
          <View style={styles.headerDatesRow}>
            <Text
              style={[
                styles.headerDate,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Creado:{' '}
              {receipt.createdAt
                ? format(new Date(receipt.createdAt), 'dd/MM/yyyy HH:mm', {
                    locale: es,
                  })
                : ''}
            </Text>
            {receipt.finalizedAt && (
              <Text
                style={[styles.headerDate, { color: theme.colors.primary }]}
              >
                Finalizado:{' '}
                {format(new Date(receipt.finalizedAt), 'dd/MM/yyyy HH:mm', {
                  locale: es,
                })}
              </Text>
            )}
          </View>
        </View>

        {/* Información del recibo */}
        <View style={styles.infoSection}>
          {receipt.deliveryInfo?.recipientName && (
            <View style={styles.infoRow}>
              <Text
                style={[styles.contactText, { color: theme.colors.onSurface }]}
              >
                👤 Nombre del Cliente: {receipt.deliveryInfo.recipientName}
              </Text>
            </View>
          )}

          {receipt.deliveryInfo?.recipientPhone && (
            <View style={styles.infoRow}>
              <Text
                style={[styles.contactText, { color: theme.colors.onSurface }]}
              >
                📞 Teléfono: {receipt.deliveryInfo.recipientPhone}
              </Text>
            </View>
          )}

          {receipt.orderType === 'DELIVERY' &&
            receipt.deliveryInfo?.fullAddress && (
              <View style={styles.infoRow}>
                <Text
                  style={[
                    styles.addressText,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  📦 Dirección de Entrega: {receipt.deliveryInfo.fullAddress}
                </Text>
              </View>
            )}

          {receipt.orderType === 'DINE_IN' && receipt.table && (
            <View style={styles.infoRow}>
              <Text
                style={[styles.tableText, { color: theme.colors.onSurface }]}
              >
                🏛️ Mesa: {receipt.table.area?.name || 'Sin área'} -{' '}
                {receipt.table.number}
              </Text>
            </View>
          )}

          {receipt.scheduledAt && (
            <View style={styles.infoRow}>
              <Text
                style={[
                  styles.contactText,
                  { color: theme.colors.primary, fontWeight: '600' },
                ]}
              >
                ⏰ Hora de Entrega Programada:{' '}
                {format(new Date(receipt.scheduledAt), 'HH:mm', {
                  locale: es,
                })}
              </Text>
            </View>
          )}

          {receipt.user && (
            <View style={styles.infoRow}>
              <Text
                style={[
                  styles.contactText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                👨‍💼 Atendido por: {receipt.user.firstName}{' '}
                {receipt.user.lastName}
              </Text>
            </View>
          )}

          {receipt.notes && (
            <View style={styles.infoRow}>
              <Text
                style={[
                  styles.notesText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                📋 Notas: {receipt.notes}
              </Text>
            </View>
          )}
        </View>

        <Divider style={styles.divider} />

        {/* Lista de productos */}
        <View style={styles.itemsList}>
          {receipt.orderItems?.map((item) => renderItem(item)) || []}
        </View>

        <Divider style={styles.divider} />

        {/* Pagos */}
        {receipt.payments && receipt.payments.length > 0 && (
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
                    {typeof receipt.total === 'string'
                      ? parseFloat(receipt.total).toFixed(2)
                      : (receipt.total || 0).toFixed(2)}
                  </Text>
                  <Text
                    style={[styles.summaryCompactLabel, { color: '#10B981' }]}
                  >
                    Pagado: $
                    {receipt.payments
                      .reduce((sum, p) => sum + p.amount, 0)
                      .toFixed(2)}
                  </Text>
                  {(() => {
                    const totalAmount =
                      typeof receipt.total === 'string'
                        ? parseFloat(receipt.total)
                        : receipt.total || 0;
                    const totalPaid = receipt.payments.reduce(
                      (sum, p) => sum + p.amount,
                      0,
                    );
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

              {receipt.payments.map((payment, index) => {
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

        {/* Historial de impresiones */}
        {receipt.ticketImpressions && receipt.ticketImpressions.length > 0 && (
          <>
            <View style={styles.ticketImpressionsSection}>
              <TouchableOpacity
                style={styles.collapsibleHeader}
                onPress={() => setShowPrintHistory(!showPrintHistory)}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.sectionTitle, { color: theme.colors.primary }]}
                >
                  🖨️ Historial de Impresiones (
                  {receipt.ticketImpressions.length})
                </Text>
                <IconButton
                  icon={showPrintHistory ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  style={styles.collapseIcon}
                />
              </TouchableOpacity>

              {showPrintHistory && (
                <View style={styles.collapsibleContent}>
                  {receipt.ticketImpressions.map((impression, index) => {
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
                            {
                              color: theme.colors.onSurfaceVariant,
                            },
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
                  })}
                </View>
              )}
            </View>
          </>
        )}
      </ResponsiveModal>

      {/* Modal de historial */}
      {receipt && (
        <OrderHistoryModal
          visible={showOrderHistory}
          onDismiss={() => setShowOrderHistory(false)}
          orderId={receipt.id}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
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
  historyButton: {
    margin: -8,
  },
  headerInfo: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
    marginBottom: 16,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 8,
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
  screenChip: {
    height: 20,
  },
  screenChipText: {
    fontSize: 10,
    marginVertical: -2,
  },
  headerDatesRow: {
    gap: 8,
  },
  headerDate: {
    fontSize: 11,
  },
  infoSection: {
    gap: 4,
    marginBottom: 16,
  },
  infoRow: {
    marginVertical: 2,
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
  divider: {
    marginVertical: 2,
  },
  itemsList: {
    marginBottom: 16,
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
    marginBottom: 6,
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
    marginBottom: 16,
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
    marginBottom: 16,
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
    // ResponsiveModal maneja padding y border
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
