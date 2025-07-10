import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
} from 'react';
import { Product, OrderTypeEnum, type OrderType } from '../types/orders.types'; // Importar OrderType y Enum
import type { DeliveryInfo } from '../../../app/schemas/domain/delivery-info.schema';
import type { SelectedPizzaCustomization } from '../../../app/schemas/domain/order.schema';

const generateId = () => {
  // Usar un timestamp como cadena + random sin conversión aritmética
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
  pizzaExtraCost?: number; // Costo extra de personalizaciones de pizza
}

interface CartContextType {
  // --- Items del carrito ---
  items: CartItem[];
  setItems: (items: CartItem[]) => void;
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
  clearCart: () => void;
  isCartEmpty: boolean;
  subtotal: number;
  total: number;
  totalItemsCount: number;
  isCartVisible: boolean;
  showCart: () => void;
  hideCart: () => void;

  // --- Estado del formulario de la orden ---
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  selectedAreaId: string | null;
  setSelectedAreaId: (id: string | null) => void;
  selectedTableId: string | null;
  setSelectedTableId: (id: string | null) => void;
  scheduledTime: Date | null;
  setScheduledTime: (time: Date | null) => void;
  deliveryInfo: DeliveryInfo;
  setDeliveryInfo: (info: DeliveryInfo) => void;
  orderNotes: string;
  setOrderNotes: (notes: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // --- Estados del carrito ---
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartVisible, setIsCartVisible] = useState(false);

  // --- Estados del formulario de la orden ---
  const [orderType, setOrderType] = useState<OrderType>(OrderTypeEnum.DINE_IN);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [scheduledTime, setScheduledTime] = useState<Date | null>(null);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({});
  const [orderNotes, setOrderNotes] = useState<string>('');

  const subtotal = useMemo(() => {
    return items.reduce((sum, item: CartItem) => sum + item.totalPrice, 0);
  }, [items]);

  const total = useMemo(() => {
    return subtotal;
  }, [subtotal]);

  const totalItemsCount = useMemo(() => {
    return items.reduce((sum, item: CartItem) => sum + item.quantity, 0);
  }, [items]);

  const isCartEmpty = items.length === 0;

  const addItem = (
    product: Product,
    quantity: number = 1,
    variantId?: string,
    modifiers: CartItemModifier[] = [],
    preparationNotes?: string,
    selectedPizzaCustomizations?: SelectedPizzaCustomization[],
    pizzaExtraCost: number = 0,
  ) => {
    const variantToAdd = variantId
      ? product.variants?.find((v) => v.id === variantId)
      : undefined;

    // Validar y sanitizar precios
    const safeParsePrice = (price: any): number => {
      const parsed = Number(price);
      if (isNaN(parsed) || !isFinite(parsed) || parsed < 0) {
        console.error('[CartContext] Precio inválido:', price);
        return 0;
      }
      // Limitar a 2 decimales y máximo razonable
      return Math.min(Math.round(parsed * 100) / 100, 999999.99);
    };

    const unitPrice = variantToAdd
      ? safeParsePrice(variantToAdd.price)
      : safeParsePrice(product.price);

    const modifiersPrice = modifiers.reduce(
      (sum, mod) => sum + safeParsePrice(mod.price || 0),
      0,
    );

    setItems((currentItems) => {
      // Buscar si existe un item idéntico
      const existingItemIndex = currentItems.findIndex((item) => {
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
        const updatedItems = [...currentItems];
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

        return updatedItems;
      } else {
        // Si no existe, crear un nuevo item
        const newItem: CartItem = {
          id: generateId(),
          productId: product.id,
          productName: product.name,
          quantity,
          unitPrice: unitPrice as number,
          totalPrice:
            ((unitPrice as number) + modifiersPrice + pizzaExtraCost) *
            quantity,
          modifiers,
          variantId,
          variantName: variantToAdd?.name,
          preparationNotes,
          selectedPizzaCustomizations,
          pizzaExtraCost,
        };

        return [...currentItems, newItem];
      }
    });
  };

  const removeItem = (itemId: string) => {
    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== itemId),
    );
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    // Validar y sanitizar cantidad
    const safeQuantity = Math.round(quantity);
    
    if (!Number.isInteger(quantity) || safeQuantity !== quantity) {
      console.warn('[CartContext] Cantidad debe ser un número entero:', quantity);
    }
    
    if (safeQuantity <= 0 || isNaN(safeQuantity)) {
      removeItem(itemId);
      return;
    }
    
    // Límite máximo razonable
    const MAX_QUANTITY = 9999;
    const finalQuantity = Math.min(safeQuantity, MAX_QUANTITY);

    setItems((currentItems) =>
      currentItems.map((item) => {
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
      }),
    );
  };

  const updateItem = (
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
    setItems((currentItems) =>
      currentItems.map((item) => {
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
      }),
    );
  };

  // Modificar clearCart para resetear todo
  const clearCart = () => {
    setItems([]);
    // Resetear estado del formulario
    setOrderType(OrderTypeEnum.DINE_IN);
    setSelectedAreaId(null);
    setSelectedTableId(null);
    setScheduledTime(null);
    setDeliveryInfo({});
    setOrderNotes('');
  };

  const showCart = useCallback(() => {
    setIsCartVisible(true);
  }, []);

  const hideCart = useCallback(() => {
    setIsCartVisible(false);
  }, []);

  const value: CartContextType = {
    items,
    setItems,
    addItem,
    removeItem,
    updateItemQuantity,
    updateItem,
    clearCart,
    isCartEmpty,
    subtotal,
    total,
    totalItemsCount,
    isCartVisible,
    showCart,
    hideCart,
    orderType,
    setOrderType,
    selectedAreaId,
    setSelectedAreaId,
    selectedTableId,
    setSelectedTableId,
    scheduledTime,
    setScheduledTime,
    deliveryInfo,
    setDeliveryInfo,
    orderNotes,
    setOrderNotes,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext;
