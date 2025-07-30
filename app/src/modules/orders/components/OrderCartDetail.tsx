import React, {
  useMemo,
  useEffect,
  useCallback,
  useState,
  useRef,
} from 'react';
import {
  Portal,
  Text,
  Divider,
  Button,
  Menu,
  IconButton,
  Modal,
  FAB,
} from 'react-native-paper';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
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
} from '../stores/useOrderManagement';
import { CartItem, CartItemModifier } from '../utils/cartUtils';
import { OrderDetailsForBackend } from '../utils/orderUtils';
import { useAuthStore } from '@/app/stores/authStore';
import { useSnackbarStore } from '@/app/stores/snackbarStore';
import { useGetOrderByIdQuery } from '../hooks/useOrdersQueries';
import { useGetPaymentsByOrderIdQuery } from '../hooks/usePaymentQueries';
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

// Custom hook useOrderCart DENTRO del archivo
const useOrderCart = ({
  isEditMode = false,
  orderId,
  visible,
  onConfirmOrder,
  onEditItem,
  onClose,
}: UseOrderCartProps) => {
  const theme = useAppTheme();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);
  const user = useAuthStore((state) => state.user);

  // Referencias a los formularios
  const dineInFormRef = useRef<DineInFormRef | null>(null);
  const takeAwayFormRef = useRef<TakeAwayFormRef | null>(null);
  const deliveryFormRef = useRef<DeliveryFormRef | null>(null);

  // Estados locales
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [hasLoadedOrder, setHasLoadedOrder] = useState(false);

  // Conexión con el store de Zustand
  const {
    items,
    orderType,
    scheduledTime,
    adjustments,
    prepaymentId,
    prepaymentAmount: paymentAmount,
    prepaymentMethod: paymentMethod,
    isCartVisible,
    hasUnsavedChanges,
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

  // Cálculos
  const subtotal = useOrderSubtotal();
  const total = useOrderTotal();
  const totalItemsCount = useOrderItemsCount();

  // Queries
  const {
    data: orderData,
    isLoading: isLoadingOrder,
    isError: isErrorOrder,
  } = useGetOrderByIdQuery(orderId, {
    enabled: isEditMode && !!orderId && visible,
  });

  const { data: payments = [] } = useGetPaymentsByOrderIdQuery(orderId || '', {
    enabled: isEditMode && !!orderId && visible,
  });

  // Cálculos derivados
  const totalAdjustments = useMemo(() => {
    return adjustments.reduce((sum, adj) => sum + (adj.amount || 0), 0);
  }, [adjustments]);

  const totalPaid = useMemo(() => {
    if (!isEditMode || !payments) return 0;
    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  }, [payments, isEditMode]);

  const pendingAmount = useMemo(() => {
    return total - totalPaid;
  }, [total, totalPaid]);

  const canRegisterPayments = useMemo(() => {
    return checkCanRegisterPayments(user);
  }, [user]);

  // Validación centralizada
  const validateOrder = useCallback(() => {
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
  }, [orderType]);

  // Handlers
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
    (item: CartItem) => {
      if (onEditItem) {
        onEditItem(item);
      } else {
        modalHelpers.showProductCustomization({
          editingProduct: null,
          editingItemFromList: item,
          clearEditingState: () => {},
          handleUpdateEditedItem,
        });
      }
    },
    [onEditItem, handleUpdateEditedItem],
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
      if (isEditMode) {
        addAdjustment(adjustment);
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
    [isEditMode, removeAdjustment],
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

  // Effects

  // Cargar la orden cuando se reciba la data
  useEffect(() => {
    if (isEditMode && orderData && visible && !hasLoadedOrder) {
      loadOrderForEditing(orderData);
      setHasLoadedOrder(true);
    }
  }, [isEditMode, orderData, visible, hasLoadedOrder, loadOrderForEditing]);

  // Reset hasLoadedOrder cuando se cierra el modal
  useEffect(() => {
    if (!visible) {
      setHasLoadedOrder(false);
    }
  }, [visible]);

  // API expuesta
  return {
    // Estados y datos
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
    payments,
    canRegisterPayments,

    // Cálculos
    subtotal,
    total,
    totalItemsCount,
    totalAdjustments,
    totalPaid,
    pendingAmount,

    // Referencias
    dineInFormRef,
    takeAwayFormRef,
    deliveryFormRef,

    // Setters
    setOrderType,
    setScheduledTime,
    setPrepaymentId,
    setPrepaymentAmount,
    setPrepaymentMethod,
    setShowOptionsMenu,

    // Handlers
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

    // Store actions
    removeCartItem,
    updateCartItemQuantity,
    updateCartItem,
    addItem,
    addAdjustment,
    updateAdjustment,
    removeAdjustment,
    confirmOrder,
    loadOrderForEditing,

    // Theme
    theme,
  };
};

// Sub-componente para el formulario según el tipo de orden
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

// Sub-componente para el header de la orden
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
  theme,
}) => {
  const styles = StyleSheet.create({
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
  });

  if (isEditMode) {
    return (
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
          onClose?.();
        }
      }}
      itemCount={totalItemsCount}
      onCartPress={() => {}}
      isCartVisible={isCartVisible}
    />
  );
};

// Sub-componente para el contenido principal del scroll
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
  totalAdjustments: number;
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
  handlePrepaymentCreated: (id: string, amount: number, method: 'CASH' | 'CARD' | 'TRANSFER') => void;
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
  totalAdjustments,
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
  const styles = StyleSheet.create({
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
  });

  return (
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

      {isEditMode && (
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
      )}

      <Divider style={styles.divider} />

      {/* Subtotal dentro del scroll */}
      <View style={styles.subtotalSection}>
        <View style={styles.subtotalContainer}>
          <Text style={styles.subtotalText}>Subtotal:</Text>
          <Text style={styles.subtotalValue}>${subtotal.toFixed(2)}</Text>
        </View>
        {totalAdjustments > 0 && (
          <View style={styles.subtotalContainer}>
            <Text style={styles.subtotalText}>Descuentos:</Text>
            <Text style={[styles.subtotalValue, styles.discountText]}>
              -${totalAdjustments.toFixed(2)}
            </Text>
          </View>
        )}
      </View>

      <Divider style={styles.divider} />

      {/* Prepayment Section dentro del scroll */}
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

// Sub-componente para el resumen de totales
const OrderSummarySection: React.FC<{
  subtotal: number;
  totalAdjustments: number;
  total: number;
  theme: any;
}> = ({ subtotal, totalAdjustments, total, theme }) => {
  const styles = StyleSheet.create({
    totalsSection: {
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
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
    discountText: {
      color: theme.colors.primary,
    },
    totalDivider: {
      marginVertical: theme.spacing.s,
    },
  });

  return (
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
  );
};

// Componente principal refactorizado
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
    // Estados y datos
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
    prepaymentId,
    paymentAmount,
    paymentMethod,
    isCartVisible,

    // Cálculos
    subtotal,
    total,
    totalItemsCount,
    totalAdjustments,
    totalPaid,
    pendingAmount,

    // Referencias
    dineInFormRef,
    takeAwayFormRef,
    deliveryFormRef,

    // Setters
    setOrderType,
    setShowOptionsMenu,

    // Handlers
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

    // Store actions
    addItem,

    // Theme
    theme,
  } = useOrderCart(props);

  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);
  const styles = useMemo(() => createStyles(theme), [theme]);

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
            <View style={styles.container}>
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
                totalAdjustments={totalAdjustments}
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


              {isEditMode && orderId && visible && (
                <FAB
                  icon="cash-multiple"
                  style={[
                    styles.paymentFab,
                    hasUnsavedChanges
                      ? styles.paymentFabUnsaved
                      : pendingAmount <= 0
                        ? styles.paymentFabCompleted
                        : { backgroundColor: theme.colors.primary },
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

              <ModalsContainer />
            </View>
          </TouchableWithoutFeedback>

          {/* Footer con solo el total y el botón */}
          <View style={styles.footer}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
            </View>
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
                isEditMode && hasUnsavedChanges && styles.cancelButton,
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
    paymentFab: {
      position: 'absolute',
      margin: theme.spacing.m,
      right: 0,
      bottom: 140,
      zIndex: 1000,
      elevation: 6,
      width: 56,
      height: 56,
      justifyContent: 'center',
      alignItems: 'center',
    },
    paymentFabUnsaved: {
      backgroundColor: '#9CA3AF',
    },
    paymentFabCompleted: {
      backgroundColor: '#4CAF50',
    },
    subtotalSection: {
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
    },
    subtotalContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.xs,
      paddingHorizontal: theme.spacing.xs,
    },
    subtotalText: {
      fontSize: 16,
      color: theme.colors.onSurface,
    },
    subtotalValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
    },
    discountText: {
      color: theme.colors.primary,
    },
    totalContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.s,
      paddingHorizontal: theme.spacing.xs,
    },
    totalLabel: {
      fontWeight: 'bold',
      fontSize: 18,
      color: theme.colors.onSurface,
    },
    totalValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
  });

export default OrderCartDetail;
