import { useState, useCallback, useEffect } from 'react';
import { OrderTypeEnum, type OrderType } from '../../schema/orders.schema';
import type { DeliveryInfo } from '@/app/schemas/domain/delivery-info.schema';

interface OrderTypeState {
  orderType: OrderType;
  selectedAreaId: string | null;
  selectedTableId: string | null;
  isTemporaryTable: boolean;
  temporaryTableName: string;
  scheduledTime: Date | null;
  deliveryInfo: DeliveryInfo;
  orderNotes: string;
}


export const useOrderTypeLogic = (
  initialState?: Partial<OrderTypeState>,
) => {
  // Estados principales
  const [orderType, setOrderType] = useState<OrderType>(
    initialState?.orderType || OrderTypeEnum.DINE_IN,
  );
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(
    initialState?.selectedAreaId || null,
  );
  const [selectedTableId, setSelectedTableId] = useState<string | null>(
    initialState?.selectedTableId || null,
  );
  const [isTemporaryTable, setIsTemporaryTable] = useState<boolean>(
    initialState?.isTemporaryTable || false,
  );
  const [temporaryTableName, setTemporaryTableName] = useState<string>(
    initialState?.temporaryTableName || '',
  );
  const [scheduledTime, setScheduledTime] = useState<Date | null>(
    initialState?.scheduledTime || null,
  );
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>(
    initialState?.deliveryInfo || {},
  );
  const [orderNotes, setOrderNotes] = useState<string>(
    initialState?.orderNotes || '',
  );

  // Estados de validación
  const [areaError, setAreaError] = useState<string | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);
  const [recipientNameError, setRecipientNameError] = useState<string | null>(
    null,
  );
  const [recipientPhoneError, setRecipientPhoneError] = useState<string | null>(
    null,
  );
  const [addressError, setAddressError] = useState<string | null>(null);

  // Limpiar errores al cambiar tipo de orden
  useEffect(() => {
    setAreaError(null);
    setTableError(null);
    setRecipientNameError(null);
    setRecipientPhoneError(null);
    setAddressError(null);
  }, [orderType]);

  // Validación para DINE_IN
  const validateDineIn = useCallback((): boolean => {
    let isValid = true;

    if (!isTemporaryTable) {
      if (!selectedAreaId) {
        setAreaError('Por favor selecciona un área');
        isValid = false;
      } else {
        setAreaError(null);
      }

      if (!selectedTableId) {
        setTableError('Por favor selecciona una mesa');
        isValid = false;
      } else {
        setTableError(null);
      }
    } else {
      if (!temporaryTableName.trim()) {
        setTableError('Por favor ingresa el nombre de la mesa temporal');
        isValid = false;
      } else {
        setTableError(null);
      }

      if (!selectedAreaId) {
        setAreaError('Por favor selecciona un área para la mesa temporal');
        isValid = false;
      } else {
        setAreaError(null);
      }
    }

    return isValid;
  }, [isTemporaryTable, selectedAreaId, selectedTableId, temporaryTableName]);

  // Validación para DELIVERY
  const validateDelivery = useCallback((): boolean => {
    let isValid = true;

    if (!deliveryInfo.recipientName?.trim()) {
      setRecipientNameError('El nombre es requerido');
      isValid = false;
    } else {
      setRecipientNameError(null);
    }

    if (!deliveryInfo.recipientPhone?.trim()) {
      setRecipientPhoneError('El teléfono es requerido');
      isValid = false;
    } else {
      setRecipientPhoneError(null);
    }

    if (!deliveryInfo.fullAddress?.trim()) {
      setAddressError('La dirección es requerida');
      isValid = false;
    } else {
      setAddressError(null);
    }

    return isValid;
  }, [deliveryInfo]);

  // Validación para TAKE_AWAY
  const validateTakeAway = useCallback((): boolean => {
    let isValid = true;

    if (!deliveryInfo.recipientName?.trim()) {
      setRecipientNameError('El nombre es requerido');
      isValid = false;
    } else {
      setRecipientNameError(null);
    }

    if (!deliveryInfo.recipientPhone?.trim()) {
      setRecipientPhoneError('El teléfono es requerido');
      isValid = false;
    } else {
      setRecipientPhoneError(null);
    }

    return isValid;
  }, [deliveryInfo]);

  // Validación general
  const validate = useCallback((): boolean => {
    switch (orderType) {
      case OrderTypeEnum.DINE_IN:
        return validateDineIn();
      case OrderTypeEnum.DELIVERY:
        return validateDelivery();
      case OrderTypeEnum.TAKE_AWAY:
        return validateTakeAway();
      default:
        return true;
    }
  }, [orderType, validateDineIn, validateDelivery, validateTakeAway]);

  // Limpiar datos según el tipo de orden
  const cleanOrderDataForSubmission = useCallback(
    (orderType: OrderType) => {
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
          if (isTemporaryTable) {
            cleanedData.isTemporaryTable = true;
            cleanedData.temporaryTableName = temporaryTableName;
            cleanedData.temporaryTableAreaId = selectedAreaId || undefined;
          } else {
            cleanedData.tableId = selectedTableId || undefined;
          }
          break;

        case OrderTypeEnum.DELIVERY:
          cleanedData.deliveryInfo = {
            recipientName: deliveryInfo.recipientName,
            recipientPhone: deliveryInfo.recipientPhone,
            fullAddress: deliveryInfo.fullAddress,
            city: deliveryInfo.city,
            neighborhood: deliveryInfo.neighborhood,
            deliveryInstructions: deliveryInfo.deliveryInstructions,
          };
          break;

        case OrderTypeEnum.TAKE_AWAY:
          cleanedData.deliveryInfo = {
            recipientName: deliveryInfo.recipientName,
            recipientPhone: deliveryInfo.recipientPhone,
          };
          break;

        default:
          break;
      }

      return cleanedData;
    },
    [
      isTemporaryTable,
      temporaryTableName,
      selectedAreaId,
      selectedTableId,
      deliveryInfo,
    ],
  );

  return {
    // Estados
    orderType,
    selectedAreaId,
    selectedTableId,
    isTemporaryTable,
    temporaryTableName,
    scheduledTime,
    deliveryInfo,
    orderNotes,

    // Setters
    setOrderType,
    setSelectedAreaId,
    setSelectedTableId,
    setIsTemporaryTable,
    setTemporaryTableName,
    setScheduledTime,
    setDeliveryInfo,
    setOrderNotes,

    // Errores
    areaError,
    tableError,
    recipientNameError,
    recipientPhoneError,
    addressError,

    // Funciones
    validate,
    cleanOrderDataForSubmission,
  };
};
