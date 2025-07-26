import { useCallback } from 'react';
import { OrderTypeEnum, type OrderType } from '../../schema/orders.schema';
import type { CartItem } from '../../stores/useOrderStore';

interface ValidationParams {
  items: CartItem[];
  orderType: OrderType;
  isTemporaryTable: boolean;
  selectedAreaId: string | null;
  selectedTableId: string | null;
  temporaryTableName: string;
  deliveryInfo: any;
  validate: () => boolean;
}

export const useOrderValidation = () => {
  const validateOrder = useCallback(
    ({
      items,
      orderType,
      isTemporaryTable,
      selectedAreaId,
      selectedTableId,
      temporaryTableName,
      deliveryInfo,
      validate,
    }: ValidationParams): {
      isValid: boolean;
      errorMessage?: string;
    } => {
      // Verificar que haya items en el carrito
      if (items.length === 0) {
        return {
          isValid: false,
          errorMessage: 'El carrito está vacío',
        };
      }

      // Validar según el tipo de orden
      if (!validate()) {
        return {
          isValid: false,
          errorMessage: 'Por favor completa todos los campos requeridos',
        };
      }

      // Validaciones específicas adicionales
      switch (orderType) {
        case OrderTypeEnum.DINE_IN:
          if (!isTemporaryTable && !selectedTableId) {
            return {
              isValid: false,
              errorMessage: 'Por favor selecciona una mesa',
            };
          }
          if (isTemporaryTable && !temporaryTableName.trim()) {
            return {
              isValid: false,
              errorMessage: 'Por favor ingresa el nombre de la mesa temporal',
            };
          }
          if (isTemporaryTable && !selectedAreaId) {
            return {
              isValid: false,
              errorMessage:
                'Por favor selecciona un área para la mesa temporal',
            };
          }
          break;

        case OrderTypeEnum.DELIVERY:
          if (!deliveryInfo.recipientName?.trim()) {
            return {
              isValid: false,
              errorMessage: 'Por favor ingresa el nombre del cliente',
            };
          }
          if (!deliveryInfo.recipientPhone?.trim()) {
            return {
              isValid: false,
              errorMessage: 'Por favor ingresa el teléfono del cliente',
            };
          }
          if (!deliveryInfo.address?.trim()) {
            return {
              isValid: false,
              errorMessage: 'Por favor ingresa la dirección de entrega',
            };
          }
          break;

        case OrderTypeEnum.TAKE_AWAY:
          if (!deliveryInfo.recipientName?.trim()) {
            return {
              isValid: false,
              errorMessage: 'Por favor ingresa el nombre del cliente',
            };
          }
          if (!deliveryInfo.recipientPhone?.trim()) {
            return {
              isValid: false,
              errorMessage: 'Por favor ingresa el teléfono del cliente',
            };
          }
          break;
      }

      return { isValid: true };
    },
    [],
  );

  const canModifyItem = useCallback(
    (
      item: CartItem,
    ): {
      canModify: boolean;
      reason?: string;
    } => {
      if (
        item.preparationStatus === 'READY' ||
        item.preparationStatus === 'DELIVERED'
      ) {
        return {
          canModify: false,
          reason: `No se puede modificar un producto ${
            item.preparationStatus === 'READY' ? 'listo' : 'entregado'
          }`,
        };
      }

      return { canModify: true };
    },
    [],
  );

  const requiresConfirmation = useCallback((item: CartItem): boolean => {
    return item.preparationStatus === 'IN_PROGRESS';
  }, []);

  return {
    validateOrder,
    canModifyItem,
    requiresConfirmation,
  };
};
