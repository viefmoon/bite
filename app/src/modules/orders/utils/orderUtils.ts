import type { OrderType } from '../schema/orders.schema';
import type { DeliveryInfo } from '../../../app/schemas/domain/delivery-info.schema';
import type { OrderAdjustment } from '../schema/adjustments.schema';
import type { OrderItemDtoForBackend } from '../schema/update-order.schema';
import type { CartItem } from './cartUtils';
import { OrderTypeEnum } from '../schema/orders.schema';

export interface OrderDetailsForBackend {
  userId?: string;
  orderType: OrderType;
  subtotal: number;
  total: number;
  items: OrderItemDtoForBackend[];
  tableId?: string;
  isTemporaryTable?: boolean;
  temporaryTableName?: string;
  temporaryTableAreaId?: string;
  scheduledAt?: Date;
  deliveryInfo: DeliveryInfo;
  notes?: string;
  payment?: {
    amount: number;
    method: 'CASH' | 'CARD' | 'TRANSFER';
  };
  adjustments?: {
    orderId?: string;
    name: string;
    isPercentage: boolean;
    value?: number;
    amount?: number;
  }[];
  prepaymentId?: string;
}

interface OrderFormState {
  orderType: OrderType;
  selectedAreaId: string | null;
  selectedTableId: string | null;
  isTemporaryTable: boolean;
  temporaryTableName: string;
  scheduledTime: Date | null;
  deliveryInfo: DeliveryInfo;
  orderNotes: string;
  adjustments: OrderAdjustment[];
}

interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export const validateOrderForConfirmation = (
  items: CartItem[],
  formState: OrderFormState,
  prepaymentId?: string | null,
  prepaymentAmount?: string,
  isEditMode: boolean = false,
): ValidationResult => {
  if (items.length === 0) {
    return {
      isValid: false,
      errorMessage: 'No hay productos en el carrito',
    };
  }

  if (!isEditMode && prepaymentId) {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const adjustmentTotal = formState.adjustments.reduce((sum, adj) => {
      if (adj.isDeleted) return sum;
      return sum + (adj.amount || 0);
    }, 0);
    const total = subtotal - adjustmentTotal;

    if (parseFloat(prepaymentAmount || '0') > total) {
      return {
        isValid: false,
        errorMessage:
          'El prepago excede el total de la orden. Por favor edite el pago antes de continuar.',
      };
    }
  }

  // Validaciones específicas según el tipo de orden
  switch (formState.orderType) {
    case OrderTypeEnum.DINE_IN:
      if (!formState.isTemporaryTable && !formState.selectedTableId) {
        return {
          isValid: false,
          errorMessage: 'Por favor selecciona una mesa',
        };
      }
      if (formState.isTemporaryTable && !formState.temporaryTableName.trim()) {
        return {
          isValid: false,
          errorMessage: 'Por favor ingresa el nombre de la mesa temporal',
        };
      }
      if (formState.isTemporaryTable && !formState.selectedAreaId) {
        return {
          isValid: false,
          errorMessage: 'Por favor selecciona un área para la mesa temporal',
        };
      }
      break;

    case OrderTypeEnum.DELIVERY:
      if (!formState.deliveryInfo.recipientName?.trim()) {
        return {
          isValid: false,
          errorMessage: 'Por favor ingresa el nombre del cliente',
        };
      }
      if (!formState.deliveryInfo.recipientPhone?.trim()) {
        return {
          isValid: false,
          errorMessage: 'Por favor ingresa el teléfono del cliente',
        };
      }
      if (!formState.deliveryInfo.fullAddress?.trim()) {
        return {
          isValid: false,
          errorMessage: 'Por favor ingresa la dirección de entrega',
        };
      }
      break;

    case OrderTypeEnum.TAKE_AWAY:
      if (!formState.deliveryInfo.recipientName?.trim()) {
        return {
          isValid: false,
          errorMessage: 'Por favor ingresa el nombre del cliente',
        };
      }
      break;
  }

  return { isValid: true };
};

export const getValidationErrors = (
  items: CartItem[],
  formState: OrderFormState,
): string[] => {
  const errors: string[] = [];

  if (items.length === 0) {
    errors.push('El carrito está vacío');
  }

  // Validaciones específicas según el tipo de orden
  switch (formState.orderType) {
    case OrderTypeEnum.DINE_IN:
      if (!formState.isTemporaryTable && !formState.selectedTableId) {
        errors.push('Selecciona una mesa');
      }
      if (formState.isTemporaryTable && !formState.temporaryTableName.trim()) {
        errors.push('Ingresa el nombre de la mesa temporal');
      }
      if (formState.isTemporaryTable && !formState.selectedAreaId) {
        errors.push('Selecciona un área para la mesa temporal');
      }
      break;

    case OrderTypeEnum.DELIVERY:
      if (!formState.deliveryInfo.recipientName?.trim()) {
        errors.push('Ingresa el nombre del cliente');
      }
      if (!formState.deliveryInfo.recipientPhone?.trim()) {
        errors.push('Ingresa el teléfono del cliente');
      }
      if (!formState.deliveryInfo.fullAddress?.trim()) {
        errors.push('Ingresa la dirección de entrega');
      }
      break;

    case OrderTypeEnum.TAKE_AWAY:
      if (!formState.deliveryInfo.recipientName?.trim()) {
        errors.push('Ingresa el nombre del cliente');
      }
      break;
  }

  return errors;
};

export const prepareOrderForBackend = (
  items: CartItem[],
  formState: OrderFormState,
  isEditMode: boolean = false,
  orderId?: string | null,
  prepaymentId?: string | null,
): OrderDetailsForBackend | null => {
  const validation = validateOrderForConfirmation(
    items,
    formState,
    prepaymentId,
    '',
    isEditMode,
  );

  if (!validation.isValid) {
    return null;
  }

  // Limpiar datos según el tipo de orden
  const cleanedData = (() => {
    const base = {
      tableId: undefined as string | undefined,
      isTemporaryTable: undefined as boolean | undefined,
      temporaryTableName: undefined as string | undefined,
      temporaryTableAreaId: undefined as string | undefined,
      deliveryInfo: {} as DeliveryInfo,
    };

    switch (formState.orderType) {
      case OrderTypeEnum.DINE_IN:
        if (formState.isTemporaryTable) {
          return {
            ...base,
            isTemporaryTable: true,
            temporaryTableName: formState.temporaryTableName,
            temporaryTableAreaId: formState.selectedAreaId || undefined,
          };
        } else {
          return {
            ...base,
            tableId: formState.selectedTableId || undefined,
          };
        }

      case OrderTypeEnum.DELIVERY:
        return {
          ...base,
          deliveryInfo: {
            recipientName: formState.deliveryInfo.recipientName,
            recipientPhone: formState.deliveryInfo.recipientPhone,
            fullAddress: formState.deliveryInfo.fullAddress,
            deliveryInstructions: formState.deliveryInfo.deliveryInstructions,
          },
        };

      case OrderTypeEnum.TAKE_AWAY:
        return {
          ...base,
          deliveryInfo: {
            recipientName: formState.deliveryInfo.recipientName,
            recipientPhone: formState.deliveryInfo.recipientPhone,
          },
        };

      default:
        return base;
    }
  })();

  const itemsForBackend: OrderItemDtoForBackend[] = [];

  items.forEach((item) => {
    if (isEditMode && item.id && !item.id.startsWith('new-')) {
      const existingIds = item.id
        .split(',')
        .filter((id) => id.trim() && !id.startsWith('new-'));
      const requiredQuantity = item.quantity;

      for (let i = 0; i < requiredQuantity; i++) {
        const isExistingItem = i < existingIds.length;

        itemsForBackend.push({
          id: isExistingItem ? existingIds[i] : undefined,
          productId: item.productId,
          productVariantId: item.variantId || null,
          quantity: 1,
          basePrice: Number(item.unitPrice),
          finalPrice: Number(item.totalPrice / item.quantity),
          preparationNotes: item.preparationNotes || null,
          productModifiers:
            item.modifiers && item.modifiers.length > 0
              ? item.modifiers.map((mod) => ({
                  modifierId: mod.id,
                }))
              : undefined,
          selectedPizzaCustomizations:
            item.selectedPizzaCustomizations || undefined,
        });
      }
    } else {
      for (let i = 0; i < item.quantity; i++) {
        itemsForBackend.push({
          productId: item.productId,
          productVariantId: item.variantId || null,
          quantity: 1,
          basePrice: Number(item.unitPrice),
          finalPrice: Number(item.totalPrice / item.quantity),
          preparationNotes: item.preparationNotes || null,
          productModifiers:
            item.modifiers && item.modifiers.length > 0
              ? item.modifiers.map((mod) => ({
                  modifierId: mod.id,
                }))
              : undefined,
          selectedPizzaCustomizations:
            item.selectedPizzaCustomizations || undefined,
        });
      }
    }
  });

  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const adjustmentTotal = formState.adjustments.reduce((sum, adj) => {
    if (adj.isDeleted) return sum;
    return sum + (adj.amount || 0);
  }, 0);
  const total = Math.max(0, subtotal - adjustmentTotal);

  let formattedPhone: string | undefined = undefined;
  if (
    cleanedData.deliveryInfo.recipientPhone &&
    cleanedData.deliveryInfo.recipientPhone.trim() !== ''
  ) {
    formattedPhone = cleanedData.deliveryInfo.recipientPhone.trim();
  }

  const orderDetails: OrderDetailsForBackend = {
    orderType: formState.orderType,
    subtotal,
    total,
    items: itemsForBackend,
    tableId: cleanedData.tableId,
    isTemporaryTable: cleanedData.isTemporaryTable,
    temporaryTableName: cleanedData.temporaryTableName,
    temporaryTableAreaId: cleanedData.temporaryTableAreaId,
    scheduledAt: formState.scheduledTime ? formState.scheduledTime : undefined,
    deliveryInfo: {
      ...cleanedData.deliveryInfo,
      recipientPhone: formattedPhone,
    },
    notes: formState.orderNotes || undefined,
    adjustments: isEditMode
      ? formState.adjustments
          .filter((adj) => !adj.isDeleted)
          .map((adj) => {
            return {
              orderId: orderId || undefined,
              name: adj.name,
              isPercentage: adj.isPercentage,
              value: adj.value,
              amount: adj.amount,
            };
          })
      : undefined,
  };

  if (!isEditMode && prepaymentId) {
    orderDetails.prepaymentId = prepaymentId;
  }

  return orderDetails;
};
