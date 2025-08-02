import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useAppTheme } from '@/app/styles/theme';
import { ResponsiveModal } from '@/app/components/responsive/ResponsiveModal';
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

  const localStyles = StyleSheet.create({
    modalHeaderSubtitle: {
      paddingHorizontal: theme.spacing.l,
      paddingBottom: theme.spacing.s,
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
    <ResponsiveModal
      visible={visible}
      onDismiss={onDismiss}
      maxWidthPercent={96}
      maxHeightPercent={95}
      title={`Historial de Orden #${orderNumber || ''}`}
      dismissable={true}
      noScroll={true}
      noPadding={false}
    >
      <View style={localStyles.modalHeaderSubtitle}>
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

      <Divider />

      <OrderHistoryContent
        orderId={orderId}
        orderNumber={orderNumber}
        showHeaderInfo={false}
        contentContainerStyle={styles.listContent}
        emptyContainerStyle={styles.emptyContainer}
      />
    </ResponsiveModal>
  );
};

export default OrderHistoryModal;
