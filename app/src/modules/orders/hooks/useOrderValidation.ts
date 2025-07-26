import { useState, useCallback } from 'react';
import { OrderTypeEnum, type OrderType } from '../types/orders.types';
import type { DeliveryInfo } from '@/app/schemas/domain/delivery-info.schema';
import type { CartItem } from '../stores/useOrderCreationStore';

interface ValidationErrors {
  areaError: string | null;
  tableError: string | null;
  recipientNameError: string | null;
  recipientPhoneError: string | null;
  addressError: string | null;
}

interface UseOrderValidationProps {
  orderType: OrderType;
  items: CartItem[];
  selectedAreaId: string | null;
  selectedTableId: string | null;
  isTemporaryTable: boolean;
  temporaryTableName: string;
  deliveryInfo: DeliveryInfo;
}

interface UseOrderValidationReturn extends ValidationErrors {
  setAreaError: (error: string | null) => void;
  setTableError: (error: string | null) => void;
  setRecipientNameError: (error: string | null) => void;
  setRecipientPhoneError: (error: string | null) => void;
  setAddressError: (error: string | null) => void;
  validateOrder: () => boolean;
  clearAllErrors: () => void;
}

export const useOrderValidation = ({
  orderType,
  items,
  selectedAreaId,
  selectedTableId,
  isTemporaryTable,
  temporaryTableName,
  deliveryInfo,
}: UseOrderValidationProps): UseOrderValidationReturn => {
  const [areaError, setAreaError] = useState<string | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);
  const [recipientNameError, setRecipientNameError] = useState<string | null>(
    null,
  );
  const [recipientPhoneError, setRecipientPhoneError] = useState<string | null>(
    null,
  );
  const [addressError, setAddressError] = useState<string | null>(null);

  const clearAllErrors = useCallback(() => {
    setAreaError(null);
    setTableError(null);
    setRecipientNameError(null);
    setRecipientPhoneError(null);
    setAddressError(null);
  }, []);

  const validateOrder = useCallback((): boolean => {
    // Limpiar errores previos
    clearAllErrors();

    // Validar que haya items
    if (items.length === 0) {
      return false;
    }

    let isValid = true;

    // Validaciones específicas por tipo de orden
    switch (orderType) {
      case OrderTypeEnum.DINE_IN:
        // Validar área
        if (!selectedAreaId) {
          setAreaError('Por favor selecciona un área');
          isValid = false;
        }

        // Validar mesa o mesa temporal
        if (isTemporaryTable) {
          if (!temporaryTableName.trim()) {
            setTableError('Por favor ingresa el nombre de la mesa');
            isValid = false;
          }
        } else {
          if (!selectedTableId) {
            setTableError('Por favor selecciona una mesa');
            isValid = false;
          }
        }
        break;

      case OrderTypeEnum.TAKE_AWAY:
        // Validar nombre del cliente
        if (!deliveryInfo.recipientName?.trim()) {
          setRecipientNameError('Por favor ingresa el nombre del cliente');
          isValid = false;
        }

        // Validar teléfono solo si se proporciona (es opcional)
        if (
          deliveryInfo.recipientPhone?.trim() &&
          !isValidPhoneNumber(deliveryInfo.recipientPhone)
        ) {
          setRecipientPhoneError('Por favor ingresa un teléfono válido');
          isValid = false;
        }
        break;

      case OrderTypeEnum.DELIVERY:
        // Validar teléfono
        if (!deliveryInfo.recipientPhone?.trim()) {
          setRecipientPhoneError('Por favor ingresa el teléfono');
          isValid = false;
        } else if (!isValidPhoneNumber(deliveryInfo.recipientPhone)) {
          setRecipientPhoneError('Por favor ingresa un teléfono válido');
          isValid = false;
        }

        // Validar dirección - usar fullAddress en lugar de address
        if (!deliveryInfo.fullAddress?.trim()) {
          setAddressError('Por favor ingresa la dirección de entrega');
          isValid = false;
        }
        break;
    }

    return isValid;
  }, [
    orderType,
    items,
    selectedAreaId,
    selectedTableId,
    isTemporaryTable,
    temporaryTableName,
    deliveryInfo,
    clearAllErrors,
  ]);

  return {
    areaError,
    tableError,
    recipientNameError,
    recipientPhoneError,
    addressError,
    setAreaError,
    setTableError,
    setRecipientNameError,
    setRecipientPhoneError,
    setAddressError,
    validateOrder,
    clearAllErrors,
  };
};

// Función auxiliar para validar números de teléfono
function isValidPhoneNumber(phone: string): boolean {
  // Eliminar espacios y caracteres especiales
  const cleanPhone = phone.replace(/[\s\-()]/g, '');

  // Validar que solo tenga números y opcionalmente un + al inicio
  const phoneRegex = /^\+?\d{7,15}$/;

  return phoneRegex.test(cleanPhone);
}
