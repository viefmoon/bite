import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
} from "react"; 
import { Product, OrderTypeEnum, type OrderType } from "../types/orders.types"; // Importar OrderType y Enum

const generateId = () => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15) +
    Date.now().toString(36)
  );
};

export interface CartItemModifier {
  id: string;
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
}

interface CartContextType {
  // --- Items del carrito ---
  items: CartItem[];
  addItem: (
    product: Product,
    quantity?: number,
    variantId?: string,
    modifiers?: CartItemModifier[],
    preparationNotes?: string
  ) => void;
  removeItem: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  isCartEmpty: boolean;
  subtotal: number;
  total: number;
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
  customerName: string;
  setCustomerName: (name: string) => void;
  phoneNumber: string;
  setPhoneNumber: (phone: string) => void;
  deliveryAddress: string;
  setDeliveryAddress: (address: string) => void;
  orderNotes: string;
  setOrderNotes: (notes: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart debe ser usado dentro de un CartProvider");
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
  const [customerName, setCustomerName] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState<string>('');


  const subtotal = useMemo(() => {
    return items.reduce((sum, item: CartItem) => sum + item.totalPrice, 0);
  }, [items]);

  const total = useMemo(() => {
    // Por ahora, el total es igual al subtotal. Se añadirán impuestos/descuentos después.
    return subtotal;
  }, [subtotal]);

  const isCartEmpty = items.length === 0;

  const addItem = (
    product: Product,
    quantity: number = 1,
    variantId?: string,
    modifiers: CartItemModifier[] = [],
    preparationNotes?: string
  ) => {
    const variantToAdd = variantId
      ? product.variants?.find((v) => v.id === variantId)
      : undefined;

    const unitPrice = variantToAdd ? variantToAdd.price : product.price || 0;

    const modifiersPrice = modifiers.reduce((sum, mod) => sum + mod.price, 0);

    const newItem: CartItem = {
      id: generateId(),
      productId: product.id,
      productName: product.name,
      quantity,
      unitPrice: unitPrice as number,
      totalPrice: ((unitPrice as number) + modifiersPrice) * quantity,
      modifiers,
      variantId,
      variantName: variantToAdd?.name,
      preparationNotes,
    };

    setItems((currentItems) => [...currentItems, newItem]);
  };

  const removeItem = (itemId: string) => {
    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== itemId)
    );
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id === itemId) {
          const modifiersPrice = item.modifiers.reduce(
            (sum, mod) => sum + mod.price,
            0
          );
          const newTotalPrice = (item.unitPrice + modifiersPrice) * quantity;
          return {
            ...item,
            quantity,
            totalPrice: newTotalPrice,
          };
        }
        return item;
      })
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
    setCustomerName('');
    setPhoneNumber('');
    setDeliveryAddress('');
    setOrderNotes('');
    // Opcional: resetear visibilidad si se desea cerrar el carrito al limpiar
    // setIsCartVisible(false);
  };

  const showCart = useCallback(() => {
    setIsCartVisible(true);
  }, []);

  const hideCart = useCallback(() => {
    setIsCartVisible(false);
  }, []);

  const value: CartContextType = {
    // --- Carrito ---
    items,
    addItem,
    removeItem,
    updateItemQuantity,
    clearCart,
    isCartEmpty,
    subtotal,
    total,
    isCartVisible,
    showCart,
    hideCart,
    // --- Formulario ---
    orderType,
    setOrderType,
    selectedAreaId,
    setSelectedAreaId,
    selectedTableId,
    setSelectedTableId,
    scheduledTime,
    setScheduledTime,
    customerName,
    setCustomerName,
    phoneNumber,
    setPhoneNumber,
    deliveryAddress,
    setDeliveryAddress,
    orderNotes,
    setOrderNotes,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext;
