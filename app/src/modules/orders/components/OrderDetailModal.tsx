import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Modal,
  Portal,
  Text,
  IconButton,
  Surface,
  Chip,
  Divider,
} from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { OrderDetailsView } from '@/modules/shared/components/OrderDetailsView';
import { mapOrderToUnifiedOrder } from '@/modules/shared/mappers/order-mapper';
import { OrderStatusInfo } from '../utils/formatters';

interface OrderDetailModalProps {
  visible: boolean;
  onDismiss: () => void;
  orderId: string | null;
  orderNumber?: number;
  orderData?: any; // Datos de la orden pasados como prop
}

// Componente interno para mostrar el contenido de detalles
export const OrderDetailContent: React.FC<{
  orderData?: any; // Datos de la orden pasados como prop
}> = ({ orderData }) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Mapear los datos de la orden a formato unificado
  const unifiedOrder = useMemo(() => {
    if (!orderData) return null;
    try {
      return mapOrderToUnifiedOrder(orderData);
    } catch (error) {
      // Si hay error en el mapeo, devolver null para mostrar error
      console.warn('Error mapeando orden:', error);
      return null;
    }
  }, [orderData]);

  if (!orderData) {
    return (
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
    );
  }

  // Usar el componente compartido pero con un scroll view container
  return (
    <View style={styles.content}>
      <OrderDetailsView 
        order={unifiedOrder} 
        isLoading={false}
      />
    </View>
  );
};

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  visible,
  onDismiss,
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
                      backgroundColor: OrderStatusInfo.getColor(
                        orderData.orderStatus,
                        theme,
                      ),
                    },
                  ]}
                  textStyle={styles.statusChipText}
                >
                  {OrderStatusInfo.getLabel(orderData.orderStatus)}
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
          <OrderDetailContent orderData={orderData} />
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
      flex: 1,
    },
    errorContainer: {
      padding: 40,
      alignItems: 'center',
    },
    errorText: {
      marginTop: 16,
      color: theme.colors.error,
    },
  });

export default OrderDetailModal;
