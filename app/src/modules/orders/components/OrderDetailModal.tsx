import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Modal,
  Portal,
  Text,
  IconButton,
  Divider,
  Card,
  Chip,
  Surface,
} from 'react-native-paper';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAppTheme } from '@/app/styles/theme';
import { OrderStatusEnum } from '../types/orders.types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface OrderDetailModalProps {
  visible: boolean;
  onDismiss: () => void;
  orderId: string | null;
  orderNumber?: number;
  orderData?: any; // Datos de la orden pasados como prop
}

const getStatusColor = (status: string, theme: any) => {
  switch (status) {
    case OrderStatusEnum.PENDING:
      return '#FFA000';
    case OrderStatusEnum.IN_PROGRESS:
      return theme.colors.primary;
    case OrderStatusEnum.IN_PREPARATION:
      return '#FF6B35';
    case OrderStatusEnum.READY:
      return '#4CAF50';
    case OrderStatusEnum.DELIVERED:
      return theme.colors.tertiary;
    case OrderStatusEnum.COMPLETED:
      return '#9E9E9E';
    case OrderStatusEnum.CANCELLED:
      return theme.colors.error;
    default:
      return theme.colors.onSurfaceVariant;
  }
};

const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    [OrderStatusEnum.PENDING]: 'Pendiente',
    [OrderStatusEnum.IN_PROGRESS]: 'En Progreso',
    [OrderStatusEnum.IN_PREPARATION]: 'En Preparación',
    [OrderStatusEnum.READY]: 'Lista',
    [OrderStatusEnum.DELIVERED]: 'Entregada',
    [OrderStatusEnum.COMPLETED]: 'Completada',
    [OrderStatusEnum.CANCELLED]: 'Cancelada',
  };
  return statusMap[status] || status;
};

const getPreparationStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    PENDING: 'Pendiente',
    IN_PROGRESS: 'En Preparación',
    READY: 'Listo',
    DELIVERED: 'Entregado',
    CANCELLED: 'Cancelado',
  };
  return statusMap[status] || status;
};

const getPreparationStatusColor = (status: string, theme: any) => {
  switch (status) {
    case 'PENDING':
      return theme.colors.error;
    case 'IN_PROGRESS':
      return '#FFA000';
    case 'READY':
      return '#4CAF50';
    case 'DELIVERED':
      return theme.colors.tertiary;
    case 'CANCELLED':
      return theme.colors.onSurfaceDisabled;
    default:
      return theme.colors.onSurfaceVariant;
  }
};

// Componente interno para mostrar el contenido de detalles
export const OrderDetailContent: React.FC<{
  orderId: string | null;
  orderNumber?: number;
  orderData?: any; // Datos de la orden pasados como prop
}> = ({ orderId: _orderId, orderNumber: _orderNumber, orderData }) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {!orderData ? (
        <View style={styles.errorContainer}>
          <Icon
            name="alert-circle-outline"
            size={48}
            color={theme.colors.error}
          />
          <Text style={styles.errorText}>
            No hay datos de la orden disponibles
          </Text>
        </View>
      ) : (
        <>
          {/* Información General - Simplificada */}
          <View style={styles.infoHeader}>
            <View style={styles.infoHeaderRow}>
              <Text style={styles.infoHeaderLabel}>Creada:</Text>
              <Text style={styles.infoHeaderValue}>
                {format(new Date(orderData.createdAt), 'HH:mm', { locale: es })}
              </Text>
            </View>
            <View style={styles.infoHeaderRow}>
              <Text style={styles.infoHeaderLabel}>Total:</Text>
              <Text style={[styles.infoHeaderValue, styles.totalAmount]}>
                ${Number(orderData.total || 0).toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Items de la Orden */}
          <Card style={styles.itemsCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>
                Artículos ({orderData.orderItems?.length || 0})
              </Text>

              {orderData.orderItems?.map((item: any, index: number) => (
                <View key={item.id || index} style={styles.itemRow}>
                  <View style={styles.itemContent}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemName}>
                        {item.product?.name || 'Producto desconocido'}
                      </Text>
                      {item.preparedAt && (
                        <Text style={styles.preparedTime}>
                          {format(new Date(item.preparedAt), 'HH:mm', {
                            locale: es,
                          })}
                        </Text>
                      )}
                    </View>
                    {item.productVariant && (
                      <Text style={styles.itemVariant}>
                        {item.productVariant.name}
                      </Text>
                    )}
                    {item.preparationNotes && (
                      <Text style={styles.itemNotes}>
                        📝 {item.preparationNotes}
                      </Text>
                    )}
                    <View style={styles.itemFooter}>
                      <Chip
                        mode="flat"
                        compact
                        style={[
                          styles.preparationChip,
                          {
                            backgroundColor:
                              getPreparationStatusColor(
                                item.preparationStatus,
                                theme,
                              ) + '20',
                          },
                        ]}
                        textStyle={[
                          styles.preparationChipText,
                          {
                            color: getPreparationStatusColor(
                              item.preparationStatus,
                              theme,
                            ),
                          },
                        ]}
                      >
                        {getPreparationStatusLabel(item.preparationStatus)}
                      </Chip>
                      <View style={styles.itemTimesContainer}>
                        {item.createdAt && (
                          <Text style={styles.itemCreatedTime}>
                            Creado:{' '}
                            {format(new Date(item.createdAt), 'HH:mm', {
                              locale: es,
                            })}
                          </Text>
                        )}
                        {item.preparedById && item.preparedBy && (
                          <Text style={styles.preparedByText}>
                            Preparado por: {item.preparedBy.firstName}{' '}
                            {item.preparedBy.lastName}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                  {index < orderData.orderItems.length - 1 && (
                    <Divider style={styles.itemDivider} />
                  )}
                </View>
              ))}
            </Card.Content>
          </Card>
        </>
      )}
    </ScrollView>
  );
};

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  visible,
  onDismiss,
  orderId,
  orderNumber,
  orderData,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (!visible) return null;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <Surface style={styles.surface} elevation={2}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>
                {orderNumber ? `Orden #${orderNumber}` : 'Detalles de la Orden'}
              </Text>
              {orderData && (
                <Chip
                  mode="flat"
                  style={[
                    styles.statusChip,
                    {
                      backgroundColor: getStatusColor(orderData.orderStatus, theme),
                    },
                  ]}
                  textStyle={styles.statusChipText}
                >
                  {getStatusLabel(orderData.orderStatus)}
                </Chip>
              )}
            </View>
            <IconButton
              icon="close"
              size={24}
              onPress={onDismiss}
              style={styles.closeButton}
            />
          </View>

          <Divider />

          {/* Content */}
          <OrderDetailContent
            orderId={orderId}
            orderNumber={orderNumber}
            orderData={order}
          />
        </Surface>
      </Modal>
    </Portal>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    modalContainer: {
      padding: 20,
      maxWidth: 600,
      width: '90%',
      alignSelf: 'center',
      maxHeight: '90%',
    },
    surface: {
      borderRadius: theme.roundness * 2,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 8,
      minHeight: 56,
    },
    headerContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    statusChip: {
      height: 28,
    },
    statusChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: 'white',
    },
    closeButton: {
      margin: 0,
    },
    content: {
      maxHeight: 600,
    },
    loadingContainer: {
      padding: 40,
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 16,
      color: theme.colors.onSurfaceVariant,
    },
    errorContainer: {
      padding: 40,
      alignItems: 'center',
    },
    errorText: {
      marginTop: 16,
      color: theme.colors.error,
    },
    infoHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.surfaceVariant,
      marginBottom: 8,
    },
    infoHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    infoHeaderLabel: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      marginRight: 8,
    },
    infoHeaderValue: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    infoCard: {
      margin: 16,
      marginBottom: 8,
    },
    itemsCard: {
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 16,
      flex: 1,
    },
    itemRow: {
      paddingVertical: 12,
    },
    itemContent: {
      flex: 1,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    itemFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    itemDivider: {
      marginTop: 12,
      backgroundColor: theme.colors.outlineVariant,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: 12,
    },
    totalAmount: {
      fontSize: 16,
      color: theme.colors.primary,
      fontWeight: '700',
    },
    itemName: {
      fontWeight: '600',
      fontSize: 15,
      color: theme.colors.onSurface,
      flex: 1,
    },
    itemVariant: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    itemNotes: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
      marginTop: 2,
    },
    preparationChip: {
      height: 28,
      paddingHorizontal: 12,
    },
    preparationChipText: {
      fontSize: 12,
      fontWeight: '600',
    },
    preparedTime: {
      fontSize: 12,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    itemTimesContainer: {
      flex: 1,
      alignItems: 'flex-end',
    },
    itemCreatedTime: {
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
    },
    preparedByText: {
      fontSize: 11,
      color: theme.colors.primary,
      fontWeight: '500',
      marginTop: 2,
    },
    notPrepared: {
      fontSize: 12,
      color: theme.colors.onSurfaceDisabled,
    },
  });

export default OrderDetailModal;
