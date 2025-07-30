import React, { useMemo, useEffect } from 'react';
import { OrderForFinalization } from '../schema/orderFinalization.schema';
import { OrderDetailsView } from '@/modules/shared/components/OrderDetailsView';
import { mapOrderForFinalizationToUnifiedOrder } from '@/modules/shared/mappers/order-mapper';
import { ResponsiveModal } from '@/app/components/responsive/ResponsiveModal';
import { useOrderForFinalizationDetail } from '../hooks/useOrderFinalizationQueries';

interface OrderDetailsModalProps {
  visible: boolean;
  onDismiss: () => void;
  order: OrderForFinalization | null;
  isLoading?: boolean;
  orderId?: string; // ID para refetch automático
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  visible,
  onDismiss,
  order,
  isLoading = false,
  orderId,
}) => {
  // Obtener datos frescos cuando se abre el modal
  const { data: freshOrder, isLoading: isFetchingFresh } =
    useOrderForFinalizationDetail(visible && orderId ? orderId : null);

  // Usar datos frescos si están disponibles, caso contrario usar los pasados por props
  const orderToUse = freshOrder || order;
  const actualIsLoading = isLoading || isFetchingFresh;

  // Mapear los datos de la orden a formato unificado
  const unifiedOrder = useMemo(() => {
    if (!orderToUse) return null;
    return mapOrderForFinalizationToUnifiedOrder(orderToUse);
  }, [orderToUse]);

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

  return (
    <ResponsiveModal
      visible={visible}
      onDismiss={onDismiss}
      title={
        orderToUse
          ? `Orden #${orderToUse.shiftOrderNumber || ''} • ${getOrderTypeLabel(orderToUse.orderType)}`
          : 'Cargando...'
      }
      maxWidthPercent={92}
      maxHeightPercent={90}
      isLoading={actualIsLoading}
      noPadding={true}
    >
      {orderToUse && unifiedOrder && (
        <OrderDetailsView order={unifiedOrder} isLoading={false} />
      )}
    </ResponsiveModal>
  );
};

export default OrderDetailsModal;
