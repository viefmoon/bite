import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Modal,
  Portal,
  Surface,
  Text,
  Button,
  Divider,
  IconButton,
  Chip,
} from 'react-native-paper';
import {
  OrderForFinalization,
  OrderItemForFinalization,
} from '../types/orderFinalization.types';
import { useAppTheme } from '@/app/styles/theme';
import {
  CustomizationType,
  PizzaHalf,
  CustomizationAction,
} from '@/modules/pizzaCustomizations/types/pizzaCustomization.types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface OrderDetailsModalProps {
  visible: boolean;
  onDismiss: () => void;
  order: OrderForFinalization | null;
}


// Función para formatear personalizaciones de pizza
const formatPizzaCustomizations = (
  customizations: any[],
): string => {
  if (!customizations || customizations.length === 0) return '';

  // Agrupar por mitad y tipo
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

      // Obtener información de la personalización
      let name = curr.pizzaCustomization?.name || curr.pizzaCustomizationId;
      let type = curr.pizzaCustomization?.type;

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

  // Formatear según el tipo de pizza
  if (groupedByHalf.FULL) {
    // Pizza completa
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
    // Pizza mitad y mitad
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

    const half1 = groupedByHalf.HALF_1
      ? formatHalf(groupedByHalf.HALF_1)
      : '';
    const half2 = groupedByHalf.HALF_2
      ? formatHalf(groupedByHalf.HALF_2)
      : '';

    return half1 && half2 ? `(${half1} / ${half2})` : half1 || half2;
  }

  return '';
};

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  visible,
  onDismiss,
  order,
}) => {
  const theme = useAppTheme();

  const totalItems =
    order?.orderItems.reduce((sum, item) => sum + item.quantity, 0) || 0;

  if (!order) return null;

  // Formatear tipo de pedido
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

  // Formatear estado de la orden
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
      default:
        return status;
    }
  };

  // Obtener color del estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#FFA726';
      case 'IN_PROGRESS':
        return theme.colors.primary;
      case 'READY':
        return '#66BB6A';
      case 'DELIVERED':
        return theme.colors.tertiary;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  // Calcular estado del pago
  const getPaymentStatus = () => {
    if (order.payments && order.payments.length > 0) {
      const totalPaid = order.payments.reduce((sum, p) => sum + p.amount, 0);
      const totalAmount = typeof order.total === 'string' ? parseFloat(order.total) : order.total;
      
      if (totalPaid >= totalAmount) {
        return { label: 'Pagado', color: '#10B981' };
      } else if (totalPaid > 0) {
        return { label: 'Parcial', color: '#F59E0B' };
      }
    }
    return { label: 'Pendiente', color: '#EF4444' };
  };

  const paymentStatus = getPaymentStatus();

  const renderItem = (item: OrderItemForFinalization) => {
    const unitPrice = parseFloat(item.finalPrice);
    const totalPrice = unitPrice * item.quantity;
    const preparationStatusColors = {
      PENDING: '#FFA726',
      IN_PROGRESS: '#42A5F5',
      READY: '#66BB6A',
      DELIVERED: '#26A69A',
      CANCELLED: '#EF5350',
    };
    const statusColor = preparationStatusColors[item.preparationStatus as keyof typeof preparationStatusColors] || theme.colors.onSurfaceVariant;

    return (
      <Surface
        key={`${item.product.id}-${item.productVariant?.id || ''}-${item.preparationStatus || ''}`}
        style={[styles.itemCard, { backgroundColor: theme.colors.elevation.level1 }]}
        elevation={1}
      >
        <View style={styles.itemContent}>
          {/* Header con nombre y estado */}
          <View style={styles.itemHeader}>
            <View style={styles.nameContainer}>
              <Text style={[styles.itemQuantity, { color: theme.colors.primary }]}>
                {item.quantity}x
              </Text>
              <Text style={[styles.itemName, { color: theme.colors.onSurface }]} numberOfLines={1}>
                {item.productVariant?.name || item.product.name}
              </Text>
            </View>
            {item.preparationStatus && (
              <View style={[styles.statusChip, { backgroundColor: statusColor }]}>
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

          {/* Detalles del producto */}
          <View style={styles.itemDetailsContainer}>

            {/* Pizza customizations */}
            {item.selectedPizzaCustomizations && item.selectedPizzaCustomizations.length > 0 && (
              <View style={styles.customizationContainer}>
                <Text
                  style={[
                    styles.pizzaCustomizationText,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {formatPizzaCustomizations(item.selectedPizzaCustomizations)}
                </Text>
              </View>
            )}

            {/* Modifiers */}
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

            {/* Notes */}
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

          {/* Precios al final */}
          <View style={styles.priceContainer}>
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: theme.colors.onSurfaceVariant }]}>
                P. unitario:
              </Text>
              <Text style={[styles.priceValue, { color: theme.colors.onSurface }]}>
                ${unitPrice.toFixed(2)}
              </Text>
            </View>
            {item.quantity > 1 && (
              <View style={styles.priceRow}>
                <Text style={[styles.priceLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Total ×{item.quantity}:
                </Text>
                <Text style={[styles.totalPrice, { color: theme.colors.primary }]}>
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
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modalContent,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <View style={styles.headerTopRow}>
              <View style={styles.headerLeft}>
                <Text style={[styles.title, { color: theme.colors.onSurface }]}>
                  Orden #{order.shiftOrderNumber}
                </Text>
                <Text style={[styles.headerSeparator, { color: theme.colors.onSurfaceVariant }]}>•</Text>
                <Text style={[styles.orderType, { color: theme.colors.primary }]}>
                  {getOrderTypeLabel(order.orderType)}
                </Text>
                <Text style={[styles.headerSeparator, { color: theme.colors.onSurfaceVariant }]}>•</Text>
                <Text style={[styles.headerDate, { color: theme.colors.onSurfaceVariant }]}>
                  {format(new Date(order.createdAt), 'dd/MM HH:mm', { locale: es })}
                </Text>
              </View>
              <IconButton
                icon="close"
                size={24}
                onPress={onDismiss}
                style={styles.closeButton}
              />
            </View>
            <View style={styles.headerBottomRow}>
              <View style={styles.chipsRow}>
                <View style={[styles.headerStatusChip, { backgroundColor: getStatusColor(order.orderStatus) }]}>
                  <Text style={styles.headerStatusChipText}>
                    {getOrderStatusLabel(order.orderStatus)}
                  </Text>
                </View>
                {order.preparationScreens && order.preparationScreens.map((screen, index) => (
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
            </View>
          </View>
        </View>

        {/* Información de contacto y detalles */}
        <View style={styles.infoSection}>
          {/* Datos de contacto */}
          {(order.deliveryInfo?.recipientName || order.deliveryInfo?.recipientPhone) && (
            <View style={styles.contactRow}>
              {order.deliveryInfo.recipientName && (
                <Text style={[styles.contactText, { color: theme.colors.onSurface }]}>
                  👤 {order.deliveryInfo.recipientName}
                </Text>
              )}
              {order.deliveryInfo.recipientPhone && (
                <Text style={[styles.contactText, { color: theme.colors.onSurface }]}>
                  📞 {order.deliveryInfo.recipientPhone}
                </Text>
              )}
            </View>
          )}
          
          {/* Dirección para delivery */}
          {order.orderType === 'DELIVERY' && order.deliveryInfo?.fullAddress && (
            <Text style={[styles.addressText, { color: theme.colors.onSurfaceVariant }]}>
              📦 {order.deliveryInfo.fullAddress}
            </Text>
          )}

          {/* Mesa para dine in */}
          {order.orderType === 'DINE_IN' && order.table && (
            <Text style={[styles.tableText, { color: theme.colors.onSurface }]}>
              🏛️ {order.table.area?.name || 'Sin área'} - {order.table.number}
            </Text>
          )}


        </View>

        <Divider style={styles.divider} />

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.itemsList}>
            {order.orderItems.map((item) => renderItem(item))}
          </View>
        </ScrollView>

        <Divider style={styles.divider} />
        
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Text style={[styles.totalLabel, { color: theme.colors.onSurfaceVariant }]}>
              Total:
            </Text>
            <Text style={[styles.totalAmount, { color: theme.colors.primary }]}>
              ${typeof order.total === 'string' ? parseFloat(order.total).toFixed(2) : order.total.toFixed(2)}
            </Text>
          </View>
          <View style={[styles.paymentBadge, { backgroundColor: paymentStatus.color }]}>
            <Text style={styles.paymentBadgeText}>
              💵 {paymentStatus.label}
            </Text>
          </View>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    margin: 12,
    borderRadius: 12,
    maxHeight: '90%',
    elevation: 4,
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
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  headerBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chipsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  headerSeparator: {
    fontSize: 11,
    marginHorizontal: 6,
  },
  orderType: {
    fontSize: 12,
    fontWeight: '600',
  },
  headerDate: {
    fontSize: 11,
  },
  infoSection: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 6,
    gap: 4,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 16,
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
  screenChip: {
    height: 20,
  },
  screenChipText: {
    fontSize: 10,
    marginVertical: -2,
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
  totalAmount: {
    fontSize: 16,
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
  divider: {
    marginVertical: 2,
  },
  closeButton: {
    margin: -8,
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
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    opacity: 0.7,
  },
  scrollView: {
    maxHeight: 520,
  },
  itemsList: {
    padding: 12,
    gap: 8,
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
});
