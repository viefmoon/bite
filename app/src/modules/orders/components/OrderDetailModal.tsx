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
import { formatOrderStatus, getOrderStatusColor, getPreparationStatusLabel, getPreparationStatusColor } from '../utils/formatters';

interface OrderDetailModalProps {
  visible: boolean;
  onDismiss: () => void;
  orderId: string | null;
  orderNumber?: number;
  orderData?: any; // Datos de la orden pasados como prop
}


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
              <Text style={styles.infoHeaderLabel}>Hora de creación:</Text>
              <Text style={styles.infoHeaderValue}>
                {format(new Date(orderData.createdAt), 'HH:mm', { locale: es })}
              </Text>
            </View>
          </View>

          {/* Items de la Orden */}
          <Card style={styles.itemsCard}>
            <Card.Content style={styles.cardContentCompact}>
              <Text style={styles.sectionTitle}>
                Artículos ({orderData.orderItems?.length || 0})
              </Text>

              {orderData.orderItems?.map((item: any, index: number) => (
                <View key={item.id || index} style={styles.itemRow}>
                  <View style={styles.itemCompactRow}>
                    <View style={styles.itemMainInfo}>
                      <View style={styles.itemTitleRow}>
                        <Text style={styles.itemName}>
                          {item.product?.name || 'Producto desconocido'}
                          {item.productVariant &&
                            ` - ${item.productVariant.name}`}
                        </Text>
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
                      </View>
                      {item.preparationNotes && (
                        <Text style={styles.itemNotes}>
                          📝 {item.preparationNotes}
                        </Text>
                      )}
                    </View>
                    {item.preparedAt && (
                      <Text style={styles.preparedTime}>
                        {format(new Date(item.preparedAt), 'HH:mm')}
                      </Text>
                    )}
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
                      backgroundColor: getOrderStatusColor(
                        orderData.orderStatus,
                        theme,
                      ),
                    },
                  ]}
                  textStyle={styles.statusChipText}
                >
                  {formatOrderStatus(orderData.orderStatus)}
                </Chip>
              )}
            </View>
            <IconButton
              icon="close-circle"
              size={32}
              onPress={onDismiss}
              style={styles.closeButton}
              iconColor={theme.colors.error}
            />
          </View>

          <Divider />

          {/* Content */}
          <OrderDetailContent
            orderId={orderId}
            orderNumber={orderNumber}
            orderData={orderData}
          />
        </Surface>
      </Modal>
    </Portal>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    modalContainer: {
      padding: 12,
      maxWidth: 600,
      width: '95%',
      alignSelf: 'center',
      maxHeight: '92%',
    },
    surface: {
      borderRadius: theme.roundness * 2,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 8,
      minHeight: 56,
    },
    headerContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginRight: 8,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    statusChip: {
      minHeight: 28,
      height: 'auto',
      paddingVertical: 4,
    },
    statusChipText: {
      fontSize: 13,
      fontWeight: '600',
      color: 'white',
      lineHeight: 18,
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    closeButton: {
      margin: -4,
      backgroundColor: theme.colors.errorContainer,
      borderRadius: 20,
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
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: theme.colors.surfaceVariant,
      marginBottom: 4,
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
      margin: 8,
      marginBottom: 4,
    },
    itemsCard: {
      marginHorizontal: 8,
      marginTop: 4,
      marginBottom: 8,
      flex: 1,
    },
    itemRow: {
      paddingVertical: 3,
    },
    itemCompactRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
    },
    itemMainInfo: {
      flex: 1,
    },
    itemTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'nowrap',
    },
    itemStatusInfo: {
      alignItems: 'flex-end',
      gap: 2,
    },
    itemContent: {
      flex: 1,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 2,
    },
    itemFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    itemDivider: {
      marginTop: 2,
      marginBottom: 1,
      backgroundColor: theme.colors.outlineVariant,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: 12,
    },
    itemName: {
      fontWeight: '600',
      fontSize: 13,
      color: theme.colors.onSurface,
      flex: 1,
      flexShrink: 1,
    },
    itemVariant: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    itemNotes: {
      fontSize: 10,
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
      marginTop: 0,
    },
    preparationChip: {
      minHeight: 26,
      height: 'auto',
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    preparationChipText: {
      fontSize: 12,
      fontWeight: '600',
      lineHeight: 16,
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    preparedTime: {
      fontSize: 12,
      color: theme.colors.primary,
      fontWeight: '600',
      minWidth: 40,
      textAlign: 'right',
      alignSelf: 'center',
      lineHeight: 16,
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
    cardContentCompact: {
      paddingVertical: 6,
      paddingHorizontal: 10,
    },
  });

export default OrderDetailModal;
