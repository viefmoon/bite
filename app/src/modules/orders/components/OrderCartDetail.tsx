import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Portal } from 'react-native-paper';
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
  Checkbox,
  TextInput,
} from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import { OrderTypeEnum, type OrderType } from '../types/orders.types'; // Importar OrderTypeEnum y el tipo OrderType
import { useGetAreas } from '@/modules/areasTables/services/areaService';
import type { DeliveryInfo } from '../../../app/schemas/domain/delivery-info.schema';
import OrderHeader from './OrderHeader';
import AnimatedLabelSelector from '@/app/components/common/AnimatedLabelSelector';
import SpeechRecognitionInput from '@/app/components/common/SpeechRecognitionInput';
import DateTimePickerSafe from '@/app/components/DateTimePickerSafe';
import {
  safeTimeStringToDate,
  safeDateToTimeString,
  getNextAvailableTime,
  parseDateFromBackend,
} from '@/app/utils/dateTimeHelpers';
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
import { OrderDetailModal } from './OrderDetailModal'; // Modal de detalles
import PaymentModal from './PaymentModal'; // Modal de pagos
import { FAB } from 'react-native-paper'; // Para el floating action button
import { AdjustmentFormModal } from './AdjustmentFormModal'; // Modal de ajustes
import type { OrderAdjustment } from '../types/adjustments.types'; // Tipo para ajustes
import { useGetPaymentsByOrderIdQuery } from '../hooks/usePaymentQueries'; // Para consultar pagos existentes
import { PaymentStatusEnum } from '../types/payment.types'; // Para verificar estados de pago
import type { SelectedPizzaCustomization } from '@/app/schemas/domain/order.schema'; // Para personalizaciones de pizza
import { prepaymentService } from '@/modules/payments/services/prepaymentService'; // Servicio de prepagos
import {
  CustomizationType,
  PizzaHalf,
  CustomizationAction,
} from '@/modules/pizzaCustomizations/types/pizzaCustomization.types';

// Definir la estructura esperada para los items en el DTO de backend
interface OrderItemModifierDto {
  modifierId: string;
  quantity?: number;
  price?: number | null;
}

interface OrderItemDtoForBackend {
  id?: string; // ID opcional para actualizaciones
  productId: string;
  productVariantId?: string | null;
  basePrice: number;
  finalPrice: number;
  preparationNotes?: string | null;
  modifiers?: OrderItemModifierDto[];
  selectedPizzaCustomizations?: SelectedPizzaCustomization[];
}

// Definir la estructura completa del payload para onConfirmOrder (y exportarla)
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
    description?: string;
    isPercentage: boolean;
    value?: number;
    amount?: number;
  }[];
  customerId?: string;
  isFromWhatsApp?: boolean;
  prepaymentId?: string;
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
  const [editDeliveryInfo, setEditDeliveryInfo] = useState<DeliveryInfo>({});
  const [editOrderNotes, setEditOrderNotes] = useState<string>('');
  const [editAdjustments, setEditAdjustments] = useState<OrderAdjustment[]>([]);
  const [editIsTemporaryTable, setEditIsTemporaryTable] =
    useState<boolean>(false);
  const [editTemporaryTableName, setEditTemporaryTableName] =
    useState<string>('');

  // Siempre llamar al hook, pero usar sus valores solo si no estamos en modo edición
  const cartContext = useCart();

  const cartItems = !isEditMode ? cartContext?.items || [] : [];
  const removeCartItem = !isEditMode
    ? cartContext?.removeItem || (() => {})
    : () => {};
  const updateCartItemQuantity = !isEditMode
    ? cartContext?.updateItemQuantity || (() => {})
    : () => {};
  const isCartVisible = !isEditMode
    ? cartContext?.isCartVisible || false
    : false;
  const cartOrderType = !isEditMode
    ? cartContext?.orderType || OrderTypeEnum.DINE_IN
    : OrderTypeEnum.DINE_IN;
  const setCartOrderType = !isEditMode
    ? cartContext?.setOrderType || (() => {})
    : () => {};
  const cartSelectedAreaId = !isEditMode
    ? cartContext?.selectedAreaId || null
    : null;
  const setCartSelectedAreaId = !isEditMode
    ? cartContext?.setSelectedAreaId || (() => {})
    : () => {};
  const cartSelectedTableId = !isEditMode
    ? cartContext?.selectedTableId || null
    : null;
  const setCartSelectedTableId = !isEditMode
    ? cartContext?.setSelectedTableId || (() => {})
    : () => {};
  const cartIsTemporaryTable = !isEditMode
    ? cartContext?.isTemporaryTable || false
    : false;
  const setCartIsTemporaryTable = !isEditMode
    ? cartContext?.setIsTemporaryTable || (() => {})
    : () => {};
  const cartTemporaryTableName = !isEditMode
    ? cartContext?.temporaryTableName || ''
    : '';
  const setCartTemporaryTableName = !isEditMode
    ? cartContext?.setTemporaryTableName || (() => {})
    : () => {};
  const cartScheduledTime = !isEditMode
    ? cartContext?.scheduledTime || null
    : null;
  const setCartScheduledTime = !isEditMode
    ? cartContext?.setScheduledTime || (() => {})
    : () => {};
  const cartDeliveryInfo = !isEditMode ? cartContext?.deliveryInfo || {} : {};
  const setCartDeliveryInfo = cartContext?.setDeliveryInfo || (() => {});
  const cartOrderNotes = cartContext?.orderNotes || '';
  const setCartOrderNotes = cartContext?.setOrderNotes || (() => {});

  // Usar valores del contexto o locales según el modo
  const items = isEditMode ? editItems : cartItems;
  const orderType = isEditMode ? editOrderType : cartOrderType;
  const selectedAreaId = isEditMode ? editSelectedAreaId : cartSelectedAreaId;
  const selectedTableId = isEditMode
    ? editSelectedTableId
    : cartSelectedTableId;
  const isTemporaryTable = isEditMode
    ? editIsTemporaryTable
    : cartIsTemporaryTable;
  const temporaryTableName = isEditMode
    ? editTemporaryTableName
    : cartTemporaryTableName;
  const scheduledTime = isEditMode ? editScheduledTime : cartScheduledTime;
  const deliveryInfo = isEditMode ? editDeliveryInfo : cartDeliveryInfo;
  const orderNotes = isEditMode ? editOrderNotes : cartOrderNotes;
  const adjustments = isEditMode ? editAdjustments : [];

  const setOrderType = isEditMode ? setEditOrderType : setCartOrderType;
  const setSelectedAreaId = isEditMode
    ? setEditSelectedAreaId
    : setCartSelectedAreaId;
  const setSelectedTableId = isEditMode
    ? setEditSelectedTableId
    : setCartSelectedTableId;
  const setIsTemporaryTable = isEditMode
    ? setEditIsTemporaryTable
    : setCartIsTemporaryTable;
  const setTemporaryTableName = isEditMode
    ? setEditTemporaryTableName
    : setCartTemporaryTableName;
  const setScheduledTime = isEditMode
    ? setEditScheduledTime
    : setCartScheduledTime;
  const setDeliveryInfo = isEditMode
    ? setEditDeliveryInfo
    : setCartDeliveryInfo;
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
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  }, [items]);

  // Calcular total de ajustes
  const totalAdjustments = useMemo(() => {
    if (!isEditMode) return 0;
    return editAdjustments
      .filter((adj) => !adj.isDeleted)
      .reduce((sum, adj) => sum + (adj.amount || 0), 0);
  }, [isEditMode, editAdjustments]);

  const total = useMemo(() => {
    return subtotal + totalAdjustments;
  }, [subtotal, totalAdjustments]);

  const totalItemsCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  // Calcular conteo de items existentes (no temporales)
  const existingItemsCount = useMemo(() => {
    if (!isEditMode) return 0;
    return editItems
      .filter((item) => !item.id.startsWith('new-'))
      .reduce((sum, item) => sum + item.quantity, 0);
  }, [isEditMode, editItems]);

  // Notificar cambios en el conteo de items (solo en modo edición)
  const [lastNotifiedCount, setLastNotifiedCount] = useState<number | null>(
    null,
  );

  useEffect(() => {
    if (isEditMode && onItemsCountChanged && visible && orderDataLoaded) {
      // Solo notificar si el conteo realmente cambió
      if (existingItemsCount !== lastNotifiedCount) {
        onItemsCountChanged(existingItemsCount);
        setLastNotifiedCount(existingItemsCount);
      }
    }
  }, [
    isEditMode,
    existingItemsCount,
    visible,
    orderDataLoaded,
    lastNotifiedCount,
    onItemsCountChanged,
  ]);

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

  // Verificar si el usuario puede registrar pagos (admin, manager, cashier)
  const canRegisterPayments = useMemo(() => {
    if (!user?.role?.id) return false;
    // RoleEnum: admin = 1, manager = 2, cashier = 3
    return [1, 2, 3].includes(user.role.id);
  }, [user]);

  // Estados locales solo para UI (errores, visibilidad de menús/modales)
  const [areaMenuVisible, setAreaMenuVisible] = useState(false);
  const [tableMenuVisible, setTableMenuVisible] = useState(false);
  const [areaError, setAreaError] = useState<string | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);
  const [recipientNameError, setRecipientNameError] = useState<string | null>(
    null,
  );
  const [recipientPhoneError, setRecipientPhoneError] = useState<string | null>(
    null,
  );
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
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentToEdit, setAdjustmentToEdit] =
    useState<OrderAdjustment | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<
    'CASH' | 'CARD' | 'TRANSFER'
  >('CASH');
  const [prepaymentId, setPrepaymentId] = useState<string | null>(null);
  const [showPrepaymentModal, setShowPrepaymentModal] = useState(false);
  const [showDeletePrepaymentConfirm, setShowDeletePrepaymentConfirm] = useState(false);

  // Estado original de la orden para detectar cambios
  const [originalOrderState, setOriginalOrderState] = useState<{
    items: CartItem[];
    orderType: OrderType;
    tableId: string | null;
    deliveryInfo: DeliveryInfo;
    notes: string;
    scheduledAt: Date | null;
    adjustments: OrderAdjustment[];
  } | null>(null);

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

  // Función helper para buscar información de un modifier por su ID
  const findModifierById = useCallback(
    (modifierId: string): CartItemModifier | null => {
      if (!menu) return null;

      for (const category of menu) {
        for (const subcategory of category.subcategories || []) {
          for (const product of subcategory.products || []) {
            for (const modifierGroup of product.modifierGroups || []) {
              const modifier = modifierGroup.productModifiers?.find(
                (mod) => mod.id === modifierId,
              );
              if (modifier) {
                return {
                  id: modifier.id,
                  modifierGroupId: modifierGroup.id,
                  name: modifier.name,
                  price: modifier.price,
                };
              }
            }
          }
        }
      }
      return null;
    },
    [menu],
  );

  // Cargar datos de la orden cuando esté en modo edición
  useEffect(() => {
    if (!isEditMode || !orderData || !visible) return;

    // Establecer los valores del formulario
    setEditOrderType(orderData.orderType);
    setEditSelectedTableId(orderData.tableId ?? null);
    setEditScheduledTime(
      orderData.scheduledAt ? new Date(orderData.scheduledAt) : null,
    );
    // Cargar deliveryInfo
    setEditDeliveryInfo(orderData.deliveryInfo || {});
    setEditOrderNotes(orderData.notes ?? '');

    // Cargar ajustes si existen
    if (orderData.adjustments && Array.isArray(orderData.adjustments)) {
      setEditAdjustments(
        orderData.adjustments.map((adj) => ({
          id: adj.id,
          name: adj.name,
          description: adj.description || '',
          isPercentage: adj.isPercentage,
          value: adj.value,
          amount: adj.amount,
        })),
      );
    } else {
      setEditAdjustments([]);
    }

    // Si hay una mesa, necesitamos encontrar el área
    if (orderData.tableId && orderData.table) {
      setEditSelectedAreaId(orderData.table.areaId);
      // Verificar si es una mesa temporal
      if (orderData.table.isTemporary) {
        setEditIsTemporaryTable(true);
        setEditTemporaryTableName(orderData.table.name || '');
      } else {
        setEditIsTemporaryTable(false);
        setEditTemporaryTableName('');
      }
    } else {
      setEditIsTemporaryTable(false);
      setEditTemporaryTableName('');
    }

    // Mapa para agrupar items idénticos
    const groupedItemsMap = new Map<string, CartItem>();

    // Mapear y agrupar los items de la orden
    if (orderData.orderItems && Array.isArray(orderData.orderItems)) {
      orderData.orderItems.forEach((item: any) => {
        // Mapear los modificadores desde el nuevo formato (productModifiers)
        const modifiers: CartItemModifier[] = [];

        // Si vienen en el formato antiguo (item.modifiers con objetos)
        if (item.modifiers && Array.isArray(item.modifiers)) {
          item.modifiers.forEach((mod: any) => {
            modifiers.push({
              id: mod.productModifierId,
              modifierGroupId: mod.productModifier?.modifierGroupId || '',
              name: mod.productModifier?.name || 'Modificador',
              price: parseFloat(mod.price) || 0,
            });
          });
        }
        // Si vienen en el nuevo formato (item.productModifiers como array de entidades)
        else if (
          item.productModifiers &&
          Array.isArray(item.productModifiers)
        ) {
          item.productModifiers.forEach((mod: any) => {
            const modifierInfo = findModifierById(mod.id) || {
              id: mod.id,
              modifierGroupId: mod.modifierGroupId || '',
              name: mod.name || 'Modificador',
              price: parseFloat(mod.price) || 0,
            };
            modifiers.push(modifierInfo);
          });
        }

        const modifiersPrice = modifiers.reduce(
          (sum: number, mod: any) => sum + (parseFloat(mod.price) || 0),
          0,
        );
        const unitPrice = parseFloat(item.basePrice || '0');

        // Crear una clave única para agrupar items idénticos (incluye estado de preparación)
        const modifierIds = modifiers
          .map((m) => m.id)
          .sort()
          .join(',');
        const pizzaCustomizationIds = item.selectedPizzaCustomizations
          ? item.selectedPizzaCustomizations
              .map((c) => `${c.pizzaCustomizationId}-${c.half}-${c.action}`)
              .sort()
              .join(',')
          : '';
        const groupKey = `${item.productId}-${item.productVariantId || 'null'}-${modifierIds}-${pizzaCustomizationIds}-${item.preparationNotes || ''}-${item.preparationStatus || 'PENDING'}`;

        const existingItem = groupedItemsMap.get(groupKey);

        if (
          existingItem &&
          existingItem.preparationStatus === item.preparationStatus
        ) {
          // Si ya existe un item idéntico con el mismo estado, incrementar la cantidad
          existingItem.quantity += 1;
          existingItem.totalPrice =
            (unitPrice + modifiersPrice) * existingItem.quantity;
          existingItem.id = `${existingItem.id},${item.id}`;
        } else {
          // Si es un nuevo item, agregarlo al mapa

          const cartItem: CartItem = {
            id: item.id,
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
            selectedPizzaCustomizations:
              item.selectedPizzaCustomizations || undefined, // Incluir personalizaciones de pizza
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

    // Guardar el estado original de la orden para detectar cambios
    const originalItems = Array.from(groupedItemsMap.values());
    const originalAdjustments =
      orderData.adjustments?.map((adj) => ({
        id: adj.id,
        name: adj.name,
        // description: adj.description, // No existe en el tipo Adjustment
        isPercentage: adj.isPercentage,
        value: adj.value,
        amount: adj.amount,
      })) || [];

    setOriginalOrderState({
      items: originalItems,
      orderType: orderData.orderType,
      tableId: orderData.tableId ?? null,
      deliveryInfo: orderData.deliveryInfo || {},
      notes: orderData.notes ?? '',
      scheduledAt: orderData.scheduledAt
        ? new Date(orderData.scheduledAt)
        : null,
      adjustments: originalAdjustments,
    });

    // Resetear el flag de cambios no guardados
    setHasUnsavedChanges(false);
  }, [isEditMode, orderData, visible]);

  // Función para formatear las personalizaciones de pizza
  const formatPizzaCustomizations = (
    customizations: SelectedPizzaCustomization[],
  ): string => {
    if (!customizations || customizations.length === 0) return '';

    // Agrupar por mitad y tipo
    const groupedByHalf = customizations.reduce(
      (acc, curr) => {
        const half =
          curr.half === PizzaHalf.HALF_1
            ? 'HALF_1'
            : curr.half === PizzaHalf.HALF_2
              ? 'HALF_2'
              : 'FULL';

        if (!acc[half]) {
          acc[half] = {
            flavors: [],
            addedIngredients: [],
            removedIngredients: [],
          };
        }

        // Primero intentar obtener la información de pizzaCustomization si está disponible
        let name = '';
        let type = null;

        if (curr.pizzaCustomization) {
          // Si viene la información completa del backend
          name = curr.pizzaCustomization.name;
          type = curr.pizzaCustomization.type;
        } else if (menu) {
          // Si no viene la información completa, buscarla en el menú
          outer: for (const category of menu) {
            for (const subcategory of category.subcategories || []) {
              for (const product of subcategory.products || []) {
                if (product.pizzaCustomizations) {
                  const customization = product.pizzaCustomizations.find(
                    (pc) => pc.id === curr.pizzaCustomizationId,
                  );
                  if (customization) {
                    name = customization.name;
                    type = customization.type;
                    break outer;
                  }
                }
              }
            }
          }
        }

        // Si aún no tenemos el nombre, usar el ID como fallback
        if (!name) {
          name = curr.pizzaCustomizationId;
        }

        if (type === 'FLAVOR' || type === CustomizationType.FLAVOR) {
          acc[half].flavors.push(name);
        } else if (
          type === 'INGREDIENT' ||
          type === CustomizationType.INGREDIENT
        ) {
          if (curr.action === CustomizationAction.ADD) {
            acc[half].addedIngredients.push(name);
          } else {
            acc[half].removedIngredients.push(name);
          }
        }

        return acc;
      },
      {} as Record<
        string,
        {
          flavors: string[];
          addedIngredients: string[];
          removedIngredients: string[];
        }
      >,
    );

    // Formatear según el tipo de pizza
    if (groupedByHalf.FULL) {
      // Pizza completa
      const parts: string[] = [];
      if (groupedByHalf.FULL.flavors.length > 0) {
        parts.push(groupedByHalf.FULL.flavors.join(', '));
      }
      if (groupedByHalf.FULL.addedIngredients.length > 0) {
        parts.push(`con: ${groupedByHalf.FULL.addedIngredients.join(', ')}`);
      }
      if (groupedByHalf.FULL.removedIngredients.length > 0) {
        parts.push(`sin: ${groupedByHalf.FULL.removedIngredients.join(', ')}`);
      }
      return parts.join(' - ');
    } else if (groupedByHalf.HALF_1 || groupedByHalf.HALF_2) {
      // Pizza mitad y mitad
      const formatHalf = (halfData: {
        flavors: string[];
        addedIngredients: string[];
        removedIngredients: string[];
      }) => {
        const parts: string[] = [];
        if (halfData.flavors.length > 0) {
          parts.push(halfData.flavors.join(', '));
        }
        if (halfData.addedIngredients.length > 0) {
          parts.push(`con: ${halfData.addedIngredients.join(', ')}`);
        }
        if (halfData.removedIngredients.length > 0) {
          parts.push(`sin: ${halfData.removedIngredients.join(', ')}`);
        }
        return parts.join(' - ');
      };

      const half1 = groupedByHalf.HALF_1
        ? formatHalf(groupedByHalf.HALF_1)
        : '';
      const half2 = groupedByHalf.HALF_2
        ? formatHalf(groupedByHalf.HALF_2)
        : '';

      return half1 && half2 ? `(${half1} / ${half2})` : half1 || half2;
    }

    return '';
  };

  // Función para agrupar items idénticos
  const groupIdenticalItems = useCallback((items: CartItem[]): CartItem[] => {
    const groupedMap = new Map<string, CartItem>();

    items.forEach((item) => {
      // Crear una clave única basada en todas las propiedades que deben ser idénticas
      const modifierIds = item.modifiers
        .map((m) => m.id)
        .sort()
        .join(',');

      // Incluir personalizaciones de pizza en la clave
      const pizzaCustomizationIds = item.selectedPizzaCustomizations
        ? item.selectedPizzaCustomizations
            .map((pc) => `${pc.pizzaCustomizationId}-${pc.half}-${pc.action}`)
            .sort()
            .join(',')
        : '';

      const groupKey = `${item.productId}-${item.variantId || 'null'}-${modifierIds}-${pizzaCustomizationIds}-${item.preparationNotes || ''}-${item.preparationStatus || 'PENDING'}`;

      const existingItem = groupedMap.get(groupKey);

      if (existingItem) {
        // Si ya existe un item idéntico, incrementar la cantidad
        existingItem.quantity += item.quantity;
        // Recalcular el precio total considerando modificadores
        const modifiersPrice = existingItem.modifiers.reduce(
          (sum, mod) => sum + (mod.price || 0),
          0,
        );
        existingItem.totalPrice =
          (existingItem.unitPrice + modifiersPrice) * existingItem.quantity;

        // Concatenar IDs si ambos items tienen IDs reales (no temporales)
        if (
          !existingItem.id.startsWith('new-') &&
          !item.id.startsWith('new-')
        ) {
          const existingIds = existingItem.id.split(',');
          const newIds = item.id.split(',');
          const allIds = [...new Set([...existingIds, ...newIds])];
          existingItem.id = allIds.join(',');
        }
      } else {
        // Si es nuevo, agregarlo al mapa con una copia completa
        groupedMap.set(groupKey, { ...item });
      }
    });

    const result = Array.from(groupedMap.values());

    return result;
  }, []);

  // Estado para controlar si ya procesamos los productos pendientes
  const [processedPendingProductsIds, setProcessedPendingProductsIds] =
    useState<string[]>([]);
  // Estado para controlar si los datos de la orden ya se cargaron
  const [orderDataLoaded, setOrderDataLoaded] = useState(false);

  // Manejar productos pendientes de añadir
  useEffect(() => {
    // Solo procesar cuando:
    // 1. Hay productos pendientes
    // 2. Estamos en modo edición
    // 3. El modal es visible
    // 4. Los datos de la orden ya se cargaron
    if (
      pendingProductsToAdd.length > 0 &&
      isEditMode &&
      visible &&
      orderDataLoaded
    ) {
      // Filtrar productos que no han sido procesados aún
      const unprocessedProducts = pendingProductsToAdd.filter((item) => {
        // Usar una clave única para cada producto basada en sus propiedades
        const productKey = `${item.productId}-${item.variantId || 'null'}-${JSON.stringify(item.modifiers.map((m) => m.id).sort())}-${item.preparationNotes || ''}`;
        return !processedPendingProductsIds.includes(productKey);
      });

      if (unprocessedProducts.length > 0) {
        // Marcar los nuevos productos con estado "NEW" temporal
        const newProductsWithStatus = unprocessedProducts.map((item) => ({
          ...item,
          preparationStatus: 'NEW' as const,
          id: `new-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
        }));

        // Combinar con items existentes y agrupar
        setEditItems((prevItems) => {
          const allItems = [...prevItems, ...newProductsWithStatus];
          const grouped = groupIdenticalItems(allItems);

          return grouped;
        });

        // Marcar estos productos como procesados
        const newProcessedIds = unprocessedProducts.map(
          (item) =>
            `${item.productId}-${item.variantId || 'null'}-${JSON.stringify(item.modifiers.map((m) => m.id).sort())}-${item.preparationNotes || ''}`,
        );
        setProcessedPendingProductsIds((prev) => [...prev, ...newProcessedIds]);

        // Calcular cuántos items únicos se añadieron
        const uniqueNewItems = newProductsWithStatus.length;
        showSnackbar({
          message: `${uniqueNewItems} producto${uniqueNewItems > 1 ? 's' : ''} añadido${uniqueNewItems > 1 ? 's' : ''}`,
          type: 'success',
        });
      }
    }
  }, [
    pendingProductsToAdd,
    isEditMode,
    visible,
    orderDataLoaded,
    processedPendingProductsIds,
    groupIdenticalItems,
    showSnackbar,
  ]);

  // Resetear los IDs procesados cuando el modal se cierre o cambie de orden
  // (esto se maneja en el useEffect de reseteo de estados)

  // Limpiar errores locales al cambiar tipo de orden (más simple)
  useEffect(() => {
    setAreaError(null);
    setTableError(null);
    setRecipientNameError(null);
    setRecipientPhoneError(null);
    setAddressError(null);
  }, [orderType]);

  // Detectar cambios sin guardar
  useEffect(() => {
    if (!isEditMode || !originalOrderState || !visible) {
      setHasUnsavedChanges(false);
      return;
    }

    // Comparar el estado actual con el original
    const hasChanges =
      // Cambios en items
      JSON.stringify(editItems) !== JSON.stringify(originalOrderState.items) ||
      // Cambios en tipo de orden
      editOrderType !== originalOrderState.orderType ||
      // Cambios en mesa
      editSelectedTableId !== originalOrderState.tableId ||
      // Cambios en datos del cliente
      JSON.stringify(editDeliveryInfo) !==
        JSON.stringify(originalOrderState.deliveryInfo) ||
      editOrderNotes !== originalOrderState.notes ||
      // Cambios en hora programada
      editScheduledTime !== originalOrderState.scheduledAt ||
      // Cambios en ajustes
      JSON.stringify(editAdjustments) !==
        JSON.stringify(originalOrderState.adjustments);

    setHasUnsavedChanges(hasChanges);
  }, [
    isEditMode,
    originalOrderState,
    visible,
    editItems,
    editOrderType,
    editSelectedTableId,
    editDeliveryInfo,
    editOrderNotes,
    editScheduledTime,
    editAdjustments,
  ]);

  // Resetear estados cuando el modal se cierre
  useEffect(() => {
    if (!visible && isEditMode) {
      // Resetear estados de edición cuando el modal se cierre
      setEditOrderType(OrderTypeEnum.DINE_IN);
      setEditSelectedAreaId(null);
      setEditSelectedTableId(null);
      setEditScheduledTime(null);
      setEditDeliveryInfo({});
      setEditOrderNotes('');
      setEditItems([]);
      setShowExitConfirmation(false);
      setEditingItemFromList(null);
      setEditingProduct(null);
      setIsModalReady(false);
      setOrderDataLoaded(false); // Resetear el flag de datos cargados
      setProcessedPendingProductsIds([]); // Resetear los IDs de productos procesados
      setLastNotifiedCount(null); // Resetear el conteo notificado
      setOriginalOrderState(null); // Resetear el estado original
      setHasUnsavedChanges(false); // Resetear el flag de cambios
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

  // Funciones para manejar ajustes
  const handleAddAdjustment = useCallback(
    (adjustment: OrderAdjustment) => {
      if (isEditMode) {
        // Asegurar que el ajuste tenga un ID único
        const newAdjustment = {
          ...adjustment,
          id:
            adjustment.id ||
            `new-adjustment-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
          isNew: true,
        };
        setEditAdjustments((prev) => [...prev, newAdjustment]);
      }
    },
    [isEditMode],
  );

  const handleUpdateAdjustment = useCallback(
    (id: string, updatedAdjustment: OrderAdjustment) => {
      if (isEditMode) {
        setEditAdjustments((prev) =>
          prev.map((adj) =>
            adj.id === id ? { ...adj, ...updatedAdjustment, id } : adj,
          ),
        );
      }
    },
    [isEditMode],
  );

  const handleRemoveAdjustment = useCallback(
    (id: string) => {
      if (isEditMode) {
        setEditAdjustments((prev) => prev.filter((adj) => adj.id !== id));
      }
    },
    [isEditMode],
  );

  const handleConfirm = async () => {
    if (isConfirming) return; // Prevenir múltiples clics

    setAreaError(null);
    setTableError(null);
    setRecipientNameError(null);
    setRecipientPhoneError(null);
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
      if (isTemporaryTable) {
        // Validar mesa temporal
        if (!temporaryTableName || temporaryTableName.trim() === '') {
          setTableError('Debe ingresar un nombre para la mesa temporal');
          isValid = false;
        }
      } else {
        // Validar mesa existente
        if (!selectedTableId) {
          setTableError('Debe seleccionar una mesa');
          isValid = false;
        }
      }
    } else if (orderType === OrderTypeEnum.TAKE_AWAY) {
      // Usar Enum
      if (
        !deliveryInfo.recipientName ||
        deliveryInfo.recipientName.trim() === ''
      ) {
        setRecipientNameError('El nombre del cliente es obligatorio');
        isValid = false;
      }
      // Phone is optional for take away
    } else if (orderType === OrderTypeEnum.DELIVERY) {
      // Usar Enum
      // Customer name not required for delivery as per new spec
      if (!deliveryInfo.fullAddress || deliveryInfo.fullAddress.trim() === '') {
        setAddressError('La dirección es obligatoria para Domicilio');
        isValid = false;
      }
      if (
        !deliveryInfo.recipientPhone ||
        deliveryInfo.recipientPhone.trim() === ''
      ) {
        setRecipientPhoneError('El teléfono es obligatorio para Domicilio');
        isValid = false;
      }
    }

    if (!isValid) {
      return;
    }

    // Mapear items del carrito al formato esperado por el DTO del backend
    const itemsForBackend: OrderItemDtoForBackend[] = [];

    // Mapear items según el modo (creación o edición)
    items.forEach((item: CartItem) => {
      if (isEditMode && item.id && !item.id.startsWith('new-')) {
        // En modo edición, items con ID real se envían agrupados
        itemsForBackend.push({
          id: item.id, // IDs concatenados del grupo
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
      } else {
        // Items nuevos se expanden según cantidad
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

    // Formatear el número de teléfono para el backend
    let formattedPhone: string | undefined = undefined;
    if (
      deliveryInfo.recipientPhone &&
      deliveryInfo.recipientPhone.trim() !== ''
    ) {
      formattedPhone = deliveryInfo.recipientPhone.trim();
    }

    const orderDetails: OrderDetailsForBackend = {
      userId: user?.id, // userId ahora es opcional
      orderType,
      subtotal,
      total,
      items: itemsForBackend,
      tableId:
        orderType === OrderTypeEnum.DINE_IN && !isTemporaryTable
          ? (selectedTableId ?? undefined)
          : undefined, // Usar Enum
      isTemporaryTable:
        orderType === OrderTypeEnum.DINE_IN && isTemporaryTable
          ? true
          : undefined,
      temporaryTableName:
        orderType === OrderTypeEnum.DINE_IN && isTemporaryTable
          ? temporaryTableName
          : undefined,
      temporaryTableAreaId:
        orderType === OrderTypeEnum.DINE_IN && isTemporaryTable
          ? selectedAreaId || undefined
          : undefined,
      scheduledAt: scheduledTime ? scheduledTime : undefined,
      deliveryInfo: {
        recipientName:
          orderType === OrderTypeEnum.TAKE_AWAY
            ? deliveryInfo.recipientName
            : undefined,
        recipientPhone:
          (orderType === OrderTypeEnum.TAKE_AWAY ||
            orderType === OrderTypeEnum.DELIVERY) &&
          formattedPhone
            ? formattedPhone
            : undefined,
        fullAddress:
          orderType === OrderTypeEnum.DELIVERY
            ? deliveryInfo.fullAddress
            : undefined,
        // Solo incluir instrucciones de entrega si es delivery y existen
        deliveryInstructions:
          orderType === OrderTypeEnum.DELIVERY &&
          deliveryInfo.deliveryInstructions
            ? deliveryInfo.deliveryInstructions
            : undefined,
      },
      notes: orderNotes || undefined,
      adjustments: isEditMode
        ? editAdjustments
            .filter((adj) => !adj.isDeleted)
            .map((adj) => {
              return {
                orderId: orderId || undefined,
                name: adj.name,
                // description: adj.description, // No existe en el tipo Adjustment
                isPercentage: adj.isPercentage,
                value: adj.value,
                amount: adj.amount,
              };
            })
        : undefined,
    };

    if (!orderDetails.userId) {
      console.error('Error: Falta el ID del usuario al confirmar la orden.');
      return; // Detener el proceso si falta el userId
    }

    setIsConfirming(true); // Marcar como procesando

    // Si hay un pre-pago creado, incluir su ID
    if (!isEditMode && prepaymentId) {
      orderDetails.prepaymentId = prepaymentId;
    }

    try {
      await onConfirmOrder(orderDetails);
      // Si llegamos aquí, la orden fue exitosa
      setIsConfirming(false);

      // Actualizar el estado original después de guardar exitosamente
      if (isEditMode) {
        setOriginalOrderState({
          items: [...editItems],
          orderType: editOrderType,
          tableId: editSelectedTableId,
          deliveryInfo: editDeliveryInfo,
          notes: editOrderNotes,
          scheduledAt: editScheduledTime,
          adjustments: editAdjustments,
        });
        setHasUnsavedChanges(false);

        // Mostrar mensaje de éxito
        showSnackbar({
          message: 'Cambios guardados exitosamente',
          type: 'success',
        });

        // Cerrar el modal después de una actualización exitosa
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

  const showTimePicker = () => {
    setTimePickerVisible(true);
  };

  const hideTimePicker = () => setTimePickerVisible(false);

  const handlePrepaymentCreated = async (
    prepaymentIdCreated: string,
    amount: number,
    method: 'CASH' | 'CARD' | 'TRANSFER',
  ) => {
    const isUpdate = prepaymentId === prepaymentIdCreated;

    setPrepaymentId(prepaymentIdCreated);
    setPaymentAmount(amount.toFixed(2));
    setPaymentMethod(method);
    setShowPrepaymentModal(false);

    showSnackbar({
      message: isUpdate
        ? 'Pago actualizado correctamente'
        : 'Pago registrado correctamente',
      type: 'success',
    });
  };

  const handleDeletePrepayment = () => {
    if (!prepaymentId) return;

    setShowDeletePrepaymentConfirm(true);
  };

  const confirmDeletePrepayment = async () => {
    if (!prepaymentId) return;

    try {
      await prepaymentService.deletePrepayment(prepaymentId);
      setPrepaymentId(null);
      setPaymentAmount('');
      setPaymentMethod(null);

      showSnackbar({
        message: 'Prepago eliminado correctamente',
        type: 'success',
      });
    } catch (error: any) {
      let errorMessage = 'Error al eliminar el prepago';

      // Manejar específicamente el error 404
      if (error?.response?.status === 404) {
        errorMessage = 'El prepago ya no existe o fue eliminado previamente';
        // Limpiar el estado local si el prepago ya no existe
        setPrepaymentId(null);
        setPaymentAmount('');
        setPaymentMethod(null);
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      showSnackbar({
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setShowDeletePrepaymentConfirm(false);
    }
  };

  const handlePrepaymentDeleted = () => {
    setPrepaymentId(null);
    setPaymentAmount('');
    setPaymentMethod('CASH');
    setShowPrepaymentModal(false);

    showSnackbar({
      message: 'Pago eliminado correctamente',
      type: 'success',
    });
  };

  const handleTimeConfirm = (date: Date) => {
    const now = new Date();
    now.setSeconds(0, 0);

    if (date < now) {
      hideTimePicker();
      setTimeAlertVisible(true);
    } else {
      if (isEditMode) {
        setEditScheduledTime(date);
      } else {
        setScheduledTime(date);
      }
      hideTimePicker();
    }
  };

  const formattedScheduledTime = useMemo(() => {
    if (!scheduledTime) return null;
    try {
      return format(scheduledTime, 'h:mm a').toLowerCase(); // Formato 12 horas con am/pm
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Hora inválida';
    }
  }, [scheduledTime]);

  // [HELPER MOVIDO A dateTimeHelpers.ts para evitar problemas con Hermes]

  // [FUNCIÓN ELIMINADA - hasUnsavedChanges ya existe como estado]
  /*
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
    if (JSON.stringify(editDeliveryInfo) !== JSON.stringify(orderData.deliveryInfo || {})) return true;
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
      let modifierIds = '';
      if (item.modifiers && Array.isArray(item.modifiers)) {
        // Formato antiguo
        modifierIds = item.modifiers
          .map((m: any) => m.productModifierId)
          .sort()
          .join(',');
      } else if (item.productModifiers && Array.isArray(item.productModifiers)) {
        // Formato nuevo
        modifierIds = item.productModifiers
          .map((m: any) => m.id)
          .sort()
          .join(',');
      }
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
  ]); */

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
      selectedPizzaCustomizations?: SelectedPizzaCustomization[],
      pizzaExtraCost?: number,
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
            const extraCost = pizzaExtraCost || 0;
            const newTotalPrice =
              (finalUnitPrice + modifiersPrice + extraCost) * quantity;

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
                      value={isTemporaryTable ? '(Usando mesa temporal)' : selectedTableName}
                      onPress={() => setTableMenuVisible(true)}
                      isLoading={isLoadingTables}
                      error={!!tableError || !!errorTables}
                      disabled={
                        !selectedAreaId || isLoadingTables || isLoadingAreas || isTemporaryTable
                      }
                    />
                  }
                >
                  {tablesData?.map((table: Table) => {
                    // En modo edición, permitir seleccionar la mesa actual aunque esté ocupada
                    const isCurrentTable = isEditMode && orderData?.tableId === table.id;
                    const canSelect = table.isAvailable || isCurrentTable;

                    return (
                      <Menu.Item
                        key={table.id}
                        onPress={() => {
                          if (canSelect) {
                            setSelectedTableId(table.id);
                            setTableMenuVisible(false);
                            setTableError(null);
                          }
                        }}
                        title={`${table.name}${!table.isAvailable && !isCurrentTable ? ' (Ocupada)' : ''}`}
                        disabled={!canSelect}
                        titleStyle={
                          !canSelect
                            ? { color: theme.colors.error }
                            : undefined
                        }
                      />
                    );
                  })}
                  {selectedAreaId &&
                    tablesData?.length === 0 &&
                    !isLoadingTables &&
                    !errorTables && <Menu.Item title="No hay mesas" disabled />}
                  {errorTables && (
                    <Menu.Item title="Error al cargar mesas" disabled />
                  )}
                </Menu>
                {tableError && !errorTables && !isTemporaryTable && (
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

            {/* Opción de mesa temporal */}
            <View style={[styles.sectionCompact, styles.fieldContainer]}>
              <TouchableOpacity
                onPress={() => {
                  setIsTemporaryTable(!isTemporaryTable);
                  if (!isTemporaryTable) {
                    // Si activamos mesa temporal, limpiar la selección de mesa
                    setSelectedTableId(null);
                    setTableError(null);
                  } else {
                    // Si desactivamos mesa temporal, limpiar el nombre
                    setTemporaryTableName('');
                  }
                }}
                style={styles.checkboxContainer}
              >
                <Checkbox.Android
                  status={isTemporaryTable ? 'checked' : 'unchecked'}
                  onPress={() => {
                    setIsTemporaryTable(!isTemporaryTable);
                    if (!isTemporaryTable) {
                      // Si activamos mesa temporal, limpiar la selección de mesa
                      setSelectedTableId(null);
                      setTableError(null);
                    } else {
                      // Si desactivamos mesa temporal, limpiar el nombre
                      setTemporaryTableName('');
                    }
                  }}
                  color={theme.colors.primary}
                />
                <Text style={styles.checkboxLabel}>Crear mesa temporal</Text>
              </TouchableOpacity>

              {/* Campo para nombre de mesa temporal */}
              {isTemporaryTable && (
                <View style={styles.temporaryTableInputContainer}>
                  <SpeechRecognitionInput
                    key="temporary-table-name"
                    label="Nombre de la Mesa Temporal *"
                    value={temporaryTableName}
                    onChangeText={(text) => {
                      setTemporaryTableName(text);
                      if (tableError) setTableError(null);
                    }}
                    error={!!tableError && isTemporaryTable}
                    speechLang="es-MX"
                    autoCapitalize="words"
                    autoCorrect={false}
                    placeholder="Ej: Mesa Terraza 1"
                  />
                  {tableError && isTemporaryTable && (
                    <HelperText
                      type="error"
                      visible={true}
                      style={styles.helperTextFix}
                    >
                      {tableError}
                    </HelperText>
                  )}
                </View>
              )}
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
                value={deliveryInfo.recipientName || ''}
                onChangeText={(text) => {
                  setDeliveryInfo({ ...deliveryInfo, recipientName: text });
                  if (recipientNameError) setRecipientNameError(null);
                }}
                error={!!recipientNameError}
                speechLang="es-MX"
                autoCapitalize="words"
                autoCorrect={false}
              />
              {recipientNameError && (
                <HelperText
                  type="error"
                  visible={true}
                  style={styles.helperTextFix}
                >
                  {recipientNameError}
                </HelperText>
              )}
            </View>

            {/* 2. Teléfono */}
            <View style={[styles.sectionCompact, styles.fieldContainer]}>
              <View style={styles.phoneInputWrapper}>
                <SpeechRecognitionInput
                  key={`phone-input-takeaway-${orderType}`}
                  label="Teléfono (Opcional)"
                  value={deliveryInfo.recipientPhone || ''}
                  onChangeText={(text) => {
                    setDeliveryInfo({ ...deliveryInfo, recipientPhone: text });
                    if (recipientPhoneError) setRecipientPhoneError(null);
                  }}
                  keyboardType="phone-pad"
                  error={!!recipientPhoneError} // Aunque opcional, puede tener errores de formato si se ingresa
                  speechLang="es-MX"
                  autoCorrect={false}
                />
                {(deliveryInfo.recipientPhone || '').length > 0 &&
                  !recipientPhoneError && (
                    <Text style={styles.digitCounterAbsolute}>
                      {
                        (deliveryInfo.recipientPhone || '').replace(/\D/g, '')
                          .length
                      }{' '}
                      dígitos
                    </Text>
                  )}
              </View>
              {recipientPhoneError && (
                <HelperText
                  type="error"
                  visible={true}
                  style={styles.helperTextFix}
                >
                  {recipientPhoneError}
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
            {/* 1. Dirección */}
            <View style={[styles.sectionCompact, styles.fieldContainer]}>
              <SpeechRecognitionInput
                key="address-input-delivery"
                label="Dirección de Entrega *"
                value={deliveryInfo.fullAddress || ''}
                onChangeText={(text) => {
                  setDeliveryInfo({ ...deliveryInfo, fullAddress: text });
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

            {/* 2. Teléfono */}
            <View style={[styles.sectionCompact, styles.fieldContainer]}>
              <SpeechRecognitionInput
                key={`phone-input-delivery-${orderType}`} // Key única y específica
                label="Teléfono *"
                value={deliveryInfo.recipientPhone || ''}
                onChangeText={(text) => {
                  // Asegurar que la función esté bien definida aquí
                  setDeliveryInfo({ ...deliveryInfo, recipientPhone: text });
                  if (recipientPhoneError) {
                    setRecipientPhoneError(null);
                  }
                }}
                keyboardType="phone-pad"
                error={!!recipientPhoneError}
                speechLang="es-MX"
                autoCorrect={false}
              />
              <View style={styles.phoneHelperContainer}>
                {recipientPhoneError ? (
                  <HelperText
                    type="error"
                    visible={true}
                    style={[styles.helperTextFix, styles.recipientPhoneError]}
                  >
                    {recipientPhoneError}
                  </HelperText>
                ) : (
                  (deliveryInfo.recipientPhone || '').length > 0 && (
                    <Text style={styles.digitCounter}>
                      {
                        (deliveryInfo.recipientPhone || '').replace(/\D/g, '')
                          .length
                      }{' '}
                      dígitos
                    </Text>
                  )
                )}
              </View>
            </View>

            {/* 3. Notas */}
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

            {/* 4. Programar Hora */}
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
          contentContainerStyle={styles.errorModalContent}
        >
          <View style={styles.errorModalContainer}>
            {/* Icono de error */}
            <View
              style={[
                styles.errorIconContainer,
                { backgroundColor: theme.colors.errorContainer },
              ]}
            >
              <IconButton
                icon="alert-circle-outline"
                size={48}
                iconColor={theme.colors.error}
                style={{ margin: 0 }}
              />
            </View>

            {/* Título del error */}
            <Text
              style={[
                styles.errorModalTitle,
                { color: theme.colors.onSurface },
              ]}
            >
              No se pudo cargar la orden
            </Text>

            {/* Mensaje descriptivo */}
            <Text
              style={[
                styles.errorModalMessage,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Ha ocurrido un error al intentar cargar los datos de la orden. Por
              favor, intenta nuevamente más tarde.
            </Text>

            {/* Botón de cerrar */}
            <Button
              mode="contained"
              onPress={onClose}
              style={styles.errorModalButton}
              contentStyle={styles.errorModalButtonContent}
              labelStyle={styles.errorModalButtonLabel}
            >
              Entendido
            </Button>
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
          if (isEditMode && hasUnsavedChanges) {
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
                      if (hasUnsavedChanges) {
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
                        setShowDetailModal(true);
                      }}
                      title="Ver Detalles"
                      leadingIcon="file-document-outline"
                    />
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
                                {`${item.quantity}x ${item.variantName ? String(item.variantName ?? '') : String(item.productName ?? '')}`}
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
                              const hasPizzaCustomizations =
                                item.selectedPizzaCustomizations &&
                                item.selectedPizzaCustomizations.length > 0;

                              return (
                                <View>
                                  {/* Renderizar personalizaciones de pizza */}
                                  {hasPizzaCustomizations && (
                                    <Text style={styles.itemDescription}>
                                      {formatPizzaCustomizations(
                                        item.selectedPizzaCustomizations,
                                      )}
                                    </Text>
                                  )}

                                  {/* Renderizar modificadores */}
                                  {hasModifiers &&
                                    item.modifiers.map((mod, index) => (
                                      <Text
                                        key={mod.id || index}
                                        style={styles.itemDescription}
                                      >
                                        • {mod.name}{' '}
                                        {mod.price && Number(mod.price) > 0
                                          ? `(+$${Number(mod.price).toFixed(2)})`
                                          : ''}
                                      </Text>
                                    ))}

                                  {/* Renderizar notas */}
                                  {hasNotes && (
                                    <Text
                                      style={[
                                        styles.itemDescription,
                                        styles.notesText,
                                      ]}
                                    >
                                      Notas: {item.preparationNotes}
                                    </Text>
                                  )}
                                </View>
                              );
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
                                    (item.modifiers || []).reduce(
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

              {/* Renderizar ajustes como OrderItems - dentro del mismo List.Section */}
              {isEditMode &&
                adjustments
                  .filter((adj) => !adj.isDeleted)
                  .map((adjustment, index) => {
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
                            <Text style={styles.deleteActionText}>
                              ELIMINAR
                            </Text>
                          </Animated.View>
                        </Animated.View>
                      );
                    };

                    return (
                      <Swipeable
                        key={adjustment.id || `new-${index}`}
                        renderRightActions={renderRightActions}
                        overshootRight={false}
                        friction={2}
                        rightThreshold={90}
                        leftThreshold={100}
                        onSwipeableOpen={(direction) => {
                          if (direction === 'right') {
                            setTimeout(() => {
                              if (adjustment.id) {
                                handleRemoveAdjustment(adjustment.id);
                              }
                            }, 150);
                          }
                        }}
                      >
                        <TouchableOpacity
                          onPress={() => {
                            setAdjustmentToEdit(adjustment);
                            setShowAdjustmentModal(true);
                          }}
                          activeOpacity={0.7}
                        >
                          <List.Item
                            title={() => (
                              <View style={styles.itemTextContainer}>
                                <Text
                                  style={[
                                    styles.itemTitleText,
                                    {
                                      color:
                                        adjustment.amount < 0
                                          ? theme.colors.error
                                          : theme.colors.primary,
                                    },
                                  ]}
                                >
                                  {adjustment.name}
                                  {adjustment.isPercentage
                                    ? ` (${adjustment.value}%)`
                                    : ''}
                                </Text>
                              </View>
                            )}
                            right={() => (
                              <View style={styles.itemActionsContainer}>
                                <View style={styles.priceContainer}>
                                  <Text
                                    style={[
                                      styles.itemPrice,
                                      {
                                        color:
                                          adjustment.amount < 0
                                            ? theme.colors.error
                                            : theme.colors.primary,
                                      },
                                    ]}
                                  >
                                    {adjustment.amount < 0 ? '-' : '+'}$
                                    {Math.abs(adjustment.amount || 0).toFixed(
                                      2,
                                    )}
                                  </Text>
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

            {/* Botón de ajustes - Solo en modo edición */}
            {isEditMode && (
              <Button
                onPress={() => setShowAdjustmentModal(true)}
                mode="outlined"
                style={{
                  marginTop: theme.spacing.m,
                  marginBottom: theme.spacing.s,
                }}
                icon="calculator-variant"
              >
                Ajustes
              </Button>
            )}

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
                        existingOrderItemsCount: editItems
                          .filter((item) => !item.id.startsWith('new-'))
                          .reduce((sum, item) => sum + item.quantity, 0),
                        onProductsAdded: (newProducts: CartItem[]) => {
                          // Marcar los nuevos productos con estado "NEW"
                          const newProductsWithStatus = newProducts.map(
                            (item) => ({
                              ...item,
                              preparationStatus: 'NEW' as const,
                              id: `new-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
                            }),
                          );

                          // Combinar con items existentes y agrupar
                          const allItems = [
                            ...editItems,
                            ...newProductsWithStatus,
                          ];
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
              <Text style={styles.totalsValue}>
                ${(subtotal || 0).toFixed(2)}
              </Text>
            </View>
            {isEditMode && totalAdjustments !== 0 && (
              <View style={styles.totalsContainer}>
                <Text style={styles.totalsText}>Ajustes:</Text>
                <Text
                  style={[
                    styles.totalsValue,
                    {
                      color:
                        totalAdjustments < 0
                          ? theme.colors.error
                          : theme.colors.primary,
                    },
                  ]}
                >
                  {totalAdjustments < 0 ? '-' : '+'}$
                  {Math.abs(totalAdjustments || 0).toFixed(2)}
                </Text>
              </View>
            )}
            <View style={styles.totalsContainer}>
              <Text style={[styles.totalsText, styles.totalLabel]}>Total:</Text>
              <Text style={[styles.totalsValue, styles.totalValue]}>
                ${(total || 0).toFixed(2)}
              </Text>
            </View>

            {/* Mostrar desglose de pago cuando hay pre-pago registrado */}
            {!isEditMode && prepaymentId && (
              <>
                <View style={styles.prepaymentSection}>
                  <View style={styles.prepaymentHeader}>
                    <Text style={styles.prepaymentTitle}>
                      Prepago registrado
                    </Text>
                    <View style={styles.prepaymentActions}>
                      <IconButton
                        icon="pencil"
                        size={28}
                        iconColor={theme.colors.primary}
                        onPress={() => setShowPrepaymentModal(true)}
                        style={styles.prepaymentIconButton}
                      />
                      <IconButton
                        icon="delete"
                        size={28}
                        iconColor={theme.colors.error}
                        onPress={handleDeletePrepayment}
                        style={styles.prepaymentIconButton}
                      />
                    </View>
                  </View>
                  <View style={styles.totalsContainer}>
                    <Text style={styles.totalsText}>Monto pagado:</Text>
                    <Text style={[styles.totalsValue, { color: '#4CAF50' }]}>
                      ${parseFloat(paymentAmount || '0').toFixed(2)}
                    </Text>
                  </View>
                  {/* Mostrar advertencia si el prepago excede el total */}
                  {parseFloat(paymentAmount || '0') > total && (
                    <View style={styles.prepaymentWarning}>
                      <IconButton
                        icon="alert-circle"
                        size={16}
                        iconColor={theme.colors.error}
                        style={{ margin: 0 }}
                      />
                      <Text style={styles.prepaymentWarningText}>
                        El prepago excede el total de la orden. Edite el pago
                        antes de continuar.
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.totalsContainer}>
                  <Text style={[styles.totalsText, { fontWeight: '600' }]}>
                    Restante:
                  </Text>
                  <Text
                    style={[
                      styles.totalsValue,
                      {
                        fontWeight: 'bold',
                        color:
                          total - parseFloat(paymentAmount || '0') <= 0
                            ? '#4CAF50'
                            : theme.colors.error,
                      },
                    ]}
                  >
                    $
                    {Math.max(
                      0,
                      total - parseFloat(paymentAmount || '0'),
                    ).toFixed(2)}
                  </Text>
                </View>
              </>
            )}

            {/* Mostrar información de pagos solo en modo edición */}
            {isEditMode && (
              <>
                <View style={styles.totalsContainer}>
                  <Text style={styles.totalsText}>Pagado:</Text>
                  <Text style={[styles.totalsValue, { color: '#4CAF50' }]}>
                    ${(totalPaid || 0).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.totalsContainer}>
                  <Text style={[styles.totalsText, { fontWeight: 'bold' }]}>
                    Restante:
                  </Text>
                  <Text
                    style={[
                      styles.totalsValue,
                      {
                        fontWeight: 'bold',
                        color:
                          pendingAmount > 0 ? theme.colors.error : '#4CAF50',
                      },
                    ]}
                  >
                    ${(pendingAmount || 0).toFixed(2)}
                  </Text>
                </View>
              </>
            )}
          </ScrollView>

          {/* Botón de pago - solo mostrar si es creación y el usuario tiene permisos y no hay pre-pago */}
          {!isEditMode && canRegisterPayments && !prepaymentId && (
            <View style={styles.paymentButtonContainer}>
              <Button
                mode="outlined"
                onPress={() => setShowPrepaymentModal(true)}
                style={styles.paymentButton}
                icon="credit-card"
              >
                💵 Registrar pago con la orden
              </Button>
            </View>
          )}

          <View style={styles.footer}>
            <Button
              mode="contained"
              onPress={handleConfirm}
              disabled={
                isConfirming || // Deshabilitar mientras se procesa
                items.length === 0 ||
                (orderType === OrderTypeEnum.DINE_IN &&
                  (!selectedAreaId ||
                    (isTemporaryTable
                      ? !temporaryTableName || temporaryTableName.trim() === ''
                      : !selectedTableId))) || // Usar Enum
                (orderType === OrderTypeEnum.TAKE_AWAY &&
                  (!deliveryInfo.recipientName ||
                    deliveryInfo.recipientName.trim() === '')) || // Usar Enum
                (orderType === OrderTypeEnum.DELIVERY &&
                  (!deliveryInfo.fullAddress ||
                    deliveryInfo.fullAddress.trim() === '')) || // Usar Enum
                (orderType === OrderTypeEnum.DELIVERY &&
                  (!deliveryInfo.recipientPhone ||
                    deliveryInfo.recipientPhone.trim() === '')) // Usar Enum
              }
              style={[
                styles.confirmButton,
                isEditMode &&
                  hasUnsavedChanges && {
                    backgroundColor: '#FF6B35', // Naranja vibrante para indicar acción requerida
                  },
              ]}
              loading={isConfirming} // Mostrar indicador de carga
            >
              {isConfirming
                ? isEditMode
                  ? 'Guardando...'
                  : 'Enviando...'
                : isEditMode
                  ? hasUnsavedChanges
                    ? '⚠️ Guardar Cambios'
                    : 'Guardar Cambios'
                  : 'Enviar Orden'}
            </Button>
          </View>

          {/* Modals */}
          <Portal>
            <DateTimePickerSafe
              visible={isTimePickerVisible}
              mode="time"
              value={scheduledTime}
              onConfirm={handleTimeConfirm}
              onCancel={hideTimePicker}
              minimumDate={new Date()}
              minuteInterval={5}
              title={
                orderType === OrderTypeEnum.DELIVERY
                  ? 'Seleccionar Hora de Entrega'
                  : orderType === OrderTypeEnum.TAKE_AWAY
                    ? 'Seleccionar Hora de Recolección'
                    : 'Seleccionar Hora'
              }
            />
          </Portal>

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

          {/* Modal de detalles de orden */}
          {isEditMode && (
            <OrderDetailModal
              visible={showDetailModal}
              onDismiss={() => setShowDetailModal(false)}
              orderId={orderId}
              orderNumber={orderNumber}
              orderData={orderData}
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
                  backgroundColor: hasUnsavedChanges
                    ? '#9CA3AF' // Gris sólido pero visible
                    : pendingAmount <= 0
                      ? '#4CAF50'
                      : theme.colors.primary,
                },
              ]}
              color="white"
              onPress={() => {
                if (hasUnsavedChanges) {
                  showSnackbar({
                    message:
                      'Debes guardar los cambios antes de registrar pagos',
                    type: 'warning',
                  });
                } else {
                  setShowPaymentModal(true);
                }
              }}
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
              onOrderCompleted={() => {
                // Cerrar el modal de pagos
                setShowPaymentModal(false);
                // Cerrar el modal de edición de orden
                onClose?.();
              }}
            />
          )}

          {/* Modal de ajustes */}
          {showAdjustmentModal && isEditMode && (
            <AdjustmentFormModal
              visible={showAdjustmentModal}
              onDismiss={() => {
                setShowAdjustmentModal(false);
                setAdjustmentToEdit(null);
              }}
              onSave={(adjustment: OrderAdjustment) => {
                if (adjustmentToEdit) {
                  handleUpdateAdjustment(adjustmentToEdit.id!, adjustment);
                } else {
                  handleAddAdjustment(adjustment);
                }
                setShowAdjustmentModal(false);
                setAdjustmentToEdit(null);
              }}
              adjustment={adjustmentToEdit}
              orderSubtotal={subtotal}
            />
          )}

          {/* Modal de pago para pre-pagos */}
          <PaymentModal
            visible={showPrepaymentModal}
            onDismiss={() => setShowPrepaymentModal(false)}
            orderTotal={total}
            mode="prepayment"
            onPrepaymentCreated={handlePrepaymentCreated}
            existingPrepaymentId={prepaymentId || undefined}
            onPrepaymentDeleted={handlePrepaymentDeleted}
          />

          {/* Modal de confirmación para eliminar prepago */}
          <ConfirmationModal
            visible={showDeletePrepaymentConfirm}
            onDismiss={() => setShowDeletePrepaymentConfirm(false)}
            title="¿Eliminar prepago?"
            message="¿Estás seguro de que deseas eliminar este prepago? Esta acción no se puede deshacer."
            confirmText="Eliminar"
            cancelText="Cancelar"
            onConfirm={confirmDeletePrepayment}
            onCancel={() => setShowDeletePrepaymentConfirm(false)}
          />
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
    },
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
    recipientPhoneError: {
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
    paymentConfigButton: {
      marginTop: theme.spacing.s,
    },
    paymentButtonContainer: {
      paddingHorizontal: theme.spacing.s,
      paddingVertical: theme.spacing.m,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
    },
    paymentButton: {
      marginVertical: theme.spacing.xs,
    },
    paymentValueContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    editPaymentButton: {
      margin: 0,
      marginLeft: theme.spacing.xs,
      width: 28,
      height: 28,
    },
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.s,
      marginBottom: theme.spacing.xs,
    },
    checkboxLabel: {
      fontSize: 16,
      marginLeft: theme.spacing.xs,
      color: theme.colors.onSurface,
    },
    temporaryTableInputContainer: {
      marginTop: theme.spacing.xs,
      marginBottom: theme.spacing.s,
    },
    prepaymentSection: {
      marginBottom: theme.spacing.s,
      paddingHorizontal: theme.spacing.xs,
    },
    prepaymentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    prepaymentTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    prepaymentActions: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
    prepaymentIconButton: {
      margin: 0,
    },
    prepaymentWarning: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.errorContainer,
      padding: theme.spacing.s,
      borderRadius: theme.roundness,
      marginTop: theme.spacing.xs,
      marginBottom: theme.spacing.xs,
    },
    prepaymentWarningText: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.onErrorContainer,
      marginLeft: theme.spacing.xs,
    },
    errorModalContent: {
      backgroundColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.m,
    },
    errorModalContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness * 3,
      padding: theme.spacing.xl,
      alignItems: 'center',
      width: '90%',
      maxWidth: 400,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    errorIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.m,
    },
    errorModalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: theme.spacing.s,
      textAlign: 'center',
    },
    errorModalMessage: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: theme.spacing.l,
      lineHeight: 22,
    },
    errorModalButton: {
      marginTop: theme.spacing.m,
      minWidth: 120,
    },
    errorModalButtonContent: {
      paddingHorizontal: theme.spacing.l,
    },
    errorModalButtonLabel: {
      fontSize: 16,
    },
  });
export default OrderCartDetail;
