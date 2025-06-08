import React, { useState, useMemo, useEffect, useCallback } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, TouchableWithoutFeedback, Keyboard, Platform } from "react-native";
import {
  Text,
  Divider,
  List,
  Button,
  RadioButton,
  HelperText,
  Menu,
  IconButton,
  Modal,
  Portal,
} from "react-native-paper";
import { useAppTheme } from "@/app/styles/theme";
import { OrderTypeEnum, type OrderType } from "../types/orders.types"; // Importar OrderTypeEnum y el tipo OrderType
import { useGetAreas } from "@/modules/areasTables/services/areaService";
import OrderHeader from "./OrderHeader";
import AnimatedLabelSelector from "@/app/components/common/AnimatedLabelSelector";
import SpeechRecognitionInput from "@/app/components/common/SpeechRecognitionInput";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import ConfirmationModal from "@/app/components/common/ConfirmationModal";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ProductSelectionModal from "./ProductSelectionModal";
import ProductCustomizationModal from "./ProductCustomizationModal";
import type { FullMenuProduct as Product } from "../types/orders.types";
import { useGetTablesByArea } from "@/modules/areasTables/services/tableService";
import type { Table } from "@/modules/areasTables/types/areasTables.types";
import { useCart, CartItem, CartItemModifier } from "../context/CartContext"; // Importar CartItem y CartItemModifier
import { useAuthStore } from "@/app/store/authStore"; // Importar authStore
import { useGetOrderByIdQuery } from "../hooks/useOrdersQueries"; // Para cargar datos en modo edición
import { useGetFullMenu } from "../hooks/useMenuQueries"; // Para obtener productos completos
import type { FullMenuCategory } from "../types/orders.types"; // Tipo con subcategorías

// Definir la estructura esperada para los items en el DTO de backend
interface OrderItemDtoForBackend {
  productId: string;
  productVariantId?: string | null;
  quantity: number;
  basePrice: number;
  finalPrice: number;
  preparationNotes?: string | null;
}

// Definir la estructura completa del payload para onConfirmOrder (y exportarla)
export interface OrderDetailsForBackend {
  userId: string; // Añadido
  orderType: OrderType;
  subtotal: number; // Añadido
  total: number; // Añadido
  items: OrderItemDtoForBackend[];
  tableId?: string;
  scheduledAt?: Date;
  customerName?: string;
  phoneNumber?: string;
  deliveryAddress?: string;
  notes?: string;
}

interface OrderCartDetailProps {
  visible: boolean;
  onConfirmOrder: (details: OrderDetailsForBackend) => void;
  onClose?: () => void;
  onEditItem?: (item: CartItem) => void;
  isEditMode?: boolean;
  orderId?: string | null;
  orderNumber?: number;
  orderDate?: Date;
  onAddProducts?: () => void;
}

const OrderCartDetail: React.FC<OrderCartDetailProps> = ({
  visible,
  onConfirmOrder,
  onClose,
  onEditItem,
  isEditMode = false,
  orderId,
  orderNumber,
  orderDate,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  // Query para cargar datos de la orden en modo edición
  const {
    data: orderData,
    isLoading: isLoadingOrder,
    isError: isErrorOrder,
  } = useGetOrderByIdQuery(orderId, { 
    enabled: isEditMode && !!orderId && visible 
  });
  
  // Query para obtener el menú completo (para poder editar productos)
  const { data: menu } = useGetFullMenu();
  
  // Estados locales para modo edición (cuando no usamos el contexto del carrito)
  const [editItems, setEditItems] = useState<CartItem[]>([]);
  const [editOrderType, setEditOrderType] = useState<OrderType>(OrderTypeEnum.DINE_IN);
  const [editSelectedAreaId, setEditSelectedAreaId] = useState<string | null>(null);
  const [editSelectedTableId, setEditSelectedTableId] = useState<string | null>(null);
  const [editScheduledTime, setEditScheduledTime] = useState<Date | null>(null);
  const [editCustomerName, setEditCustomerName] = useState<string>('');
  const [editPhoneNumber, setEditPhoneNumber] = useState<string>('');
  const [editDeliveryAddress, setEditDeliveryAddress] = useState<string>('');
  const [editOrderNotes, setEditOrderNotes] = useState<string>('');
  
  // Obtener estado del carrito Y del formulario desde el contexto SOLO si NO estamos en modo edición
  const cartContext = !isEditMode ? useCart() : null;
  
  const cartItems = cartContext?.items || [];
  const removeCartItem = cartContext?.removeItem || (() => {});
  const updateCartItemQuantity = cartContext?.updateItemQuantity || (() => {});
  const isCartVisible = cartContext?.isCartVisible || false;
  const cartOrderType = cartContext?.orderType || OrderTypeEnum.DINE_IN;
  const setCartOrderType = cartContext?.setOrderType || (() => {});
  const cartSelectedAreaId = cartContext?.selectedAreaId || null;
  const setCartSelectedAreaId = cartContext?.setSelectedAreaId || (() => {});
  const cartSelectedTableId = cartContext?.selectedTableId || null;
  const setCartSelectedTableId = cartContext?.setSelectedTableId || (() => {});
  const cartScheduledTime = cartContext?.scheduledTime || null;
  const setCartScheduledTime = cartContext?.setScheduledTime || (() => {});
  const cartCustomerName = cartContext?.customerName || '';
  const setCartCustomerName = cartContext?.setCustomerName || (() => {});
  const cartPhoneNumber = cartContext?.phoneNumber || '';
  const setCartPhoneNumber = cartContext?.setPhoneNumber || (() => {});
  const cartDeliveryAddress = cartContext?.deliveryAddress || '';
  const setCartDeliveryAddress = cartContext?.setDeliveryAddress || (() => {});
  const cartOrderNotes = cartContext?.orderNotes || '';
  const setCartOrderNotes = cartContext?.setOrderNotes || (() => {});
  
  // Usar valores del contexto o locales según el modo
  const items = isEditMode ? editItems : cartItems;
  const orderType = isEditMode ? editOrderType : cartOrderType;
  const selectedAreaId = isEditMode ? editSelectedAreaId : cartSelectedAreaId;
  const selectedTableId = isEditMode ? editSelectedTableId : cartSelectedTableId;
  const scheduledTime = isEditMode ? editScheduledTime : cartScheduledTime;
  const customerName = isEditMode ? editCustomerName : cartCustomerName;
  const phoneNumber = isEditMode ? editPhoneNumber : cartPhoneNumber;
  const deliveryAddress = isEditMode ? editDeliveryAddress : cartDeliveryAddress;
  const orderNotes = isEditMode ? editOrderNotes : cartOrderNotes;
  
  const setOrderType = isEditMode ? setEditOrderType : setCartOrderType;
  const setSelectedAreaId = isEditMode ? setEditSelectedAreaId : setCartSelectedAreaId;
  const setSelectedTableId = isEditMode ? setEditSelectedTableId : setCartSelectedTableId;
  const setScheduledTime = isEditMode ? setEditScheduledTime : setCartScheduledTime;
  const setCustomerName = isEditMode ? setEditCustomerName : setCartCustomerName;
  const setPhoneNumber = isEditMode ? setEditPhoneNumber : setCartPhoneNumber;
  const setDeliveryAddress = isEditMode ? setEditDeliveryAddress : setCartDeliveryAddress;
  const setOrderNotes = isEditMode ? setEditOrderNotes : setCartOrderNotes;
  
  const removeItem = (itemId: string) => {
    if (isEditMode) {
      setEditItems(prev => prev.filter(item => item.id !== itemId));
    } else {
      removeCartItem(itemId);
    }
  };
  
  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (isEditMode) {
      if (quantity <= 0) {
        removeItem(itemId);
        return;
      }
      setEditItems(prev => prev.map(item => {
        if (item.id === itemId) {
          const modifiersPrice = item.modifiers.reduce(
            (sum, mod) => sum + Number(mod.price || 0),
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
      }));
    } else {
      updateCartItemQuantity(itemId, quantity);
    }
  };
  
  // Calcular totales
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [items]);
  
  const total = useMemo(() => {
    return subtotal;
  }, [subtotal]);
  
  const totalItemsCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);
  
  const { user } = useAuthStore(); // Obtener usuario autenticado

  // Estados locales solo para UI (errores, visibilidad de menús/modales)
  const [areaMenuVisible, setAreaMenuVisible] = useState(false);
  const [tableMenuVisible, setTableMenuVisible] = useState(false);
  const [areaError, setAreaError] = useState<string | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);
  const [customerNameError, setCustomerNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);
  const [isTimeAlertVisible, setTimeAlertVisible] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showProductSelection, setShowProductSelection] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [editingItemFromList, setEditingItemFromList] = useState<CartItem | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalReady, setIsModalReady] = useState(false);


  // --- Queries para Áreas y Mesas (sin cambios) ---
  const {
    data: areasData,
    isLoading: isLoadingAreas,
    error: errorAreas,
  } = useGetAreas();
  const {
    data: tablesData,
    isLoading: isLoadingTables,
    error: errorTables,
  } = useGetTablesByArea(selectedAreaId);

  // Cargar datos de la orden cuando esté en modo edición
  useEffect(() => {
    if (!isEditMode || !orderData || !visible) return;
    
    // Establecer los valores del formulario
    setEditOrderType(orderData.orderType);
    setEditSelectedTableId(orderData.tableId ?? null);
    setEditScheduledTime(orderData.scheduledAt ? new Date(orderData.scheduledAt) : null);
    setEditCustomerName(orderData.customerName ?? '');
    
    // Procesar el teléfono - si viene con +52, quitarlo para mostrarlo sin prefijo
    let phoneForDisplay = orderData.phoneNumber ?? '';
    if (phoneForDisplay.startsWith('+52')) {
      phoneForDisplay = phoneForDisplay.substring(3);
    } else if (phoneForDisplay.startsWith('52') && phoneForDisplay.length === 12) {
      phoneForDisplay = phoneForDisplay.substring(2);
    }
    setEditPhoneNumber(phoneForDisplay);
    
    setEditDeliveryAddress(orderData.deliveryAddress ?? '');
    setEditOrderNotes(orderData.notes ?? '');
    
    // Si hay una mesa, necesitamos encontrar el área
    if (orderData.tableId && orderData.table) {
      setEditSelectedAreaId(orderData.table.areaId);
    }
    
    // Mapear los items de la orden
    if (orderData.orderItems && Array.isArray(orderData.orderItems)) {
      const mappedItems: CartItem[] = orderData.orderItems.map((item: any) => {
        // Calcular el precio de los modificadores
        const modifiers = (item.modifiers || []).map((mod: any) => ({
          id: mod.id,
          name: mod.productModifier?.name || mod.name || 'Modificador',
          price: parseFloat(mod.price || '0'),
        }));
        
        const modifiersPrice = modifiers.reduce((sum: number, mod: any) => sum + (mod.price || 0), 0);
        const unitPrice = parseFloat(item.basePrice || '0');
        const quantity = Number(item.quantity) || 1;
        
        // El totalPrice es (precio base + modificadores) * cantidad
        const totalPrice = (unitPrice + modifiersPrice) * quantity;
        
        return {
          id: item.id,
          productId: item.productId,
          productName: item.product?.name || 'Producto desconocido',
          quantity,
          unitPrice,
          totalPrice,
          modifiers,
          variantId: item.productVariantId || undefined,
          variantName: item.productVariant?.name || undefined,
          preparationNotes: item.preparationNotes || undefined,
        };
      });
      setEditItems(mappedItems);
    }
  }, [isEditMode, orderData, visible]);

  // Limpiar errores locales al cambiar tipo de orden (más simple)
  useEffect(() => {
    setAreaError(null);
    setTableError(null);
    setCustomerNameError(null);
    setPhoneError(null);
    setAddressError(null);
  }, [orderType]);
  
  // Resetear estados cuando el modal se cierre
  useEffect(() => {
    if (!visible && isEditMode) {
      // Resetear estados de edición cuando el modal se cierre
      setEditOrderType(OrderTypeEnum.DINE_IN);
      setEditSelectedAreaId(null);
      setEditSelectedTableId(null);
      setEditScheduledTime(null);
      setEditCustomerName('');
      setEditPhoneNumber('');
      setEditDeliveryAddress('');
      setEditOrderNotes('');
      setEditItems([]);
      setShowExitConfirmation(false);
      setShowProductSelection(false);
      setEditingItemFromList(null);
      setEditingProduct(null);
      setIsModalReady(false);
    }
  }, [visible, isEditMode]);
  
  // Manejar la preparación del modal con un pequeño delay
  useEffect(() => {
    if (visible && !isModalReady) {
      const timer = setTimeout(() => {
        setIsModalReady(true);
      }, 100); // 100ms delay para evitar conflictos de focus
      return () => clearTimeout(timer);
    }
  }, [visible, isModalReady]);


  const handleConfirm = async () => {
    if (isConfirming) return; // Prevenir múltiples clics
    
    setAreaError(null);
    setTableError(null);
    setCustomerNameError(null);
    setPhoneError(null);
    setAddressError(null);

    if (items.length === 0) {
      return;
    }

    let isValid = true;

    if (orderType === OrderTypeEnum.DINE_IN) { // Usar Enum
      if (!selectedAreaId) {
        setAreaError("Debe seleccionar un área");
        isValid = false;
      }
      if (!selectedTableId) {
        setTableError("Debe seleccionar una mesa");
        isValid = false;
      }
    } else if (orderType === OrderTypeEnum.TAKE_AWAY) { // Usar Enum
        if (!customerName || customerName.trim() === '') {
            setCustomerNameError("El nombre del cliente es obligatorio");
            isValid = false;
        }
        // Phone is optional for take away
    } else if (orderType === OrderTypeEnum.DELIVERY) { // Usar Enum
        // Customer name not required for delivery as per new spec
        if (!deliveryAddress || deliveryAddress.trim() === '') {
            setAddressError("La dirección es obligatoria para Domicilio");
            isValid = false;
        }
        if (!phoneNumber || phoneNumber.trim() === '') {
            setPhoneError("El teléfono es obligatorio para Domicilio");
            isValid = false;
        }
    }


    
    if (!isValid) {
      return;
    }

    
    // Mapear items del carrito al formato esperado por el DTO del backend
    const itemsForBackend: OrderItemDtoForBackend[] = items.map((item: CartItem) => ({
      productId: item.productId,
      productVariantId: item.variantId || null,
      quantity: item.quantity,
      basePrice: Number(item.unitPrice), // Asegurar que sea número
      finalPrice: Number(item.totalPrice / item.quantity), // Asegurar que sea número
      preparationNotes: item.preparationNotes || null,
      // Mapear modifiers si es necesario y la estructura del backend es diferente
    }));

    // Formatear el número de teléfono para el backend
    let formattedPhone: string | undefined = undefined;
    if (phoneNumber && phoneNumber.trim() !== '') {
      // Eliminar espacios, guiones y caracteres no numéricos
      let cleanPhone = phoneNumber.replace(/\D/g, '');
      
      // Si tiene 11 dígitos y empieza con 52 (código de México), eliminar el prefijo
      if (cleanPhone.length === 11 && cleanPhone.startsWith('52')) {
        cleanPhone = cleanPhone.substring(1);
      }
      // Si tiene 12 dígitos y empieza con 521 (código de México + 1), eliminar el prefijo
      else if (cleanPhone.length === 12 && cleanPhone.startsWith('521')) {
        cleanPhone = cleanPhone.substring(2);
      }
      
      // Validar que tenga exactamente 10 dígitos
      if (cleanPhone.length !== 10) {
        setPhoneError("El teléfono debe tener 10 dígitos");
        return;
      }
      
      // El backend espera números con formato internacional, agregar +52 para México
      formattedPhone = `+52${cleanPhone}`;
    }

    const orderDetails: OrderDetailsForBackend = {
      userId: user?.id || '', // Asegurarse de tener un userId
      orderType,
      subtotal,
      total,
      items: itemsForBackend,
      tableId: orderType === OrderTypeEnum.DINE_IN ? selectedTableId ?? undefined : undefined, // Usar Enum
      scheduledAt: scheduledTime ?? undefined,
      customerName: (orderType === OrderTypeEnum.TAKE_AWAY || orderType === OrderTypeEnum.DELIVERY) ? customerName : undefined, // Include for both TAKE_AWAY and DELIVERY
      phoneNumber: (orderType === OrderTypeEnum.TAKE_AWAY || orderType === OrderTypeEnum.DELIVERY) && formattedPhone ? formattedPhone : undefined, // Usar teléfono formateado
      deliveryAddress: orderType === OrderTypeEnum.DELIVERY ? deliveryAddress : undefined, // Usar Enum
      notes: orderNotes || undefined,
    };

    if (!orderDetails.userId) {
        console.error("Error: Falta el ID del usuario al confirmar la orden.");
        return; // Detener el proceso si falta el userId
    }

    setIsConfirming(true); // Marcar como procesando
    
    try {
      await onConfirmOrder(orderDetails);
      // Si llegamos aquí, la orden fue exitosa, resetear el estado
      setIsConfirming(false);
    } catch (error) {
      // Solo re-habilitar si hubo un error
      setIsConfirming(false);
      console.error("Error en handleConfirm:", error);
    }
  };

  
  const selectedAreaName = useMemo(
    () => areasData?.find((a: any) => a.id === selectedAreaId)?.name,
    [areasData, selectedAreaId]
  );
  const selectedTableName = useMemo(
    () => tablesData?.find((t) => t.id === selectedTableId)?.name,
    [tablesData, selectedTableId]
  );

  const showTimePicker = () => setTimePickerVisible(true);
  const hideTimePicker = () => setTimePickerVisible(false);
  const handleTimeConfirm = (date: Date) => {
    const now = new Date();

    now.setSeconds(0, 0);
    date.setSeconds(0, 0);

    if (date < now) {
      hideTimePicker();
      setTimeAlertVisible(true);
      // Actualizar estado global del contexto
      setScheduledTime(date);
      hideTimePicker();
    }
  };

  const formattedScheduledTime = useMemo(() => {
    if (!scheduledTime) return null;
    try {
      return format(scheduledTime, "p", { locale: es });
    } catch (error) {
      console.error("Error formatting time:", error);
      return "Hora inválida";
    }
  }, [scheduledTime]);
  
  // Función para detectar si hay cambios en modo edición
  const hasUnsavedChanges = useCallback(() => {
    if (!isEditMode || !orderData) return false;
    
    // Comparar tipo de orden
    if (editOrderType !== orderData.orderType) return true;
    
    // Comparar mesa (solo para DINE_IN)
    if (editOrderType === OrderTypeEnum.DINE_IN && editSelectedTableId !== orderData.tableId) return true;
    
    // Comparar hora programada
    const originalScheduledTime = orderData.scheduledAt ? new Date(orderData.scheduledAt).getTime() : null;
    const currentScheduledTime = editScheduledTime ? editScheduledTime.getTime() : null;
    if (originalScheduledTime !== currentScheduledTime) return true;
    
    // Comparar datos del cliente
    if (editCustomerName !== (orderData.customerName || '')) return true;
    
    // Comparar teléfono considerando el formato
    let originalPhone = orderData.phoneNumber || '';
    if (originalPhone.startsWith('+52')) {
      originalPhone = originalPhone.substring(3);
    } else if (originalPhone.startsWith('52') && originalPhone.length === 12) {
      originalPhone = originalPhone.substring(2);
    }
    if (editPhoneNumber !== originalPhone) return true;
    
    if (editDeliveryAddress !== (orderData.deliveryAddress || '')) return true;
    if (editOrderNotes !== (orderData.notes || '')) return true;
    
    // Comparar items
    const originalItems = orderData.orderItems || [];
    
    // Si la cantidad de items cambió
    if (editItems.length !== originalItems.length) return true;
    
    // Comparar cada item (esto es más complejo porque los items pueden haber sido modificados)
    // Por simplicidad, si algún item tiene un ID temporal (new-*), hay cambios
    if (editItems.some(item => item.id.startsWith('new-'))) return true;
    
    // Comparar items existentes por cantidad
    for (const editItem of editItems) {
      if (!editItem.id.startsWith('new-')) {
        const originalItem = originalItems.find((item: any) => item.id === editItem.id);
        if (!originalItem) return true; // Item fue eliminado
        if (editItem.quantity !== Number(originalItem.quantity)) return true;
      }
    }
    
    // Verificar si algún item original fue eliminado
    for (const originalItem of originalItems) {
      const stillExists = editItems.find(item => item.id === originalItem.id);
      if (!stillExists) return true;
    }
    
    return false;
  }, [isEditMode, orderData, editOrderType, editSelectedTableId, editScheduledTime, 
      editCustomerName, editPhoneNumber, editDeliveryAddress, editOrderNotes, editItems]);

  // Función para manejar la edición de un item del carrito
  const handleEditCartItem = useCallback((item: CartItem) => {
    if (!isEditMode) {
      // En modo creación, usar la función pasada por props
      if (onEditItem) {
        onEditItem(item);
      }
    } else {
      // En modo edición, buscar el producto real del menú
      if (!menu || !Array.isArray(menu)) {
        console.warn("El menú no está disponible");
        return;
      }
      
      // Buscar el producto en la estructura anidada del menú
      let product: Product | undefined;
      
      for (const category of menu as FullMenuCategory[]) {
        if (category.subcategories && Array.isArray(category.subcategories)) {
          for (const subcategory of category.subcategories) {
            if (subcategory.products && Array.isArray(subcategory.products)) {
              product = subcategory.products.find((p: Product) => p.id === item.productId);
              if (product) break;
            }
          }
        }
        if (product) break;
      }
      
      if (product) {
        setEditingItemFromList(item);
        setEditingProduct(product);
      } else {
        // Si no encontramos el producto en el menú, crear uno temporal
        console.warn("Producto no encontrado en el menú, usando datos temporales");
        setEditingItemFromList(item);
        
        const tempProduct: Product = {
          id: item.productId,
          name: item.productName,
          price: item.unitPrice,
          hasVariants: !!item.variantId,
          variants: item.variantId ? [{
            id: item.variantId,
            name: item.variantName || '',
            price: item.unitPrice,
          }] : [],
          modifierGroups: [], // Sin grupos de modificadores
          photo: null,
          subcategoryId: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        setEditingProduct(tempProduct);
      }
    }
  }, [isEditMode, onEditItem, menu]);
  
  // Función para actualizar un item editado
  const handleUpdateEditedItem = useCallback((
    itemId: string,
    quantity: number,
    modifiers: CartItemModifier[],
    preparationNotes?: string,
    variantId?: string,
    variantName?: string,
    unitPrice?: number
  ) => {
    if (!isEditMode) return;
    
    setEditItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const modifiersPrice = modifiers.reduce(
          (sum, mod) => sum + Number(mod.price || 0),
          0
        );
        const finalUnitPrice = unitPrice !== undefined ? unitPrice : item.unitPrice;
        const newTotalPrice = (finalUnitPrice + modifiersPrice) * quantity;
        
        return {
          ...item,
          quantity,
          modifiers,
          preparationNotes: preparationNotes !== undefined ? preparationNotes : item.preparationNotes,
          variantId: variantId !== undefined ? variantId : item.variantId,
          variantName: variantName !== undefined ? variantName : item.variantName,
          unitPrice: finalUnitPrice,
          totalPrice: newTotalPrice,
        };
      }
      return item;
    }));
    
    // Cerrar el modal de edición
    setEditingItemFromList(null);
    setEditingProduct(null);
  }, [isEditMode]);

  // Función para añadir un producto desde el modal de selección
  const handleAddProductFromModal = (
    product: Product,
    quantity: number,
    variantId?: string,
    modifiers?: CartItemModifier[],
    preparationNotes?: string
  ) => {
    if (!isEditMode) return;
    
    // Encontrar la variante si existe
    const variant = variantId && product.variants
      ? product.variants.find(v => v.id === variantId)
      : undefined;
    
    // Calcular precio unitario
    const unitPrice = variant ? Number(variant.price) : Number(product.price) || 0;
    
    // Calcular precio de modificadores
    const modifiersPrice = modifiers?.reduce((sum, mod) => sum + Number(mod.price || 0), 0) || 0;
    
    // Crear nuevo item
    const newItem: CartItem = {
      id: `new-${Date.now()}-${Math.random()}`, // ID temporal para nuevos items
      productId: product.id,
      productName: product.name,
      quantity,
      unitPrice,
      totalPrice: (unitPrice + modifiersPrice) * quantity,
      modifiers: modifiers || [],
      variantId,
      variantName: variant?.name,
      preparationNotes,
    };
    
    // Añadir al array de items editados
    setEditItems(prev => [...prev, newItem]);
    
    // Cerrar el modal
    setShowProductSelection(false);
  };

  // Helper function to render fields in order
  const renderFields = () => {
    switch (orderType) {
      case OrderTypeEnum.DINE_IN: // Usar Enum
        return (
          <>
            {/* 1. Área */}
            <View style={styles.dineInSelectorsRow}>
              <View style={styles.dineInSelectorContainer}>
                <Menu
                  visible={areaMenuVisible}
                  onDismiss={() => setAreaMenuVisible(false)}
                  anchor={
                    <AnimatedLabelSelector
                      label="Área *"
                      value={selectedAreaName}
                      onPress={() => setAreaMenuVisible(true)}
                      isLoading={isLoadingAreas}
                      error={!!areaError || !!errorAreas}
                      disabled={isLoadingAreas}
                    />
                  }
                >
                  {areasData?.map((area: any) => (
                    <Menu.Item
                      key={area.id}
                      onPress={() => {
                        setSelectedAreaId(area.id);
                        setSelectedTableId(null);
                        setAreaMenuVisible(false);
                        setAreaError(null);
                      }}
                      title={area.name}
                    />
                  ))}
                  {errorAreas && (
                    <Menu.Item title="Error al cargar áreas" disabled />
                  )}
                </Menu>
                {areaError && !errorAreas && (
                  <HelperText type="error" visible={true} style={styles.helperTextFix}>
                    {areaError}
                  </HelperText>
                )}
                {errorAreas && (
                  <HelperText type="error" visible={true} style={styles.helperTextFix}>
                    Error al cargar áreas
                  </HelperText>
                )}
              </View>

              {/* 2. Mesa */}
              <View style={styles.dineInSelectorContainer}>
                <Menu
                  visible={tableMenuVisible}
                  onDismiss={() => setTableMenuVisible(false)}
                  anchor={
                    <AnimatedLabelSelector
                      label="Mesa *"
                      value={selectedTableName}
                      onPress={() => setTableMenuVisible(true)}
                      isLoading={isLoadingTables}
                      error={!!tableError || !!errorTables}
                      disabled={!selectedAreaId || isLoadingTables || isLoadingAreas}
                    />
                  }
                >
                  {tablesData?.map((table: Table) => (
                    <Menu.Item
                      key={table.id}
                      onPress={() => {
                        setSelectedTableId(table.id);
                        setTableMenuVisible(false);
                        setTableError(null);
                      }}
                      title={table.name}
                    />
                  ))}
                  {selectedAreaId && tablesData?.length === 0 && !isLoadingTables && !errorTables && (
                    <Menu.Item title="No hay mesas" disabled />
                  )}
                  {errorTables && (
                    <Menu.Item title="Error al cargar mesas" disabled />
                  )}
                </Menu>
                {tableError && !errorTables && (
                  <HelperText type="error" visible={true} style={styles.helperTextFix}>
                    {tableError}
                  </HelperText>
                )}
                {errorTables && (
                  <HelperText type="error" visible={true} style={styles.helperTextFix}>
                    Error al cargar mesas
                  </HelperText>
                )}
              </View>
            </View>

            {/* 3. Notas */}
            <View style={[styles.sectionCompact, styles.fieldContainer]}>
              <SpeechRecognitionInput
                key="notes-input-dine-in"
                label="Notas de la Orden (Opcional)"
                value={orderNotes}
                onChangeText={setOrderNotes}
                multiline
                speechLang="es-MX"
              />
            </View>

            {/* 4. Programar Hora */}
            <View style={[styles.sectionCompact, styles.fieldContainer]}>
              <AnimatedLabelSelector
                label="Programar Hora (Opcional)"
                value={formattedScheduledTime}
                onPress={showTimePicker}
                onClear={() => setScheduledTime(null)}
              />
            </View>
          </>
        );
      case OrderTypeEnum.TAKE_AWAY: // Usar Enum
        return (
          <>
            {/* 1. Nombre Cliente */}
            <View style={[styles.sectionCompact, styles.fieldContainer]}>
              <SpeechRecognitionInput
                key={`customer-name-input-${orderType}`}
                label="Nombre del Cliente *"
                value={customerName}
                onChangeText={(text) => {
                  setCustomerName(text);
                  if (customerNameError) setCustomerNameError(null);
                }}
                error={!!customerNameError}
                speechLang="es-MX"
                autoCapitalize="words"
                autoCorrect={false}
              />
              {customerNameError && (
                <HelperText type="error" visible={true} style={styles.helperTextFix}>
                  {customerNameError}
                </HelperText>
              )}
            </View>

            {/* 2. Teléfono */}
            <View style={[styles.sectionCompact, styles.fieldContainer]}>
              <SpeechRecognitionInput
                key={`phone-input-takeaway-${orderType}`}
                label="Teléfono (Opcional)"
                value={phoneNumber}
                onChangeText={(text) => {
                  setPhoneNumber(text);
                  if (phoneError) setPhoneError(null);
                }}
                keyboardType="phone-pad"
                error={!!phoneError} // Aunque opcional, puede tener errores de formato si se ingresa
                speechLang="es-MX"
                autoCorrect={false}
              />
              {phoneError && (
                <HelperText type="error" visible={true} style={styles.helperTextFix}>
                  {phoneError}
                </HelperText>
              )}
            </View>

            {/* 3. Notas */}
            <View style={[styles.sectionCompact, styles.fieldContainer]}>
              <SpeechRecognitionInput
                key="notes-input-takeaway"
                label="Notas de la Orden (Opcional)"
                value={orderNotes}
                onChangeText={setOrderNotes}
                multiline
                speechLang="es-MX"
              />
            </View>

            {/* 4. Programar Hora */}
            <View style={[styles.sectionCompact, styles.fieldContainer]}>
              <AnimatedLabelSelector
                label="Programar Hora Recolección (Opcional)"
                value={formattedScheduledTime}
                onPress={showTimePicker}
                onClear={() => setScheduledTime(null)}
              />
            </View>
          </>
        );
      case OrderTypeEnum.DELIVERY: // Usar Enum
        return (
          <>
            {/* 1. Nombre Cliente */}
            <View style={[styles.sectionCompact, styles.fieldContainer]}>
              <SpeechRecognitionInput
                key={`customer-name-input-delivery-${orderType}`}
                label="Nombre del Cliente (Opcional)"
                value={customerName}
                onChangeText={(text) => {
                  setCustomerName(text);
                  if (customerNameError) setCustomerNameError(null);
                }}
                speechLang="es-MX"
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            {/* 2. Dirección */}
            <View style={[styles.sectionCompact, styles.fieldContainer]}>
              <SpeechRecognitionInput
                key="address-input-delivery"
                label="Dirección de Entrega *"
                value={deliveryAddress}
                onChangeText={(text) => {
                  setDeliveryAddress(text);
                  if (addressError) setAddressError(null);
                }}
                error={!!addressError}
                speechLang="es-MX"
                multiline
              />
              {addressError && (
                <HelperText type="error" visible={true} style={styles.helperTextFix}>
                  {addressError}
                </HelperText>
              )}
            </View>

            {/* 3. Teléfono */}
            <View style={[styles.sectionCompact, styles.fieldContainer]}>
              <SpeechRecognitionInput
                key={`phone-input-delivery-${orderType}`} // Key única y específica
                label="Teléfono *"
                value={phoneNumber}
                onChangeText={(text) => { // Asegurar que la función esté bien definida aquí
                  setPhoneNumber(text);
                  if (phoneError) {
                    setPhoneError(null);
                  }
                }}
                keyboardType="phone-pad"
                error={!!phoneError}
                speechLang="es-MX"
                autoCorrect={false}
              />
              {phoneError && (
                <HelperText type="error" visible={true} style={styles.helperTextFix}>
                  {phoneError}
                </HelperText>
              )}
            </View>

            {/* 4. Notas */}
            <View style={[styles.sectionCompact, styles.fieldContainer]}>
              <SpeechRecognitionInput
                key="notes-input-delivery" // Key única y específica
                label="Notas de la Orden (Opcional)"
                value={orderNotes}
                onChangeText={setOrderNotes}
                multiline
                speechLang="es-MX"
              />
            </View>

            {/* 5. Programar Hora */}
            <View style={[styles.sectionCompact, styles.fieldContainer]}>
              <AnimatedLabelSelector
                label="Programar Hora Entrega (Opcional)"
                value={formattedScheduledTime}
                onPress={showTimePicker}
                onClear={() => setScheduledTime(null)}
              />
            </View>
          </>
        );
      default:
        return null;
    }
  };

  // Mostrar loading si estamos en modo edición y aún cargando
  if (isEditMode && isLoadingOrder) {
    return (
      <Portal>
        <Modal
          visible={visible}
          onDismiss={onClose}
          contentContainerStyle={styles.modalContent}
        >
          <View style={[styles.container, styles.loadingContainer]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Cargando orden...</Text>
          </View>
        </Modal>
      </Portal>
    );
  }
  
  // Mostrar error si falló la carga en modo edición
  if (isEditMode && isErrorOrder) {
    return (
      <Portal>
        <Modal
          visible={visible}
          onDismiss={onClose}
          contentContainerStyle={styles.modalContent}
        >
          <View style={[styles.container, styles.errorContainer]}>
            <Text style={styles.errorText}>Error al cargar la orden</Text>
            <Button onPress={onClose}>Cerrar</Button>
          </View>
        </Modal>
      </Portal>
    );
  }

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={() => {
          if (isEditMode && hasUnsavedChanges()) {
            setShowExitConfirmation(true);
          } else {
            onClose?.();
          }
        }}
        contentContainerStyle={styles.modalContent}
        dismissable={false}
        dismissableBackButton={false}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.container}>
          <OrderHeader
            title={isEditMode && orderNumber && orderDate 
              ? `Editar Orden #${orderNumber} - ${format(orderDate, 'dd/MM/yyyy', { locale: es })}`
              : "Resumen de Orden"
            }
            onBackPress={() => {
              if (isEditMode && hasUnsavedChanges()) {
                setShowExitConfirmation(true);
              } else {
                onClose?.();
              }
            }}
            itemCount={totalItemsCount}
            onCartPress={() => {}}
            isCartVisible={isCartVisible}
          />

          <ScrollView 
            style={styles.scrollView}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {/* Order Type Selection */}
            <View style={styles.sectionCompact}>
              <RadioButton.Group
                onValueChange={(newValue) =>
                  setOrderType(newValue as OrderType)
                }
                value={orderType}
              >
                <View style={styles.radioGroupHorizontal}>
                  <RadioButton.Item
                    label="COMER AQUÍ"
                    value={OrderTypeEnum.DINE_IN} // Usar Enum
                    style={styles.radioButtonItem}
                    labelStyle={styles.radioLabel}
                    position="leading"
                  />
                  <RadioButton.Item
                    label="PARA LLEVAR"
                    value={OrderTypeEnum.TAKE_AWAY} // Usar Enum
                    style={styles.radioButtonItem}
                    labelStyle={styles.radioLabel}
                    position="leading"
                  />
                  <RadioButton.Item
                    label="DOMICILIO"
                    value={OrderTypeEnum.DELIVERY} // Usar Enum
                    style={styles.radioButtonItem}
                    labelStyle={styles.radioLabel}
                    position="leading"
                  />
                </View>
              </RadioButton.Group>
            </View>

            {/* Render fields based on order type */}
            {renderFields()}

            <Divider style={styles.divider} />

            {/* Cart Items */}
            <List.Section>
              {items.map((item) => {
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handleEditCartItem(item)}
                    disabled={!onEditItem && !isEditMode}
                  >
                    <List.Item
                      // Mover title y description a un View contenedor para controlar el ancho
                      title={() => (
                      <View style={styles.itemTextContainer}>
                        {/* Eliminar numberOfLines para permitir expansión */}
                        <Text style={styles.itemTitleText}>
                          {`${item.quantity}x ${String(item.productName ?? "")}${item.variantName ? ` (${String(item.variantName ?? "")})` : ""}`}
                        </Text>
                        {(() => { // Render description condicionalmente
                          const modifierString =
                            item.modifiers && item.modifiers.length > 0
                              ? item.modifiers.map((mod) => mod.name).join(", ")
                              : "";
                          const notesString = item.preparationNotes
                            ? `Notas: ${item.preparationNotes}`
                            : "";

                          if (modifierString && notesString) {
                            return (
                              // Comentario eliminado o corregido si es necesario
                              <Text style={styles.itemDescription}>
                                {/* Usar template literal para interpretar \n */}
                                {`${modifierString}\n${notesString}`}
                              </Text>
                            );
                          } else if (modifierString) {
                            // Comentario eliminado o corregido si es necesario
                            return <Text style={styles.itemDescription}>{modifierString}</Text>;
                          } else if (notesString) {
                            // Comentario eliminado o corregido si es necesario
                            return <Text style={styles.itemDescription}>{notesString}</Text>;
                          } else {
                            return null;
                          }
                        })()}
                      </View>
                    )}
                    // titleNumberOfLines y description ya no se usan directamente aquí
                    right={() => ( // Usar paréntesis para retorno implícito si es una sola expresión
                      <View style={styles.itemActionsContainer}>
                        <View style={styles.quantityActions}>
                          <IconButton
                            icon="minus-circle-outline"
                            size={20} // Reducir tamaño de icono
                            onPress={() =>
                              updateItemQuantity(item.id, item.quantity - 1)
                            }
                            style={styles.quantityButton}
                            disabled={item.quantity <= 1} // Deshabilitar si es 1
                          />
                          <Text style={styles.quantityText}>{item.quantity}</Text>
                          <IconButton
                            icon="plus-circle-outline"
                            size={20} // Reducir tamaño de icono
                            onPress={() =>
                              updateItemQuantity(item.id, item.quantity + 1)
                            }
                            style={styles.quantityButton}
                          />
                        </View>
                        <View style={styles.priceContainer}>
                          <Text style={styles.itemPrice}>
                            ${item.totalPrice.toFixed(2)}
                          </Text>
                          {item.quantity > 1 && (
                            <Text style={styles.unitPriceText}>
                              (${((item.unitPrice + item.modifiers.reduce((sum, mod) => sum + Number(mod.price || 0), 0))).toFixed(2)} c/u)
                            </Text>
                          )}
                        </View>
                        <IconButton
                          icon="delete-outline"
                          size={20} // Reducir tamaño de icono
                          onPress={() => removeItem(item.id)}
                          style={styles.deleteButton}
                          iconColor={theme.colors.error}
                        />
                      </View>
                    )}
                    style={styles.listItem}
                  />
                  </TouchableOpacity>
                );
              })}
            </List.Section>

            {/* Botón para añadir productos en modo edición */}
            {isEditMode && (
              <Button 
                onPress={() => setShowProductSelection(true)} 
                mode="outlined" 
                style={{ marginTop: theme.spacing.m, marginBottom: theme.spacing.m }}
                icon="plus-circle-outline"
              >
                Añadir Productos
              </Button>
            )}

            <Divider style={styles.divider} />

            {/* Totals */}
            <View style={styles.totalsContainer}>
              <Text style={styles.totalsText}>Subtotal:</Text>
              <Text style={styles.totalsValue}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.totalsContainer}>
              <Text style={[styles.totalsText, styles.totalLabel]}>Total:</Text>
              <Text style={[styles.totalsValue, styles.totalValue]}>
                ${total.toFixed(2)}
              </Text>
            </View>
          </ScrollView>

          {/* Footer Button */}
          <View style={styles.footer}>
            <Button
              mode="contained"
              onPress={handleConfirm}
              disabled={
                isConfirming || // Deshabilitar mientras se procesa
                items.length === 0 ||
                (orderType === OrderTypeEnum.DINE_IN && (!selectedAreaId || !selectedTableId)) || // Usar Enum
                (orderType === OrderTypeEnum.TAKE_AWAY && (!customerName || customerName.trim() === '')) || // Usar Enum
                (orderType === OrderTypeEnum.DELIVERY && (!deliveryAddress || deliveryAddress.trim() === '')) || // Usar Enum
                (orderType === OrderTypeEnum.DELIVERY && (!phoneNumber || phoneNumber.trim() === '')) // Usar Enum
              }
              style={styles.confirmButton}
              loading={isConfirming} // Mostrar indicador de carga
            >
              {isConfirming 
                ? (isEditMode ? "Guardando..." : "Enviando...") 
                : (isEditMode ? "Guardar Cambios" : "Enviar Orden")
              }
            </Button>
          </View>
        </View>

        {/* Modals */}
        <DateTimePickerModal
          isVisible={isTimePickerVisible}
          mode="time"
          minimumDate={new Date()}
          onConfirm={handleTimeConfirm}
          onCancel={hideTimePicker}
          date={scheduledTime || new Date()}
          locale="es_ES"
          minuteInterval={15}
        />

        <ConfirmationModal
          visible={isTimeAlertVisible}
          title="Hora Inválida"
          message="No puedes seleccionar una hora que ya ha pasado. Por favor, elige una hora futura."
          confirmText="Entendido"
          onConfirm={() => setTimeAlertVisible(false)}
        />
        
        {/* Modal de selección de productos */}
        {isEditMode && (
          <ProductSelectionModal
            visible={showProductSelection}
            onDismiss={() => setShowProductSelection(false)}
            onAddProduct={handleAddProductFromModal}
          />
        )}
        
        {/* Modal de confirmación para descartar cambios */}
        <ConfirmationModal
          visible={showExitConfirmation}
          title="¿Descartar cambios?"
          message="Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?"
          confirmText="Descartar"
          cancelText="Cancelar"
          onConfirm={() => {
            setShowExitConfirmation(false);
            onClose?.();
          }}
          onCancel={() => setShowExitConfirmation(false)}
        />
        
        {/* Modal de personalización de producto para edición */}
        {isEditMode && editingProduct && editingItemFromList && (
          <ProductCustomizationModal
            visible={true}
            product={editingProduct}
            editingItem={editingItemFromList}
            onDismiss={() => {
              setEditingItemFromList(null);
              setEditingProduct(null);
            }}
            onAddToCart={() => {}} // No usado en modo edición
            onUpdateItem={handleUpdateEditedItem}
          />
        )}
        </View>
        </TouchableWithoutFeedback>
      </Modal>
    </Portal>
  );
};


const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    modalContent: {
      backgroundColor: theme.colors.background,
      width: "100%",
      height: "100%",
      margin: 0,
      padding: 0,
      position: "absolute",
      top: 0,
      left: 0,
    },
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
      paddingHorizontal: theme.spacing.s, // Restaurar padding pequeño
    },
    divider: {
      marginVertical: theme.spacing.s,
    },
    // List Item Styles
    listItem: {
      flexDirection: 'row',           // 1) Fila
      alignItems: 'center',
      justifyContent: 'space-between',// 2) Separar título y acciones
      paddingVertical: theme.spacing.s,
      paddingHorizontal: theme.spacing.s, // controla el “gap” desde el borde
    },

    itemTextContainer: { // Contenedor para título y descripción
      flex: 2,                        // Darle más espacio al texto
      marginRight: theme.spacing.xs,  // Pequeño margen para separar de las acciones
      justifyContent: 'center',       // Centrar texto verticalmente
      // backgroundColor: 'lightyellow', // Debug
    },
    itemTitleText: { // Estilo para el texto del título
      fontSize: 13,                   // Reducir ligeramente el tamaño
      fontWeight: '500',
      color: theme.colors.onSurface,
      flexWrap: 'wrap',              // Permitir que el texto se ajuste
      lineHeight: 18,                // Ajustar altura de línea
    },
    itemDescription: {
      fontSize: 11,                  // Reducir tamaño de descripción
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
      flexWrap: 'wrap',             // Permitir que el texto se ajuste
      lineHeight: 15,               // Ajustar altura de línea
    },
    itemActionsContainer: { // Contenedor para acciones (cantidad, precio, borrar)
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      flexShrink: 0,                // No permitir que se encoja
      // backgroundColor: 'lightblue', // Debug
    },
    quantityActions: {
      flexDirection: "row",
      alignItems: "center",
      // marginRight: theme.spacing.s, // Adjust spacing as needed
    }, // <<< COMA RESTAURADA
    // quantityButton: { // <<< ESTILO DUPLICADO/INCORRECTO ELIMINADO
    //    margin: 0,
    //    // backgroundColor: 'lightgreen',
    // },
    //   flexDirection: "row", // <<< CÓDIGO INCORRECTO ELIMINADO
    //   alignItems: "center",
    //   // marginRight: theme.spacing.xs,
    // },
    quantityButton: { // <<< ESTILO CORRECTO
        marginHorizontal: -4, // Reducir espacio horizontal entre botones
        padding: 0,          // Eliminar padding interno
        // backgroundColor: 'lightgreen', // Debug
    }, // <<< COMA RESTAURADA
    quantityText: {
        fontSize: 13,        // Reducir tamaño
        fontWeight: 'bold',
        minWidth: 18,        // Reducir ancho mínimo
        textAlign: 'center',
        marginHorizontal: 1, // Mínimo margen horizontal
        // backgroundColor: 'pink', // Debug
    }, // <<< COMA RESTAURADA
    itemPrice: {
      alignSelf: "center",
      marginRight: theme.spacing.xs, // Reducir espacio
      color: theme.colors.onSurfaceVariant,
      fontSize: 13,          // Reducir tamaño
      fontWeight: 'bold',
      minWidth: 50,          // Reducir ancho mínimo
      textAlign: "right",
      // backgroundColor: 'lightcoral', // Debug
    }, // <<< COMA RESTAURADA
    priceContainer: {
      flexDirection: 'column',
      alignItems: 'flex-end',
      marginRight: theme.spacing.xs,
    },
    unitPriceText: {
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
    },
    deleteButton: {
      margin: 0,
      marginLeft: theme.spacing.xs, // Reducir espacio
      padding: 0,                   // Eliminar padding
      // backgroundColor: 'gold', // Debug
    }, // <<< COMA RESTAURADA
    // End List Item Styles
    totalsContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: theme.spacing.xs,
      paddingHorizontal: theme.spacing.xs,
    }, // <<< COMA RESTAURADA
    totalsText: {
      fontSize: 16,
    }, // <<< COMA RESTAURADA
    totalsValue: {
      fontSize: 16,
      fontWeight: "bold",
    }, // <<< COMA RESTAURADA
    totalLabel: {
      fontWeight: "bold",
      fontSize: 18,
    }, // <<< COMA RESTAURADA
    totalValue: {
      fontSize: 18,
      color: theme.colors.primary,
    }, // <<< COMA RESTAURADA
    section: {
      marginBottom: theme.spacing.m,
      marginTop: theme.spacing.s,
    }, // <<< COMA RESTAURADA
    sectionCompact: {
      marginBottom: 0,
      paddingBottom: 0,
    }, // <<< COMA RESTAURADA
    dineInSelectorsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 0,
      gap: theme.spacing.s,
      marginTop: theme.spacing.s,
    }, // <<< COMA RESTAURADA
    dineInSelectorContainer: {
      flex: 1,
    }, // <<< COMA RESTAURADA
    selectorLoader: {
    }, // <<< COMA RESTAURADA
    sectionTitleContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: theme.spacing.xs,
    }, // <<< COMA RESTAURADA
    sectionTitle: {
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: theme.spacing.xs,
    }, // <<< COMA RESTAURADA
    sectionTitleOptional: {
      ...theme.fonts.bodySmall,
      color: theme.colors.onSurfaceVariant,
      marginLeft: theme.spacing.xs,
    }, // <<< COMA RESTAURADA
    radioGroupHorizontal: {
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
      width: "100%",
      paddingVertical: theme.spacing.xs,
    }, // <<< COMA RESTAURADA
    radioLabel: {
      marginLeft: 0,
      fontSize: 11,
      textTransform: "uppercase",
      textAlign: 'center',
    }, // <<< COMA RESTAURADA
    radioButtonItem: {
      paddingHorizontal: 0,
      paddingVertical: 4,
      flexShrink: 1,
      flex: 1,
      marginHorizontal: 2,
    }, // <<< COMA RESTAURADA
    dropdownAnchor: {
    }, // <<< COMA RESTAURADA
    dropdownContent: {
    }, // <<< COMA RESTAURADA
    dropdownLabel: {
    }, // <<< COMA RESTAURADA
    helperTextFix: {
      marginTop: -6,
      marginBottom: 0,
      paddingHorizontal: 12,
    }, // <<< COMA RESTAURADA
    footer: {
      padding: theme.spacing.m,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
    }, // <<< COMA RESTAURADA
    confirmButton: {
      paddingVertical: theme.spacing.xs,
    }, // <<< COMA RESTAURADA
    input: {
    }, // <<< COMA RESTAURADA
    fieldContainer: {
      marginTop: theme.spacing.s,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: theme.spacing.m,
      color: theme.colors.onSurfaceVariant,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorText: {
      color: theme.colors.error,
      marginBottom: theme.spacing.m,
    }, // <<< COMA RESTAURADA (Último estilo antes del cierre)
  });
export default OrderCartDetail;
