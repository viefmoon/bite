import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
} from 'react-native';
import {
  Swipeable,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
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
} from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import { OrderTypeEnum, type OrderType } from '../types/orders.types'; // Importar OrderTypeEnum y el tipo OrderType
import { useGetAreas } from '@/modules/areasTables/services/areaService';
import OrderHeader from './OrderHeader';
import AnimatedLabelSelector from '@/app/components/common/AnimatedLabelSelector';
import SpeechRecognitionInput from '@/app/components/common/SpeechRecognitionInput';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import ConfirmationModal from '@/app/components/common/ConfirmationModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ProductCustomizationModal from './ProductCustomizationModal';
import type { FullMenuProduct as Product } from '../types/orders.types';
import { useGetTablesByArea } from '@/modules/areasTables/services/tableService';
import type { Table } from '@/modules/areasTables/types/areasTables.types';
import { useCart, CartItem, CartItemModifier } from '../context/CartContext'; // Importar CartItem y CartItemModifier
import { useAuthStore } from '@/app/store/authStore'; // Importar authStore
import { useSnackbarStore } from '@/app/store/snackbarStore'; // Importar snackbar store
import { useGetOrderByIdQuery } from '../hooks/useOrdersQueries'; // Para cargar datos en modo edición
import { useGetFullMenu } from '../hooks/useMenuQueries'; // Para obtener productos completos
import type { FullMenuCategory } from '../types/orders.types'; // Tipo con subcategorías
import OrderHistoryModal from './OrderHistoryModal'; // Modal de historial
import PaymentModal from './PaymentModal'; // Modal de pagos
import { FAB } from 'react-native-paper'; // Para el floating action button
import { useGetPaymentsByOrderIdQuery } from '../hooks/usePaymentQueries'; // Para consultar pagos existentes
import { PaymentStatusEnum } from '../types/payment.types'; // Para verificar estados de pago

// Definir la estructura esperada para los items en el DTO de backend
interface OrderItemModifierDto {
  modifierId: string; // ID del ProductModifier (la opción específica)
  modifierOptionId?: string | null; // Campo opcional
  quantity?: number;
  price?: number | null;
}

interface OrderItemDtoForBackend {
  productId: string;
  productVariantId?: string | null;
  basePrice: number;
  finalPrice: number;
  preparationNotes?: string | null;
  modifiers?: OrderItemModifierDto[];
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
  onCancelOrder?: () => void; // Función para cancelar la orden
  navigation?: any; // Prop de navegación opcional para añadir productos
  onAddProducts?: () => void; // Callback para añadir productos
  pendingProductsToAdd?: CartItem[]; // Productos pendientes de añadir
  onItemsCountChanged?: (count: number) => void; // Callback cuando cambia el conteo de items
}

// Helper para obtener el color del estado de preparación
const getPreparationStatusColor = (status: string | undefined, theme: any) => {
  switch (status) {
    case 'NEW':
      return '#2196F3'; // Azul brillante para nuevo
    case 'PENDING':
      return theme.colors.error; // Rojo para pendiente
    case 'IN_PROGRESS':
      return '#FFA000'; // Naranja para en progreso
    case 'READY':
      return '#4CAF50'; // Verde para listo
    case 'DELIVERED':
      return theme.colors.tertiary; // Color terciario para entregado
    case 'CANCELLED':
      return theme.colors.onSurfaceDisabled; // Gris para cancelado
    default:
      return theme.colors.onSurfaceVariant;
  }
};

// Helper para obtener el texto del estado de preparación
const getPreparationStatusText = (status: string | undefined): string => {
  switch (status) {
    case 'NEW':
      return 'Nuevo';
    case 'PENDING':
      return 'Pendiente';
    case 'IN_PROGRESS':
      return 'En Preparación';
    case 'READY':
      return 'Listo';
    case 'DELIVERED':
      return 'Entregado';
    case 'CANCELLED':
      return 'Cancelado';
    default:
      return '';
  }
};

const OrderCartDetail: React.FC<OrderCartDetailProps> = ({
  visible,
  onConfirmOrder,
  onClose,
  onEditItem,
  isEditMode = false,
  orderId,
  orderNumber,
  orderDate,
  onCancelOrder,
  navigation,
  onAddProducts,
  pendingProductsToAdd = [],
  onItemsCountChanged,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Query para cargar datos de la orden en modo edición
  const {
    data: orderData,
    isLoading: isLoadingOrder,
    isError: isErrorOrder,
    isSuccess: isSuccessOrder,
  } = useGetOrderByIdQuery(orderId, {
    enabled: isEditMode && !!orderId && visible,
  });

  // Query para obtener el menú completo (para poder editar productos)
  const { data: menu } = useGetFullMenu();

  // Query para obtener los pagos de la orden (solo en modo edición)
  const { data: payments = [] } = useGetPaymentsByOrderIdQuery(orderId || '', {
    enabled: isEditMode && !!orderId && visible,
  });

  // Estados locales para modo edición (cuando no usamos el contexto del carrito)
  const [editItems, setEditItems] = useState<CartItem[]>([]);
  const [editOrderType, setEditOrderType] = useState<OrderType>(
    OrderTypeEnum.DINE_IN,
  );
  const [editSelectedAreaId, setEditSelectedAreaId] = useState<string | null>(
    null,
  );
  const [editSelectedTableId, setEditSelectedTableId] = useState<string | null>(
    null,
  );
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
  const selectedTableId = isEditMode
    ? editSelectedTableId
    : cartSelectedTableId;
  const scheduledTime = isEditMode ? editScheduledTime : cartScheduledTime;
  const customerName = isEditMode ? editCustomerName : cartCustomerName;
  const phoneNumber = isEditMode ? editPhoneNumber : cartPhoneNumber;
  const deliveryAddress = isEditMode
    ? editDeliveryAddress
    : cartDeliveryAddress;
  const orderNotes = isEditMode ? editOrderNotes : cartOrderNotes;

  const setOrderType = isEditMode ? setEditOrderType : setCartOrderType;
  const setSelectedAreaId = isEditMode
    ? setEditSelectedAreaId
    : setCartSelectedAreaId;
  const setSelectedTableId = isEditMode
    ? setEditSelectedTableId
    : setCartSelectedTableId;
  const setScheduledTime = isEditMode
    ? setEditScheduledTime
    : setCartScheduledTime;
  const setCustomerName = isEditMode
    ? setEditCustomerName
    : setCartCustomerName;
  const setPhoneNumber = isEditMode ? setEditPhoneNumber : setCartPhoneNumber;
  const setDeliveryAddress = isEditMode
    ? setEditDeliveryAddress
    : setCartDeliveryAddress;
  const setOrderNotes = isEditMode ? setEditOrderNotes : setCartOrderNotes;

  const removeItem = (itemId: string) => {
    if (isEditMode) {
      const item = editItems.find((i) => i.id === itemId);
      if (!item) return;

      // Verificar el estado del item
      if (
        item.preparationStatus === 'READY' ||
        item.preparationStatus === 'DELIVERED'
      ) {
        // No permitir eliminar items listos o entregados
        showSnackbar({
          message: `No se puede eliminar un producto ${getPreparationStatusText(item.preparationStatus).toLowerCase()}`,
          type: 'error',
        });
        return;
      }

      if (item.preparationStatus === 'IN_PROGRESS') {
        // Pedir confirmación para items en preparación
        setModifyingItemName(item.productName);
        setPendingModifyAction(() => () => {
          setEditItems((prev) => prev.filter((i) => i.id !== itemId));
        });
        setShowModifyInProgressConfirmation(true);
      } else {
        // Permitir eliminar items pendientes o cancelados sin confirmación
        setEditItems((prev) => prev.filter((i) => i.id !== itemId));
      }
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

      const item = editItems.find((i) => i.id === itemId);
      if (!item) return;

      // Verificar el estado del item
      if (
        item.preparationStatus === 'READY' ||
        item.preparationStatus === 'DELIVERED'
      ) {
        // No permitir modificar items listos o entregados
        showSnackbar({
          message: `No se puede modificar un producto ${getPreparationStatusText(item.preparationStatus).toLowerCase()}`,
          type: 'error',
        });
        return;
      }

      const updateQuantity = () => {
        setEditItems((prev) =>
          prev.map((item) => {
            if (item.id === itemId) {
              const modifiersPrice = item.modifiers.reduce(
                (sum, mod) => sum + Number(mod.price || 0),
                0,
              );
              const newTotalPrice =
                (item.unitPrice + modifiersPrice) * quantity;
              return {
                ...item,
                quantity,
                totalPrice: newTotalPrice,
              };
            }
            return item;
          }),
        );
      };

      if (item.preparationStatus === 'IN_PROGRESS') {
        // Pedir confirmación para items en preparación
        setModifyingItemName(item.productName);
        setPendingModifyAction(() => updateQuantity);
        setShowModifyInProgressConfirmation(true);
      } else {
        // Permitir modificar items pendientes o cancelados sin confirmación
        updateQuantity();
      }
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

  // Calcular conteo de items existentes (no temporales)
  const existingItemsCount = useMemo(() => {
    if (!isEditMode) return 0;
    return editItems
      .filter(item => !item.id.startsWith('new-'))
      .reduce((sum, item) => sum + item.quantity, 0);
  }, [isEditMode, editItems]);

  // Notificar cambios en el conteo de items (solo en modo edición)
  const [lastNotifiedCount, setLastNotifiedCount] = useState<number | null>(null);
  
  useEffect(() => {
    if (isEditMode && onItemsCountChanged && visible && orderDataLoaded) {
      // Solo notificar si el conteo realmente cambió
      if (existingItemsCount !== lastNotifiedCount) {
        onItemsCountChanged(existingItemsCount);
        setLastNotifiedCount(existingItemsCount);
      }
    }
  }, [isEditMode, existingItemsCount, visible, orderDataLoaded, lastNotifiedCount, onItemsCountChanged]);

  // Calcular total pagado
  const totalPaid = useMemo(() => {
    if (!isEditMode || !payments) return 0;
    return payments
      .filter((p) => p.paymentStatus === PaymentStatusEnum.COMPLETED)
      .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
  }, [payments, isEditMode]);

  const pendingAmount = useMemo(() => {
    return Math.max(0, total - totalPaid);
  }, [total, totalPaid]);

  const { user } = useAuthStore(); // Obtener usuario autenticado
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar); // Hook para snackbar

  // Estados locales solo para UI (errores, visibilidad de menús/modales)
  const [areaMenuVisible, setAreaMenuVisible] = useState(false);
  const [tableMenuVisible, setTableMenuVisible] = useState(false);
  const [areaError, setAreaError] = useState<string | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);
  const [customerNameError, setCustomerNameError] = useState<string | null>(
    null,
  );
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);
  const [isTimeAlertVisible, setTimeAlertVisible] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [editingItemFromList, setEditingItemFromList] =
    useState<CartItem | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalReady, setIsModalReady] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [
    showModifyInProgressConfirmation,
    setShowModifyInProgressConfirmation,
  ] = useState(false);
  const [pendingModifyAction, setPendingModifyAction] = useState<
    (() => void) | null
  >(null);
  const [modifyingItemName, setModifyingItemName] = useState<string>('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

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
    setEditScheduledTime(
      orderData.scheduledAt ? new Date(orderData.scheduledAt) : null,
    );
    setEditCustomerName(orderData.customerName ?? '');

    // Procesar el teléfono - si viene con +52, quitarlo para mostrarlo sin prefijo
    let phoneForDisplay = orderData.phoneNumber ?? '';
    if (phoneForDisplay.startsWith('+52')) {
      phoneForDisplay = phoneForDisplay.substring(3);
    } else if (
      phoneForDisplay.startsWith('52') &&
      phoneForDisplay.length === 12
    ) {
      phoneForDisplay = phoneForDisplay.substring(2);
    }
    setEditPhoneNumber(phoneForDisplay);

    setEditDeliveryAddress(orderData.deliveryAddress ?? '');
    setEditOrderNotes(orderData.notes ?? '');

    // Si hay una mesa, necesitamos encontrar el área
    if (orderData.tableId && orderData.table) {
      setEditSelectedAreaId(orderData.table.areaId);
    }

    // Mapear y agrupar los items de la orden
    if (orderData.orderItems && Array.isArray(orderData.orderItems)) {
      // Mapa para agrupar items idénticos
      const groupedItemsMap = new Map<string, CartItem>();

      orderData.orderItems.forEach((item: any) => {
        // Calcular el precio de los modificadores
        const modifiers = (item.modifiers || []).map((mod: any) => ({
          id: mod.modifierId, // El modifierId en la BD es el ID del ProductModifier
          groupId: mod.modifier?.groupId || '', // Obtener el groupId desde la relación
          name: mod.modifier?.name || 'Modificador',
          price: parseFloat(mod.price || '0'),
        }));

        const modifiersPrice = modifiers.reduce(
          (sum: number, mod: any) => sum + (mod.price || 0),
          0,
        );
        const unitPrice = parseFloat(item.basePrice || '0');

        // Crear una clave única para agrupar items idénticos (incluyendo estado de preparación)
        const groupKey = `${item.productId}-${item.productVariantId || 'null'}-${JSON.stringify(
          modifiers.map((m) => m.id).sort(),
        )}-${item.preparationNotes || ''}-${item.preparationStatus || 'PENDING'}`;

        const existingItem = groupedItemsMap.get(groupKey);

        if (existingItem && existingItem.preparationStatus === item.preparationStatus) {
          // Si ya existe un item idéntico con el mismo estado, incrementar la cantidad
          existingItem.quantity += 1;
          existingItem.totalPrice =
            (unitPrice + modifiersPrice) * existingItem.quantity;
        } else {
          // Si es un nuevo item, agregarlo al mapa
          const cartItem: CartItem = {
            id: item.id, // Usar el ID del primer item del grupo
            productId: item.productId,
            productName: item.product?.name || 'Producto desconocido',
            quantity: 1, // Empezar con 1, el backend ya no envía quantity
            unitPrice,
            totalPrice: unitPrice + modifiersPrice,
            modifiers,
            variantId: item.productVariantId || undefined,
            variantName: item.productVariant?.name || undefined,
            preparationNotes: item.preparationNotes || undefined,
            preparationStatus: item.preparationStatus || 'PENDING', // Incluir estado de preparación
          };
          groupedItemsMap.set(groupKey, cartItem);
        }
      });

      // Convertir el mapa a array
      const mappedItems = Array.from(groupedItemsMap.values());
      setEditItems(mappedItems);
    }
    
    // Marcar que los datos de la orden ya se cargaron
    setOrderDataLoaded(true);
  }, [isEditMode, orderData, visible]);

  // Función para agrupar items idénticos
  const groupIdenticalItems = useCallback((items: CartItem[]): CartItem[] => {
    const groupedMap = new Map<string, CartItem>();
    
    items.forEach(item => {
      // Crear una clave única basada en todas las propiedades que deben ser idénticas
      const modifierIds = item.modifiers
        .map(m => m.id)
        .sort()
        .join(',');
      
      const groupKey = `${item.productId}-${item.variantId || 'null'}-${modifierIds}-${item.preparationNotes || ''}-${item.preparationStatus || 'NEW'}`;
      
      const existingItem = groupedMap.get(groupKey);
      
      if (existingItem) {
        // Si ya existe un item idéntico, incrementar la cantidad
        existingItem.quantity += item.quantity;
        // Recalcular el precio total considerando modificadores
        const modifiersPrice = existingItem.modifiers.reduce(
          (sum, mod) => sum + (mod.price || 0),
          0,
        );
        existingItem.totalPrice = (existingItem.unitPrice + modifiersPrice) * existingItem.quantity;
      } else {
        // Si es nuevo, agregarlo al mapa con una copia completa
        groupedMap.set(groupKey, { ...item });
      }
    });
    
    return Array.from(groupedMap.values());
  }, []);

  // Estado para controlar si ya procesamos los productos pendientes
  const [processedPendingProductsIds, setProcessedPendingProductsIds] = useState<string[]>([]);
  // Estado para controlar si los datos de la orden ya se cargaron
  const [orderDataLoaded, setOrderDataLoaded] = useState(false);
  
  // Manejar productos pendientes de añadir
  useEffect(() => {
    // Solo procesar cuando:
    // 1. Hay productos pendientes
    // 2. Estamos en modo edición
    // 3. El modal es visible
    // 4. Los datos de la orden ya se cargaron
    if (pendingProductsToAdd.length > 0 && isEditMode && visible && orderDataLoaded) {
      // Filtrar productos que no han sido procesados aún
      const unprocessedProducts = pendingProductsToAdd.filter(item => {
        // Usar una clave única para cada producto basada en sus propiedades
        const productKey = `${item.productId}-${item.variantId || 'null'}-${JSON.stringify(item.modifiers.map(m => m.id).sort())}-${item.preparationNotes || ''}`;
        return !processedPendingProductsIds.includes(productKey);
      });

      if (unprocessedProducts.length > 0) {
        console.log('Procesando productos pendientes:', unprocessedProducts.length);
        
        // Marcar los nuevos productos con estado "NEW"
        const newProductsWithStatus = unprocessedProducts.map(item => ({
          ...item,
          preparationStatus: 'NEW' as const,
          id: `new-${Date.now()}-${Math.random()}`, // Asegurar IDs únicos para nuevos items
        }));
        
        // Combinar con items existentes y agrupar
        setEditItems(prevItems => {
          const allItems = [...prevItems, ...newProductsWithStatus];
          const grouped = groupIdenticalItems(allItems);
          console.log('Items después de agrupar:', grouped.length);
          return grouped;
        });
        
        // Marcar estos productos como procesados
        const newProcessedIds = unprocessedProducts.map(item => 
          `${item.productId}-${item.variantId || 'null'}-${JSON.stringify(item.modifiers.map(m => m.id).sort())}-${item.preparationNotes || ''}`
        );
        setProcessedPendingProductsIds(prev => [...prev, ...newProcessedIds]);
        
        // Calcular cuántos items únicos se añadieron
        const uniqueNewItems = newProductsWithStatus.length;
        showSnackbar({
          message: `${uniqueNewItems} producto${uniqueNewItems > 1 ? 's' : ''} añadido${uniqueNewItems > 1 ? 's' : ''}`,
          type: 'success',
        });
      }
    }
  }, [pendingProductsToAdd, isEditMode, visible, orderDataLoaded, processedPendingProductsIds, groupIdenticalItems, showSnackbar]);
  
  // Resetear los IDs procesados cuando el modal se cierre o cambie de orden
  // (esto se maneja en el useEffect de reseteo de estados)

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
      setEditingItemFromList(null);
      setEditingProduct(null);
      setIsModalReady(false);
      setOrderDataLoaded(false); // Resetear el flag de datos cargados
      setProcessedPendingProductsIds([]); // Resetear los IDs de productos procesados
      setLastNotifiedCount(null); // Resetear el conteo notificado
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

    if (orderType === OrderTypeEnum.DINE_IN) {
      // Usar Enum
      if (!selectedAreaId) {
        setAreaError('Debe seleccionar un área');
        isValid = false;
      }
      if (!selectedTableId) {
        setTableError('Debe seleccionar una mesa');
        isValid = false;
      }
    } else if (orderType === OrderTypeEnum.TAKE_AWAY) {
      // Usar Enum
      if (!customerName || customerName.trim() === '') {
        setCustomerNameError('El nombre del cliente es obligatorio');
        isValid = false;
      }
      // Phone is optional for take away
    } else if (orderType === OrderTypeEnum.DELIVERY) {
      // Usar Enum
      // Customer name not required for delivery as per new spec
      if (!deliveryAddress || deliveryAddress.trim() === '') {
        setAddressError('La dirección es obligatoria para Domicilio');
        isValid = false;
      }
      if (!phoneNumber || phoneNumber.trim() === '') {
        setPhoneError('El teléfono es obligatorio para Domicilio');
        isValid = false;
      }
    }

    if (!isValid) {
      return;
    }

    // Mapear items del carrito al formato esperado por el DTO del backend
    const itemsForBackend: OrderItemDtoForBackend[] = [];

    console.log('Items a enviar al backend:', items.length);
    console.log('Items con estado NEW:', items.filter(item => item.preparationStatus === 'NEW').length);
    
    // En ambos modos (creación y edición), expandir items según su cantidad
    // El backend identifica items únicos por productId + variantId, así que necesitamos
    // enviar items individuales para poder tener múltiples del mismo producto
    items.forEach((item: CartItem) => {
      // Crear un item individual por cada unidad de la cantidad
      for (let i = 0; i < item.quantity; i++) {
        itemsForBackend.push({
          productId: item.productId,
          productVariantId: item.variantId || null,
          basePrice: Number(item.unitPrice), // Precio unitario
          finalPrice: Number(item.totalPrice / item.quantity), // Precio final unitario
          preparationNotes: item.preparationNotes || null,
          // Mapear modificadores al formato del backend
          modifiers:
            item.modifiers && item.modifiers.length > 0
              ? item.modifiers.map((mod) => ({
                  modifierId: mod.id, // ID del ProductModifier (la opción específica)
                  modifierOptionId: null, // Campo opcional, no se usa actualmente
                  quantity: 1, // Por defecto 1
                  price: mod.price || null,
                }))
              : undefined,
        });
      }
    });

    // Formatear el número de teléfono para el backend
    let formattedPhone: string | undefined = undefined;
    if (phoneNumber && phoneNumber.trim() !== '') {
      // Mantener el formato original del teléfono, solo validar longitud
      formattedPhone = phoneNumber.trim();

      // Si no empieza con +, agregar +52 por defecto (México)
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = `+52${formattedPhone}`;
      }

      // Validar longitud mínima y máxima (contando solo dígitos)
      const digitsOnly = formattedPhone.replace(/\D/g, '');
      if (digitsOnly.length < 10) {
        setPhoneError('El teléfono debe tener al menos 10 dígitos');
        return;
      }
      if (digitsOnly.length > 15) {
        setPhoneError('El teléfono no puede tener más de 15 dígitos');
        return;
      }
    }

    const orderDetails: OrderDetailsForBackend = {
      userId: user?.id || '', // Asegurarse de tener un userId
      orderType,
      subtotal,
      total,
      items: itemsForBackend,
      tableId:
        orderType === OrderTypeEnum.DINE_IN
          ? (selectedTableId ?? undefined)
          : undefined, // Usar Enum
      scheduledAt: scheduledTime ?? undefined,
      customerName:
        orderType === OrderTypeEnum.TAKE_AWAY ||
        orderType === OrderTypeEnum.DELIVERY
          ? customerName
          : undefined, // Include for both TAKE_AWAY and DELIVERY
      phoneNumber:
        (orderType === OrderTypeEnum.TAKE_AWAY ||
          orderType === OrderTypeEnum.DELIVERY) &&
        formattedPhone
          ? formattedPhone
          : undefined, // Usar teléfono formateado
      deliveryAddress:
        orderType === OrderTypeEnum.DELIVERY ? deliveryAddress : undefined, // Usar Enum
      notes: orderNotes || undefined,
    };

    console.log('Payload final a enviar:', JSON.stringify(orderDetails, null, 2));

    if (!orderDetails.userId) {
      console.error('Error: Falta el ID del usuario al confirmar la orden.');
      return; // Detener el proceso si falta el userId
    }

    setIsConfirming(true); // Marcar como procesando

    try {
      await onConfirmOrder(orderDetails);
      // Si llegamos aquí, la orden fue exitosa
      setIsConfirming(false);
      // Cerrar el modal después de una actualización exitosa
      if (isEditMode) {
        onClose?.();
      }
    } catch (error) {
      // Solo re-habilitar si hubo un error
      setIsConfirming(false);
      console.error('Error en handleConfirm:', error);
    }
  };

  const selectedAreaName = useMemo(
    () => areasData?.find((a: any) => a.id === selectedAreaId)?.name,
    [areasData, selectedAreaId],
  );
  const selectedTableName = useMemo(
    () => tablesData?.find((t) => t.id === selectedTableId)?.name,
    [tablesData, selectedTableId],
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
      return format(scheduledTime, 'p', { locale: es });
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Hora inválida';
    }
  }, [scheduledTime]);

  // Función para detectar si hay cambios en modo edición
  const hasUnsavedChanges = useCallback(() => {
    if (!isEditMode || !orderData) return false;

    // Comparar tipo de orden
    if (editOrderType !== orderData.orderType) return true;

    // Comparar mesa (solo para DINE_IN)
    if (
      editOrderType === OrderTypeEnum.DINE_IN &&
      editSelectedTableId !== orderData.tableId
    )
      return true;

    // Comparar hora programada
    const originalScheduledTime = orderData.scheduledAt
      ? new Date(orderData.scheduledAt).getTime()
      : null;
    const currentScheduledTime = editScheduledTime
      ? editScheduledTime.getTime()
      : null;
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

    // Si algún item tiene un ID temporal (new-*), hay cambios
    if (editItems.some((item) => item.id.startsWith('new-'))) return true;

    // Calcular la cantidad total de items originales
    const originalTotalQuantity = originalItems.length; // Backend envía items individuales
    const editTotalQuantity = editItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    // Si la cantidad total de items cambió, hay cambios
    if (originalTotalQuantity !== editTotalQuantity) return true;

    // Crear un mapa de items agrupados desde los items originales para comparación
    const originalGroupedMap = new Map<string, number>();

    originalItems.forEach((item: any) => {
      // Crear una clave única para agrupar items idénticos
      const modifierIds = (item.modifiers || [])
        .map((m: any) => m.modifierId)
        .sort()
        .join(',');
      const groupKey = `${item.productId}-${item.productVariantId || 'null'}-${modifierIds}-${item.preparationNotes || ''}`;

      const currentQuantity = originalGroupedMap.get(groupKey) || 0;
      originalGroupedMap.set(groupKey, currentQuantity + 1);
    });

    // Crear un mapa similar para los items editados
    const editGroupedMap = new Map<string, number>();

    editItems.forEach((item) => {
      if (!item.id.startsWith('new-')) {
        const modifierIds = item.modifiers
          .map((m) => m.id)
          .sort()
          .join(',');
        const groupKey = `${item.productId}-${item.variantId || 'null'}-${modifierIds}-${item.preparationNotes || ''}`;

        editGroupedMap.set(groupKey, item.quantity);
      }
    });

    // Comparar los mapas
    if (originalGroupedMap.size !== editGroupedMap.size) return true;

    for (const [key, originalQuantity] of originalGroupedMap) {
      const editQuantity = editGroupedMap.get(key);
      if (editQuantity === undefined || editQuantity !== originalQuantity) {
        return true;
      }
    }

    return false;
  }, [
    isEditMode,
    orderData,
    editOrderType,
    editSelectedTableId,
    editScheduledTime,
    editCustomerName,
    editPhoneNumber,
    editDeliveryAddress,
    editOrderNotes,
    editItems,
  ]);

  // Función para manejar la edición de un item del carrito
  const handleEditCartItem = useCallback(
    (item: CartItem) => {
      if (!isEditMode) {
        // En modo creación, usar la función pasada por props
        if (onEditItem) {
          onEditItem(item);
        }
      } else {
        // Verificar el estado del item antes de permitir edición
        if (
          item.preparationStatus === 'READY' ||
          item.preparationStatus === 'DELIVERED'
        ) {
          // No permitir editar items listos o entregados
          showSnackbar({
            message: `No se puede editar un producto ${getPreparationStatusText(item.preparationStatus).toLowerCase()}`,
            type: 'error',
          });
          return;
        }

        const proceedWithEdit = () => {
          // En modo edición, buscar el producto real del menú
          if (!menu || !Array.isArray(menu)) {
            console.warn('El menú no está disponible');
            return;
          }

          // Buscar el producto en la estructura anidada del menú
          let product: Product | undefined;

          for (const category of menu as FullMenuCategory[]) {
            if (
              category.subcategories &&
              Array.isArray(category.subcategories)
            ) {
              for (const subcategory of category.subcategories) {
                if (
                  subcategory.products &&
                  Array.isArray(subcategory.products)
                ) {
                  product = subcategory.products.find(
                    (p: Product) => p.id === item.productId,
                  );
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
            console.warn(
              'Producto no encontrado en el menú, usando datos temporales',
            );
            setEditingItemFromList(item);

            const tempProduct: Product = {
              id: item.productId,
              name: item.productName,
              price: item.unitPrice,
              hasVariants: !!item.variantId,
              variants: item.variantId
                ? [
                    {
                      id: item.variantId,
                      name: item.variantName || '',
                      price: item.unitPrice,
                    },
                  ]
                : [],
              modifierGroups: [], // Sin grupos de modificadores
              photo: null,
              subcategoryId: '',
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            setEditingProduct(tempProduct);
          }
        };

        if (item.preparationStatus === 'IN_PROGRESS') {
          // Pedir confirmación para items en preparación
          setModifyingItemName(item.productName);
          setPendingModifyAction(() => proceedWithEdit);
          setShowModifyInProgressConfirmation(true);
        } else {
          // Permitir editar items pendientes o cancelados sin confirmación
          proceedWithEdit();
        }
      }
    },
    [isEditMode, onEditItem, menu, showSnackbar],
  );

  // Función para actualizar un item editado
  const handleUpdateEditedItem = useCallback(
    (
      itemId: string,
      quantity: number,
      modifiers: CartItemModifier[],
      preparationNotes?: string,
      variantId?: string,
      variantName?: string,
      unitPrice?: number,
    ) => {
      if (!isEditMode) return;

      setEditItems((prev) =>
        prev.map((item) => {
          if (item.id === itemId) {
            const modifiersPrice = modifiers.reduce(
              (sum, mod) => sum + Number(mod.price || 0),
              0,
            );
            const finalUnitPrice =
              unitPrice !== undefined ? unitPrice : item.unitPrice;
            const newTotalPrice = (finalUnitPrice + modifiersPrice) * quantity;

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
            };
          }
          return item;
        }),
      );

      // Cerrar el modal de edición
      setEditingItemFromList(null);
      setEditingProduct(null);
    },
    [isEditMode],
  );

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
                  <HelperText
                    type="error"
                    visible={true}
                    style={styles.helperTextFix}
                  >
                    {areaError}
                  </HelperText>
                )}
                {errorAreas && (
                  <HelperText
                    type="error"
                    visible={true}
                    style={styles.helperTextFix}
                  >
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
                      disabled={
                        !selectedAreaId || isLoadingTables || isLoadingAreas
                      }
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
                  {selectedAreaId &&
                    tablesData?.length === 0 &&
                    !isLoadingTables &&
                    !errorTables && <Menu.Item title="No hay mesas" disabled />}
                  {errorTables && (
                    <Menu.Item title="Error al cargar mesas" disabled />
                  )}
                </Menu>
                {tableError && !errorTables && (
                  <HelperText
                    type="error"
                    visible={true}
                    style={styles.helperTextFix}
                  >
                    {tableError}
                  </HelperText>
                )}
                {errorTables && (
                  <HelperText
                    type="error"
                    visible={true}
                    style={styles.helperTextFix}
                  >
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
                <HelperText
                  type="error"
                  visible={true}
                  style={styles.helperTextFix}
                >
                  {customerNameError}
                </HelperText>
              )}
            </View>

            {/* 2. Teléfono */}
            <View style={[styles.sectionCompact, styles.fieldContainer]}>
              <View style={styles.phoneInputWrapper}>
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
                {phoneNumber.length > 0 && !phoneError && (
                  <Text style={styles.digitCounterAbsolute}>
                    {phoneNumber.replace(/\D/g, '').length} dígitos
                  </Text>
                )}
              </View>
              {phoneError && (
                <HelperText
                  type="error"
                  visible={true}
                  style={styles.helperTextFix}
                >
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
                isInModal={true}
              />
              {addressError && (
                <HelperText
                  type="error"
                  visible={true}
                  style={styles.helperTextFix}
                >
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
                onChangeText={(text) => {
                  // Asegurar que la función esté bien definida aquí
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
              <View style={styles.phoneHelperContainer}>
                {phoneError ? (
                  <HelperText
                    type="error"
                    visible={true}
                    style={[styles.helperTextFix, styles.phoneError]}
                  >
                    {phoneError}
                  </HelperText>
                ) : (
                  phoneNumber.length > 0 && (
                    <Text style={styles.digitCounter}>
                      {phoneNumber.replace(/\D/g, '').length} dígitos
                    </Text>
                  )
                )}
              </View>
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
        dismissable={true}
        dismissableBackButton={false}
      >
        <GestureHandlerRootView style={styles.container}>
          <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}
          >
            <View>
              {isEditMode ? (
                <View style={styles.customHeader}>
                  <IconButton
                    icon="arrow-left"
                    size={24}
                    onPress={() => {
                      if (hasUnsavedChanges()) {
                        setShowExitConfirmation(true);
                      } else {
                        onClose?.();
                      }
                    }}
                    iconColor={theme.colors.onSurface}
                  />

                  <Text style={styles.headerTitle}>
                    {orderNumber && orderDate
                      ? `Editar Orden #${orderNumber} - ${format(orderDate, 'dd/MM/yyyy', { locale: es })}`
                      : orderNumber
                        ? `Editando Orden #${orderNumber}`
                        : 'Editar Orden'}
                  </Text>

                  <Menu
                    visible={showOptionsMenu}
                    onDismiss={() => setShowOptionsMenu(false)}
                    anchor={
                      <IconButton
                        icon="dots-vertical"
                        size={24}
                        onPress={() => setShowOptionsMenu(true)}
                        iconColor={theme.colors.onSurface}
                      />
                    }
                  >
                    <Menu.Item
                      onPress={() => {
                        setShowOptionsMenu(false);
                        setShowHistoryModal(true);
                      }}
                      title="Ver Historial"
                      leadingIcon="history"
                    />
                    <Menu.Item
                      onPress={() => {
                        setShowOptionsMenu(false);
                        setShowCancelConfirmation(true);
                      }}
                      title="Cancelar Orden"
                      leadingIcon="cancel"
                    />
                  </Menu>
                </View>
              ) : (
                <OrderHeader
                  title={
                    orderNumber ? `Orden #${orderNumber}` : 'Resumen de Orden'
                  }
                  onBackPress={() => onClose?.()}
                  itemCount={totalItemsCount}
                  onCartPress={() => {}}
                  isCartVisible={isCartVisible}
                />
              )}
            </View>
          </TouchableWithoutFeedback>

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
                // Crear función de renderizado de acción de eliminar
                const renderRightActions = (progress, dragX) => {
                  const translateX = dragX.interpolate({
                    inputRange: [-100, 0],
                    outputRange: [0, 100],
                    extrapolate: 'clamp',
                  });

                  const scale = dragX.interpolate({
                    inputRange: [-100, -50, 0],
                    outputRange: [1, 0.8, 0.5],
                    extrapolate: 'clamp',
                  });

                  const opacity = dragX.interpolate({
                    inputRange: [-100, -20, 0],
                    outputRange: [1, 0.5, 0],
                    extrapolate: 'clamp',
                  });

                  return (
                    <Animated.View
                      style={[
                        styles.deleteActionContainer,
                        {
                          opacity,
                          transform: [{ translateX }],
                        },
                      ]}
                    >
                      <Animated.View
                        style={[
                          styles.deleteAction,
                          {
                            backgroundColor: theme.colors.error,
                            transform: [{ scale }],
                          },
                        ]}
                      >
                        <View style={styles.deleteIconContainer}>
                          <IconButton
                            icon="delete-sweep"
                            size={28}
                            iconColor="white"
                            style={styles.deleteIcon}
                          />
                        </View>
                        <Text style={styles.deleteActionText}>ELIMINAR</Text>
                      </Animated.View>
                    </Animated.View>
                  );
                };

                return (
                  <Swipeable
                    key={item.id}
                    renderRightActions={renderRightActions}
                    overshootRight={false}
                    friction={2}
                    rightThreshold={90}
                    leftThreshold={100}
                    onSwipeableOpen={(direction) => {
                      if (direction === 'right') {
                        // Pequeño delay para que se vea la animación completa
                        setTimeout(() => {
                          removeItem(item.id);
                        }, 150);
                      }
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => handleEditCartItem(item)}
                      disabled={!onEditItem && !isEditMode}
                      activeOpacity={0.7}
                    >
                      <List.Item
                        // Mover title y description a un View contenedor para controlar el ancho
                        title={() => (
                          <View style={styles.itemTextContainer}>
                            <View>
                              <Text style={styles.itemTitleText}>
                                {`${item.quantity}x ${String(item.productName ?? '')}${item.variantName ? ` (${String(item.variantName ?? '')})` : ''}`}
                              </Text>
                              {/* Mostrar estado de preparación solo en modo edición - siempre en nueva línea */}
                              {isEditMode && item.preparationStatus && (
                                <View style={styles.statusContainer}>
                                  <View
                                    style={[
                                      styles.statusBadge,
                                      {
                                        backgroundColor:
                                          getPreparationStatusColor(
                                            item.preparationStatus,
                                            theme,
                                          ) + '20',
                                      },
                                    ]}
                                  >
                                    <View
                                      style={[
                                        styles.statusDot,
                                        {
                                          backgroundColor:
                                            getPreparationStatusColor(
                                              item.preparationStatus,
                                              theme,
                                            ),
                                        },
                                      ]}
                                    />
                                    <Text
                                      style={[
                                        styles.statusText,
                                        {
                                          color: getPreparationStatusColor(
                                            item.preparationStatus,
                                            theme,
                                          ),
                                        },
                                      ]}
                                    >
                                      {getPreparationStatusText(
                                        item.preparationStatus,
                                      )}
                                    </Text>
                                  </View>
                                </View>
                              )}
                            </View>
                            {(() => {
                              // Render description condicionalmente
                              const hasModifiers =
                                item.modifiers && item.modifiers.length > 0;
                              const hasNotes =
                                item.preparationNotes &&
                                item.preparationNotes.trim() !== '';

                              if (hasModifiers && hasNotes) {
                                return (
                                  <View>
                                    {item.modifiers.map((mod, index) => (
                                      <Text
                                        key={mod.id || index}
                                        style={styles.itemDescription}
                                      >
                                        • {mod.name}{' '}
                                        {mod.price && mod.price > 0
                                          ? `(+$${mod.price.toFixed(2)})`
                                          : ''}
                                      </Text>
                                    ))}
                                    <Text
                                      style={[
                                        styles.itemDescription,
                                        styles.notesText,
                                      ]}
                                    >
                                      Notas: {item.preparationNotes}
                                    </Text>
                                  </View>
                                );
                              } else if (hasModifiers) {
                                return (
                                  <View>
                                    {item.modifiers.map((mod, index) => (
                                      <Text
                                        key={mod.id || index}
                                        style={styles.itemDescription}
                                      >
                                        • {mod.name}{' '}
                                        {mod.price && mod.price > 0
                                          ? `(+$${mod.price.toFixed(2)})`
                                          : ''}
                                      </Text>
                                    ))}
                                  </View>
                                );
                              } else if (hasNotes) {
                                return (
                                  <Text
                                    style={[
                                      styles.itemDescription,
                                      styles.notesText,
                                    ]}
                                  >
                                    Notas: {item.preparationNotes}
                                  </Text>
                                );
                              } else {
                                return null;
                              }
                            })()}
                          </View>
                        )}
                        // titleNumberOfLines y description ya no se usan directamente aquí
                        right={() => (
                          // Usar paréntesis para retorno implícito si es una sola expresión
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
                              <Text style={styles.quantityText}>
                                {item.quantity}
                              </Text>
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
                                ${Number(item.totalPrice || 0).toFixed(2)}
                              </Text>
                              {item.quantity > 1 && (
                                <Text style={styles.unitPriceText}>
                                  ($
                                  {(
                                    Number(item.unitPrice || 0) +
                                    item.modifiers.reduce(
                                      (sum, mod) =>
                                        sum + Number(mod.price || 0),
                                      0,
                                    )
                                  ).toFixed(2)}{' '}
                                  c/u)
                                </Text>
                              )}
                            </View>
                          </View>
                        )}
                        style={styles.listItem}
                      />
                    </TouchableOpacity>
                  </Swipeable>
                );
              })}
            </List.Section>

            {/* Botón para añadir productos en modo edición */}
            {isEditMode && (
              <Button
                onPress={() => {
                  if (onAddProducts) {
                    // Si tenemos un callback personalizado, usarlo
                    onAddProducts();
                  } else if (navigation && orderId && orderNumber) {
                    // Si no, usar navegación directa
                    try {
                      navigation.navigate('AddProductsToOrder', {
                        orderId,
                        orderNumber,
                        // Pasar el conteo de items existentes (no incluir los temporales "NEW")
                        existingOrderItemsCount: editItems.filter(item => !item.id.startsWith('new-')).reduce((sum, item) => sum + item.quantity, 0),
                        onProductsAdded: (newProducts: CartItem[]) => {
                          // Marcar los nuevos productos con estado "NEW"
                          const newProductsWithStatus = newProducts.map(item => ({
                            ...item,
                            preparationStatus: 'NEW' as const,
                            id: `new-${Date.now()}-${Math.random()}`,
                          }));
                          
                          // Combinar con items existentes y agrupar
                          const allItems = [...editItems, ...newProductsWithStatus];
                          const groupedItems = groupIdenticalItems(allItems);
                          
                          setEditItems(groupedItems);
                          showSnackbar({
                            message: `${newProducts.length} producto${newProducts.length > 1 ? 's' : ''} añadido${newProducts.length > 1 ? 's' : ''}`,
                            type: 'success',
                          });
                        },
                      });
                    } catch (error) {
                      console.error('Error al navegar:', error);
                    }
                  }
                }}
                mode="outlined"
                style={{
                  marginTop: theme.spacing.m,
                  marginBottom: theme.spacing.m,
                }}
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

            {/* Mostrar información de pagos solo en modo edición */}
            {isEditMode && totalPaid > 0 && (
              <>
                <View style={styles.totalsContainer}>
                  <Text style={styles.totalsText}>Pagado:</Text>
                  <Text style={[styles.totalsValue, { color: '#4CAF50' }]}>
                    ${totalPaid.toFixed(2)}
                  </Text>
                </View>
                {pendingAmount > 0 && (
                  <View style={styles.totalsContainer}>
                    <Text style={[styles.totalsText, { fontWeight: 'bold' }]}>
                      Pendiente:
                    </Text>
                    <Text
                      style={[
                        styles.totalsValue,
                        {
                          fontWeight: 'bold',
                          color: theme.colors.error,
                        },
                      ]}
                    >
                      ${pendingAmount.toFixed(2)}
                    </Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          {/* Footer Button */}
          <View style={styles.footer}>
            <Button
              mode="contained"
              onPress={handleConfirm}
              disabled={
                isConfirming || // Deshabilitar mientras se procesa
                items.length === 0 ||
                (orderType === OrderTypeEnum.DINE_IN &&
                  (!selectedAreaId || !selectedTableId)) || // Usar Enum
                (orderType === OrderTypeEnum.TAKE_AWAY &&
                  (!customerName || customerName.trim() === '')) || // Usar Enum
                (orderType === OrderTypeEnum.DELIVERY &&
                  (!deliveryAddress || deliveryAddress.trim() === '')) || // Usar Enum
                (orderType === OrderTypeEnum.DELIVERY &&
                  (!phoneNumber || phoneNumber.trim() === '')) // Usar Enum
              }
              style={styles.confirmButton}
              loading={isConfirming} // Mostrar indicador de carga
            >
              {isConfirming
                ? isEditMode
                  ? 'Guardando...'
                  : 'Enviando...'
                : isEditMode
                  ? 'Guardar Cambios'
                  : 'Enviar Orden'}
            </Button>
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

          {/* Modal de confirmación para cancelar la orden */}
          <ConfirmationModal
            visible={showCancelConfirmation}
            title="¿Cancelar orden?"
            message={`¿Estás seguro de que quieres cancelar la orden #${orderNumber}? Esta acción no se puede deshacer.`}
            confirmText="Cancelar Orden"
            cancelText="No, mantener"
            onConfirm={() => {
              setShowCancelConfirmation(false);
              if (onCancelOrder) {
                onCancelOrder();
              }
            }}
            onCancel={() => setShowCancelConfirmation(false)}
          />

          {/* Modal de confirmación para modificar items en preparación */}
          <ConfirmationModal
            visible={showModifyInProgressConfirmation}
            title="¿Modificar producto en preparación?"
            message={`El producto "${modifyingItemName}" está actualmente en preparación. ¿Estás seguro de que quieres modificarlo?`}
            confirmText="Sí, modificar"
            cancelText="No, cancelar"
            onConfirm={() => {
              setShowModifyInProgressConfirmation(false);
              if (pendingModifyAction) {
                pendingModifyAction();
                setPendingModifyAction(null);
              }
              setModifyingItemName('');
            }}
            onCancel={() => {
              setShowModifyInProgressConfirmation(false);
              setPendingModifyAction(null);
              setModifyingItemName('');
            }}
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

          {/* Modal de historial de cambios */}
          {isEditMode && (
            <OrderHistoryModal
              visible={showHistoryModal}
              onDismiss={() => setShowHistoryModal(false)}
              orderId={orderId}
              orderNumber={orderNumber}
            />
          )}

          {/* FAB para pagos - solo en modo edición */}
          {isEditMode && orderId && visible && (
            <FAB
              icon="cash-multiple"
              style={[
                styles.paymentFab,
                {
                  backgroundColor:
                    pendingAmount <= 0 ? '#4CAF50' : theme.colors.primary,
                },
              ]}
              color="white"
              onPress={() => setShowPaymentModal(true)}
              visible={true}
            />
          )}

          {/* Modal de pagos */}
          {showPaymentModal && isEditMode && orderId && (
            <PaymentModal
              visible={showPaymentModal}
              onDismiss={() => setShowPaymentModal(false)}
              orderId={orderId}
              orderTotal={total}
              orderNumber={orderNumber}
            />
          )}
        </GestureHandlerRootView>
      </Modal>
    </Portal>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    modalContent: {
      backgroundColor: theme.colors.background,
      width: '100%',
      height: '100%',
      margin: 0,
      padding: 0,
      position: 'absolute',
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
      flexDirection: 'row', // 1) Fila
      alignItems: 'center',
      justifyContent: 'space-between', // 2) Separar título y acciones
      paddingVertical: theme.spacing.s,
      paddingHorizontal: theme.spacing.s, // controla el “gap” desde el borde
      backgroundColor: theme.colors.surface,
      minHeight: 80, // Altura mínima para mejor experiencia de swipe
    },

    itemTextContainer: {
      // Contenedor para título y descripción
      flex: 3, // Darle aún más espacio al texto ahora que no hay botón de eliminar
      marginRight: theme.spacing.xs, // Pequeño margen para separar de las acciones
      justifyContent: 'center', // Centrar texto verticalmente
      // backgroundColor: 'lightyellow', // Debug
    },
    itemTitleText: {
      // Estilo para el texto del título
      fontSize: 15, // Aumentar tamaño del título
      fontWeight: '500',
      color: theme.colors.onSurface,
      flexWrap: 'wrap', // Permitir que el texto se ajuste
      lineHeight: 20, // Ajustar altura de línea
    },
    itemDescription: {
      fontSize: 13, // Aumentar tamaño de descripción
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
      flexWrap: 'wrap', // Permitir que el texto se ajuste
      lineHeight: 18, // Ajustar altura de línea
    },
    itemActionsContainer: {
      // Contenedor para acciones (cantidad, precio, borrar)
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      flexShrink: 0, // No permitir que se encoja
      // backgroundColor: 'lightblue', // Debug
    },
    quantityActions: {
      flexDirection: 'row',
      alignItems: 'center',
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
    quantityButton: {
      // <<< ESTILO CORRECTO
      marginHorizontal: -4, // Reducir espacio horizontal entre botones
      padding: 0, // Eliminar padding interno
      // backgroundColor: 'lightgreen', // Debug
    }, // <<< COMA RESTAURADA
    quantityText: {
      fontSize: 14, // Aumentar tamaño
      fontWeight: 'bold',
      minWidth: 20, // Ajustar ancho mínimo
      textAlign: 'center',
      marginHorizontal: 2, // Ajustar margen horizontal
      // backgroundColor: 'pink', // Debug
    }, // <<< COMA RESTAURADA
    itemPrice: {
      alignSelf: 'center',
      marginRight: theme.spacing.xs, // Reducir espacio
      color: theme.colors.onSurfaceVariant,
      fontSize: 15, // Aumentar tamaño
      fontWeight: 'bold',
      minWidth: 55, // Ajustar ancho mínimo
      textAlign: 'right',
      // backgroundColor: 'lightcoral', // Debug
    }, // <<< COMA RESTAURADA
    priceContainer: {
      flexDirection: 'column',
      alignItems: 'flex-end',
      marginRight: theme.spacing.xs,
    },
    unitPriceText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
    },
    deleteActionContainer: {
      width: 120,
      height: '100%',
      justifyContent: 'center',
      alignItems: 'flex-end',
      paddingRight: theme.spacing.m,
    },
    deleteAction: {
      backgroundColor: theme.colors.error,
      justifyContent: 'center',
      alignItems: 'center',
      width: 90,
      height: '90%',
      borderRadius: theme.roundness * 2,
      flexDirection: 'column',
      shadowColor: theme.colors.error,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    deleteIconContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
    },
    deleteIcon: {
      margin: 0,
      padding: 0,
    },
    deleteActionText: {
      color: 'white',
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
    }, // <<< COMA RESTAURADA
    // End List Item Styles
    totalsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.xs,
      paddingHorizontal: theme.spacing.xs,
    }, // <<< COMA RESTAURADA
    totalsText: {
      fontSize: 16,
    }, // <<< COMA RESTAURADA
    totalsValue: {
      fontSize: 16,
      fontWeight: 'bold',
    }, // <<< COMA RESTAURADA
    totalLabel: {
      fontWeight: 'bold',
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
    selectorLoader: {}, // <<< COMA RESTAURADA
    sectionTitleContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: theme.spacing.xs,
    }, // <<< COMA RESTAURADA
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: theme.spacing.xs,
    }, // <<< COMA RESTAURADA
    sectionTitleOptional: {
      ...theme.fonts.bodySmall,
      color: theme.colors.onSurfaceVariant,
      marginLeft: theme.spacing.xs,
    }, // <<< COMA RESTAURADA
    radioGroupHorizontal: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      width: '100%',
      paddingVertical: theme.spacing.xs,
    }, // <<< COMA RESTAURADA
    radioLabel: {
      marginLeft: 0,
      fontSize: 11,
      textTransform: 'uppercase',
      textAlign: 'center',
    }, // <<< COMA RESTAURADA
    radioButtonItem: {
      paddingHorizontal: 0,
      paddingVertical: 4,
      flexShrink: 1,
      flex: 1,
      marginHorizontal: 2,
    }, // <<< COMA RESTAURADA
    dropdownAnchor: {}, // <<< COMA RESTAURADA
    dropdownContent: {}, // <<< COMA RESTAURADA
    dropdownLabel: {}, // <<< COMA RESTAURADA
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
    input: {}, // <<< COMA RESTAURADA
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
    },
    phoneHelperContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginTop: 2,
      paddingHorizontal: 12,
      minHeight: 20,
    },
    phoneError: {
      flex: 1,
      marginBottom: 0,
      marginTop: 0,
    },
    digitCounter: {
      fontSize: 10,
      color: theme.colors.onSurfaceVariant,
      opacity: 0.6,
      marginLeft: theme.spacing.xs,
      marginTop: 2,
    },
    phoneInputWrapper: {
      position: 'relative',
    },
    digitCounterAbsolute: {
      position: 'absolute',
      right: 50, // Mover más a la izquierda para evitar el botón de micrófono
      top: 10, // Ajustar para estar en la parte superior del input
      fontSize: 10,
      color: theme.colors.onSurfaceVariant,
      opacity: 0.7,
      backgroundColor: theme.colors.background,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
      zIndex: 1,
    },
    notesText: {
      fontStyle: 'italic',
      marginTop: 4,
      paddingTop: 4,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
    },
    customHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 4,
      paddingVertical: 8,
      backgroundColor: theme.colors.elevation.level2,
    },
    headerTitle: {
      ...theme.fonts.titleMedium,
      color: theme.colors.onSurface,
      fontWeight: 'bold',
      textAlign: 'center',
      flex: 1,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2, // Pequeño margen para separar del nombre
      justifyContent: 'flex-start', // Alinear a la izquierda
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.s,
      paddingVertical: 2, // Reducido de 4 a 2 para ser más compacto
      borderRadius: 12,
      gap: 4,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    paymentFab: {
      position: 'absolute',
      margin: 16,
      right: 0,
      bottom: 140, // Más arriba para mejor visibilidad
      zIndex: 1000,
      elevation: 6,
      width: 56, // Tamaño estándar para FAB pequeño
      height: 56,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
export default OrderCartDetail;
