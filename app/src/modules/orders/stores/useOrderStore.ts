import { create } from 'zustand';
import type { Product } from '../types/orders.types';
import type { SelectedPizzaCustomization } from '../../../app/schemas/domain/order.schema';
import { OrderTypeEnum, type OrderType } from '../types/orders.types';
import type { DeliveryInfo } from '../../../app/schemas/domain/delivery-info.schema';
import type { OrderAdjustment } from '../types/adjustments.types';
import type { OrderItemDtoForBackend } from '../types/update-order.types';

const generateId = () => {
  const timestamp = Date.now().toString();
  const random1 = Math.floor(Math.random() * 1000000).toString();
  const random2 = Math.floor(Math.random() * 1000000).toString();
  return `${timestamp}-${random1}-${random2}`;
};

export interface CartItemModifier {
  id: string;
  modifierGroupId: string;
  name: string;
  price: number;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  modifiers: CartItemModifier[];
  variantId?: string;
  variantName?: string;
  preparationNotes?: string;
  notes?: string;
  preparationStatus?:
    | 'NEW'
    | 'PENDING'
    | 'IN_PROGRESS'
    | 'READY'
    | 'DELIVERED'
    | 'CANCELLED';
  selectedPizzaCustomizations?: SelectedPizzaCustomization[];
  pizzaExtraCost?: number;
}

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

interface OrderState {
  id: string | null; // ID de la orden que se está editando
  isEditMode: boolean;
  items: CartItem[];
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
  isCartVisible: boolean;
  isLoading: boolean;
  isConfirming: boolean;
  hasUnsavedChanges: boolean;
  orderDataLoaded: boolean;
  originalState: {
    items: CartItem[];
    orderType: OrderType;
    tableId: string | null;
    isTemporaryTable: boolean;
    temporaryTableName: string;
    deliveryInfo: DeliveryInfo;
    notes: string;
    scheduledAt: Date | null;
    adjustments: OrderAdjustment[];
  } | null;
  addItem: (
    product: Product,
    quantity?: number,
    variantId?: string,
    modifiers?: CartItemModifier[],
    preparationNotes?: string,
    selectedPizzaCustomizations?: SelectedPizzaCustomization[],
    pizzaExtraCost?: number,
  ) => void;
  removeItem: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  updateItem: (
    itemId: string,
    quantity: number,
    modifiers: CartItemModifier[],
    preparationNotes?: string,
    variantId?: string,
    variantName?: string,
    unitPrice?: number,
    selectedPizzaCustomizations?: SelectedPizzaCustomization[],
    pizzaExtraCost?: number,
  ) => void;
  setItems: (items: CartItem[]) => void;
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
  showCart: () => void;
  hideCart: () => void;
  setIsLoading: (loading: boolean) => void;
  setIsConfirming: (confirming: boolean) => void;
  loadOrderForEditing: (orderData: any, fullMenuData?: any) => void;
  checkForUnsavedChanges: () => void;
  resetOrder: () => void;
  resetToOriginalState: () => void;
  prepareOrderForBackend: () => OrderDetailsForBackend | null;
  validateForConfirmation: () => { isValid: boolean; errorMessage?: string };
  getValidationErrors: () => string[];
  confirmOrder: (userId: string, onConfirmOrder: (details: OrderDetailsForBackend) => Promise<void>) => Promise<void>;
}

const calculateTotalPrice = (unitPrice: number, modifiers: CartItemModifier[], pizzaExtraCost: number, quantity: number) => {
  const modifiersPrice = modifiers.reduce((sum, mod) => sum + (mod.price || 0), 0);
  return (unitPrice + modifiersPrice + pizzaExtraCost) * quantity;
};

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

export const useOrderStore = create<OrderState>((set, get) => ({
  id: null,
  isEditMode: false,
  items: [],
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
  isCartVisible: false,
  isLoading: false,
  isConfirming: false,
  hasUnsavedChanges: false,
  orderDataLoaded: false,
  originalState: null,
  
  addItem: (
    product: Product,
    quantity: number = 1,
    variantId?: string,
    modifiers: CartItemModifier[] = [],
    preparationNotes?: string,
    selectedPizzaCustomizations?: SelectedPizzaCustomization[],
    pizzaExtraCost: number = 0,
  ) => {
    const { items, isEditMode } = get();
    
    const variantToAdd = variantId
      ? product.variants?.find((v) => v.id === variantId)
      : undefined;
    
    const unitPrice = variantToAdd ? Number(variantToAdd.price) : Number(product.price);
    
    if (isEditMode) {
      const newItem: CartItem = {
        id: `new-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice,
        totalPrice: calculateTotalPrice(unitPrice, modifiers, pizzaExtraCost, quantity),
        modifiers,
        variantId,
        variantName: variantToAdd?.name,
        preparationNotes,
        selectedPizzaCustomizations,
        pizzaExtraCost,
        preparationStatus: 'NEW' as const,
      };
      
      set({ items: [...items, newItem] });
      get().checkForUnsavedChanges();
      return;
    }
    
    const existingItemIndex = items.findIndex((item) => {
      if (item.productId !== product.id) return false;
      if (item.variantId !== variantId) return false;
      if (item.preparationNotes !== preparationNotes) return false;
      if (item.modifiers.length !== modifiers.length) return false;
      
      const sortedExistingModifiers = [...item.modifiers].sort((a, b) => a.id.localeCompare(b.id));
      const sortedNewModifiers = [...modifiers].sort((a, b) => a.id.localeCompare(b.id));
      
      for (let i = 0; i < sortedExistingModifiers.length; i++) {
        if (sortedExistingModifiers[i].id !== sortedNewModifiers[i].id) {
          return false;
        }
      }
      
      const existingCustomizations = item.selectedPizzaCustomizations || [];
      const newCustomizations = selectedPizzaCustomizations || [];
      
      if (existingCustomizations.length !== newCustomizations.length) return false;
      
      const sortedExistingCustomizations = [...existingCustomizations].sort((a, b) =>
        `${a.pizzaCustomizationId}-${a.half}-${a.action}`.localeCompare(
          `${b.pizzaCustomizationId}-${b.half}-${b.action}`,
        ),
      );
      const sortedNewCustomizations = [...newCustomizations].sort((a, b) =>
        `${a.pizzaCustomizationId}-${a.half}-${a.action}`.localeCompare(
          `${b.pizzaCustomizationId}-${b.half}-${b.action}`,
        ),
      );
      
      for (let i = 0; i < sortedExistingCustomizations.length; i++) {
        if (
          sortedExistingCustomizations[i].pizzaCustomizationId !== sortedNewCustomizations[i].pizzaCustomizationId ||
          sortedExistingCustomizations[i].half !== sortedNewCustomizations[i].half ||
          sortedExistingCustomizations[i].action !== sortedNewCustomizations[i].action
        ) {
          return false;
        }
      }
      
      return true;
    });
    
    if (existingItemIndex !== -1) {
      const updatedItems = [...items];
      const existingItem = updatedItems[existingItemIndex];
      const newQuantity = existingItem.quantity + quantity;
      
      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
        totalPrice: calculateTotalPrice(existingItem.unitPrice, modifiers, pizzaExtraCost, newQuantity),
        pizzaExtraCost,
      };
      
      set({ items: updatedItems });
    } else {
      const newItem: CartItem = {
        id: generateId(),
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice,
        totalPrice: calculateTotalPrice(unitPrice, modifiers, pizzaExtraCost, quantity),
        modifiers,
        variantId,
        variantName: variantToAdd?.name,
        preparationNotes,
        selectedPizzaCustomizations,
        pizzaExtraCost,
      };
      
      set({ items: [...items, newItem] });
    }
  },
  
  removeItem: (itemId: string) => {
    const { items } = get();
    set({ items: items.filter((item) => item.id !== itemId) });
    get().checkForUnsavedChanges();
  },
  
  updateItemQuantity: (itemId: string, quantity: number) => {
    const { items, removeItem } = get();
    
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    
    const updatedItems = items.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity,
          totalPrice: calculateTotalPrice(
            item.unitPrice,
            item.modifiers,
            item.pizzaExtraCost || 0,
            quantity
          ),
        };
      }
      return item;
    });
    
    set({ items: updatedItems });
    get().checkForUnsavedChanges();
  },
  
  updateItem: (
    itemId: string,
    quantity: number,
    modifiers: CartItemModifier[],
    preparationNotes?: string,
    variantId?: string,
    variantName?: string,
    unitPrice?: number,
    selectedPizzaCustomizations?: SelectedPizzaCustomization[],
    pizzaExtraCost: number = 0,
  ) => {
    const { items } = get();
    
    const updatedItems = items.map((item) => {
      if (item.id === itemId) {
        const finalUnitPrice = unitPrice !== undefined ? unitPrice : item.unitPrice;
        return {
          ...item,
          quantity,
          modifiers,
          preparationNotes: preparationNotes !== undefined ? preparationNotes : item.preparationNotes,
          variantId: variantId !== undefined ? variantId : item.variantId,
          variantName: variantName !== undefined ? variantName : item.variantName,
          unitPrice: finalUnitPrice,
          totalPrice: calculateTotalPrice(finalUnitPrice, modifiers, pizzaExtraCost, quantity),
          selectedPizzaCustomizations: selectedPizzaCustomizations !== undefined
            ? selectedPizzaCustomizations
            : item.selectedPizzaCustomizations,
          pizzaExtraCost,
        };
      }
      return item;
    });
    
    set({ items: updatedItems });
    get().checkForUnsavedChanges();
  },
  
  setItems: (items: CartItem[]) => {
    set({ items });
    get().checkForUnsavedChanges();
  },
  
  // --- Form Actions ---
  setOrderType: (type: OrderType) => {
    set((state) => {
      const newState: Partial<OrderState> = { orderType: type };
      
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
    get().checkForUnsavedChanges();
  },
  
  setSelectedAreaId: (id: string | null) => {
    set({ selectedAreaId: id });
    get().checkForUnsavedChanges();
  },
  
  setSelectedTableId: (id: string | null) => {
    set((state) => {
      const newState: Partial<OrderState> = { selectedTableId: id };
      
      // Si se selecciona una mesa existente, desmarcar mesa temporal
      if (id) {
        newState.isTemporaryTable = false;
        newState.temporaryTableName = '';
      }
      
      return newState;
    });
    get().checkForUnsavedChanges();
  },
  
  setIsTemporaryTable: (isTemp: boolean) => {
    set((state) => {
      const newState: Partial<OrderState> = { isTemporaryTable: isTemp };
      
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
    get().checkForUnsavedChanges();
  },
  
  setTemporaryTableName: (name: string) => {
    set({ temporaryTableName: name });
    get().checkForUnsavedChanges();
  },
  
  setScheduledTime: (time: Date | null) => {
    set({ scheduledTime: time });
    get().checkForUnsavedChanges();
  },
  
  setDeliveryInfo: (info: DeliveryInfo) => {
    set({ deliveryInfo: info });
    get().checkForUnsavedChanges();
  },
  
  setOrderNotes: (notes: string) => {
    set({ orderNotes: notes });
    get().checkForUnsavedChanges();
  },
  
  setAdjustments: (adjustments: OrderAdjustment[]) => {
    set({ adjustments });
    get().checkForUnsavedChanges();
  },
  
  addAdjustment: (adjustment: OrderAdjustment) => {
    const { adjustments } = get();
    const newAdjustment = {
      ...adjustment,
      id: adjustment.id || `new-adjustment-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      isNew: true,
    };
    set({ adjustments: [...adjustments, newAdjustment] });
    get().checkForUnsavedChanges();
  },
  
  updateAdjustment: (id: string, updatedAdjustment: Partial<OrderAdjustment>) => {
    const { adjustments } = get();
    set({
      adjustments: adjustments.map((adj) =>
        adj.id === id ? { ...adj, ...updatedAdjustment } : adj
      ),
    });
    get().checkForUnsavedChanges();
  },
  
  removeAdjustment: (id: string) => {
    const { adjustments } = get();
    set({ adjustments: adjustments.filter((adj) => adj.id !== id) });
    get().checkForUnsavedChanges();
  },
  
  // --- Prepayment Actions ---
  setPrepaymentId: (id: string | null) => {
    set({ prepaymentId: id });
  },
  
  setPrepaymentAmount: (amount: string) => {
    set({ prepaymentAmount: amount });
  },
  
  setPrepaymentMethod: (method: 'CASH' | 'CARD' | 'TRANSFER' | null) => {
    set({ prepaymentMethod: method });
  },
  
  // --- UI Actions ---
  showCart: () => {
    set({ isCartVisible: true });
  },
  
  hideCart: () => {
    set({ isCartVisible: false });
  },
  
  setIsLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
  
  setIsConfirming: (confirming: boolean) => {
    set({ isConfirming: confirming });
  },
  
  // --- Order Loading Actions ---
  loadOrderForEditing: (orderData: any, fullMenuData?: any) => {
    // Reset state first
    get().resetOrder();
    
    // Map order data to store state
    const mappedState: Partial<OrderState> = {
      id: orderData.id,
      isEditMode: true,
      orderType: orderData.orderType,
      selectedTableId: orderData.tableId ?? null,
      scheduledTime: orderData.scheduledAt ? new Date(orderData.scheduledAt) : null,
      deliveryInfo: orderData.deliveryInfo || {},
      orderNotes: orderData.notes ?? '',
    };
    
    // Handle adjustments
    if (orderData.adjustments && Array.isArray(orderData.adjustments)) {
      mappedState.adjustments = orderData.adjustments.map((adj: any) => ({
        id: adj.id,
        name: adj.name,
        description: adj.description || '',
        isPercentage: adj.isPercentage,
        value: adj.value,
        amount: adj.amount,
        isDeleted: false,
        isNew: false,
      }));
    }
    
    // Handle table data
    if (orderData.tableId && orderData.table) {
      const areaId = orderData.table.areaId || orderData.table.area?.id;
      if (areaId) {
        mappedState.selectedAreaId = areaId;
      }
      
      if (orderData.table.isTemporary) {
        mappedState.isTemporaryTable = true;
        mappedState.temporaryTableName = orderData.table.name || '';
      }
    }
    
    // Handle order items
    const groupedItemsMap = new Map<string, CartItem>();
    
    if (orderData.orderItems && Array.isArray(orderData.orderItems)) {
      orderData.orderItems.forEach((item: any) => {
        const modifiers: CartItemModifier[] = [];
        
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
        } else if (item.productModifiers && Array.isArray(item.productModifiers)) {
          item.productModifiers.forEach((mod: any) => {
            const modifierInfo = fullMenuData ? findModifierById(mod.id, fullMenuData) : null;
            modifiers.push(modifierInfo || {
              id: mod.id,
              modifierGroupId: mod.modifierGroupId || '',
              name: mod.name || 'Modificador',
              price: parseFloat(mod.price) || 0,
            });
          });
        }
        
        const unitPrice = parseFloat(item.basePrice || '0');
        const modifierIds = modifiers.map((m) => m.id).sort().join(',');
        const pizzaCustomizationIds = item.selectedPizzaCustomizations
          ? item.selectedPizzaCustomizations
              .map((c: any) => `${c.pizzaCustomizationId}-${c.half}-${c.action}`)
              .sort()
              .join(',')
          : '';
        const groupKey = `${item.productId}-${item.productVariantId || 'null'}-${modifierIds}-${pizzaCustomizationIds}-${item.preparationNotes || ''}-${item.preparationStatus || 'PENDING'}`;
        
        const existingItem = groupedItemsMap.get(groupKey);
        
        if (existingItem && existingItem.preparationStatus === item.preparationStatus) {
          existingItem.quantity += 1;
          existingItem.totalPrice = calculateTotalPrice(
            unitPrice,
            modifiers,
            0,
            existingItem.quantity
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
            selectedPizzaCustomizations: item.selectedPizzaCustomizations || undefined,
          };
          groupedItemsMap.set(groupKey, cartItem);
        }
      });
    }
    
    mappedState.items = Array.from(groupedItemsMap.values());
    mappedState.orderDataLoaded = true;
    
    // Save original state for comparison
    const originalState = {
      items: Array.from(groupedItemsMap.values()),
      orderType: orderData.orderType,
      tableId: orderData.tableId ?? null,
      isTemporaryTable: orderData.table?.isTemporary || false,
      temporaryTableName: orderData.table?.isTemporary ? orderData.table.name : '',
      deliveryInfo: orderData.deliveryInfo || {},
      notes: orderData.notes ?? '',
      scheduledAt: orderData.scheduledAt ? new Date(orderData.scheduledAt) : null,
      adjustments: mappedState.adjustments || [],
    };
    
    mappedState.originalState = originalState;
    mappedState.hasUnsavedChanges = false;
    
    set(mappedState);
  },
  
  // --- State Management Actions ---
  checkForUnsavedChanges: () => {
    const state = get();
    if (!state.isEditMode || !state.originalState) {
      set({ hasUnsavedChanges: false });
      return;
    }
    
    const hasChanges =
      JSON.stringify(state.items) !== JSON.stringify(state.originalState.items) ||
      state.orderType !== state.originalState.orderType ||
      state.selectedTableId !== state.originalState.tableId ||
      state.isTemporaryTable !== state.originalState.isTemporaryTable ||
      state.temporaryTableName !== state.originalState.temporaryTableName ||
      JSON.stringify(state.deliveryInfo) !== JSON.stringify(state.originalState.deliveryInfo) ||
      state.orderNotes !== state.originalState.notes ||
      (state.scheduledTime?.getTime() ?? null) !== (state.originalState.scheduledAt?.getTime() ?? null) ||
      JSON.stringify(state.adjustments) !== JSON.stringify(state.originalState.adjustments);
    
    set({ hasUnsavedChanges: hasChanges });
  },
  
  resetOrder: () => {
    set({
      id: null,
      isEditMode: false,
      items: [],
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
      isCartVisible: false,
      isLoading: false,
      isConfirming: false,
      hasUnsavedChanges: false,
      orderDataLoaded: false,
      originalState: null,
    });
  },
  
  resetToOriginalState: () => {
    const { originalState } = get();
    if (!originalState) return;
    
    set({
      items: [...originalState.items],
      orderType: originalState.orderType,
      selectedTableId: originalState.tableId,
      isTemporaryTable: originalState.isTemporaryTable,
      temporaryTableName: originalState.temporaryTableName,
      deliveryInfo: { ...originalState.deliveryInfo },
      orderNotes: originalState.notes,
      scheduledTime: originalState.scheduledAt,
      adjustments: [...originalState.adjustments],
      hasUnsavedChanges: false,
    });
  },
  
  // --- Order Confirmation ---
  validateForConfirmation: () => {
    const state = get();
    
    if (state.items.length === 0) {
      return {
        isValid: false,
        errorMessage: 'No hay productos en el carrito',
      };
    }
    
    if (!state.isEditMode && state.prepaymentId) {
      const subtotal = state.items.reduce((sum, item) => sum + item.totalPrice, 0);
      const adjustmentTotal = state.adjustments.reduce((sum, adj) => {
        if (adj.isDeleted) return sum;
        return sum + (adj.amount || 0);
      }, 0);
      const total = subtotal - adjustmentTotal;
      
      if (parseFloat(state.prepaymentAmount || '0') > total) {
        return {
          isValid: false,
          errorMessage: 'El prepago excede el total de la orden. Por favor edite el pago antes de continuar.',
        };
      }
    }
    
    // Validaciones específicas según el tipo de orden
    switch (state.orderType) {
      case OrderTypeEnum.DINE_IN:
        if (!state.isTemporaryTable && !state.selectedTableId) {
          return {
            isValid: false,
            errorMessage: 'Por favor selecciona una mesa',
          };
        }
        if (state.isTemporaryTable && !state.temporaryTableName.trim()) {
          return {
            isValid: false,
            errorMessage: 'Por favor ingresa el nombre de la mesa temporal',
          };
        }
        if (state.isTemporaryTable && !state.selectedAreaId) {
          return {
            isValid: false,
            errorMessage: 'Por favor selecciona un área para la mesa temporal',
          };
        }
        break;
        
      case OrderTypeEnum.DELIVERY:
        if (!state.deliveryInfo.recipientName?.trim()) {
          return {
            isValid: false,
            errorMessage: 'Por favor ingresa el nombre del cliente',
          };
        }
        if (!state.deliveryInfo.recipientPhone?.trim()) {
          return {
            isValid: false,
            errorMessage: 'Por favor ingresa el teléfono del cliente',
          };
        }
        if (!state.deliveryInfo.fullAddress?.trim()) {
          return {
            isValid: false,
            errorMessage: 'Por favor ingresa la dirección de entrega',
          };
        }
        break;
        
      case OrderTypeEnum.TAKE_AWAY:
        if (!state.deliveryInfo.recipientName?.trim()) {
          return {
            isValid: false,
            errorMessage: 'Por favor ingresa el nombre del cliente',
          };
        }
        break;
    }
    
    return { isValid: true };
  },
  
  getValidationErrors: () => {
    const state = get();
    const errors: string[] = [];
    
    if (state.items.length === 0) {
      errors.push('El carrito está vacío');
    }
    
    // Validaciones específicas según el tipo de orden
    switch (state.orderType) {
      case OrderTypeEnum.DINE_IN:
        if (!state.isTemporaryTable && !state.selectedTableId) {
          errors.push('Selecciona una mesa');
        }
        if (state.isTemporaryTable && !state.temporaryTableName.trim()) {
          errors.push('Ingresa el nombre de la mesa temporal');
        }
        if (state.isTemporaryTable && !state.selectedAreaId) {
          errors.push('Selecciona un área para la mesa temporal');
        }
        break;
        
      case OrderTypeEnum.DELIVERY:
        if (!state.deliveryInfo.recipientName?.trim()) {
          errors.push('Ingresa el nombre del cliente');
        }
        if (!state.deliveryInfo.recipientPhone?.trim()) {
          errors.push('Ingresa el teléfono del cliente');
        }
        if (!state.deliveryInfo.fullAddress?.trim()) {
          errors.push('Ingresa la dirección de entrega');
        }
        break;
        
      case OrderTypeEnum.TAKE_AWAY:
        if (!state.deliveryInfo.recipientName?.trim()) {
          errors.push('Ingresa el nombre del cliente');
        }
        break;
    }
    
    return errors;
  },
  
  prepareOrderForBackend: () => {
    const state = get();
    const validation = get().validateForConfirmation();
    
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
      
      switch (state.orderType) {
        case OrderTypeEnum.DINE_IN:
          if (state.isTemporaryTable) {
            return {
              ...base,
              isTemporaryTable: true,
              temporaryTableName: state.temporaryTableName,
              temporaryTableAreaId: state.selectedAreaId || undefined,
            };
          } else {
            return {
              ...base,
              tableId: state.selectedTableId || undefined,
            };
          }
          
        case OrderTypeEnum.DELIVERY:
          return {
            ...base,
            deliveryInfo: {
              recipientName: state.deliveryInfo.recipientName,
              recipientPhone: state.deliveryInfo.recipientPhone,
              fullAddress: state.deliveryInfo.fullAddress,
              reference: state.deliveryInfo.reference,
              coords: state.deliveryInfo.coords,
            },
          };
          
        case OrderTypeEnum.TAKE_AWAY:
          return {
            ...base,
            deliveryInfo: {
              recipientName: state.deliveryInfo.recipientName,
              recipientPhone: state.deliveryInfo.recipientPhone,
            },
          };
          
        default:
          return base;
      }
    })();
    
    const itemsForBackend: OrderItemDtoForBackend[] = [];
    
    state.items.forEach((item) => {
      if (state.isEditMode && item.id && !item.id.startsWith('new-')) {
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
    
    const subtotal = state.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const adjustmentTotal = state.adjustments.reduce((sum, adj) => {
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
      orderType: state.orderType,
      subtotal,
      total,
      items: itemsForBackend,
      tableId: cleanedData.tableId,
      isTemporaryTable: cleanedData.isTemporaryTable,
      temporaryTableName: cleanedData.temporaryTableName,
      temporaryTableAreaId: cleanedData.temporaryTableAreaId,
      scheduledAt: state.scheduledTime ? state.scheduledTime : undefined,
      deliveryInfo: {
        ...cleanedData.deliveryInfo,
        recipientPhone: formattedPhone,
      },
      notes: state.orderNotes || undefined,
      adjustments: state.isEditMode
        ? state.adjustments
            .filter((adj) => !adj.isDeleted)
            .map((adj) => {
              return {
                orderId: state.id || undefined,
                name: adj.name,
                isPercentage: adj.isPercentage,
                value: adj.value,
                amount: adj.amount,
              };
            })
        : undefined,
    };
    
    if (!state.isEditMode && state.prepaymentId) {
      orderDetails.prepaymentId = state.prepaymentId;
    }
    
    return orderDetails;
  },
  
  confirmOrder: async (userId: string, onConfirmOrder: (details: OrderDetailsForBackend) => Promise<void>) => {
    const state = get();
    
    // Evitar múltiples confirmaciones
    if (state.isConfirming) {
      throw new Error('Ya se está procesando la orden');
    }
    
    // Validar primero
    const validation = get().validateForConfirmation();
    if (!validation.isValid) {
      throw new Error(validation.errorMessage || 'Por favor complete todos los campos requeridos');
    }
    
    // Preparar datos para el backend
    const orderDetails = get().prepareOrderForBackend();
    if (!orderDetails) {
      throw new Error('Error al preparar la orden');
    }
    
    // Agregar el userId
    orderDetails.userId = userId;
    
    if (orderDetails.total <= 0) {
      throw new Error('El total de la orden debe ser mayor a 0');
    }
    
    if (orderDetails.payment && orderDetails.payment.amount > orderDetails.total) {
      throw new Error('El monto del pago no puede exceder el total de la orden');
    }
    
    set({ isConfirming: true });
    
    try {
      await onConfirmOrder(orderDetails);
      
      if (state.isEditMode) {
        const newOriginalState = {
          items: [...state.items],
          orderType: state.orderType,
          tableId: state.selectedTableId,
          isTemporaryTable: state.isTemporaryTable,
          temporaryTableName: state.temporaryTableName,
          deliveryInfo: { ...state.deliveryInfo },
          notes: state.orderNotes,
          scheduledAt: state.scheduledTime,
          adjustments: [...state.adjustments],
        };
        set({ originalState: newOriginalState, hasUnsavedChanges: false });
      } else {
        get().resetOrder();
      }
    } catch (error) {
      throw error;
    } finally {
      set({ isConfirming: false });
    }
  },
}));

export const useOrderValidation = () => 
  useOrderStore((state) => ({
    validateForConfirmation: state.validateForConfirmation,
    getValidationErrors: state.getValidationErrors,
  }));

export const useOrderSubtotal = () =>
  useOrderStore((state) =>
    state.items.reduce((sum, item) => sum + item.totalPrice, 0)
  );

export const useOrderTotal = () => {
  const subtotal = useOrderSubtotal();
  const adjustments = useOrderStore((state) => state.adjustments);
  
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

export const useOrderItemsCount = () =>
  useOrderStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0)
  );

export const useIsOrderEmpty = () =>
  useOrderStore((state) => state.items.length === 0);

export const useOrderConfirmation = () =>
  useOrderStore((state) => ({
    confirmOrder: state.confirmOrder,
    isConfirming: state.isConfirming,
    prepareOrderForBackend: state.prepareOrderForBackend,
  }));