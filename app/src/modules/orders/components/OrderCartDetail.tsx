<<<<<<< HEAD
import React, { useMemo, useEffect, useCallback } from 'react';
=======
import React, {
  useMemo,
  useEffect,
  useCallback,
  useState,
  useRef,
} from 'react';
>>>>>>> 5c79eb0af123293a14dc286c7854e3d77055395b
import { Portal } from 'react-native-paper';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
<<<<<<< HEAD
import {
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
=======
import { GestureHandlerRootView } from 'react-native-gesture-handler';
>>>>>>> 5c79eb0af123293a14dc286c7854e3d77055395b
import {
  Text,
  Divider,
  Button,
  Menu,
  IconButton,
  Modal,
} from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
<<<<<<< HEAD
import { OrderTypeEnum, type OrderType } from '../types/orders.types';
import { useGetAreas } from '@/modules/areasTables/services/areaService';
import type { DeliveryInfo } from '../../../app/schemas/domain/delivery-info.schema';
import OrderHeader from './OrderHeader';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useGetTablesByArea } from '@/modules/areasTables/services/tableService';
=======
import { OrderTypeEnum } from '../types/orders.types';
import type { OrderAdjustment } from '../schema/adjustments.schema';
import { OrderStatusInfo, PreparationStatusInfo } from '../utils/formatters';
import OrderHeader from './OrderHeader';
>>>>>>> 5c79eb0af123293a14dc286c7854e3d77055395b
import { canRegisterPayments as checkCanRegisterPayments } from '@/app/utils/roleUtils';
import {
  useOrderStore,
  CartItem,
  CartItemModifier,
<<<<<<< HEAD
} from '../stores/useOrderCreationStore';
import { useAuthStore } from '@/app/store/authStore';
import { useSnackbarStore } from '@/app/store/snackbarStore';
import { useGetOrderByIdQuery } from '../hooks/useOrdersQueries';
import { useGetOrderMenu } from '../hooks/useMenuQueries';
import { FAB } from 'react-native-paper';
import type { OrderAdjustment } from '../types/adjustments.types';
import { useGetPaymentsByOrderIdQuery } from '../hooks/usePaymentQueries';
import type { SelectedPizzaCustomization } from '@/app/schemas/domain/order.schema';

import { useOrderType } from '../hooks/useOrderType';
import { useOrderCalculations } from '../hooks/useOrderCalculations';
import { useOrderValidation } from '../hooks/useOrderValidation';
import { useOrderEditing } from '../hooks/useOrderEditing';
import { usePrepayment } from '../hooks/usePrepayment';
import { useOrderState } from '../hooks/useOrderState';
import { useOrderDataLoader } from '../hooks/useOrderDataLoader';
import { 
  OrderTypeSelector, 
  DineInForm, 
  TakeAwayForm, 
  DeliveryForm,
  OrderItemsList,
  OrderAdjustments,
  PrepaymentSection,
  ModalsContainer
} from './order-cart';

import type {
  OrderItemDtoForBackend,
} from '../types/update-order.types';

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

const formatOrderStatus = (status: string): string => {
  switch (status) {
    case 'PENDING':
      return 'Pendiente';
    case 'IN_PROGRESS':
      return 'En Progreso';
    case 'IN_PREPARATION':
      return 'En Preparación';
    case 'READY':
      return 'Lista';
    case 'DELIVERED':
      return 'Entregada';
    case 'COMPLETED':
      return 'Completada';
    case 'CANCELLED':
      return 'Cancelada';
    default:
      return status;
  }
};

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
=======
  useOrderSubtotal,
  useOrderTotal,
  useOrderItemsCount,
  useIsOrderEmpty,
  OrderDetailsForBackend,
} from '../stores/useOrderStore';
import { useAuthStore } from '@/app/store/authStore';
import { useSnackbarStore } from '@/app/store/snackbarStore';
import { useGetOrderByIdQuery } from '../hooks/useOrdersQueries';
import { FAB } from 'react-native-paper';
import { useGetPaymentsByOrderIdQuery } from '../hooks/usePaymentQueries';
import type { SelectedPizzaCustomization } from '@/app/schemas/domain/order.schema';

import {
  OrderTypeSelector,
  DineInForm,
  DineInFormRef,
  TakeAwayForm,
  TakeAwayFormRef,
  DeliveryForm,
  DeliveryFormRef,
  OrderItemsList,
  OrderAdjustments,
  PrepaymentSection,
  ModalsContainer,
} from './order-cart';
import { modalHelpers } from '../stores/useModalStore';
>>>>>>> 5c79eb0af123293a14dc286c7854e3d77055395b

interface OrderCartDetailProps {
  visible: boolean;
  onConfirmOrder: (details: OrderDetailsForBackend) => void;
  onClose?: () => void;
  onEditItem?: (item: CartItem) => void;
  isEditMode?: boolean;
  orderId?: string | null;
  orderNumber?: number;
  orderDate?: Date;
  onCancelOrder?: () => void;
  navigation?: any;
  onAddProducts?: () => void;
<<<<<<< HEAD
  pendingProductsToAdd?: CartItem[];
  onItemsCountChanged?: (count: number) => void;
}

const getOrderStatusColor = (status: string, theme: any) => {
  switch (status) {
    case 'PENDING':
      return '#FFA000';
    case 'IN_PROGRESS':
      return theme.colors.primary;
    case 'IN_PREPARATION':
      return '#FF6B35';
    case 'READY':
      return '#4CAF50';
    case 'DELIVERED':
      return theme.colors.tertiary;
    case 'COMPLETED':
      return '#10B981';
    case 'CANCELLED':
      return theme.colors.error;
    default:
      return theme.colors.onSurfaceVariant;
  }
};

=======
}

>>>>>>> 5c79eb0af123293a14dc286c7854e3d77055395b
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
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

<<<<<<< HEAD
=======
  // Referencias a los formularios
  const dineInFormRef = useRef<DineInFormRef>(null);
  const takeAwayFormRef = useRef<TakeAwayFormRef>(null);
  const deliveryFormRef = useRef<DeliveryFormRef>(null);

  const {
    items,
    orderType,
    selectedAreaId,
    selectedTableId,
    isTemporaryTable,
    temporaryTableName,
    scheduledTime,
    deliveryInfo,
    orderNotes,
    adjustments,
    prepaymentId,
    prepaymentAmount: paymentAmount,
    prepaymentMethod: paymentMethod,
    isCartVisible,
    hasUnsavedChanges,
    isLoading: storeIsLoading,
    isConfirming,
    orderDataLoaded,
    setOrderType,
    setSelectedAreaId,
    setSelectedTableId,
    setIsTemporaryTable,
    setTemporaryTableName,
    setScheduledTime,
    setDeliveryInfo,
    setOrderNotes,
    setAdjustments,
    setPrepaymentId,
    setPrepaymentAmount,
    setPrepaymentMethod,
    removeItem: removeCartItem,
    updateItemQuantity: updateCartItemQuantity,
    updateItem: updateCartItem,
    addItem,
    loadOrderForEditing,
    resetOrder,
    setIsConfirming,
    checkForUnsavedChanges,
    addAdjustment,
    updateAdjustment,
    removeAdjustment,
    confirmOrder,
  } = useOrderStore();

  const subtotal = useOrderSubtotal();
  const total = useOrderTotal();
  const totalItemsCount = useOrderItemsCount();
  const isCartEmpty = useIsOrderEmpty();

>>>>>>> 5c79eb0af123293a14dc286c7854e3d77055395b
  const {
    data: orderData,
    isLoading: isLoadingOrder,
    isError: isErrorOrder,
  } = useGetOrderByIdQuery(orderId, {
    enabled: isEditMode && !!orderId && visible,
  });

<<<<<<< HEAD
  const { data: menu } = useGetOrderMenu();

=======
>>>>>>> 5c79eb0af123293a14dc286c7854e3d77055395b
  const { data: payments = [] } = useGetPaymentsByOrderIdQuery(orderId || '', {
    enabled: isEditMode && !!orderId && visible,
  });

<<<<<<< HEAD
  // Consolidate all states using useOrderState hook
  const {
    // States
    editItems,
    editOrderType,
    editSelectedAreaId,
    editSelectedTableId,
    editScheduledTime,
    editDeliveryInfo,
    editOrderNotes,
    editAdjustments,
    editIsTemporaryTable,
    editTemporaryTableName,
    processedPendingProductsIds,
    orderDataLoaded,
    isTimePickerVisible,
    isTimeAlertVisible,
    isConfirming,
    showExitConfirmation,
    isModalReady,
    showOptionsMenu,
    showCancelConfirmation,
    showModifyInProgressConfirmation,
    pendingModifyAction,
    modifyingItemName,
    showHistoryModal,
    showDetailModal,
    showPaymentModal,
    showAdjustmentModal,
    adjustmentToEdit,
    hasUnsavedChanges,
    originalOrderState,
    lastNotifiedCount,
    // Setters
    setEditItems,
    setEditOrderType,
    setEditSelectedAreaId,
    setEditSelectedTableId,
    setEditScheduledTime,
    setEditDeliveryInfo,
    setEditOrderNotes,
    setEditAdjustments,
    setEditIsTemporaryTable,
    setEditTemporaryTableName,
    setProcessedPendingProductsIds,
    setOrderDataLoaded,
    setTimeAlertVisible,
    setIsConfirming,
    setShowExitConfirmation,
    setIsModalReady,
    setShowOptionsMenu,
    setShowCancelConfirmation,
    setShowModifyInProgressConfirmation,
    setPendingModifyAction,
    setModifyingItemName,
    setShowHistoryModal,
    setShowDetailModal,
    setShowPaymentModal,
    setShowAdjustmentModal,
    setAdjustmentToEdit,
    setHasUnsavedChanges,
    setOriginalOrderState,
    setLastNotifiedCount,
    // Helper functions
    resetEditModeStates,
    showTimePicker,
    hideTimePicker,
  } = useOrderState();

  const orderCreationStore = useOrderCreationStore();

  const cartItems = !isEditMode ? orderCreationStore.items : [];
  const removeCartItem = !isEditMode ? orderCreationStore.removeItem : () => {};
  const updateCartItemQuantity = !isEditMode
    ? orderCreationStore.updateItemQuantity
    : () => {};
  const isCartVisible = !isEditMode ? orderCreationStore.isCartVisible : false;

  const cartOrderType = !isEditMode
    ? orderCreationStore.orderType
    : OrderTypeEnum.DINE_IN;
  const setCartOrderType = !isEditMode
    ? orderCreationStore.setOrderType
    : () => {};
  const cartSelectedAreaId = !isEditMode
    ? orderCreationStore.selectedAreaId
    : null;
  const setCartSelectedAreaId = !isEditMode
    ? orderCreationStore.setSelectedAreaId
    : () => {};
  const cartSelectedTableId = !isEditMode
    ? orderCreationStore.selectedTableId
    : null;
  const setCartSelectedTableId = !isEditMode
    ? orderCreationStore.setSelectedTableId
    : () => {};
  const cartIsTemporaryTable = !isEditMode
    ? orderCreationStore.isTemporaryTable
    : false;
  const setCartIsTemporaryTable = !isEditMode
    ? orderCreationStore.setIsTemporaryTable
    : () => {};
  const cartTemporaryTableName = !isEditMode
    ? orderCreationStore.temporaryTableName
    : '';
  const setCartTemporaryTableName = !isEditMode
    ? orderCreationStore.setTemporaryTableName
    : () => {};
  const cartScheduledTime = !isEditMode
    ? orderCreationStore.scheduledTime
    : null;
  const setCartScheduledTime = !isEditMode
    ? orderCreationStore.setScheduledTime
    : () => {};
  const cartDeliveryInfo = !isEditMode ? orderCreationStore.deliveryInfo : {};
  const setCartDeliveryInfo = orderCreationStore.setDeliveryInfo;
  const cartOrderNotes = orderCreationStore.orderNotes;
  const setCartOrderNotes = orderCreationStore.setOrderNotes;

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
=======
  const validateOrder = () => {
    let isValid = true;

    switch (orderType) {
      case OrderTypeEnum.DINE_IN:
        if (dineInFormRef.current) {
          const dineInValid = dineInFormRef.current.validate();
          isValid = isValid && dineInValid;
        }
        break;

      case OrderTypeEnum.TAKE_AWAY:
        if (takeAwayFormRef.current) {
          const takeAwayValid = takeAwayFormRef.current.validate();
          isValid = isValid && takeAwayValid;
        }
        break;

      case OrderTypeEnum.DELIVERY:
        if (deliveryFormRef.current) {
          const deliveryValid = deliveryFormRef.current.validate();
          isValid = isValid && deliveryValid;
        }
        break;
    }

    return isValid;
  };

  const [editingItemFromList, setEditingItemFromList] =
    useState<CartItem | null>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [adjustmentToEdit, setAdjustmentToEdit] = useState<any>(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [isModalReady, setIsModalReady] = useState(false);

  // Calcular totales
  const totalAdjustments = useMemo(() => {
    return adjustments.reduce((sum, adj) => sum + (adj.amount || 0), 0);
  }, [adjustments]);

  const totalPaid = useMemo(() => {
    if (!isEditMode || !payments) return 0;
    return payments.reduce(
      (sum, payment) => sum + parseFloat(payment.amount),
      0,
    );
  }, [payments, isEditMode]);

  const pendingAmount = useMemo(() => {
    return total - totalPaid;
  }, [total, totalPaid]);

  const showTimePicker = () => {
    modalHelpers.showTimePicker({
      scheduledTime,
      orderType,
      onTimeConfirm: handleTimeConfirm,
      hideTimePicker: modalHelpers.hideModal,
    });
  };

  const handleEditCartItem = (item: CartItem) => {
    setEditingItemFromList(item);
    if (onEditItem) {
      onEditItem(item);
    } else {
      // Si no hay onEditItem, mostrar modal de personalización directamente
      modalHelpers.showProductCustomization({
        editingProduct: editingProduct,
        editingItemFromList: item,
        clearEditingState,
        handleUpdateEditedItem,
      });
    }
  };

  const clearEditingState = () => {
    setEditingItemFromList(null);
    setEditingProduct(null);
  };

  const handlePrepaymentCreated = useCallback(
    (id: string, amount: string, method: 'CASH' | 'CARD' | 'TRANSFER') => {
      if (!isEditMode) {
        setPrepaymentId(id);
        setPrepaymentAmount(amount);
        setPrepaymentMethod(method);
      }
    },
    [isEditMode, setPrepaymentId, setPrepaymentAmount, setPrepaymentMethod],
  );

  const handlePrepaymentDeleted = useCallback(() => {
    if (!isEditMode) {
      setPrepaymentId(null);
      setPrepaymentAmount('');
      setPrepaymentMethod(null);
    }
  }, [isEditMode, setPrepaymentId, setPrepaymentAmount, setPrepaymentMethod]);

  const handleDeletePrepayment = () => {
    modalHelpers.showDeletePrepaymentConfirm({
      confirmDeletePrepayment: async () => {
        handlePrepaymentDeleted();
      },
    });
  };

  const { user } = useAuthStore();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);
>>>>>>> 5c79eb0af123293a14dc286c7854e3d77055395b

  const { cleanOrderDataForType } = useOrderType({
    isEditMode,
    initialOrderType: orderType,
    onOrderTypeChange: setOrderType,
  });

  const {
    subtotal,
    adjustmentTotal: totalAdjustments,
    total,
    totalPaid,
    remainingAmount: pendingAmount,
  } = useOrderCalculations({
    items,
    adjustments,
    payments,
  });

  const {
    areaError,
    tableError,
    recipientNameError,
    recipientPhoneError,
    addressError,
    setAreaError,
    setTableError,
    setRecipientNameError,
    setRecipientPhoneError,
    setAddressError,
    validateOrder,
    clearAllErrors,
  } = useOrderValidation({
    orderType,
    items,
    selectedAreaId,
    selectedTableId,
    isTemporaryTable,
    temporaryTableName,
    deliveryInfo,
  });

  const {
    editingItemFromList,
    editingProduct,
    handleEditCartItem,
    clearEditingState,
  } = useOrderEditing({
    isEditMode,
    onEditItem,
  });

  // Hook para manejo de prepagos
  const {
    prepaymentId,
    paymentAmount,
    paymentMethod,
    showPrepaymentModal,
    showDeletePrepaymentConfirm,
    setShowPrepaymentModal,
    setShowDeletePrepaymentConfirm,
    handlePrepaymentCreated,
    handleDeletePrepayment,
    confirmDeletePrepayment,
    handlePrepaymentDeleted,
  } = usePrepayment({
    initialPrepaymentId: null,
    initialPaymentAmount: '',
    initialPaymentMethod: 'CASH',
  });

  const { user } = useAuthStore();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  const removeItem = useCallback(
    (itemId: string) => {
      if (isEditMode) {
        const item = items.find((i) => i.id === itemId);
        if (!item) return;

        if (
          item.preparationStatus === 'READY' ||
          item.preparationStatus === 'DELIVERED'
        ) {
          showSnackbar({
            message: `No se puede eliminar un producto ${PreparationStatusInfo.getLabel(item.preparationStatus || '').toLowerCase()}`,
            type: 'error',
          });
          return;
        }

        if (item.preparationStatus === 'IN_PROGRESS') {
<<<<<<< HEAD
          setModifyingItemName(item.productName);
          setPendingModifyAction(() => () => {
            setEditItems((prev) => prev.filter((i) => i.id !== itemId));
=======
          modalHelpers.showModifyInProgressConfirmation({
            modifyingItemName: item.productName,
            pendingModifyAction: () => removeCartItem(itemId),
            setPendingModifyAction: () => {},
            setModifyingItemName: () => {},
>>>>>>> 5c79eb0af123293a14dc286c7854e3d77055395b
          });
        } else {
<<<<<<< HEAD
          setEditItems((prev) => prev.filter((i) => i.id !== itemId));
=======
          removeCartItem(itemId);
>>>>>>> 5c79eb0af123293a14dc286c7854e3d77055395b
        }
      } else {
        removeCartItem(itemId);
      }
    },
    [isEditMode, items, showSnackbar, removeCartItem],
  );

  const updateItemQuantity = useCallback(
    (itemId: string, quantity: number) => {
      if (isEditMode) {
        if (quantity <= 0) {
          removeItem(itemId);
          return;
        }

        const item = items.find((i) => i.id === itemId);
        if (!item) return;

        if (
          item.preparationStatus === 'READY' ||
          item.preparationStatus === 'DELIVERED'
        ) {
          showSnackbar({
            message: `No se puede modificar un producto ${PreparationStatusInfo.getLabel(item.preparationStatus || '').toLowerCase()}`,
            type: 'error',
          });
          return;
        }

        const updateQuantity = () => {
          updateCartItemQuantity(itemId, quantity);
        };

        if (item.preparationStatus === 'IN_PROGRESS') {
<<<<<<< HEAD
          setModifyingItemName(item.productName);
          setPendingModifyAction(() => updateQuantity);
          setShowModifyInProgressConfirmation(true);
=======
          modalHelpers.showModifyInProgressConfirmation({
            modifyingItemName: item.productName,
            pendingModifyAction: updateQuantity,
            setPendingModifyAction: () => {},
            setModifyingItemName: () => {},
          });
>>>>>>> 5c79eb0af123293a14dc286c7854e3d77055395b
        } else {
          updateQuantity();
        }
      } else {
        updateCartItemQuantity(itemId, quantity);
      }
    },
    [isEditMode, items, removeItem, showSnackbar, updateCartItemQuantity],
  );

<<<<<<< HEAD
  const totalItemsCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const existingItemsCount = useMemo(() => {
    if (!isEditMode) return 0;
    return editItems
      .filter((item) => !item.id.startsWith('new-'))
      .reduce((sum, item) => sum + item.quantity, 0);
  }, [isEditMode, editItems]);

  useEffect(() => {
    if (isEditMode && onItemsCountChanged && visible && orderDataLoaded) {
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

=======
>>>>>>> 5c79eb0af123293a14dc286c7854e3d77055395b
  const canRegisterPayments = useMemo(() => {
    return checkCanRegisterPayments(user);
  }, [user]);

<<<<<<< HEAD
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

  // Use the order data loader hook
  const { findModifierById } = useOrderDataLoader({
    isEditMode,
    orderData,
    visible,
    setEditOrderType,
    setEditSelectedTableId,
    setEditScheduledTime,
    setEditDeliveryInfo,
    setEditOrderNotes,
    setEditAdjustments,
    setEditSelectedAreaId,
    setEditIsTemporaryTable,
    setEditTemporaryTableName,
    setEditItems,
    setOrderDataLoaded,
    setOriginalOrderState,
    setHasUnsavedChanges,
  });

=======
>>>>>>> 5c79eb0af123293a14dc286c7854e3d77055395b
  const groupIdenticalItems = useCallback((items: CartItem[]): CartItem[] => {
    const groupedMap = new Map<string, CartItem>();

    items.forEach((item) => {
      const modifierIds = item.modifiers
        .map((m) => m.id)
        .sort()
        .join(',');

      const pizzaCustomizationIds = item.selectedPizzaCustomizations
        ? item.selectedPizzaCustomizations
            .map((pc) => `${pc.pizzaCustomizationId}-${pc.half}-${pc.action}`)
            .sort()
            .join(',')
        : '';

      const groupKey = `${item.productId}-${item.variantId || 'null'}-${modifierIds}-${pizzaCustomizationIds}-${item.preparationNotes || ''}-${item.preparationStatus || 'PENDING'}`;

      const existingItem = groupedMap.get(groupKey);

      if (existingItem) {
        existingItem.quantity += item.quantity;
        const modifiersPrice = existingItem.modifiers.reduce(
          (sum, mod) => sum + (mod.price || 0),
          0,
        );
        existingItem.totalPrice =
          (existingItem.unitPrice + modifiersPrice) * existingItem.quantity;

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
        groupedMap.set(groupKey, { ...item });
      }
    });

    const result = Array.from(groupedMap.values());

    return result;
  }, []);

<<<<<<< HEAD
  useEffect(() => {
    if (
      pendingProductsToAdd.length > 0 &&
      isEditMode &&
      visible &&
      orderDataLoaded
    ) {
      const unprocessedProducts = pendingProductsToAdd.filter((item) => {
        const productKey = `${item.productId}-${item.variantId || 'null'}-${JSON.stringify(item.modifiers.map((m) => m.id).sort())}-${item.preparationNotes || ''}`;
        return !processedPendingProductsIds.includes(productKey);
      });

      if (unprocessedProducts.length > 0) {
        const newProductsWithStatus = unprocessedProducts.map((item) => ({
          ...item,
          preparationStatus: 'NEW' as const,
          id: `new-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
        }));

        setEditItems((prevItems) => {
          const allItems = [...prevItems, ...newProductsWithStatus];
          const grouped = groupIdenticalItems(allItems);

          return grouped;
        });

        const newProcessedIds = unprocessedProducts.map(
          (item) =>
            `${item.productId}-${item.variantId || 'null'}-${JSON.stringify(item.modifiers.map((m) => m.id).sort())}-${item.preparationNotes || ''}`,
        );
        setProcessedPendingProductsIds((prev) => [...prev, ...newProcessedIds]);

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

  useEffect(() => {
    clearAllErrors();
  }, [orderType, clearAllErrors]);

  useEffect(() => {
    if (!isEditMode || !originalOrderState || !visible) {
      setHasUnsavedChanges(false);
      return;
    }

    const hasChanges =
      JSON.stringify(editItems) !== JSON.stringify(originalOrderState.items) ||
      editOrderType !== originalOrderState.orderType ||
      editSelectedTableId !== originalOrderState.tableId ||
      editIsTemporaryTable !== originalOrderState.isTemporaryTable ||
      editTemporaryTableName !== originalOrderState.temporaryTableName ||
      JSON.stringify(editDeliveryInfo) !==
        JSON.stringify(originalOrderState.deliveryInfo) ||
      editOrderNotes !== originalOrderState.notes ||
      (editScheduledTime?.getTime() ?? null) !==
        (originalOrderState.scheduledAt?.getTime() ?? null) ||
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
    editIsTemporaryTable,
    editTemporaryTableName,
    editDeliveryInfo,
    editOrderNotes,
    editScheduledTime,
    editAdjustments,
  ]);

  useEffect(() => {
    if (!visible && isEditMode) {
      resetEditModeStates();
      clearEditingState();
    }
  }, [visible, isEditMode, resetEditModeStates, clearEditingState]);
=======
  useEffect(() => {
    if (!visible && isEditMode) {
      clearEditingState();
    }
  }, [visible, isEditMode, clearEditingState]);
>>>>>>> 5c79eb0af123293a14dc286c7854e3d77055395b

  useEffect(() => {
    if (visible && !isModalReady) {
      const timer = setTimeout(() => {
        setIsModalReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [visible, isModalReady]);

  const handleAddAdjustment = useCallback(
    (adjustment: OrderAdjustment) => {
      if (isEditMode) {
<<<<<<< HEAD
        const newAdjustment = {
          ...adjustment,
          id:
            adjustment.id ||
            `new-adjustment-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
          isNew: true,
        };
        setEditAdjustments((prev) => [...prev, newAdjustment]);
=======
        addAdjustment(adjustment);
>>>>>>> 5c79eb0af123293a14dc286c7854e3d77055395b
      }
    },
    [isEditMode, addAdjustment],
  );

  const handleUpdateAdjustment = useCallback(
    (id: string, updatedAdjustment: OrderAdjustment) => {
      if (isEditMode) {
        updateAdjustment(id, updatedAdjustment);
      }
    },
    [isEditMode, updateAdjustment],
  );

  const handleRemoveAdjustment = useCallback(
    (id: string) => {
      if (isEditMode) {
        removeAdjustment(id);
      }
    },
<<<<<<< HEAD
    [isEditMode],
  );

  const handleConfirm = async () => {
    if (isConfirming) return;

    // Validar que haya items
    if (items.length === 0) {
      showSnackbar({
        message: 'No hay productos en el carrito',
=======
    [isEditMode, removeAdjustment],
  );

  const handleConfirm = async () => {
    if (!user?.id) {
      showSnackbar({
        message: 'Error: No se pudo identificar el usuario',
>>>>>>> 5c79eb0af123293a14dc286c7854e3d77055395b
        type: 'error',
      });
      return;
    }

<<<<<<< HEAD
    // Validar prepago si existe
    if (!isEditMode && prepaymentId && parseFloat(paymentAmount || '0') > total) {
      showSnackbar({
        message: 'El prepago excede el total de la orden. Por favor edite el pago antes de continuar.',
        type: 'error',
      });
      return;
    }

    // Validar y mostrar errores específicos
    if (!validateOrder()) {
      // Los errores ya se establecen en el hook validateOrder
      // Mostrar un mensaje general si hay errores
      showSnackbar({
        message: 'Por favor complete todos los campos requeridos',
        type: 'error',
      });
      return;
    }

    const cleanedData = cleanOrderDataForType(
      orderType,
      deliveryInfo,
      selectedTableId,
      selectedAreaId,
      isTemporaryTable,
      temporaryTableName,
    );

    const itemsForBackend: OrderItemDtoForBackend[] = [];

    items.forEach((item: CartItem) => {
      if (isEditMode && item.id && !item.id.startsWith('new-')) {
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

    let formattedPhone: string | undefined = undefined;
    if (
      cleanedData.deliveryInfo.recipientPhone &&
      cleanedData.deliveryInfo.recipientPhone.trim() !== ''
    ) {
      formattedPhone = cleanedData.deliveryInfo.recipientPhone.trim();
    }

    const orderDetails: OrderDetailsForBackend = {
      userId: user?.id,
      orderType,
      subtotal,
      total,
      items: itemsForBackend,
      tableId: cleanedData.tableId,
      isTemporaryTable: cleanedData.isTemporaryTable,
      temporaryTableName: cleanedData.temporaryTableName,
      temporaryTableAreaId: cleanedData.temporaryTableAreaId,
      scheduledAt: scheduledTime ? scheduledTime : undefined,
      deliveryInfo: {
        ...cleanedData.deliveryInfo,
        recipientPhone: formattedPhone,
      },
      notes: orderNotes || undefined,
      adjustments: isEditMode
        ? editAdjustments
            .filter((adj) => !adj.isDeleted)
            .map((adj) => {
              return {
                orderId: orderId || undefined,
                name: adj.name,
                isPercentage: adj.isPercentage,
                value: adj.value,
                amount: adj.amount,
              };
            })
        : undefined,
    };

    if (!orderDetails.userId) {
      showSnackbar({
        message: 'Error: No se pudo identificar el usuario',
        type: 'error',
      });
      return;
    }

    setIsConfirming(true);

    if (!isEditMode && prepaymentId) {
      orderDetails.prepaymentId = prepaymentId;
    }

=======
    if (!validateOrder()) {
      return;
    }

>>>>>>> 5c79eb0af123293a14dc286c7854e3d77055395b
    try {
      await confirmOrder(user.id, onConfirmOrder);

      if (isEditMode) {
        showSnackbar({
          message: 'Cambios guardados exitosamente',
          type: 'success',
        });
        onClose?.();
      }
    } catch (error) {
<<<<<<< HEAD
      setIsConfirming(false);
    }
  };

  const selectedAreaName = useMemo(
    () => areasData?.find((a: any) => a.id === selectedAreaId)?.name,
    [areasData, selectedAreaId],
  );
  const selectedTableName = useMemo(() => {
    return tablesData?.find((t) => t.id === selectedTableId)?.name;
  }, [tablesData, selectedTableId]);

  // showTimePicker and hideTimePicker are now provided by useOrderState hook

=======
      showSnackbar({
        message:
          error instanceof Error ? error.message : 'Error al procesar la orden',
        type: 'error',
      });
    }
  };

>>>>>>> 5c79eb0af123293a14dc286c7854e3d77055395b
  const handleTimeConfirm = (date: Date) => {
    const now = new Date();
    now.setSeconds(0, 0);

    if (date < now) {
      modalHelpers.hideModal();
      modalHelpers.showTimeAlert();
    } else {
      setScheduledTime(date);
      modalHelpers.hideModal();
    }
  };

<<<<<<< HEAD
  const formattedScheduledTime = useMemo(() => {
    if (!scheduledTime) return null;
    try {
      return format(scheduledTime, 'h:mm a').toLowerCase();
    } catch (error) {
      return 'Hora inválida';
    }
  }, [scheduledTime]);

=======
>>>>>>> 5c79eb0af123293a14dc286c7854e3d77055395b
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

      updateCartItem(
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

      clearEditingState();
    },
<<<<<<< HEAD
    [isEditMode, clearEditingState],
=======
    [isEditMode, updateCartItem, clearEditingState],
>>>>>>> 5c79eb0af123293a14dc286c7854e3d77055395b
  );

  const renderFields = () => {
    switch (orderType) {
      case OrderTypeEnum.DINE_IN:
        return (
          <DineInForm
<<<<<<< HEAD
            selectedAreaId={selectedAreaId}
            selectedAreaName={selectedAreaName}
            selectedTableId={selectedTableId}
            selectedTableName={selectedTableName}
            isTemporaryTable={isTemporaryTable}
            temporaryTableName={temporaryTableName}
            orderNotes={orderNotes}
            formattedScheduledTime={formattedScheduledTime}
            areaError={areaError}
            tableError={tableError}
            areasData={areasData || []}
            tablesData={tablesData || []}
            isLoadingAreas={isLoadingAreas}
            isLoadingTables={isLoadingTables}
            errorAreas={errorAreas}
            errorTables={errorTables}
            isEditMode={isEditMode}
            orderData={orderData}
            onAreaSelect={(areaId) => {
              setSelectedAreaId(areaId);
              setSelectedTableId(null);
            }}
            onTableSelect={setSelectedTableId}
            onTemporaryTableToggle={setIsTemporaryTable}
            onTemporaryTableNameChange={setTemporaryTableName}
            onNotesChange={setOrderNotes}
            onScheduleTimePress={showTimePicker}
            onScheduleTimeClear={() => setScheduledTime(null)}
            setAreaError={setAreaError}
            setTableError={setTableError}
=======
            ref={dineInFormRef}
            onScheduleTimePress={showTimePicker}
>>>>>>> 5c79eb0af123293a14dc286c7854e3d77055395b
          />
        );
      case OrderTypeEnum.TAKE_AWAY:
        return (
          <TakeAwayForm
<<<<<<< HEAD
            deliveryInfo={deliveryInfo}
            orderNotes={orderNotes}
            formattedScheduledTime={formattedScheduledTime}
            recipientNameError={recipientNameError}
            recipientPhoneError={recipientPhoneError}
            onDeliveryInfoChange={setDeliveryInfo}
            onNotesChange={setOrderNotes}
            onScheduleTimePress={showTimePicker}
            onScheduleTimeClear={() => setScheduledTime(null)}
            setRecipientNameError={setRecipientNameError}
            setRecipientPhoneError={setRecipientPhoneError}
=======
            ref={takeAwayFormRef}
            onScheduleTimePress={showTimePicker}
>>>>>>> 5c79eb0af123293a14dc286c7854e3d77055395b
          />
        );
      case OrderTypeEnum.DELIVERY:
        return (
          <DeliveryForm
<<<<<<< HEAD
            deliveryInfo={deliveryInfo}
            orderNotes={orderNotes}
            formattedScheduledTime={formattedScheduledTime}
            addressError={addressError}
            recipientPhoneError={recipientPhoneError}
            onDeliveryInfoChange={setDeliveryInfo}
            onNotesChange={setOrderNotes}
            onScheduleTimePress={showTimePicker}
            onScheduleTimeClear={() => setScheduledTime(null)}
            setAddressError={setAddressError}
            setRecipientPhoneError={setRecipientPhoneError}
=======
            ref={deliveryFormRef}
            onScheduleTimePress={showTimePicker}
>>>>>>> 5c79eb0af123293a14dc286c7854e3d77055395b
          />
        );
      default:
        return null;
    }
  };

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

  if (isEditMode && isErrorOrder) {
    return (
      <Portal>
        <Modal
          visible={visible}
          onDismiss={onClose}
          contentContainerStyle={styles.errorModalContent}
        >
          <View style={styles.errorModalContainer}>
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
                style={styles.iconButtonNoMargin}
              />
            </View>

            <Text
              style={[
                styles.errorModalTitle,
                { color: theme.colors.onSurface },
              ]}
            >
              No se pudo cargar la orden
            </Text>

            <Text
              style={[
                styles.errorModalMessage,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Ha ocurrido un error al intentar cargar los datos de la orden. Por
              favor, intenta nuevamente más tarde.
            </Text>

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
            modalHelpers.showExitConfirmation({
              onClose,
            });
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
                        modalHelpers.showExitConfirmation({
                          onClose,
                        });
                      } else {
                        onClose?.();
                      }
                    }}
                    iconColor={theme.colors.onSurface}
                  />

                  <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>
                      {orderNumber && orderDate
                        ? `Editar Orden #${orderNumber} - ${format(orderDate, 'dd/MM/yyyy', { locale: es })}`
                        : orderNumber
                          ? `Editando Orden #${orderNumber}`
                          : 'Editar Orden'}
                    </Text>
                    {orderData?.orderStatus && (
                      <View
                        style={[
                          styles.orderStatusBadge,
                          {
                            backgroundColor: OrderStatusInfo.getColor(
                              orderData.orderStatus,
                              theme,
                            ),
                          },
                        ]}
                      >
                        <Text style={styles.orderStatusText}>
                          {OrderStatusInfo.getLabel(orderData.orderStatus)}
                        </Text>
                      </View>
                    )}
                  </View>

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
                        modalHelpers.showOrderDetail({
                          orderId,
                          orderNumber,
                          orderData,
                        });
                      }}
                      title="Ver Detalles"
                      leadingIcon="file-document-outline"
                    />
                    <Menu.Item
                      onPress={() => {
                        setShowOptionsMenu(false);
                        modalHelpers.showOrderHistory({
                          orderId,
                          orderNumber,
                        });
                      }}
                      title="Ver Historial"
                      leadingIcon="history"
                    />
                    <Menu.Item
                      onPress={() => {
                        setShowOptionsMenu(false);
                        modalHelpers.showCancelConfirmation({
                          orderNumber,
                          onCancelOrder,
                        });
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
                  onBackPress={() => {
                    if (!isEditMode && hasUnsavedChanges) {
                      modalHelpers.showExitConfirmation({
                        onClose,
                      });
                    } else {
                      onClose?.();
                    }
                  }}
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
            <OrderTypeSelector
              value={orderType}
              onValueChange={setOrderType}
              disabled={false}
            />

            {renderFields()}

            <Divider style={styles.divider} />

            <OrderItemsList
              items={items}
              isEditMode={isEditMode}
              onEditItem={handleEditCartItem}
              onRemoveItem={removeItem}
              onUpdateQuantity={updateItemQuantity}
            />

<<<<<<< HEAD

=======
>>>>>>> 5c79eb0af123293a14dc286c7854e3d77055395b
            {isEditMode && (
              <Button
                onPress={() => {
                  if (onAddProducts) {
                    onAddProducts();
                  } else if (navigation && orderId && orderNumber) {
                    try {
                      navigation.navigate('AddProductsToOrder', {
                        orderId,
                        orderNumber,
<<<<<<< HEAD
                        existingOrderItemsCount: editItems
=======
                        existingOrderItemsCount: items
>>>>>>> 5c79eb0af123293a14dc286c7854e3d77055395b
                          .filter((item) => !item.id.startsWith('new-'))
                          .reduce((sum, item) => sum + item.quantity, 0),
                        onProductsAdded: (newProducts: CartItem[]) => {
                          const newProductsWithStatus = newProducts.map(
                            (item) => ({
                              ...item,
                              preparationStatus: 'NEW' as const,
                              id: `new-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
                            }),
                          );

<<<<<<< HEAD
                          const allItems = [
                            ...editItems,
                            ...newProductsWithStatus,
                          ];
                          const groupedItems = groupIdenticalItems(allItems);
=======
                          newProductsWithStatus.forEach((item) => {
                            addItem(
                              {
                                id: item.productId,
                                name: item.productName,
                                price: item.unitPrice,
                              } as any,
                              item.quantity,
                              item.variantId,
                              item.modifiers,
                              item.preparationNotes,
                              item.selectedPizzaCustomizations,
                              item.pizzaExtraCost,
                            );
                          });
>>>>>>> 5c79eb0af123293a14dc286c7854e3d77055395b

                          showSnackbar({
                            message: `${newProducts.length} producto${newProducts.length > 1 ? 's' : ''} añadido${newProducts.length > 1 ? 's' : ''}`,
                            type: 'success',
                          });
                        },
                      });
<<<<<<< HEAD
                    } catch (error) {
                    }
=======
                    } catch (error) {}
>>>>>>> 5c79eb0af123293a14dc286c7854e3d77055395b
                  }
                }}
                mode="outlined"
                style={styles.addProductsButton}
                icon="plus-circle-outline"
              >
                Añadir Productos
              </Button>
            )}

            <Divider style={styles.divider} />

            {/* Sección de ajustes */}
            {isEditMode && (
              <OrderAdjustments
                adjustments={adjustments}
                subtotal={subtotal}
<<<<<<< HEAD
                onAddAdjustment={() => setShowAdjustmentModal(true)}
                onEditAdjustment={(adjustment) => {
                  setAdjustmentToEdit(adjustment);
                  setShowAdjustmentModal(true);
=======
                onAddAdjustment={() =>
                  modalHelpers.showAdjustment({
                    adjustmentToEdit: null,
                    setAdjustmentToEdit,
                    handleAddAdjustment,
                    handleUpdateAdjustment,
                    subtotal,
                  })
                }
                onEditAdjustment={(adjustment) => {
                  setAdjustmentToEdit(adjustment);
                  modalHelpers.showAdjustment({
                    adjustmentToEdit: adjustment,
                    setAdjustmentToEdit,
                    handleAddAdjustment,
                    handleUpdateAdjustment,
                    subtotal,
                  });
>>>>>>> 5c79eb0af123293a14dc286c7854e3d77055395b
                }}
                onRemoveAdjustment={handleRemoveAdjustment}
                disabled={false}
                canManageAdjustments={true}
              />
            )}

            {/* Resumen de totales */}
            <View style={styles.totalsSection}>
              <View style={styles.totalsContainer}>
                <Text style={styles.totalsText}>Subtotal:</Text>
                <Text style={styles.totalsValue}>${subtotal.toFixed(2)}</Text>
              </View>
              {totalAdjustments > 0 && (
                <View style={styles.totalsContainer}>
                  <Text style={styles.totalsText}>Descuentos:</Text>
                  <Text style={[styles.totalsValue, styles.discountText]}>
                    -${totalAdjustments.toFixed(2)}
                  </Text>
                </View>
              )}
              <Divider style={styles.totalDivider} />
              <View style={styles.totalsContainer}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
              </View>
            </View>

            <PrepaymentSection
              isEditMode={isEditMode}
              prepaymentId={prepaymentId}
              paymentAmount={paymentAmount}
              paymentMethod={paymentMethod}
              total={total}
              totalPaid={totalPaid}
              pendingAmount={pendingAmount}
              canRegisterPayments={canRegisterPayments}
<<<<<<< HEAD
              onShowPrepaymentModal={() => setShowPrepaymentModal(true)}
=======
              onShowPrepaymentModal={() =>
                modalHelpers.showPrepayment({
                  orderTotal: total,
                  prepaymentId,
                  handlePrepaymentCreated,
                  handlePrepaymentDeleted,
                })
              }
>>>>>>> 5c79eb0af123293a14dc286c7854e3d77055395b
              onDeletePrepayment={handleDeletePrepayment}
            />
          </ScrollView>

          <View style={styles.footer}>
            <Button
              mode="contained"
              onPress={handleConfirm}
              disabled={
                isConfirming ||
                items.length === 0 ||
                (isEditMode && !hasUnsavedChanges)
              }
              style={[
                styles.confirmButton,
                isEditMode &&
                  hasUnsavedChanges && {
                    backgroundColor: '#FF6B35',
                  },
              ]}
              loading={isConfirming}
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

          {isEditMode && orderId && visible && (
            <FAB
              icon="cash-multiple"
              style={[
                styles.paymentFab,
                {
                  backgroundColor: hasUnsavedChanges
                    ? '#9CA3AF'
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
                  modalHelpers.showPayment({
                    orderId,
                    orderTotal: total,
                    orderNumber,
                    orderStatus: orderData?.orderStatus,
                    onOrderCompleted: () => {
                      onClose?.();
                    },
                  });
                }
              }}
              visible={true}
            />
          )}

<<<<<<< HEAD
          <ModalsContainer
            // DateTimePicker props
            isTimePickerVisible={isTimePickerVisible}
            scheduledTime={scheduledTime}
            orderType={orderType}
            onTimeConfirm={handleTimeConfirm}
            hideTimePicker={hideTimePicker}
            
            // Alert modals props
            isTimeAlertVisible={isTimeAlertVisible}
            setTimeAlertVisible={setTimeAlertVisible}
            showExitConfirmation={showExitConfirmation}
            setShowExitConfirmation={setShowExitConfirmation}
            showCancelConfirmation={showCancelConfirmation}
            setShowCancelConfirmation={setShowCancelConfirmation}
            showModifyInProgressConfirmation={showModifyInProgressConfirmation}
            setShowModifyInProgressConfirmation={setShowModifyInProgressConfirmation}
            showDeletePrepaymentConfirm={showDeletePrepaymentConfirm}
            setShowDeletePrepaymentConfirm={setShowDeletePrepaymentConfirm}
            
            // Modal data props
            orderNumber={orderNumber}
            modifyingItemName={modifyingItemName}
            pendingModifyAction={pendingModifyAction}
            setPendingModifyAction={setPendingModifyAction}
            setModifyingItemName={setModifyingItemName}
            
            // Callbacks
            onClose={onClose}
            onCancelOrder={onCancelOrder}
            confirmDeletePrepayment={confirmDeletePrepayment}
            
            // Edit mode specific modals
            isEditMode={isEditMode}
            editingProduct={editingProduct}
            editingItemFromList={editingItemFromList}
            clearEditingState={clearEditingState}
            handleUpdateEditedItem={handleUpdateEditedItem}
            
            // Order detail modal
            showDetailModal={showDetailModal}
            setShowDetailModal={setShowDetailModal}
            orderId={orderId}
            orderData={orderData}
            
            // Order history modal  
            showHistoryModal={showHistoryModal}
            setShowHistoryModal={setShowHistoryModal}
            
            // Payment modal
            showPaymentModal={showPaymentModal}
            setShowPaymentModal={setShowPaymentModal}
            orderTotal={total}
            orderStatus={orderData?.orderStatus}
            
            // Adjustment modal
            showAdjustmentModal={showAdjustmentModal}
            setShowAdjustmentModal={setShowAdjustmentModal}
            adjustmentToEdit={adjustmentToEdit}
            setAdjustmentToEdit={setAdjustmentToEdit}
            handleAddAdjustment={handleAddAdjustment}
            handleUpdateAdjustment={handleUpdateAdjustment}
            subtotal={subtotal}
            
            // Prepayment modal
            showPrepaymentModal={showPrepaymentModal}
            setShowPrepaymentModal={setShowPrepaymentModal}
            prepaymentId={prepaymentId}
            handlePrepaymentCreated={handlePrepaymentCreated}
            handlePrepaymentDeleted={handlePrepaymentDeleted}
          />
=======
          <ModalsContainer />
>>>>>>> 5c79eb0af123293a14dc286c7854e3d77055395b
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
      paddingHorizontal: theme.spacing.s,
    },
    divider: {
      marginVertical: theme.spacing.s,
    },
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.s,
      paddingHorizontal: theme.spacing.s,
      backgroundColor: theme.colors.surface,
      minHeight: 80,
    },

    itemTextContainer: {
      flex: 3,
      marginRight: theme.spacing.xs,
      justifyContent: 'center',
    },
    itemTitleText: {
      fontSize: 15,
      fontWeight: '500',
      color: theme.colors.onSurface,
      flexWrap: 'wrap',
      lineHeight: 20,
    },
    itemDescription: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
      flexWrap: 'wrap',
      lineHeight: 18,
    },
    itemActionsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      flexShrink: 0,
    },
    quantityActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    quantityButton: {
      marginHorizontal: -4,
      padding: 0,
    },
    quantityText: {
      fontSize: 14,
      fontWeight: 'bold',
      minWidth: 20,
      textAlign: 'center',
      marginHorizontal: 2,
    },
    itemPrice: {
      alignSelf: 'center',
      marginRight: theme.spacing.xs,
      color: theme.colors.onSurfaceVariant,
      fontSize: 15,
      fontWeight: 'bold',
      minWidth: 55,
      textAlign: 'right',
    },
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
    },
    totalsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.xs,
      paddingHorizontal: theme.spacing.xs,
    },
    totalsText: {
      fontSize: 16,
    },
    totalsValue: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    totalLabel: {
      fontWeight: 'bold',
      fontSize: 18,
    },
    totalValue: {
      fontSize: 18,
      color: theme.colors.primary,
    },
    totalsSection: {
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
    },
    discountText: {
      color: theme.colors.primary,
    },
    totalDivider: {
      marginVertical: theme.spacing.s,
    },
    section: {
      marginBottom: theme.spacing.m,
      marginTop: theme.spacing.s,
    },
    sectionCompact: {
      marginBottom: 0,
      paddingBottom: 0,
    },
    dineInSelectorsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 0,
      gap: theme.spacing.s,
      marginTop: theme.spacing.s,
    },
    dineInSelectorContainer: {
      flex: 1,
    },
    selectorLoader: {},
    sectionTitleContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: theme.spacing.xs,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: theme.spacing.xs,
    },
    sectionTitleOptional: {
      ...theme.fonts.bodySmall,
      color: theme.colors.onSurfaceVariant,
      marginLeft: theme.spacing.xs,
    },
    radioGroupHorizontal: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      width: '100%',
      paddingVertical: theme.spacing.xs,
    },
    radioLabel: {
      marginLeft: 0,
      fontSize: 11,
      textTransform: 'uppercase',
      textAlign: 'center',
    },
    radioButtonItem: {
      paddingHorizontal: 0,
      paddingVertical: 4,
      flexShrink: 1,
      flex: 1,
      marginHorizontal: 2,
    },
    dropdownAnchor: {},
    dropdownContent: {},
    dropdownLabel: {},
    helperTextFix: {
      marginTop: -6,
      marginBottom: 0,
      paddingHorizontal: 12,
    },
    footer: {
      padding: theme.spacing.m,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
    },
    confirmButton: {
      paddingVertical: theme.spacing.xs,
    },
    input: {},
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
      right: 50,
      top: 10,
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
    headerTitleContainer: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
    },
    headerTitle: {
      ...theme.fonts.titleMedium,
      color: theme.colors.onSurface,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    orderStatusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    orderStatusText: {
      ...theme.fonts.labelSmall,
      color: 'white',
      fontWeight: '600',
      fontSize: 11,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
      justifyContent: 'flex-start',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.s,
      paddingVertical: 2,
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
      bottom: 140,
      zIndex: 1000,
      elevation: 6,
      width: 56,
      height: 56,
      justifyContent: 'center',
      alignItems: 'center',
    },
    paymentConfigButton: {
      marginTop: theme.spacing.s,
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
    adjustmentButton: {
      marginTop: theme.spacing.m,
      marginBottom: theme.spacing.s,
    },
    addProductsButton: {
      marginTop: theme.spacing.m,
      marginBottom: theme.spacing.m,
    },
  });
export default OrderCartDetail;
