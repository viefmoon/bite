// app/src/modules/shared/components/UnifiedOrderDetailsModal.tsx

import React, { useState, useMemo } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { IconButton } from 'react-native-paper';
import { ResponsiveModal } from '@/app/components/responsive/ResponsiveModal';
import { OrderDetailsView } from './OrderDetailsView';
import OrderHistoryModal from './OrderHistoryModal';

// Importa los servicios y mappers necesarios
import { orderService } from '@/app/services/orderService';
import { mapOrderToUnifiedOrder } from '../mappers/order-mapper';
import { UnifiedOrderDetails } from '../types/unified-order.types';

type DataSource = 'finalization' | 'receipts' | 'shiftAudit';

interface UnifiedOrderDetailsModalProps {
  visible: boolean;
  onDismiss: () => void;
  orderId: string | null;
  orderNumber?: number;
  dataSource: DataSource;
  showHistoryButton?: boolean;
  shiftId?: string; // Requerido para dataSource 'shiftAudit'
}

// Hook personalizado para obtener y mapear los datos
const useUnifiedOrder = (
  orderId: string | null,
  dataSource: DataSource,
  shiftId?: string,
) => {
  const queryFn = async () => {
    if (!orderId) return null;
    // Ahora todos los casos usan el mismo endpoint genérico
    return await orderService.getOrderById(orderId);
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['unifiedOrderDetail', orderId, dataSource, shiftId],
    queryFn,
    enabled: !!orderId,
  });

  const unifiedOrder: UnifiedOrderDetails | null = useMemo(() => {
    if (!data) return null;
    // Ahora todos los endpoints devuelven Order, usando mapper genérico
    return mapOrderToUnifiedOrder(data as any);
  }, [data]);

  return { order: unifiedOrder, isLoading, isError };
};

export const UnifiedOrderDetailsModal: React.FC<
  UnifiedOrderDetailsModalProps
> = ({
  visible,
  onDismiss,
  orderId,
  orderNumber,
  dataSource,
  showHistoryButton = false,
  shiftId,
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const { order, isLoading } = useUnifiedOrder(orderId, dataSource, shiftId);

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

  const getModalTitle = () => {
    if (isLoading) return 'Cargando...';
    if (!order) return `Orden #${orderNumber || ''}`;

    return `Orden #${order.shiftOrderNumber || orderNumber || ''} • ${getOrderTypeLabel(order.orderType)}`;
  };

  const headerActions = showHistoryButton ? (
    <View>
      <IconButton
        icon="history"
        size={32}
        onPress={() => setShowHistory(true)}
      />
    </View>
  ) : null;

  return (
    <>
      <ResponsiveModal
        visible={visible}
        onDismiss={onDismiss}
        title={getModalTitle()}
        headerRight={headerActions}
        showCloseButton
        maxWidthPercent={92}
        maxHeightPercent={90}
        isLoading={isLoading}
        noPadding={true}
      >
        {order && (
          <OrderDetailsView
            order={order}
            isLoading={false}
            showFinalizationDate={
              dataSource === 'receipts' || dataSource === 'shiftAudit'
            }
          />
        )}
      </ResponsiveModal>

      {orderId && (
        <OrderHistoryModal
          visible={showHistory}
          onDismiss={() => setShowHistory(false)}
          orderId={orderId}
          orderNumber={orderNumber || order?.shiftOrderNumber}
        />
      )}
    </>
  );
};
