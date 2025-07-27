import {
  useCartStore,
  useCartSubtotal,
  useCartItemsCount,
  useIsCartEmpty,
} from './useCartStore';
import { useOrderFormStore } from './useOrderFormStore';
import { useOrderUIStore } from './useOrderUIStore';
import {
  validateOrderForConfirmation,
  getValidationErrors,
  prepareOrderForBackend,
  type OrderDetailsForBackend,
} from '../utils/orderUtils';
import type { CartItem } from '../utils/cartUtils';

const findModifierById = (modifierId: string, fullMenuData: any) => {
  if (!fullMenuData) return null;

  for (const product of fullMenuData) {
    for (const group of product.modifierGroups || []) {
      for (const modifier of group.modifiers || []) {
        if (modifier.id === modifierId) {
          return {
            id: modifier.id,
            modifierGroupId: group.id,
            name: modifier.name,
            price: modifier.price,
          };
        }
      }
    }
  }
  return null;
};

const calculateTotalPrice = (
  unitPrice: number,
  modifiers: any[],
  pizzaExtraCost: number,
  quantity: number,
) => {
  const modifiersPrice = modifiers.reduce(
    (sum, mod) => sum + (mod.price || 0),
    0,
  );
  return (unitPrice + modifiersPrice + pizzaExtraCost) * quantity;
};

export const useOrderManagement = () => {
  const cartStore = useCartStore();
  const formStore = useOrderFormStore();
  const uiStore = useOrderUIStore();

  const loadOrderForEditing = (orderData: any, fullMenuData?: any) => {
    // Reset states first
    cartStore.resetCart();
    formStore.resetForm();
    uiStore.resetUI();

    // Set edit mode
    formStore.setEditMode(true, orderData.id);

    // Map form data
    formStore.setOrderType(orderData.orderType);
    if (orderData.tableId) {
      formStore.setSelectedTableId(orderData.tableId);
    }
    if (orderData.scheduledAt) {
      formStore.setScheduledTime(new Date(orderData.scheduledAt));
    }
    if (orderData.deliveryInfo) {
      formStore.setDeliveryInfo(orderData.deliveryInfo);
    }
    if (orderData.notes) {
      formStore.setOrderNotes(orderData.notes);
    }

    // Handle adjustments
    if (orderData.adjustments && Array.isArray(orderData.adjustments)) {
      const mappedAdjustments = orderData.adjustments.map((adj: any) => ({
        id: adj.id,
        name: adj.name,
        description: adj.description || '',
        isPercentage: adj.isPercentage,
        value: adj.value,
        amount: adj.amount,
        isDeleted: false,
        isNew: false,
      }));
      formStore.setAdjustments(mappedAdjustments);
    }

    // Handle table data
    if (orderData.tableId && orderData.table) {
      const areaId = orderData.table.areaId || orderData.table.area?.id;
      if (areaId) {
        formStore.setSelectedAreaId(areaId);
      }

      if (orderData.table.isTemporary) {
        formStore.setIsTemporaryTable(true);
        formStore.setTemporaryTableName(orderData.table.name || '');
      }
    }

    // Handle order items
    const groupedItemsMap = new Map<string, CartItem>();

    if (orderData.orderItems && Array.isArray(orderData.orderItems)) {
      orderData.orderItems.forEach((item: any) => {
        const modifiers: any[] = [];

        // Handle modifiers
        if (item.modifiers && Array.isArray(item.modifiers)) {
          item.modifiers.forEach((mod: any) => {
            modifiers.push({
              id: mod.productModifierId,
              modifierGroupId: mod.productModifier?.modifierGroupId || '',
              name: mod.productModifier?.name || 'Modificador',
              price: parseFloat(mod.price) || 0,
            });
          });
        } else if (
          item.productModifiers &&
          Array.isArray(item.productModifiers)
        ) {
          item.productModifiers.forEach((mod: any) => {
            const modifierInfo = fullMenuData
              ? findModifierById(mod.id, fullMenuData)
              : null;
            modifiers.push(
              modifierInfo || {
                id: mod.id,
                modifierGroupId: mod.modifierGroupId || '',
                name: mod.name || 'Modificador',
                price: parseFloat(mod.price) || 0,
              },
            );
          });
        }

        const unitPrice = parseFloat(item.basePrice || '0');
        const modifierIds = modifiers
          .map((m) => m.id)
          .sort()
          .join(',');
        const pizzaCustomizationIds = item.selectedPizzaCustomizations
          ? item.selectedPizzaCustomizations
              .map(
                (c: any) => `${c.pizzaCustomizationId}-${c.half}-${c.action}`,
              )
              .sort()
              .join(',')
          : '';
        const groupKey = `${item.productId}-${item.productVariantId || 'null'}-${modifierIds}-${pizzaCustomizationIds}-${item.preparationNotes || ''}-${item.preparationStatus || 'PENDING'}`;

        const existingItem = groupedItemsMap.get(groupKey);

        if (
          existingItem &&
          existingItem.preparationStatus === item.preparationStatus
        ) {
          existingItem.quantity += 1;
          existingItem.totalPrice = calculateTotalPrice(
            unitPrice,
            modifiers,
            0,
            existingItem.quantity,
          );
          existingItem.id = `${existingItem.id},${item.id}`;
        } else {
          const cartItem: CartItem = {
            id: item.id,
            productId: item.productId,
            productName: item.product?.name || 'Producto desconocido',
            quantity: 1,
            unitPrice,
            totalPrice: calculateTotalPrice(unitPrice, modifiers, 0, 1),
            modifiers,
            variantId: item.productVariantId || undefined,
            variantName: item.productVariant?.name || undefined,
            preparationNotes: item.preparationNotes || undefined,
            preparationStatus: item.preparationStatus || 'PENDING',
            selectedPizzaCustomizations:
              item.selectedPizzaCustomizations || undefined,
          };
          groupedItemsMap.set(groupKey, cartItem);
        }
      });
    }

    cartStore.setItems(Array.from(groupedItemsMap.values()));

    // Set original state for comparison
    formStore.setOriginalState(orderData);
  };

  const validateForConfirmation = () => {
    return validateOrderForConfirmation(
      cartStore.items,
      {
        orderType: formStore.orderType,
        selectedAreaId: formStore.selectedAreaId,
        selectedTableId: formStore.selectedTableId,
        isTemporaryTable: formStore.isTemporaryTable,
        temporaryTableName: formStore.temporaryTableName,
        scheduledTime: formStore.scheduledTime,
        deliveryInfo: formStore.deliveryInfo,
        orderNotes: formStore.orderNotes,
        adjustments: formStore.adjustments,
      },
      formStore.prepaymentId,
      formStore.prepaymentAmount,
      formStore.isEditMode,
    );
  };

  const getValidationErrorsList = () => {
    return getValidationErrors(cartStore.items, {
      orderType: formStore.orderType,
      selectedAreaId: formStore.selectedAreaId,
      selectedTableId: formStore.selectedTableId,
      isTemporaryTable: formStore.isTemporaryTable,
      temporaryTableName: formStore.temporaryTableName,
      scheduledTime: formStore.scheduledTime,
      deliveryInfo: formStore.deliveryInfo,
      orderNotes: formStore.orderNotes,
      adjustments: formStore.adjustments,
    });
  };

  const prepareOrderForBackendData = (): OrderDetailsForBackend | null => {
    return prepareOrderForBackend(
      cartStore.items,
      {
        orderType: formStore.orderType,
        selectedAreaId: formStore.selectedAreaId,
        selectedTableId: formStore.selectedTableId,
        isTemporaryTable: formStore.isTemporaryTable,
        temporaryTableName: formStore.temporaryTableName,
        scheduledTime: formStore.scheduledTime,
        deliveryInfo: formStore.deliveryInfo,
        orderNotes: formStore.orderNotes,
        adjustments: formStore.adjustments,
      },
      formStore.isEditMode,
      formStore.id,
      formStore.prepaymentId,
    );
  };

  const confirmOrder = async (
    userId: string,
    onConfirmOrder: (details: OrderDetailsForBackend) => Promise<void>,
  ) => {
    // Evitar múltiples confirmaciones
    if (uiStore.isConfirming) {
      throw new Error('Ya se está procesando la orden');
    }

    // Validar primero
    const validation = validateForConfirmation();
    if (!validation.isValid) {
      throw new Error(
        validation.errorMessage ||
          'Por favor complete todos los campos requeridos',
      );
    }

    // Preparar datos para el backend
    const orderDetails = prepareOrderForBackendData();
    if (!orderDetails) {
      throw new Error('Error al preparar la orden');
    }

    // Agregar el userId
    orderDetails.userId = userId;

    if (orderDetails.total <= 0) {
      throw new Error('El total de la orden debe ser mayor a 0');
    }

    if (
      orderDetails.payment &&
      orderDetails.payment.amount > orderDetails.total
    ) {
      throw new Error(
        'El monto del pago no puede exceder el total de la orden',
      );
    }

    uiStore.setIsConfirming(true);

    try {
      await onConfirmOrder(orderDetails);

      if (formStore.isEditMode) {
        // Update original state after successful edit
        const newOriginalState = {
          orderType: formStore.orderType,
          tableId: formStore.selectedTableId,
          isTemporaryTable: formStore.isTemporaryTable,
          temporaryTableName: formStore.temporaryTableName,
          deliveryInfo: { ...formStore.deliveryInfo },
          notes: formStore.orderNotes,
          scheduledAt: formStore.scheduledTime,
          adjustments: [...formStore.adjustments],
        };
        formStore.setOriginalState({ ...newOriginalState });
      } else {
        resetOrder();
      }
    } finally {
      uiStore.setIsConfirming(false);
    }
  };

  const resetOrder = () => {
    cartStore.resetCart();
    formStore.resetForm();
    uiStore.resetUI();
  };

  const checkForUnsavedChanges = () => {
    formStore.checkForUnsavedChanges();
  };

  return {
    // Cart actions
    addItem: (
      product: any,
      quantity?: number,
      variantId?: string,
      modifiers?: any[],
      preparationNotes?: string,
      selectedPizzaCustomizations?: any[],
      pizzaExtraCost?: number,
    ) => {
      cartStore.addItem(
        product,
        quantity,
        variantId,
        modifiers,
        preparationNotes,
        selectedPizzaCustomizations,
        pizzaExtraCost,
        formStore.isEditMode,
      );
      checkForUnsavedChanges();
    },
    removeItem: (itemId: string) => {
      cartStore.removeItem(itemId);
      checkForUnsavedChanges();
    },
    updateItemQuantity: (itemId: string, quantity: number) => {
      cartStore.updateItemQuantity(itemId, quantity);
      checkForUnsavedChanges();
    },
    updateItem: cartStore.updateItem,
    setItems: (items: CartItem[]) => {
      cartStore.setItems(items);
      checkForUnsavedChanges();
    },

    // Form actions
    setOrderType: formStore.setOrderType,
    setSelectedAreaId: formStore.setSelectedAreaId,
    setSelectedTableId: formStore.setSelectedTableId,
    setIsTemporaryTable: formStore.setIsTemporaryTable,
    setTemporaryTableName: formStore.setTemporaryTableName,
    setScheduledTime: formStore.setScheduledTime,
    setDeliveryInfo: formStore.setDeliveryInfo,
    setOrderNotes: formStore.setOrderNotes,
    setAdjustments: formStore.setAdjustments,
    addAdjustment: formStore.addAdjustment,
    updateAdjustment: formStore.updateAdjustment,
    removeAdjustment: formStore.removeAdjustment,
    setPrepaymentId: formStore.setPrepaymentId,
    setPrepaymentAmount: formStore.setPrepaymentAmount,
    setPrepaymentMethod: formStore.setPrepaymentMethod,

    // UI actions
    showCart: uiStore.showCart,
    hideCart: uiStore.hideCart,
    setIsLoading: uiStore.setIsLoading,
    setIsConfirming: uiStore.setIsConfirming,

    // Combined actions
    loadOrderForEditing,
    validateForConfirmation,
    getValidationErrors: getValidationErrorsList,
    prepareOrderForBackend: prepareOrderForBackendData,
    confirmOrder,
    resetOrder,
    resetToOriginalState: formStore.resetToOriginalState,
    checkForUnsavedChanges,

    // State getters
    get items() {
      return cartStore.items;
    },
    get id() {
      return formStore.id;
    },
    get isEditMode() {
      return formStore.isEditMode;
    },
    get orderType() {
      return formStore.orderType;
    },
    get selectedAreaId() {
      return formStore.selectedAreaId;
    },
    get selectedTableId() {
      return formStore.selectedTableId;
    },
    get isTemporaryTable() {
      return formStore.isTemporaryTable;
    },
    get temporaryTableName() {
      return formStore.temporaryTableName;
    },
    get scheduledTime() {
      return formStore.scheduledTime;
    },
    get deliveryInfo() {
      return formStore.deliveryInfo;
    },
    get orderNotes() {
      return formStore.orderNotes;
    },
    get adjustments() {
      return formStore.adjustments;
    },
    get prepaymentId() {
      return formStore.prepaymentId;
    },
    get prepaymentAmount() {
      return formStore.prepaymentAmount;
    },
    get prepaymentMethod() {
      return formStore.prepaymentMethod;
    },
    get hasUnsavedChanges() {
      return formStore.hasUnsavedChanges;
    },
    get orderDataLoaded() {
      return formStore.orderDataLoaded;
    },
    get originalState() {
      return formStore.originalState;
    },
    get isCartVisible() {
      return uiStore.isCartVisible;
    },
    get isLoading() {
      return uiStore.isLoading;
    },
    get isConfirming() {
      return uiStore.isConfirming;
    },
  };
};

// Export additional hooks for backward compatibility
export const useOrderValidation = () => {
  const management = useOrderManagement();
  return {
    validateForConfirmation: management.validateForConfirmation,
    getValidationErrors: management.getValidationErrors,
  };
};

export const useOrderSubtotal = useCartSubtotal;

export const useOrderTotal = () => {
  const subtotal = useCartSubtotal();
  const adjustments = useOrderFormStore((state) => state.adjustments);

  const adjustmentTotal = adjustments.reduce((sum, adj) => {
    if (adj.isDeleted) return sum;

    if (adj.isPercentage && adj.value) {
      // Para porcentajes, calcular basado en el subtotal
      return sum + (subtotal * adj.value) / 100;
    } else if (adj.amount) {
      // Para montos fijos
      return sum + adj.amount;
    }

    return sum;
  }, 0);

  return Math.max(0, subtotal - adjustmentTotal);
};

export const useOrderItemsCount = useCartItemsCount;
export const useIsOrderEmpty = useIsCartEmpty;

export const useOrderConfirmation = () => {
  const management = useOrderManagement();
  return {
    confirmOrder: management.confirmOrder,
    isConfirming: management.isConfirming,
    prepareOrderForBackend: management.prepareOrderForBackend,
  };
};
