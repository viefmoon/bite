import { create } from 'zustand';
import type { Product } from '../schema/orders.schema';
import type { SelectedPizzaCustomization } from '../../../app/schemas/domain/order.schema';
import {
  type CartItem,
  type CartItemModifier,
  addItemToCart,
  updateItemInCart,
  updateItemQuantityInCart,
  removeItemFromCart,
} from '../utils/cartUtils';

interface CartState {
  items: CartItem[];
  addItem: (
    product: Product,
    quantity?: number,
    variantId?: string,
    modifiers?: CartItemModifier[],
    preparationNotes?: string,
    selectedPizzaCustomizations?: SelectedPizzaCustomization[],
    pizzaExtraCost?: number,
    isEditMode?: boolean,
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
  resetCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (
    product: Product,
    quantity: number = 1,
    variantId?: string,
    modifiers: CartItemModifier[] = [],
    preparationNotes?: string,
    selectedPizzaCustomizations?: SelectedPizzaCustomization[],
    pizzaExtraCost: number = 0,
    isEditMode: boolean = false,
  ) => {
    const { items } = get();
    const newItems = addItemToCart(
      items,
      product,
      quantity,
      variantId,
      modifiers,
      preparationNotes,
      selectedPizzaCustomizations,
      pizzaExtraCost,
      isEditMode,
    );
    set({ items: newItems });
  },

  removeItem: (itemId: string) => {
    const { items } = get();
    const newItems = removeItemFromCart(items, itemId);
    set({ items: newItems });
  },

  updateItemQuantity: (itemId: string, quantity: number) => {
    const { items } = get();
    const newItems = updateItemQuantityInCart(items, itemId, quantity);
    set({ items: newItems });
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
    const newItems = updateItemInCart(
      items,
      itemId,
      quantity,
      modifiers,
      preparationNotes,
      variantId,
      variantName,
      unitPrice,
      selectedPizzaCustomizations,
      pizzaExtraCost,
    );
    set({ items: newItems });
  },

  setItems: (items: CartItem[]) => {
    set({ items });
  },

  resetCart: () => {
    set({ items: [] });
  },
}));

export const useCartSubtotal = () =>
  useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.totalPrice, 0),
  );

export const useCartItemsCount = () =>
  useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0),
  );

export const useIsCartEmpty = () =>
  useCartStore((state) => state.items.length === 0);
