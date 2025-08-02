import React, {
  useMemo,
  useEffect,
  useCallback,
  useState,
  useRef,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Portal,
  Text,
  Divider,
  Button,
  Menu,
  IconButton,
  Modal,
} from 'react-native-paper';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAppTheme } from '@/app/styles/theme';
import { NAVIGATION_PATHS } from '@/app/constants/navigationPaths';
import { OrderTypeEnum, OrderType } from '../schema/orders.schema';
import type { OrderAdjustment } from '../schema/adjustments.schema';
import { OrderStatusInfo, PreparationStatusInfo } from '../utils/formatters';
import OrderHeader from './OrderHeader';
import { canRegisterPayments as checkCanRegisterPayments } from '@/app/utils/roleUtils';
import {
  useOrderManagement,
  useOrderSubtotal,
  useOrderTotal,
  useOrderItemsCount,
  useHasUnsavedChanges,
} from '../stores/useOrderManagement';
import { CartItem, CartItemModifier } from '../utils/cartUtils';
import { OrderDetailsForBackend } from '../utils/orderUtils';
import { useAuthStore } from '@/app/stores/authStore';
import { useSnackbarStore } from '@/app/stores/snackbarStore';
import { useGetOrderByIdQuery } from '../hooks/useOrdersQueries';
import { useProductQuery } from '../../menu/hooks/useProductsQueries';
import type { SelectedPizzaCustomization } from '../../pizzaCustomizations/schema/pizzaCustomization.schema';
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
import { useOrderFormStore } from '../stores/useOrderFormStore';
import { UnifiedOrderDetailsModal } from '@/modules/shared/components/UnifiedOrderDetailsModal';
import { cleanupOrderState } from '../utils/orderStateUtils';

interface OrderCartDetailProps {
  visible: boolean;
  onConfirmOrder: (details: OrderDetailsForBackend) => Promise<void>;
  onClose?: () => void;
  onEditItem?: (item: CartItem) => void;
  isEditMode?: boolean;
  orderId?: string | null;
  orderNumber?: number;
  orderDate?: Date;
  onCancelOrder?: () => void;
  navigation?: any;
  onAddProducts?: () => void;
}

interface UseOrderCartProps {
  isEditMode?: boolean;
  orderId?: string | null;
  visible: boolean;
  onConfirmOrder: (details: OrderDetailsForBackend) => Promise<void>;
  onEditItem?: (item: CartItem) => void;
  onClose?: () => void;
}

const useOrderCart = ({
  isEditMode = false,
  orderId,
  visible,
  onConfirmOrder,
  onEditItem,
  onClose,
}: UseOrderCartProps) => {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);
  const user = useAuthStore((state) => state.user);

  const dineInFormRef = useRef<DineInFormRef | null>(null);
  const takeAwayFormRef = useRef<TakeAwayFormRef | null>(null);
  const deliveryFormRef = useRef<DeliveryFormRef | null>(null);

  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [hasLoadedOrder, setHasLoadedOrder] = useState(false);
  const [editingItemProductId, setEditingItemProductId] = useState<
    string | null
  >(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedOrderIdForDetails, setSelectedOrderIdForDetails] = useState<
    string | null
  >(null);
  const {
    items,
    orderType,
    scheduledTime,
    adjustments,
    prepaymentId,
    prepaymentAmount: paymentAmount,
    prepaymentMethod: paymentMethod,
    isCartVisible,
    isConfirming,
    setOrderType,
    setScheduledTime,
    setPrepaymentId,
    setPrepaymentAmount,
    setPrepaymentMethod,
    removeItem: removeCartItem,
    updateItemQuantity: updateCartItemQuantity,
    updateItem: updateCartItem,
    addItem,
    addAdjustment,
    updateAdjustment,
    removeAdjustment,
    confirmOrder,
    loadOrderForEditing,
  } = useOrderManagement();

  const subtotal = useOrderSubtotal();
  const total = useOrderTotal();
  const totalItemsCount = useOrderItemsCount();
  const hasUnsavedChanges = useHasUnsavedChanges(items);
  const {
    data: orderData,
    isLoading: isLoadingOrder,
    isError: isErrorOrder,
  } = useGetOrderByIdQuery(orderId, {
    enabled: isEditMode && !!orderId && visible,
  });

  const { data: editingProduct, isLoading: isLoadingEditingProduct } =
    useProductQuery(editingItemProductId || '', {
      enabled: !!editingItemProductId,
    });

  const adjustmentTotals = useMemo(() => {
    const discounts = adjustments.reduce((sum, adj) => {
      const amount = adj.amount || 0;
      return amount < 0 ? sum + Math.abs(amount) : sum;
    }, 0);

    const charges = adjustments.reduce((sum, adj) => {
      const amount = adj.amount || 0;
      return amount > 0 ? sum + amount : sum;
    }, 0);

    return { discounts, charges, total: charges - discounts };
  }, [adjustments]);

  // Cálculos simples para mostrar totales en la UI
  const totalPaid =
    isEditMode && orderData?.payments
      ? orderData.payments.reduce(
          (sum, payment) => sum + (payment.amount || 0),
          0,
        )
      : 0;
  const pendingAmount = total - totalPaid;

  const canRegisterPayments = useMemo(() => {
    return checkCanRegisterPayments(user);
  }, [user]);
  const validateOrder = useCallback(() => {
    let isValid = true;
    const errors: string[] = [];

    switch (orderType) {
      case OrderTypeEnum.DINE_IN:
        if (dineInFormRef.current) {
          const dineInValid = dineInFormRef.current.validate();
          isValid = isValid && dineInValid;

          if (!dineInValid) {
            const store = useOrderFormStore.getState();
            if (!store.selectedAreaId) {
              errors.push('Selecciona un área');
            }
            if (!store.isTemporaryTable && !store.selectedTableId) {
              errors.push('Selecciona una mesa');
            }
            if (store.isTemporaryTable && !store.temporaryTableName?.trim()) {
              errors.push('Ingresa el nombre de la mesa temporal');
            }
          }
        }
        break;

      case OrderTypeEnum.TAKE_AWAY:
        if (takeAwayFormRef.current) {
          const takeAwayValid = takeAwayFormRef.current.validate();
          isValid = isValid && takeAwayValid;

          if (!takeAwayValid) {
            const store = useOrderFormStore.getState();
            if (!store.deliveryInfo.recipientName?.trim()) {
              errors.push('Ingresa el nombre del cliente');
            }
            if (store.deliveryInfo.recipientPhone?.trim()) {
              const phoneDigits = store.deliveryInfo.recipientPhone.replace(
                /\D/g,
                '',
              );
              if (phoneDigits.length < 10) {
                errors.push('El teléfono debe tener al menos 10 dígitos');
              }
            }
          }
        }
        break;

      case OrderTypeEnum.DELIVERY:
        if (deliveryFormRef.current) {
          const deliveryValid = deliveryFormRef.current.validate();
          isValid = isValid && deliveryValid;

          if (!deliveryValid) {
            const store = useOrderFormStore.getState();
            if (!store.deliveryInfo.fullAddress?.trim()) {
              errors.push('Ingresa la dirección de entrega');
            }
            if (store.deliveryInfo.recipientPhone?.trim()) {
              const phoneDigits = store.deliveryInfo.recipientPhone.replace(
                /\D/g,
                '',
              );
              if (phoneDigits.length < 10) {
                errors.push('El teléfono debe tener al menos 10 dígitos');
              }
            }
          }
        }
        break;
    }

    if (!isValid && errors.length > 0) {
      showSnackbar({
        message: `Por favor completa: ${errors[0]}`,
        type: 'error',
      });
    }

    return isValid;
  }, [orderType, showSnackbar]);
  const handleTimeConfirm = useCallback(
    (date: Date) => {
      const now = new Date();
      now.setSeconds(0, 0);

      if (date < now) {
        modalHelpers.hideModal();
        modalHelpers.showTimeAlert();
      } else {
        setScheduledTime(date);
        modalHelpers.hideModal();
      }
    },
    [setScheduledTime],
  );

  const showTimePicker = useCallback(() => {
    modalHelpers.showTimePicker({
      scheduledTime,
      orderType,
      onTimeConfirm: handleTimeConfirm,
      hideTimePicker: modalHelpers.hideModal,
    });
  }, [scheduledTime, orderType, handleTimeConfirm]);

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
    },
    [isEditMode, updateCartItem],
  );

  const handlePrepaymentCreated = useCallback(
    (id: string, amount: number, method: 'CASH' | 'CARD' | 'TRANSFER') => {
      if (!isEditMode) {
        setPrepaymentId(id);
        setPrepaymentAmount(amount.toString());
        setPrepaymentMethod(method);
      }
    },
    [isEditMode, setPrepaymentId, setPrepaymentAmount, setPrepaymentMethod],
  );

  const handleEditCartItem = useCallback(
    async (item: CartItem) => {
      if (onEditItem) {
        onEditItem(item);
      } else {
        await queryClient.invalidateQueries({
          queryKey: ['products', 'detail', item.productId],
        });

        setEditingItemProductId(item.productId);
      }
    },
    [onEditItem, queryClient],
  );

  const handlePrepaymentDeleted = useCallback(() => {
    if (!isEditMode) {
      setPrepaymentId(null);
      setPrepaymentAmount('');
      setPrepaymentMethod(null);
    }
  }, [isEditMode, setPrepaymentId, setPrepaymentAmount, setPrepaymentMethod]);

  const handleDeletePrepayment = useCallback(() => {
    modalHelpers.showDeletePrepaymentConfirm({
      confirmDeletePrepayment: async () => {
        handlePrepaymentDeleted();
      },
    });
  }, [handlePrepaymentDeleted]);

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
          modalHelpers.showModifyInProgressConfirmation({
            modifyingItemName: item.productName,
            pendingModifyAction: () => removeCartItem(itemId),
            setPendingModifyAction: () => {},
            setModifyingItemName: () => {},
          });
        } else {
          removeCartItem(itemId);
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
          modalHelpers.showModifyInProgressConfirmation({
            modifyingItemName: item.productName,
            pendingModifyAction: updateQuantity,
            setPendingModifyAction: () => {},
            setModifyingItemName: () => {},
          });
        } else {
          updateQuantity();
        }
      } else {
        updateCartItemQuantity(itemId, quantity);
      }
    },
    [isEditMode, items, removeItem, showSnackbar, updateCartItemQuantity],
  );

  const handleAddAdjustment = useCallback(
    (adjustment: OrderAdjustment) => {
      addAdjustment(adjustment);
    },
    [addAdjustment],
  );

  const handleUpdateAdjustment = useCallback(
    (id: string, updatedAdjustment: OrderAdjustment) => {
      updateAdjustment(id, updatedAdjustment);
    },
    [updateAdjustment],
  );

  const handleRemoveAdjustment = useCallback(
    (id: string) => {
      removeAdjustment(id);
    },
    [removeAdjustment],
  );

  const handleConfirmOrder = useCallback(async () => {
    if (!user?.id) {
      showSnackbar({
        message: 'Error: No se pudo identificar el usuario',
        type: 'error',
      });
      return;
    }

    if (!validateOrder()) {
      return;
    }

    try {
      await confirmOrder(user.id, onConfirmOrder);

      if (isEditMode) {
        showSnackbar({
          message: 'Cambios guardados exitosamente',
          type: 'success',
        });
        // Limpiar el estado después de guardar cambios exitosamente
        cleanupOrderState();
        onClose?.();
      }
    } catch (error) {
      showSnackbar({
        message:
          error instanceof Error ? error.message : 'Error al procesar la orden',
        type: 'error',
      });
    }
  }, [
    user?.id,
    validateOrder,
    confirmOrder,
    onConfirmOrder,
    isEditMode,
    showSnackbar,
    onClose,
  ]);

  useEffect(() => {
    if (isEditMode && orderData && visible && !hasLoadedOrder) {
      loadOrderForEditing(orderData);
      setHasLoadedOrder(true);
    }
  }, [isEditMode, orderData, visible, hasLoadedOrder, loadOrderForEditing]);
  useEffect(() => {
    if (!visible) {
      setHasLoadedOrder(false);
      setEditingItemProductId(null);

      // Limpiar el estado del carrito cuando se cierre el modal en modo edición
      if (isEditMode && hasLoadedOrder) {
        cleanupOrderState();
      }
    }
  }, [visible, isEditMode, hasLoadedOrder]);
  useEffect(() => {
    if (editingProduct && editingItemProductId && !isLoadingEditingProduct) {
      const itemToEdit = items.find(
        (item) => item.productId === editingItemProductId,
      );

      if (itemToEdit) {
        modalHelpers.showProductCustomization({
          editingProduct: editingProduct,
          editingItemFromList: itemToEdit,
          clearEditingState: () => {
            setEditingItemProductId(null);
            queryClient.removeQueries({
              queryKey: ['products', 'detail', editingItemProductId],
            });
          },
          handleUpdateEditedItem,
        });
      }

      setEditingItemProductId(null);
    }
  }, [
    editingProduct,
    editingItemProductId,
    isLoadingEditingProduct,
    items,
    handleUpdateEditedItem,
    queryClient,
  ]);

  return {
    items,
    orderType,
    scheduledTime,
    adjustments,
    prepaymentId,
    paymentAmount,
    paymentMethod,
    isCartVisible,
    hasUnsavedChanges,
    isConfirming,
    showOptionsMenu,
    hasLoadedOrder,
    orderData,
    isLoadingOrder,
    isErrorOrder,
    canRegisterPayments,
    isLoadingEditingProduct,
    subtotal,
    total,
    totalItemsCount,
    adjustmentTotals,
    totalPaid,
    pendingAmount,
    dineInFormRef,
    takeAwayFormRef,
    deliveryFormRef,
    setOrderType,
    setScheduledTime,
    setPrepaymentId,
    setPrepaymentAmount,
    setPrepaymentMethod,
    setShowOptionsMenu,
    showTimePicker,
    handleTimeConfirm,
    handleEditCartItem,
    handleUpdateEditedItem,
    handleConfirmOrder,
    validateOrder,
    handlePrepaymentCreated,
    handlePrepaymentDeleted,
    handleDeletePrepayment,
    removeItem,
    updateItemQuantity,
    handleAddAdjustment,
    handleUpdateAdjustment,
    handleRemoveAdjustment,
    removeCartItem,
    updateCartItemQuantity,
    updateCartItem,
    addItem,
    addAdjustment,
    updateAdjustment,
    removeAdjustment,
    confirmOrder,
    loadOrderForEditing,
    isDetailModalVisible,
    setIsDetailModalVisible,
    selectedOrderIdForDetails,
    setSelectedOrderIdForDetails,
    theme,
  };
};

const OrderFormSection: React.FC<{
  orderType: OrderType;
  dineInFormRef: React.RefObject<DineInFormRef | null>;
  takeAwayFormRef: React.RefObject<TakeAwayFormRef | null>;
  deliveryFormRef: React.RefObject<DeliveryFormRef | null>;
  onScheduleTimePress: () => void;
}> = ({
  orderType,
  dineInFormRef,
  takeAwayFormRef,
  deliveryFormRef,
  onScheduleTimePress,
}) => {
  switch (orderType) {
    case OrderTypeEnum.DINE_IN:
      return (
        <DineInForm
          ref={dineInFormRef}
          onScheduleTimePress={onScheduleTimePress}
        />
      );
    case OrderTypeEnum.TAKE_AWAY:
      return (
        <TakeAwayForm
          ref={takeAwayFormRef}
          onScheduleTimePress={onScheduleTimePress}
        />
      );
    case OrderTypeEnum.DELIVERY:
      return (
        <DeliveryForm
          ref={deliveryFormRef}
          onScheduleTimePress={onScheduleTimePress}
        />
      );
    default:
      return null;
  }
};

const OrderCartHeader: React.FC<{
  isEditMode: boolean;
  orderData: any;
  orderNumber?: number;
  orderDate?: Date;
  showOptionsMenu: boolean;
  setShowOptionsMenu: (show: boolean) => void;
  hasUnsavedChanges: boolean;
  totalItemsCount: number;
  isCartVisible: boolean;
  onClose?: () => void;
  onCancelOrder?: () => void;
  orderId?: string | null;
  setSelectedOrderIdForDetails: (id: string | null) => void;
  setIsDetailModalVisible: (visible: boolean) => void;
  theme: any;
}> = ({
  isEditMode,
  orderData,
  orderNumber,
  orderDate,
  showOptionsMenu,
  setShowOptionsMenu,
  hasUnsavedChanges,
  totalItemsCount,
  isCartVisible,
  onClose,
  onCancelOrder,
  orderId,
  setSelectedOrderIdForDetails,
  setIsDetailModalVisible,
  theme,
}) => {
  const styles = useMemo(
    () =>
      StyleSheet.create({
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
      }),
    [theme],
  );

  if (isEditMode) {
    return (
      <View style={styles.customHeader}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => {
            if (hasUnsavedChanges) {
              modalHelpers.showExitConfirmation({
                onClose: () => {
                  if (isEditMode) {
                    cleanupOrderState();
                  }
                  onClose?.();
                },
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
              ? `Editar Orden #${orderNumber}`
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
              setSelectedOrderIdForDetails(orderId || null);
              setIsDetailModalVisible(true);
            }}
            title="Ver Detalles"
            leadingIcon="file-document-outline"
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
    );
  }

  return (
    <OrderHeader
      title={orderNumber ? `Orden #${orderNumber}` : 'Resumen de Orden'}
      onBackPress={() => {
        if (!isEditMode && hasUnsavedChanges) {
          modalHelpers.showExitConfirmation({
            onClose,
          });
        } else {
          // Si está en modo edición, limpiar el estado antes de cerrar
          if (isEditMode) {
            cleanupOrderState();
          }
          onClose?.();
        }
      }}
      itemCount={totalItemsCount}
      onCartPress={() => {}}
      isCartVisible={isCartVisible}
    />
  );
};

const OrderContent: React.FC<{
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  dineInFormRef: React.RefObject<DineInFormRef | null>;
  takeAwayFormRef: React.RefObject<TakeAwayFormRef | null>;
  deliveryFormRef: React.RefObject<DeliveryFormRef | null>;
  onScheduleTimePress: () => void;
  items: CartItem[];
  isEditMode: boolean;
  onEditCartItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  onAddProducts?: () => void;
  navigation?: any;
  orderId?: string | null;
  orderNumber?: number;
  addItem: any;
  adjustments: any[];
  subtotal: number;
  adjustmentTotals: { discounts: number; charges: number; total: number };
  total: number;
  totalPaid: number;
  pendingAmount: number;
  canRegisterPayments: boolean;
  prepaymentId: string | null;
  paymentAmount: string;
  paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | null;
  handleAddAdjustment: (adjustment: OrderAdjustment) => void;
  handleUpdateAdjustment: (id: string, adjustment: OrderAdjustment) => void;
  handleRemoveAdjustment: (id: string) => void;
  handlePrepaymentCreated: (
    id: string,
    amount: number,
    method: 'CASH' | 'CARD' | 'TRANSFER',
  ) => void;
  handlePrepaymentDeleted: () => void;
  handleDeletePrepayment: () => void;
  showSnackbar: any;
  theme: any;
}> = ({
  orderType,
  setOrderType,
  dineInFormRef,
  takeAwayFormRef,
  deliveryFormRef,
  onScheduleTimePress,
  items,
  isEditMode,
  onEditCartItem,
  removeItem,
  updateItemQuantity,
  onAddProducts,
  navigation,
  orderId,
  orderNumber,
  addItem,
  adjustments,
  subtotal,
  adjustmentTotals,
  total,
  totalPaid,
  pendingAmount,
  canRegisterPayments,
  prepaymentId,
  paymentAmount,
  paymentMethod,
  handleAddAdjustment,
  handleUpdateAdjustment,
  handleRemoveAdjustment,
  handlePrepaymentCreated,
  handlePrepaymentDeleted,
  handleDeletePrepayment,
  showSnackbar,
  theme,
}) => {
  const styles = useMemo(
    () =>
      StyleSheet.create({
        scrollView: {
          flex: 1,
          paddingHorizontal: theme.spacing.s,
        },
        divider: {
          marginVertical: theme.spacing.s,
        },
        addProductsButton: {
          marginTop: theme.spacing.m,
          marginBottom: theme.spacing.m,
        },
        subtotalSection: {
          paddingHorizontal: theme.spacing.m,
          paddingVertical: theme.spacing.s,
        },
        subtotalRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing.xs,
          paddingHorizontal: theme.spacing.xs,
          minHeight: 24,
        },
        subtotalLabel: {
          fontSize: 16,
          fontWeight: '600',
          color: theme.colors.onSurfaceVariant,
          flex: 1,
          textAlign: 'left',
        },
        subtotalAmount: {
          fontSize: 16,
          fontWeight: 'bold',
          color: theme.colors.onSurface,
          textAlign: 'right',
          minWidth: 80,
        },
        discountAmount: {
          color: theme.colors.primary,
        },
        chargeAmount: {
          color: theme.colors.error,
        },
        dividerLine: {
          height: 1,
          backgroundColor: theme.colors.outlineVariant,
          marginVertical: theme.spacing.s,
          marginHorizontal: theme.spacing.xs,
        },
        totalLabel: {
          fontSize: 18,
          fontWeight: 'bold',
          color: theme.colors.onSurface,
          flex: 1,
          textAlign: 'left',
        },
        totalAmount: {
          fontSize: 18,
          fontWeight: 'bold',
          color: theme.colors.primary,
          textAlign: 'right',
          minWidth: 80,
        },
        paidAmount: {
          color: '#10B981',
        },
        pendingAmount: {
          color: theme.colors.error,
          fontWeight: 'bold',
        },
      }),
    [theme],
  );

  return (
    <ScrollView
      style={styles.scrollView}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      nestedScrollEnabled={true}
      scrollEventThrottle={16}
      bounces={true}
    >
      <OrderTypeSelector
        value={orderType}
        onValueChange={setOrderType}
        disabled={false}
      />

      <OrderFormSection
        orderType={orderType}
        dineInFormRef={dineInFormRef}
        takeAwayFormRef={takeAwayFormRef}
        deliveryFormRef={deliveryFormRef}
        onScheduleTimePress={onScheduleTimePress}
      />

      <Divider style={styles.divider} />

      <OrderItemsList
        items={items}
        isEditMode={isEditMode}
        onEditItem={onEditCartItem}
        onRemoveItem={removeItem}
        onUpdateQuantity={updateItemQuantity}
      />

      {isEditMode && (
        <Button
          onPress={() => {
            if (onAddProducts) {
              onAddProducts();
            } else if (navigation && orderId && orderNumber) {
              try {
                navigation.navigate(NAVIGATION_PATHS.ADD_PRODUCTS_TO_ORDER, {
                  orderId,
                  orderNumber,
                  existingOrderItemsCount: items
                    .filter((item) => !item.isNew)
                    .reduce((sum, item) => sum + item.quantity, 0),
                  onProductsAdded: (newProducts: CartItem[]) => {
                    const newProductsWithStatus = newProducts.map((item) => ({
                      ...item,
                      preparationStatus: 'NEW' as const,
                      isNew: true,
                      isModified: false,
                    }));

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

                    showSnackbar({
                      message: `${newProducts.length} producto${newProducts.length > 1 ? 's' : ''} añadido${newProducts.length > 1 ? 's' : ''}`,
                      type: 'success',
                    });
                  },
                });
              } catch (error) {}
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

      <OrderAdjustments
        adjustments={adjustments}
        subtotal={subtotal}
        onAddAdjustment={() =>
          modalHelpers.showAdjustment({
            adjustmentToEdit: null,
            setAdjustmentToEdit: () => {},
            handleAddAdjustment,
            handleUpdateAdjustment,
            subtotal,
          })
        }
        onEditAdjustment={(adjustment) => {
          modalHelpers.showAdjustment({
            adjustmentToEdit: adjustment,
            setAdjustmentToEdit: () => {},
            handleAddAdjustment,
            handleUpdateAdjustment,
            subtotal,
          });
        }}
        onRemoveAdjustment={handleRemoveAdjustment}
        disabled={false}
        canManageAdjustments={true}
      />

      <Divider style={styles.divider} />

      <View style={styles.subtotalSection}>
        <View style={styles.subtotalRow}>
          <Text style={styles.subtotalLabel}>Subtotal:</Text>
          <Text style={styles.subtotalAmount}>${subtotal.toFixed(2)}</Text>
        </View>
        {adjustmentTotals.discounts > 0 && (
          <View style={styles.subtotalRow}>
            <Text style={styles.subtotalLabel}>Descuentos:</Text>
            <Text style={[styles.subtotalAmount, styles.discountAmount]}>
              -${adjustmentTotals.discounts.toFixed(2)}
            </Text>
          </View>
        )}
        {adjustmentTotals.charges > 0 && (
          <View style={styles.subtotalRow}>
            <Text style={styles.subtotalLabel}>Cargos:</Text>
            <Text style={[styles.subtotalAmount, styles.chargeAmount]}>
              +${adjustmentTotals.charges.toFixed(2)}
            </Text>
          </View>
        )}
        <View style={styles.dividerLine} />
        <View style={styles.subtotalRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
        </View>
      </View>

      <Divider style={styles.divider} />

      <PrepaymentSection
        isEditMode={isEditMode}
        prepaymentId={prepaymentId}
        paymentAmount={paymentAmount}
        paymentMethod={paymentMethod}
        total={total}
        totalPaid={totalPaid}
        pendingAmount={pendingAmount}
        canRegisterPayments={canRegisterPayments}
        onShowPrepaymentModal={() =>
          modalHelpers.showPrepayment({
            orderTotal: total,
            prepaymentId,
            handlePrepaymentCreated,
            handlePrepaymentDeleted,
          })
        }
        onDeletePrepayment={handleDeletePrepayment}
      />
    </ScrollView>
  );
};

const OrderCartDetail: React.FC<OrderCartDetailProps> = (props) => {
  const {
    visible,
    onClose,
    isEditMode = false,
    orderId,
    orderNumber,
    orderDate,
    onCancelOrder,
    navigation,
    onAddProducts,
  } = props;

  const {
    items,
    orderType,
    adjustments,
    showOptionsMenu,
    orderData,
    isLoadingOrder,
    isErrorOrder,
    canRegisterPayments,
    hasUnsavedChanges,
    isConfirming,
    isLoadingEditingProduct,
    prepaymentId,
    paymentAmount,
    paymentMethod,
    isCartVisible,
    subtotal,
    total,
    totalItemsCount,
    adjustmentTotals,
    totalPaid,
    pendingAmount,
    dineInFormRef,
    takeAwayFormRef,
    deliveryFormRef,
    setOrderType,
    setShowOptionsMenu,
    showTimePicker,
    handleEditCartItem,
    handleConfirmOrder,
    handlePrepaymentCreated,
    handlePrepaymentDeleted,
    handleDeletePrepayment,
    removeItem,
    updateItemQuantity,
    handleAddAdjustment,
    handleUpdateAdjustment,
    handleRemoveAdjustment,
    addItem,
    isDetailModalVisible,
    setIsDetailModalVisible,
    selectedOrderIdForDetails,
    setSelectedOrderIdForDetails,
    theme,
  } = useOrderCart(props);

  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (isEditMode && isLoadingOrder) {
    return (
      <Portal>
        <Modal
          visible={visible}
          onDismiss={() => {
            if (isEditMode) {
              cleanupOrderState();
            }
            onClose?.();
          }}
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
          onDismiss={() => {
            if (isEditMode) {
              cleanupOrderState();
            }
            onClose?.();
          }}
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
            // Si está en modo edición, limpiar el estado antes de cerrar
            if (isEditMode) {
              cleanupOrderState();
            }
            onClose?.();
          }
        }}
        contentContainerStyle={styles.modalContent}
        dismissable={true}
        dismissableBackButton={false}
      >
        <GestureHandlerRootView style={styles.container}>
          <View style={styles.container}>
            {isLoadingEditingProduct && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.loadingEditText}>Cargando producto...</Text>
              </View>
            )}

            <OrderCartHeader
              isEditMode={isEditMode}
              orderData={orderData}
              orderNumber={orderNumber}
              orderDate={orderDate}
              showOptionsMenu={showOptionsMenu}
              setShowOptionsMenu={setShowOptionsMenu}
              hasUnsavedChanges={hasUnsavedChanges}
              totalItemsCount={totalItemsCount}
              isCartVisible={isCartVisible}
              onClose={onClose}
              onCancelOrder={onCancelOrder}
              orderId={orderId}
              setSelectedOrderIdForDetails={setSelectedOrderIdForDetails}
              setIsDetailModalVisible={setIsDetailModalVisible}
              theme={theme}
            />

            <OrderContent
              orderType={orderType}
              setOrderType={setOrderType}
              dineInFormRef={dineInFormRef}
              takeAwayFormRef={takeAwayFormRef}
              deliveryFormRef={deliveryFormRef}
              onScheduleTimePress={showTimePicker}
              items={items}
              isEditMode={isEditMode}
              onEditCartItem={handleEditCartItem}
              removeItem={removeItem}
              updateItemQuantity={updateItemQuantity}
              onAddProducts={onAddProducts}
              navigation={navigation}
              orderId={orderId}
              orderNumber={orderNumber}
              addItem={addItem}
              adjustments={adjustments}
              subtotal={subtotal}
              adjustmentTotals={adjustmentTotals}
              total={total}
              totalPaid={totalPaid}
              pendingAmount={pendingAmount}
              canRegisterPayments={canRegisterPayments}
              prepaymentId={prepaymentId}
              paymentAmount={paymentAmount}
              paymentMethod={paymentMethod}
              handleAddAdjustment={handleAddAdjustment}
              handleUpdateAdjustment={handleUpdateAdjustment}
              handleRemoveAdjustment={handleRemoveAdjustment}
              handlePrepaymentCreated={handlePrepaymentCreated}
              handlePrepaymentDeleted={handlePrepaymentDeleted}
              handleDeletePrepayment={handleDeletePrepayment}
              showSnackbar={showSnackbar}
              theme={theme}
            />

            <ModalsContainer />
          </View>

          <UnifiedOrderDetailsModal
            visible={isDetailModalVisible}
            onDismiss={() => {
              setIsDetailModalVisible(false);
              setSelectedOrderIdForDetails(null);
            }}
            orderId={selectedOrderIdForDetails}
            orderNumber={orderNumber}
            dataSource="finalization"
            showHistoryButton={true}
          />

          <View style={styles.footer}>
            <View style={styles.buttonRow}>
              <Button
                mode="contained"
                onPress={handleConfirmOrder}
                disabled={
                  isConfirming ||
                  items.length === 0 ||
                  (isEditMode && !hasUnsavedChanges)
                }
                style={[
                  styles.confirmButton,
                  styles.confirmButtonWithPayment,
                  isEditMode && hasUnsavedChanges && styles.cancelButton,
                ]}
                loading={isConfirming}
                contentStyle={styles.confirmButtonContent}
              >
                <Text style={styles.buttonText}>
                  {isConfirming
                    ? isEditMode
                      ? 'Guardando...'
                      : 'Enviando...'
                    : `${
                        isEditMode
                          ? hasUnsavedChanges
                            ? '⚠️ Guardar Cambios'
                            : 'Guardar Cambios'
                          : 'Enviar Orden'
                      }${!isConfirming ? ` - $${total.toFixed(2)}` : ''}`}
                </Text>
              </Button>

              {isEditMode && orderId && visible && (
                <IconButton
                  icon="cash-multiple"
                  size={32}
                  onPress={() => {
                    if (hasUnsavedChanges) {
                      showSnackbar({
                        message:
                          'Debes guardar los cambios antes de registrar pagos',
                        type: 'warning',
                      });
                      return;
                    }

                    modalHelpers.showPayment({
                      orderId,
                      orderTotal: total,
                      orderNumber,
                      orderStatus: orderData?.orderStatus,
                      onOrderCompleted: () => {
                        onClose?.();
                      },
                      onPaymentRegistered: () => {
                        // Invalidar cache y refrescar orden cuando se registre un pago
                        // Nota: Estas funciones están disponibles en el scope del componente padre
                      },
                    });
                  }}
                  style={[
                    styles.paymentIconButton,
                    hasUnsavedChanges
                      ? styles.paymentIconButtonUnsaved
                      : pendingAmount <= 0
                        ? styles.paymentIconButtonCompleted
                        : { backgroundColor: theme.colors.primary },
                  ]}
                  iconColor="white"
                />
              )}
            </View>
          </View>
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
    footer: {
      padding: theme.spacing.m,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
    },
    confirmButton: {
      paddingVertical: theme.spacing.xs,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: theme.spacing.m,
      color: theme.colors.onBackground,
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
    iconButtonNoMargin: {
      margin: 0,
    },
    cancelButton: {
      backgroundColor: '#FF6B35',
    },
    buttonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.s,
    },
    confirmButtonWithPayment: {
      flex: 1,
      marginRight: theme.spacing.s,
    },
    paymentIconButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      margin: 0,
    },
    paymentIconButtonUnsaved: {
      backgroundColor: '#9CA3AF',
    },
    paymentIconButtonCompleted: {
      backgroundColor: '#4CAF50',
    },
    confirmButtonContent: {
      paddingVertical: 4,
      paddingHorizontal: theme.spacing.s,
    },
    buttonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      flexDirection: 'row',
      gap: theme.spacing.s,
    },
    loadingEditText: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: '500',
    },
  });

export default OrderCartDetail;
