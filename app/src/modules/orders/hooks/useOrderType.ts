import { useState, useEffect, useCallback } from 'react';
import { OrderTypeEnum, type OrderType } from '../types/orders.types';
import type { DeliveryInfo } from '@/app/schemas/domain/delivery-info.schema';

interface UseOrderTypeProps {
  isEditMode: boolean;
  initialOrderType?: OrderType;
  onOrderTypeChange?: (orderType: OrderType) => void;
}

interface UseOrderTypeReturn {
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  cleanOrderDataForType: (
    orderType: OrderType,
    deliveryInfo: DeliveryInfo,
    selectedTableId: string | null,
    selectedAreaId: string | null,
    isTemporaryTable: boolean,
    temporaryTableName: string,
  ) => {
    deliveryInfo: DeliveryInfo;
    tableId?: string;
    isTemporaryTable?: boolean;
    temporaryTableName?: string;
    temporaryTableAreaId?: string;
  };
}

export const useOrderType = ({
  isEditMode,
  initialOrderType = OrderTypeEnum.DINE_IN,
  onOrderTypeChange,
}: UseOrderTypeProps): UseOrderTypeReturn => {
  const [orderType, setOrderTypeState] = useState<OrderType>(initialOrderType);

  // Actualizar el tipo de orden cuando cambie el prop inicial (modo edición)
  useEffect(() => {
    if (isEditMode && initialOrderType) {
      setOrderTypeState(initialOrderType);
    }
  }, [isEditMode, initialOrderType]);

  const setOrderType = useCallback(
    (type: OrderType) => {
      setOrderTypeState(type);
      onOrderTypeChange?.(type);
    },
    [onOrderTypeChange],
  );

  // Función para limpiar datos según el tipo de orden
  const cleanOrderDataForType = useCallback(
    (
      orderType: OrderType,
      deliveryInfo: DeliveryInfo,
      selectedTableId: string | null,
      selectedAreaId: string | null,
      isTemporaryTable: boolean,
      temporaryTableName: string,
    ) => {
      const cleanedData: {
        deliveryInfo: DeliveryInfo;
        tableId?: string;
        isTemporaryTable?: boolean;
        temporaryTableName?: string;
        temporaryTableAreaId?: string;
      } = {
        deliveryInfo: {},
      };

      switch (orderType) {
        case OrderTypeEnum.DINE_IN:
          // Para comer aquí, limpiar datos de delivery
          cleanedData.deliveryInfo = {};
          if (isTemporaryTable && temporaryTableName && selectedAreaId) {
            cleanedData.isTemporaryTable = true;
            cleanedData.temporaryTableName = temporaryTableName;
            cleanedData.temporaryTableAreaId = selectedAreaId;
          } else if (selectedTableId) {
            cleanedData.tableId = selectedTableId;
          }
          break;

        case OrderTypeEnum.TAKE_AWAY:
          // Para llevar, solo mantener nombre y teléfono
          cleanedData.deliveryInfo = {
            recipientName: deliveryInfo.recipientName,
            phone: deliveryInfo.phone,
          };
          break;

        case OrderTypeEnum.DELIVERY:
          // Para domicilio, mantener todos los datos
          cleanedData.deliveryInfo = deliveryInfo;
          break;
      }

      return cleanedData;
    },
    [],
  );

  return {
    orderType,
    setOrderType,
    cleanOrderDataForType,
  };
};
