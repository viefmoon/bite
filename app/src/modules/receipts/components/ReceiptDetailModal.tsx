import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import {
  Text,
  Divider,
  List,
  Portal,
  Modal,
  Appbar,
  Chip,
  Surface,
} from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import { Order } from '@/app/schemas/domain/order.schema';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import OrderHistoryModal from '@/modules/orders/components/OrderHistoryModal';
import { OrderTypeEnum } from '@/modules/orders/types/orders.types';
interface ReceiptDetailModalProps {
  visible: boolean;
  onClose: () => void;
  order: Order | null;
  isLoading?: boolean;
}

export const ReceiptDetailModal: React.FC<ReceiptDetailModalProps> = ({
  visible,
  onClose,
  order,
  isLoading = false,
}) => {
  const theme = useAppTheme();
  const [showHistory, setShowHistory] = useState(false);

  const getOrderTypeLabel = (type: string) => {
    switch (type) {
      case OrderTypeEnum.DINE_IN:
        return 'Mesa';
      case OrderTypeEnum.DELIVERY:
        return 'Domicilio';
      case OrderTypeEnum.TAKE_AWAY:
        return 'Para llevar';
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'completed':
        return theme.colors.primary;
      case 'CANCELLED':
      case 'cancelled':
        return theme.colors.error;
      default:
        return theme.colors.onSurfaceDisabled;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'completed':
        return 'Completada';
      case 'CANCELLED':
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const calculateItemTotal = (item: any) => {
    const price = parseFloat(item.finalPrice || item.basePrice || '0');
    const quantity = item.quantity || 1;
    const baseTotal = price * quantity;
    const modifiersTotal =
      item.modifiers?.reduce((sum: number, mod: any) => {
        return sum + parseFloat(mod.price || '0') * (mod.quantity || 1);
      }, 0) || 0;
    return baseTotal + modifiersTotal;
  };

  if (isLoading || !order) {
    return (
      <Portal>
        <Modal
          visible={visible}
          onDismiss={onClose}
          contentContainerStyle={[
            styles.modal,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        </Modal>
      </Portal>
    );
  }

  return (
    <>
      <Portal>
        <Modal
          visible={visible}
          onDismiss={onClose}
          contentContainerStyle={[
            styles.modal,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Appbar.Header>
            <Appbar.Content
              title={`Recibo #${order.dailyNumber || order.orderNumber}`}
            />
            <Appbar.Action
              icon="history"
              onPress={() => setShowHistory(true)}
            />
            <Appbar.Action icon="close" onPress={onClose} />
          </Appbar.Header>

          <ScrollView style={styles.scrollView}>
            {/* Información del encabezado */}
            <Surface style={styles.headerSection} elevation={1}>
              <View style={styles.headerRow}>
                <View style={styles.headerInfo}>
                  <Text variant="bodyMedium" style={styles.label}>
                    Fecha:
                  </Text>
                  <Text variant="bodyLarge">
                    {format(
                      new Date(order.createdAt),
                      "d 'de' MMMM, yyyy 'a las' HH:mm",
                      {
                        locale: es,
                      },
                    )}
                  </Text>
                </View>
                <Chip
                  mode="flat"
                  style={{
                    backgroundColor: getStatusColor(
                      order.orderStatus || order.status,
                    ),
                  }}
                  textStyle={{ color: theme.colors.onPrimary }}
                >
                  {getStatusLabel(order.orderStatus || order.status)}
                </Chip>
              </View>

              <Divider style={styles.divider} />

              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text variant="bodyMedium" style={styles.label}>
                    Tipo de orden:
                  </Text>
                  <Text variant="bodyLarge">
                    {getOrderTypeLabel(order.orderType)}
                  </Text>
                </View>

                {order.table && (
                  <View style={styles.infoItem}>
                    <Text variant="bodyMedium" style={styles.label}>
                      Mesa:
                    </Text>
                    <Text variant="bodyLarge">
                      {order.table.area?.name} - {order.table.name}
                    </Text>
                  </View>
                )}

                {order.deliveryInfo?.recipientName && (
                  <View style={styles.infoItem}>
                    <Text variant="bodyMedium" style={styles.label}>
                      Cliente:
                    </Text>
                    <Text variant="bodyLarge">
                      {order.deliveryInfo.recipientName}
                    </Text>
                  </View>
                )}

                {order.deliveryInfo?.recipientPhone && (
                  <View style={styles.infoItem}>
                    <Text variant="bodyMedium" style={styles.label}>
                      Teléfono:
                    </Text>
                    <Text variant="bodyLarge">
                      {order.deliveryInfo.recipientPhone}
                    </Text>
                  </View>
                )}

                {order.deliveryInfo?.fullAddress && (
                  <View style={styles.infoItem}>
                    <Text variant="bodyMedium" style={styles.label}>
                      Dirección:
                    </Text>
                    <Text variant="bodyLarge">
                      {order.deliveryInfo.fullAddress}
                    </Text>
                  </View>
                )}

                {order.user && (
                  <View style={styles.infoItem}>
                    <Text variant="bodyMedium" style={styles.label}>
                      Atendido por:
                    </Text>
                    <Text variant="bodyLarge">{order.user.firstName}</Text>
                  </View>
                )}
              </View>

              {order.notes && (
                <>
                  <Divider style={styles.divider} />
                  <View>
                    <Text variant="bodyMedium" style={styles.label}>
                      Notas:
                    </Text>
                    <Text variant="bodyLarge">{order.notes}</Text>
                  </View>
                </>
              )}
            </Surface>

            {/* Items de la orden */}
            <Surface style={styles.itemsSection} elevation={1}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Productos
              </Text>
              <Divider style={styles.divider} />

              {(order.orderItems || order.items)?.map(
                (item: any, index: number) => (
                  <View key={item.id || index}>
                    <List.Item
                      title={`${item.quantity || 1}x ${item.productVariant?.name || item.product?.name || item.productName || 'Producto'}`}
                      description={() => (
                        <View>
                          {item.modifiers && item.modifiers.length > 0 && (
                            <View style={styles.modifiersList}>
                              {item.modifiers.map(
                                (mod: any, modIndex: number) => (
                                  <Text
                                    key={modIndex}
                                    variant="bodySmall"
                                    style={styles.modifierText}
                                  >
                                    • {mod.modifierGroup?.name}:{' '}
                                    {mod.modifier?.name}
                                    {mod.price &&
                                      mod.price > 0 &&
                                      ` (+$${mod.price})`}
                                  </Text>
                                ),
                              )}
                            </View>
                          )}
                          {item.preparationNotes && (
                            <Text variant="bodySmall" style={styles.notesText}>
                              Nota: {item.preparationNotes}
                            </Text>
                          )}
                        </View>
                      )}
                      right={() => (
                        <Text variant="titleMedium" style={styles.priceText}>
                          ${calculateItemTotal(item).toFixed(2)}
                        </Text>
                      )}
                    />
                    {index <
                      (order.orderItems || order.items || []).length - 1 && (
                      <Divider />
                    )}
                  </View>
                ),
              )}
            </Surface>

            {/* Totales */}
            <Surface style={styles.totalsSection} elevation={1}>
              {order.subtotal && (
                <>
                  <View style={styles.totalRow}>
                    <Text variant="titleMedium">Subtotal:</Text>
                    <Text variant="titleMedium">
                      ${parseFloat(order.subtotal || '0').toFixed(2)}
                    </Text>
                  </View>
                  <Divider style={styles.divider} />
                </>
              )}
              <View style={styles.totalRow}>
                <Text variant="titleLarge" style={styles.totalText}>
                  Total:
                </Text>
                <Text variant="titleLarge" style={styles.totalText}>
                  ${parseFloat(order.total || '0').toFixed(2)}
                </Text>
              </View>
            </Surface>

            {/* Información de pago si existe */}
            {order.payments && order.payments.length > 0 && (
              <Surface style={styles.paymentSection} elevation={1}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Información de pago
                </Text>
                <Divider style={styles.divider} />
                {order.payments.map((payment: any, index: number) => (
                  <View key={payment.id || index} style={styles.paymentRow}>
                    <Text variant="bodyMedium">
                      {payment.paymentMethod === 'cash'
                        ? 'Efectivo'
                        : payment.paymentMethod === 'card'
                          ? 'Tarjeta'
                          : payment.paymentMethod === 'transfer'
                            ? 'Transferencia'
                            : payment.paymentMethod}
                    </Text>
                    <Text variant="bodyMedium">
                      ${payment.amount.toFixed(2)}
                    </Text>
                  </View>
                ))}
              </Surface>
            )}
          </ScrollView>
        </Modal>
      </Portal>

      {/* Modal de historial */}
      <OrderHistoryModal
        visible={showHistory}
        onDismiss={() => setShowHistory(false)}
        orderId={order.id}
      />
    </>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 10,
    borderRadius: 8,
    height: '95%',
    minHeight: 600,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  headerSection: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerInfo: {
    flex: 1,
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    gap: 4,
  },
  label: {
    opacity: 0.7,
  },
  divider: {
    marginVertical: 12,
  },
  itemsSection: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  modifiersList: {
    marginTop: 4,
    marginLeft: 8,
  },
  modifierText: {
    opacity: 0.8,
    marginVertical: 2,
  },
  notesText: {
    marginTop: 4,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  quantityText: {
    marginTop: 4,
    fontWeight: 'bold',
  },
  priceText: {
    fontWeight: 'bold',
  },
  totalsSection: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalText: {
    fontWeight: 'bold',
  },
  paymentSection: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
});
