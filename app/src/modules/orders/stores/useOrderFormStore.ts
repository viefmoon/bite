import { create } from 'zustand';
import { OrderTypeEnum, type OrderType } from '../schema/orders.schema';
import type { DeliveryInfo } from '../../../app/schemas/domain/delivery-info.schema';
import type { OrderAdjustment } from '../schema/adjustments.schema';

// Utility function for deep equality comparison
const deepEqual = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) return true;

  if (obj1 == null || obj2 == null) return obj1 === obj2;

  if (typeof obj1 !== typeof obj2) return false;

  if (typeof obj1 !== 'object') return obj1 === obj2;

  if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;

  if (Array.isArray(obj1)) {
    if (obj1.length !== obj2.length) return false;
    return obj1.every((item, index) => deepEqual(item, obj2[index]));
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  return keys1.every(
    (key) => keys2.includes(key) && deepEqual(obj1[key], obj2[key]),
  );
};

// Función para normalizar items actuales del carrito (CartItem[])
const normalizeCartItems = (items: any[]) => {
  return items
    .map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      variantId: item.variantId || null,
      preparationNotes: item.preparationNotes || '',
      modifiers: (item.modifiers || [])
        .map((mod: any) => ({
          id: mod.id,
          name: mod.name,
          price: mod.price || 0,
        }))
        .sort((a: any, b: any) => a.id.localeCompare(b.id)),
      selectedPizzaCustomizations: (item.selectedPizzaCustomizations || [])
        .map((cust: any) => ({
          id: cust.id,
          name: cust.name,
          extraCost: cust.extraCost || 0,
        }))
        .sort((a: any, b: any) => a.id.localeCompare(b.id)),
      pizzaExtraCost: item.pizzaExtraCost || 0,
    }))
    .sort((a, b) =>
      `${a.productId}-${a.variantId}`.localeCompare(
        `${b.productId}-${b.variantId}`,
      ),
    );
};

// Función para normalizar items originales de la base de datos (orderItems)
const normalizeOriginalItems = (items: any[]) => {
  // Agrupar items idénticos por configuración básica
  const groupedItems: { [key: string]: any[] } = {};

  items.forEach((item) => {
    // Normalizar modificadores de manera consistente
    const modifiers: any[] = [];

    if (item.productModifiers && Array.isArray(item.productModifiers)) {
      item.productModifiers.forEach((mod: any) => {
        modifiers.push({
          id: mod.id,
          name: mod.name || 'Modificador',
          price: mod.price || 0,
        });
      });
    } else if (item.modifiers && Array.isArray(item.modifiers)) {
      item.modifiers.forEach((mod: any) => {
        modifiers.push({
          id: mod.productModifierId || mod.id,
          name: mod.productModifier?.name || mod.name || 'Modificador',
          price: mod.price || 0,
        });
      });
    }

    // Normalizar personalizaciones de pizza
    const pizzaCustomizations = (item.selectedPizzaCustomizations || [])
      .map((cust: any) => ({
        id: cust.id,
        name: cust.name,
        extraCost: cust.extraCost || 0,
      }))
      .sort((a: any, b: any) => a.id.localeCompare(b.id));

    // Crear clave de agrupación usando concatenación de strings más confiable
    const keyData = {
      productId: item.productId,
      variantId: item.productVariantId || null,
      preparationNotes: item.preparationNotes || '',
      modifiers: modifiers.sort((a, b) => a.id.localeCompare(b.id)),
      pizzaCustomizations,
      pizzaExtraCost: item.pizzaExtraCost || 0,
    };

    // Usar una función de hash más determinística
    const createHashKey = (data: any): string => {
      const sortedModifiers = data.modifiers
        .map((m: any) => `${m.id}:${m.name}:${m.price}`)
        .join('|');
      const sortedCustomizations = data.pizzaCustomizations
        .map((c: any) => `${c.id}:${c.name}:${c.extraCost}`)
        .join('|');
      return `${data.productId}_${data.variantId}_${data.preparationNotes}_${sortedModifiers}_${sortedCustomizations}_${data.pizzaExtraCost}`;
    };

    const key = createHashKey(keyData);

    if (!groupedItems[key]) {
      groupedItems[key] = [];
    }
    groupedItems[key].push(item);
  });

  // Convertir grupos a formato normalizado
  return Object.entries(groupedItems)
    .map(([keyStr, groupItems]) => {
      // Recuperar el objeto clave del primer item del grupo
      const firstItem = groupItems[0];
      const modifiers: any[] = [];

      if (
        firstItem.productModifiers &&
        Array.isArray(firstItem.productModifiers)
      ) {
        firstItem.productModifiers.forEach((mod: any) => {
          modifiers.push({
            id: mod.id,
            name: mod.name || 'Modificador',
            price: mod.price || 0,
          });
        });
      } else if (firstItem.modifiers && Array.isArray(firstItem.modifiers)) {
        firstItem.modifiers.forEach((mod: any) => {
          modifiers.push({
            id: mod.productModifierId || mod.id,
            name: mod.productModifier?.name || mod.name || 'Modificador',
            price: mod.price || 0,
          });
        });
      }

      const pizzaCustomizations = (firstItem.selectedPizzaCustomizations || [])
        .map((cust: any) => ({
          id: cust.id,
          name: cust.name,
          extraCost: cust.extraCost || 0,
        }))
        .sort((a: any, b: any) => a.id.localeCompare(b.id));

      return {
        productId: firstItem.productId,
        quantity: groupItems.length,
        variantId: firstItem.productVariantId || null,
        preparationNotes: firstItem.preparationNotes || '',
        modifiers: modifiers.sort((a, b) => a.id.localeCompare(b.id)),
        selectedPizzaCustomizations: pizzaCustomizations,
        pizzaExtraCost: firstItem.pizzaExtraCost || 0,
      };
    })
    .sort((a, b) =>
      `${a.productId}-${a.variantId}`.localeCompare(
        `${b.productId}-${b.variantId}`,
      ),
    );
};

// Función para comparación profunda de arrays de items del carrito
const deepCompareCartItems = (
  currentItems: any[],
  originalItems: any[],
): boolean => {
  const normalizedCurrent = normalizeCartItems(currentItems);
  const normalizedOriginal = normalizeCartItems(originalItems); // Los originales ya están normalizados al guardarlos

  return deepEqual(normalizedCurrent, normalizedOriginal);
};

// Función para comparación profunda de ajustes
const deepCompareAdjustments = (
  adj1: OrderAdjustment[],
  adj2: OrderAdjustment[],
): boolean => {
  const normalize = (adjustments: OrderAdjustment[]) =>
    adjustments
      .filter((adj) => !adj.isDeleted)
      .map((adj) => ({
        id: adj.id || '',
        name: adj.name,
        isPercentage: adj.isPercentage,
        value: adj.value || 0,
        amount: adj.amount || 0,
      }))
      .sort((a, b) => a.id.localeCompare(b.id));

  return deepEqual(normalize(adj1), normalize(adj2));
};

interface OrderFormState {
  id: string | null;
  isEditMode: boolean;
  orderType: OrderType;
  selectedAreaId: string | null;
  selectedTableId: string | null;
  isTemporaryTable: boolean;
  temporaryTableName: string;
  scheduledTime: Date | null;
  deliveryInfo: DeliveryInfo;
  orderNotes: string;
  adjustments: OrderAdjustment[];
  prepaymentId: string | null;
  prepaymentAmount: string;
  prepaymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | null;
  orderDataLoaded: boolean;
  originalState: {
    orderType: OrderType;
    selectedAreaId: string | null;
    tableId: string | null;
    isTemporaryTable: boolean;
    temporaryTableName: string;
    deliveryInfo: DeliveryInfo;
    notes: string;
    scheduledAt: Date | null;
    adjustments: OrderAdjustment[];
    items: any[];
    prepaymentId: string | null;
    prepaymentAmount: string;
    prepaymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | null;
  } | null;
  setOrderType: (type: OrderType) => void;
  setSelectedAreaId: (id: string | null) => void;
  setSelectedTableId: (id: string | null) => void;
  setIsTemporaryTable: (isTemp: boolean) => void;
  setTemporaryTableName: (name: string) => void;
  setScheduledTime: (time: Date | null) => void;
  setDeliveryInfo: (info: DeliveryInfo) => void;
  setOrderNotes: (notes: string) => void;
  setAdjustments: (adjustments: OrderAdjustment[]) => void;
  addAdjustment: (adjustment: OrderAdjustment) => void;
  updateAdjustment: (id: string, adjustment: Partial<OrderAdjustment>) => void;
  removeAdjustment: (id: string) => void;
  setPrepaymentId: (id: string | null) => void;
  setPrepaymentAmount: (amount: string) => void;
  setPrepaymentMethod: (method: 'CASH' | 'CARD' | 'TRANSFER' | null) => void;
  setEditMode: (isEdit: boolean, orderId?: string | null) => void;
  resetForm: () => void;
  setOriginalState: (state: any) => void;
}

export const useOrderFormStore = create<OrderFormState>((set, get) => ({
  id: null,
  isEditMode: false,
  orderType: OrderTypeEnum.DINE_IN,
  selectedAreaId: null,
  selectedTableId: null,
  isTemporaryTable: false,
  temporaryTableName: '',
  scheduledTime: null,
  deliveryInfo: {},
  orderNotes: '',
  adjustments: [],
  prepaymentId: null,
  prepaymentAmount: '',
  prepaymentMethod: null,
  orderDataLoaded: false,
  originalState: null,

  setOrderType: (type: OrderType) => {
    set((state) => {
      const newState: Partial<OrderFormState> = { orderType: type };

      if (type !== OrderTypeEnum.DINE_IN) {
        newState.selectedAreaId = null;
        newState.selectedTableId = null;
        newState.isTemporaryTable = false;
        newState.temporaryTableName = '';
      }

      if (type === OrderTypeEnum.DINE_IN) {
        newState.deliveryInfo = {};
      }

      if (type === OrderTypeEnum.TAKE_AWAY) {
        newState.deliveryInfo = {
          recipientName: state.deliveryInfo.recipientName || '',
          recipientPhone: state.deliveryInfo.recipientPhone || '',
        };
      }

      return newState;
    });
  },

  setSelectedAreaId: (id: string | null) => {
    set({ selectedAreaId: id });
  },

  setSelectedTableId: (id: string | null) => {
    set((_state) => {
      const newState: Partial<OrderFormState> = { selectedTableId: id };

      // Si se selecciona una mesa existente, desmarcar mesa temporal
      if (id) {
        newState.isTemporaryTable = false;
        newState.temporaryTableName = '';
      }

      return newState;
    });
  },

  setIsTemporaryTable: (isTemp: boolean) => {
    set((_state) => {
      const newState: Partial<OrderFormState> = { isTemporaryTable: isTemp };

      // Si se desmarca mesa temporal, limpiar el nombre
      if (!isTemp) {
        newState.temporaryTableName = '';
      }

      // Si se marca mesa temporal, limpiar selección de mesa existente
      if (isTemp) {
        newState.selectedTableId = null;
      }

      return newState;
    });
  },

  setTemporaryTableName: (name: string) => {
    set({ temporaryTableName: name });
  },

  setScheduledTime: (time: Date | null) => {
    set({ scheduledTime: time });
  },

  setDeliveryInfo: (info: DeliveryInfo) => {
    set({ deliveryInfo: info });
  },

  setOrderNotes: (notes: string) => {
    set({ orderNotes: notes });
  },

  setAdjustments: (adjustments: OrderAdjustment[]) => {
    set({ adjustments });
  },

  addAdjustment: (adjustment: OrderAdjustment) => {
    const { adjustments } = get();
    const newAdjustment = {
      ...adjustment,
      id:
        adjustment.id ||
        `new-adjustment-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      isNew: true,
    };
    set({ adjustments: [...adjustments, newAdjustment] });
  },

  updateAdjustment: (
    id: string,
    updatedAdjustment: Partial<OrderAdjustment>,
  ) => {
    const { adjustments } = get();
    set({
      adjustments: adjustments.map((adj) =>
        adj.id === id ? { ...adj, ...updatedAdjustment } : adj,
      ),
    });
  },

  removeAdjustment: (id: string) => {
    const { adjustments } = get();
    set({ adjustments: adjustments.filter((adj) => adj.id !== id) });
  },

  setPrepaymentId: (id: string | null) => {
    set({ prepaymentId: id });
  },

  setPrepaymentAmount: (amount: string) => {
    set({ prepaymentAmount: amount });
  },

  setPrepaymentMethod: (method: 'CASH' | 'CARD' | 'TRANSFER' | null) => {
    set({ prepaymentMethod: method });
  },

  setEditMode: (isEdit: boolean, orderId?: string | null) => {
    set({ isEditMode: isEdit, id: orderId || null });
  },

  resetForm: () => {
    set({
      id: null,
      isEditMode: false,
      orderType: OrderTypeEnum.DINE_IN,
      selectedAreaId: null,
      selectedTableId: null,
      isTemporaryTable: false,
      temporaryTableName: '',
      scheduledTime: null,
      deliveryInfo: {},
      orderNotes: '',
      adjustments: [],
      prepaymentId: null,
      prepaymentAmount: '',
      prepaymentMethod: null,
      orderDataLoaded: false,
      originalState: null,
    });
  },

  setOriginalState: (orderData: any) => {
    // Procesar los items originales para que tengan la misma estructura que los items actuales
    const processedOriginalItems = orderData.orderItems
      ? normalizeOriginalItems(orderData.orderItems)
      : [];

    const originalState = {
      orderType: orderData.orderType,
      selectedAreaId:
        orderData.table?.areaId || orderData.table?.area?.id || null,
      tableId: orderData.tableId ?? null,
      isTemporaryTable: orderData.table?.isTemporary || false,
      temporaryTableName: orderData.table?.isTemporary
        ? orderData.table.name
        : '',
      deliveryInfo: orderData.deliveryInfo || {},
      notes: orderData.notes ?? '',
      scheduledAt: orderData.scheduledAt
        ? new Date(orderData.scheduledAt)
        : null,
      adjustments: orderData.adjustments || [],
      items: processedOriginalItems,
      prepaymentId: orderData.prepaymentId || null,
      prepaymentAmount: orderData.prepaymentAmount?.toString() || '',
      prepaymentMethod: orderData.prepaymentMethod || null,
    };

    set({
      originalState,
      orderDataLoaded: true,
    });
  },
}));

// Hook personalizado para calcular hasUnsavedChanges de forma memorizada
export const useHasUnsavedChanges = (currentItems: any[] = []) => {
  return useOrderFormStore((state) => {
    if (!state.isEditMode || !state.originalState) {
      return false;
    }

    // Comparación profunda de todos los campos
    const hasFormChanges =
      state.orderType !== state.originalState.orderType ||
      state.selectedAreaId !== state.originalState.selectedAreaId ||
      state.selectedTableId !== state.originalState.tableId ||
      state.isTemporaryTable !== state.originalState.isTemporaryTable ||
      state.temporaryTableName !== state.originalState.temporaryTableName ||
      !deepEqual(state.deliveryInfo, state.originalState.deliveryInfo) ||
      state.orderNotes !== state.originalState.notes ||
      (state.scheduledTime?.getTime() ?? null) !==
        (state.originalState.scheduledAt?.getTime() ?? null) ||
      state.prepaymentId !== state.originalState.prepaymentId ||
      state.prepaymentAmount !== state.originalState.prepaymentAmount ||
      state.prepaymentMethod !== state.originalState.prepaymentMethod;

    // Comparación profunda de ajustes
    const hasAdjustmentChanges = !deepCompareAdjustments(
      state.adjustments,
      state.originalState.adjustments,
    );

    // Comparación profunda de items del carrito
    const hasItemChanges = !deepCompareCartItems(
      currentItems,
      state.originalState.items,
    );

    return hasFormChanges || hasAdjustmentChanges || hasItemChanges;
  });
};
