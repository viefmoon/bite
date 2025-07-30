import * as Crypto from 'expo-crypto';
import type { Product } from '../schema/orders.schema';
import type { SelectedPizzaCustomization } from '../../pizzaCustomizations/schema/pizzaCustomization.schema';

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
  // Estado explícito para modo de edición
  isNew?: boolean;
  isModified?: boolean;
  originalItemIds?: string[]; // IDs de los ítems originales en la BD
}

const generateId = (): string => {
  return Crypto.randomUUID();
};

const calculateTotalPrice = (
  unitPrice: number,
  modifiers: CartItemModifier[],
  pizzaExtraCost: number,
  quantity: number,
) => {
  const modifiersPrice = modifiers.reduce(
    (sum, mod) => sum + (mod.price || 0),
    0,
  );
  return (unitPrice + modifiersPrice + pizzaExtraCost) * quantity;
};

const areModifiersEqual = (
  modifiers1: CartItemModifier[],
  modifiers2: CartItemModifier[],
): boolean => {
  if (modifiers1.length !== modifiers2.length) return false;

  const sorted1 = [...modifiers1].sort((a, b) => a.id.localeCompare(b.id));
  const sorted2 = [...modifiers2].sort((a, b) => a.id.localeCompare(b.id));

  for (let i = 0; i < sorted1.length; i++) {
    if (sorted1[i].id !== sorted2[i].id) {
      return false;
    }
  }

  return true;
};

const arePizzaCustomizationsEqual = (
  customizations1: SelectedPizzaCustomization[] = [],
  customizations2: SelectedPizzaCustomization[] = [],
): boolean => {
  if (customizations1.length !== customizations2.length) return false;

  const sorted1 = [...customizations1].sort((a, b) =>
    `${a.pizzaCustomizationId}-${a.half}-${a.action}`.localeCompare(
      `${b.pizzaCustomizationId}-${b.half}-${b.action}`,
    ),
  );
  const sorted2 = [...customizations2].sort((a, b) =>
    `${a.pizzaCustomizationId}-${a.half}-${a.action}`.localeCompare(
      `${b.pizzaCustomizationId}-${b.half}-${b.action}`,
    ),
  );

  for (let i = 0; i < sorted1.length; i++) {
    if (
      sorted1[i].pizzaCustomizationId !== sorted2[i].pizzaCustomizationId ||
      sorted1[i].half !== sorted2[i].half ||
      sorted1[i].action !== sorted2[i].action
    ) {
      return false;
    }
  }

  return true;
};

/**
 * Compara dos items del carrito para determinar si son idénticos
 * (mismo producto, variante, modificadores, notas, y personalizaciones)
 */
export const areCartItemsEqual = (
  item1: {
    productId: string;
    variantId?: string;
    preparationNotes?: string;
    modifiers: CartItemModifier[];
    selectedPizzaCustomizations?: SelectedPizzaCustomization[];
    preparationStatus?: string;
  },
  item2: {
    productId: string;
    variantId?: string;
    preparationNotes?: string;
    modifiers: CartItemModifier[];
    selectedPizzaCustomizations?: SelectedPizzaCustomization[];
    preparationStatus?: string;
  },
): boolean => {
  // Comparar propiedades básicas
  if (item1.productId !== item2.productId) return false;
  if (item1.variantId !== item2.variantId) return false;
  if (item1.preparationNotes !== item2.preparationNotes) return false;
  if (item1.preparationStatus !== item2.preparationStatus) return false;

  // Comparar modificadores
  if (!areModifiersEqual(item1.modifiers || [], item2.modifiers || []))
    return false;

  // Comparar personalizaciones de pizza
  if (
    !arePizzaCustomizationsEqual(
      item1.selectedPizzaCustomizations,
      item2.selectedPizzaCustomizations,
    )
  )
    return false;

  return true;
};

export const addItemToCart = (
  currentItems: CartItem[],
  product: Product,
  quantity: number = 1,
  variantId?: string,
  modifiers: CartItemModifier[] = [],
  preparationNotes?: string,
  selectedPizzaCustomizations?: SelectedPizzaCustomization[],
  pizzaExtraCost: number = 0,
  isEditMode: boolean = false,
): CartItem[] => {
  const variantToAdd = variantId
    ? product.variants?.find((v) => v.id === variantId)
    : undefined;

  // Determinar el precio base: variante tiene prioridad sobre producto
  let unitPrice: number;
  
  if (variantToAdd) {
    // Si hay variante seleccionada, debe tener precio
    if (typeof variantToAdd.price !== 'number' || variantToAdd.price == null) {
      throw new Error(`La variante '${variantToAdd.name}' no tiene un precio válido`);
    }
    unitPrice = variantToAdd.price;
  } else {
    // Si no hay variante, el producto debe tener precio
    if (typeof product.price !== 'number' || product.price == null) {
      throw new Error(`El producto '${product.name}' no tiene un precio válido`);
    }
    unitPrice = product.price;
  }

  if (isEditMode) {
    const newItem: CartItem = {
      id: generateId(),
      productId: product.id,
      productName: product.name,
      quantity,
      unitPrice,
      totalPrice: calculateTotalPrice(
        unitPrice,
        modifiers,
        pizzaExtraCost,
        quantity,
      ),
      modifiers,
      variantId,
      variantName: variantToAdd?.name,
      preparationNotes,
      selectedPizzaCustomizations,
      pizzaExtraCost,
      preparationStatus: 'NEW' as const,
      isNew: true,
      isModified: false,
    };

    return [...currentItems, newItem];
  }

  // Buscar si ya existe un item idéntico
  const existingItemIndex = currentItems.findIndex((item) => {
    if (item.productId !== product.id) return false;
    if (item.variantId !== variantId) return false;
    if (item.preparationNotes !== preparationNotes) return false;
    if (!areModifiersEqual(item.modifiers, modifiers)) return false;
    if (
      !arePizzaCustomizationsEqual(
        item.selectedPizzaCustomizations,
        selectedPizzaCustomizations,
      )
    )
      return false;

    return true;
  });

  if (existingItemIndex !== -1) {
    // Actualizar item existente
    const updatedItems = [...currentItems];
    const existingItem = updatedItems[existingItemIndex];
    const newQuantity = existingItem.quantity + quantity;

    updatedItems[existingItemIndex] = {
      ...existingItem,
      quantity: newQuantity,
      totalPrice: calculateTotalPrice(
        existingItem.unitPrice,
        modifiers,
        pizzaExtraCost,
        newQuantity,
      ),
      pizzaExtraCost,
    };

    return updatedItems;
  } else {
    // Crear nuevo item
    const newItem: CartItem = {
      id: generateId(),
      productId: product.id,
      productName: product.name,
      quantity,
      unitPrice,
      totalPrice: calculateTotalPrice(
        unitPrice,
        modifiers,
        pizzaExtraCost,
        quantity,
      ),
      modifiers,
      variantId,
      variantName: variantToAdd?.name,
      preparationNotes,
      selectedPizzaCustomizations,
      pizzaExtraCost,
    };

    return [...currentItems, newItem];
  }
};

export const updateItemInCart = (
  currentItems: CartItem[],
  itemId: string,
  quantity: number,
  modifiers: CartItemModifier[],
  preparationNotes?: string,
  variantId?: string,
  variantName?: string,
  unitPrice?: number,
  selectedPizzaCustomizations?: SelectedPizzaCustomization[],
  pizzaExtraCost: number = 0,
): CartItem[] => {
  return currentItems.map((item) => {
    if (item.id === itemId) {
      const finalUnitPrice =
        unitPrice !== undefined ? unitPrice : item.unitPrice;
      return {
        ...item,
        quantity,
        modifiers,
        preparationNotes:
          preparationNotes !== undefined
            ? preparationNotes
            : item.preparationNotes,
        variantId: variantId !== undefined ? variantId : item.variantId,
        variantName: variantName !== undefined ? variantName : item.variantName,
        unitPrice: finalUnitPrice,
        totalPrice: calculateTotalPrice(
          finalUnitPrice,
          modifiers,
          pizzaExtraCost,
          quantity,
        ),
        selectedPizzaCustomizations:
          selectedPizzaCustomizations !== undefined
            ? selectedPizzaCustomizations
            : item.selectedPizzaCustomizations,
        pizzaExtraCost,
        // Marcar como modificado si no es un ítem nuevo
        isModified: item.isNew ? false : true,
      };
    }
    return item;
  });
};

export const updateItemQuantityInCart = (
  currentItems: CartItem[],
  itemId: string,
  quantity: number,
): CartItem[] => {
  if (quantity <= 0) {
    return currentItems.filter((item) => item.id !== itemId);
  }

  return currentItems.map((item) => {
    if (item.id === itemId) {
      return {
        ...item,
        quantity,
        totalPrice: calculateTotalPrice(
          item.unitPrice,
          item.modifiers,
          item.pizzaExtraCost || 0,
          quantity,
        ),
        // Marcar como modificado si no es un ítem nuevo
        isModified: item.isNew ? false : true,
      };
    }
    return item;
  });
};

export const removeItemFromCart = (
  currentItems: CartItem[],
  itemId: string,
): CartItem[] => {
  return currentItems.filter((item) => item.id !== itemId);
};
