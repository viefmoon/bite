import React, { useMemo } from 'react';
import { View, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { Modal, Text, Divider } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAppTheme } from '@/app/styles/theme';
import apiClient from '@/app/services/apiClient';
import { API_PATHS } from '@/app/constants/apiPaths';
import { OrderHistoryContent } from '@/modules/shiftAudit/components/OrderHistoryContent';
import { createStyles } from '@/modules/shiftAudit/styles/orderHistoryStyles';

interface OrderHistoryModalProps {
  visible: boolean;
  onDismiss: () => void;
  orderId: string | null;
  orderNumber?: number;
}

export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({
  visible,
  onDismiss,
  orderId,
  orderNumber,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const platformStyles = StyleSheet.create({
    modalContainerIOS: {
      marginVertical: 60,
    },
    modalContainerAndroid: {
      marginVertical: 40,
    },
  });

  // Query para obtener el conteo de elementos del historial para el header
  const { data: historyData } = useQuery({
    queryKey: ['combinedHistory', orderId],
    queryFn: async () => {
      if (!orderId) throw new Error('No order ID');
      const url = `${API_PATHS.ORDERS_HISTORY.replace(':orderId', orderId)}?page=1&limit=100`;
      const response = await apiClient.get(url);
      return response.data?.data || [];
    },
    enabled: visible && !!orderId,
    staleTime: 30000,
  });

  // Si no hay orderId, no renderizar nada
  if (!orderId) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      contentContainerStyle={[
        styles.modalContainer,
        Platform.OS === 'ios' && platformStyles.modalContainerIOS,
        Platform.OS === 'android' && platformStyles.modalContainerAndroid,
      ]}
      dismissable={true}
      dismissableBackButton={false}
    >
      {/* Header del Modal */}
      <View style={styles.modalHeader}>
        <View style={styles.headerTitleContainer}>
          <Text
            variant="titleMedium"
            style={[styles.headerTitle, { color: theme.colors.onSurface }]}
            numberOfLines={1}
          >
            Historial de Orden #{orderNumber || ''}
          </Text>
          <Text
            variant="bodySmall"
            style={[
              styles.headerSubtitle,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {historyData?.length || 0} cambios registrados
          </Text>
        </View>
        <TouchableOpacity
          onPress={onDismiss}
          style={[
            styles.closeButton,
            { backgroundColor: theme.colors.errorContainer },
          ]}
          activeOpacity={0.8}
        >
          <Icon name="close" size={24} color={theme.colors.onErrorContainer} />
        </TouchableOpacity>
      </View>

      <Divider />

      {/* Contenido del Modal usando el componente reutilizable */}
      <View style={styles.modalContent}>
        <OrderHistoryContent
          orderId={orderId}
          orderNumber={orderNumber}
          showHeaderInfo={false} // Ya tenemos header en el modal
          contentContainerStyle={styles.listContent}
          emptyContainerStyle={styles.emptyContainer}
        />
      </View>
    </Modal>
  );
};

export default OrderHistoryModal;
