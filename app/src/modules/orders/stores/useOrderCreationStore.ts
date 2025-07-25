import { create } from 'zustand';
import type { Product } from '../types/orders.types';
import type { SelectedPizzaCustomization } from '../../../app/schemas/domain/order.schema';
import { OrderTypeEnum, type OrderType } from '../types/orders.types';
import type { DeliveryInfo } from '../../../app/schemas/domain/delivery-info.schema';

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

interface OrderCreationStore {
  // Cart items
  items: CartItem[];
  isCartVisible: boolean;

  // Order form data
  orderType: OrderType;
  selectedAreaId: string | null;
  selectedTableId: string | null;
  isTemporaryTable: boolean;
  temporaryTableName: string;
  scheduledTime: Date | null;
  deliveryInfo: DeliveryInfo;
  orderNotes: string;

  // Prepayment data
  prepaymentId: string | null;
  prepaymentAmount: string;
  prepaymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | null;

  // Cart actions
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
  showCart: () => void;
  hideCart: () => void;

  // Form actions
  setOrderType: (type: OrderType) => void;
  setSelectedAreaId: (id: string | null) => void;
  setSelectedTableId: (id: string | null) => void;
  setIsTemporaryTable: (isTemp: boolean) => void;
  setTemporaryTableName: (name: string) => void;
  setScheduledTime: (time: Date | null) => void;
  setDeliveryInfo: (info: DeliveryInfo) => void;
  setOrderNotes: (notes: string) => void;
  setPrepaymentId: (id: string | null) => void;
  setPrepaymentAmount: (amount: string) => void;
  setPrepaymentMethod: (method: 'CASH' | 'CARD' | 'TRANSFER' | null) => void;

  // Unified reset action
  resetOrder: () => void;
}

// Computed selectors
export const useOrderCreationSubtotal = () =>
  useOrderCreationStore((state) =>
    state.items.reduce((sum, item) => sum + item.totalPrice, 0),
  );

export const useOrderCreationTotal = () => useOrderCreationSubtotal();

export const useOrderCreationItemsCount = () =>
  useOrderCreationStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0),
  );

export const useIsOrderCreationEmpty = () =>
  useOrderCreationStore((state) => state.items.length === 0);

export const useOrderCreationStore = create<OrderCreationStore>((set, get) => ({
  // Initial cart state
  items: [],
  isCartVisible: false,

  // Initial form state
  orderType: OrderTypeEnum.DINE_IN,
  selectedAreaId: null,
  selectedTableId: null,
  isTemporaryTable: false,
  temporaryTableName: '',
  scheduledTime: null,
  deliveryInfo: {},
  orderNotes: '',

  // Initial prepayment state
  prepaymentId: null,
  prepaymentAmount: '',
  prepaymentMethod: null,

  // Cart actions
  addItem: (
    product: Product,
    quantity: number = 1,
    variantId?: string,
    modifiers: CartItemModifier[] = [],
    preparationNotes?: string,
    selectedPizzaCustomizations?: SelectedPizzaCustomization[],
    pizzaExtraCost: number = 0,
  ) => {
    const { items } = get();

    const variantToAdd = variantId
      ? product.variants?.find((v) => v.id === variantId)
      : undefined;

    // Validar y sanitizar precios
    const safeParsePrice = (price: any): number => {
      const parsed = Number(price);
      if (isNaN(parsed) || !isFinite(parsed) || parsed < 0) {
        return 0;
      }
      return Math.min(Math.round(parsed * 100) / 100, 999999.99);
    };

    const unitPrice = variantToAdd
      ? safeParsePrice(variantToAdd.price)
      : safeParsePrice(product.price);

    const modifiersPrice = modifiers.reduce(
      (sum, mod) => sum + safeParsePrice(mod.price || 0),
      0,
    );

    // Buscar si existe un item idéntico
    const existingItemIndex = items.findIndex((item) => {
      if (item.productId !== product.id) return false;
      if (item.variantId !== variantId) return false;
      if (item.preparationNotes !== preparationNotes) return false;
      if (item.modifiers.length !== modifiers.length) return false;

      // Comparar modifiers
      const sortedExistingModifiers = [...item.modifiers].sort((a, b) =>
        a.id.localeCompare(b.id),
      );
      const sortedNewModifiers = [...modifiers].sort((a, b) =>
        a.id.localeCompare(b.id),
      );

      for (let i = 0; i < sortedExistingModifiers.length; i++) {
        if (
          sortedExistingModifiers[i].id !== sortedNewModifiers[i].id ||
          sortedExistingModifiers[i].name !== sortedNewModifiers[i].name ||
          sortedExistingModifiers[i].price !== sortedNewModifiers[i].price
        ) {
          return false;
        }
      }

      // Comparar pizza customizations
      const existingCustomizations = item.selectedPizzaCustomizations || [];
      const newCustomizations = selectedPizzaCustomizations || [];

      if (existingCustomizations.length !== newCustomizations.length)
        return false;

      const sortedExistingCustomizations = [...existingCustomizations].sort(
        (a, b) =>
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
          sortedExistingCustomizations[i].pizzaCustomizationId !==
            sortedNewCustomizations[i].pizzaCustomizationId ||
          sortedExistingCustomizations[i].half !==
            sortedNewCustomizations[i].half ||
          sortedExistingCustomizations[i].action !==
            sortedNewCustomizations[i].action
        ) {
          return false;
        }
      }

      return true;
    });

    if (existingItemIndex !== -1) {
      // Si existe un item idéntico, actualizar la cantidad
      const updatedItems = [...items];
      const existingItem = updatedItems[existingItemIndex];
      const newQuantity = existingItem.quantity + quantity;
      const newTotalPrice =
        (existingItem.unitPrice + modifiersPrice + pizzaExtraCost) *
        newQuantity;

      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
        totalPrice: newTotalPrice,
        pizzaExtraCost,
      };

      set({ items: updatedItems });
    } else {
      // Si no existe, crear un nuevo item
      const newItem: CartItem = {
        id: generateId(),
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice: unitPrice as number,
        totalPrice:
          ((unitPrice as number) + modifiersPrice + pizzaExtraCost) * quantity,
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
  },

  updateItemQuantity: (itemId: string, quantity: number) => {
    const { items, removeItem } = get();

    // Validar y sanitizar cantidad
    const safeQuantity = Math.round(quantity);

    if (safeQuantity <= 0 || isNaN(safeQuantity)) {
      removeItem(itemId);
      return;
    }

    // Límite máximo razonable
    const MAX_QUANTITY = 9999;
    const finalQuantity = Math.min(safeQuantity, MAX_QUANTITY);

    const updatedItems = items.map((item) => {
      if (item.id === itemId) {
        const modifiersPrice = item.modifiers.reduce(
          (sum, mod) => sum + Number(mod.price || 0),
          0,
        );
        const pizzaExtraCost = item.pizzaExtraCost || 0;
        const newTotalPrice =
          (item.unitPrice + modifiersPrice + pizzaExtraCost) * finalQuantity;
        return {
          ...item,
          quantity: finalQuantity,
          totalPrice: newTotalPrice,
        };
      }
      return item;
    });

    set({ items: updatedItems });
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
        const modifiersPrice = modifiers.reduce(
          (sum, mod) => sum + Number(mod.price || 0),
          0,
        );
        const finalUnitPrice =
          unitPrice !== undefined ? unitPrice : item.unitPrice;
        const newTotalPrice =
          (finalUnitPrice + modifiersPrice + pizzaExtraCost) * quantity;
        return {
          ...item,
          quantity,
          modifiers,
          preparationNotes:
            preparationNotes !== undefined
              ? preparationNotes
              : item.preparationNotes,
          variantId: variantId !== undefined ? variantId : item.variantId,
          variantName:
            variantName !== undefined ? variantName : item.variantName,
          unitPrice: finalUnitPrice,
          totalPrice: newTotalPrice,
          selectedPizzaCustomizations:
            selectedPizzaCustomizations !== undefined
              ? selectedPizzaCustomizations
              : item.selectedPizzaCustomizations,
          pizzaExtraCost,
        };
      }
      return item;
    });

    set({ items: updatedItems });
  },

  setItems: (items: CartItem[]) => {
    set({ items });
  },

  showCart: () => {
    set({ isCartVisible: true });
  },

  hideCart: () => {
    set({ isCartVisible: false });
  },

  // Form actions
  setOrderType: (type: OrderType) => {
    set({ orderType: type });
  },

  setSelectedAreaId: (id: string | null) => {
    set({ selectedAreaId: id });
  },

  setSelectedTableId: (id: string | null) => {
    set({ selectedTableId: id });
  },

  setIsTemporaryTable: (isTemp: boolean) => {
    set({ isTemporaryTable: isTemp });
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

  setPrepaymentId: (id: string | null) => {
    set({ prepaymentId: id });
  },

  setPrepaymentAmount: (amount: string) => {
    set({ prepaymentAmount: amount });
  },

  setPrepaymentMethod: (method: 'CASH' | 'CARD' | 'TRANSFER' | null) => {
    set({ prepaymentMethod: method });
  },

  // Unified reset action
  resetOrder: () => {
    set({
      // Reset cart
      items: [],
      isCartVisible: false,
      // Reset form
      orderType: OrderTypeEnum.DINE_IN,
      selectedAreaId: null,
      selectedTableId: null,
      isTemporaryTable: false,
      temporaryTableName: '',
      scheduledTime: null,
      deliveryInfo: {},
      orderNotes: '',
      // Reset prepayment
      prepaymentId: null,
      prepaymentAmount: '',
      prepaymentMethod: null,
    });
  },
}));