import React, { useMemo, useEffect, useCallback, useState, useRef } from 'react';
import { Portal } from 'react-native-paper';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import {
  Text,
  Divider,
  Button,
  Menu,
  IconButton,
  Modal,
} from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import { OrderTypeEnum } from '../types/orders.types';
import type { OrderAdjustment } from '../types/adjustments.types';
import { formatOrderStatus, getOrderStatusColor, getPreparationStatusLabel } from '../utils/formatters';
import OrderHeader from './OrderHeader';
import { canRegisterPayments as checkCanRegisterPayments } from '@/app/utils/roleUtils';
import {
  useOrderStore,
  CartItem,
  CartItemModifier,
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
  ModalsContainer
} from './order-cart';

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
  onCancelOrder,
  navigation,
  onAddProducts,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
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

  const { data: orderData, isLoading: isLoadingOrder, isError: isErrorOrder } = useGetOrderByIdQuery(orderId, {
    enabled: isEditMode && !!orderId && visible,
  });


  const { data: payments = [] } = useGetPaymentsByOrderIdQuery(orderId || '', {
    enabled: isEditMode && !!orderId && visible,
  });




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

  const [editingItemFromList, setEditingItemFromList] = useState<CartItem | null>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showPrepaymentModal, setShowPrepaymentModal] = useState(false);
  const [showDeletePrepaymentConfirm, setShowDeletePrepaymentConfirm] = useState(false);
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);
  const [isTimeAlertVisible, setIsTimeAlertVisible] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [showModifyInProgressConfirmation, setShowModifyInProgressConfirmation] = useState(false);
  const [modifyingItemName, setModifyingItemName] = useState<string>('');
  const [pendingModifyAction, setPendingModifyAction] = useState<(() => void) | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentToEdit, setAdjustmentToEdit] = useState<any>(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [isModalReady, setIsModalReady] = useState(false);
  
  // Calcular totales
  const totalAdjustments = useMemo(() => {
    return adjustments.reduce((sum, adj) => sum + (adj.amount || 0), 0);
  }, [adjustments]);
  
  const totalPaid = useMemo(() => {
    if (!isEditMode || !payments) return 0;
    return payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
  }, [payments, isEditMode]);
  
  const pendingAmount = useMemo(() => {
    return total - totalPaid;
  }, [total, totalPaid]);
  
  const showTimePicker = () => setIsTimePickerVisible(true);
  const hideTimePicker = () => setIsTimePickerVisible(false);
  
  const handleEditCartItem = (item: CartItem) => {
    setEditingItemFromList(item);
    onEditItem?.(item);
  };
  
  const clearEditingState = () => {
    setEditingItemFromList(null);
    setEditingProduct(null);
  };

  const handlePrepaymentCreated = useCallback((id: string, amount: string, method: 'CASH' | 'CARD' | 'TRANSFER') => {
    if (!isEditMode) {
      setPrepaymentId(id);
      setPrepaymentAmount(amount);
      setPrepaymentMethod(method);
    }
  }, [isEditMode, setPrepaymentId, setPrepaymentAmount, setPrepaymentMethod]);

  const handlePrepaymentDeleted = useCallback(() => {
    if (!isEditMode) {
      setPrepaymentId(null);
      setPrepaymentAmount('');
      setPrepaymentMethod(null);
    }
  }, [isEditMode, setPrepaymentId, setPrepaymentAmount, setPrepaymentMethod]);
  
  const handleDeletePrepayment = () => {
    setShowDeletePrepaymentConfirm(true);
  };
  
  const confirmDeletePrepayment = () => {
    handlePrepaymentDeleted();
    setShowDeletePrepaymentConfirm(false);
  };

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
            message: `No se puede eliminar un producto ${getPreparationStatusLabel(item.preparationStatus || '').toLowerCase()}`,
            type: 'error',
          });
          return;
        }

        if (item.preparationStatus === 'IN_PROGRESS') {
          setModifyingItemName(item.productName);
          setPendingModifyAction(() => () => {
            removeCartItem(itemId);
          });
          setShowModifyInProgressConfirmation(true);
        } else {
          removeCartItem(itemId);
        }
      } else {
        removeCartItem(itemId);
      }
    },
    [isEditMode, items, showSnackbar, removeCartItem, setModifyingItemName, setPendingModifyAction, setShowModifyInProgressConfirmation],
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
            message: `No se puede modificar un producto ${getPreparationStatusLabel(item.preparationStatus || '').toLowerCase()}`,
            type: 'error',
          });
          return;
        }

        const updateQuantity = () => {
          updateCartItemQuantity(itemId, quantity);
        };

        if (item.preparationStatus === 'IN_PROGRESS') {
          setModifyingItemName(item.productName);
          setPendingModifyAction(() => updateQuantity);
          setShowModifyInProgressConfirmation(true);
        } else {
          updateQuantity();
        }
      } else {
        updateCartItemQuantity(itemId, quantity);
      }
    },
    [isEditMode, items, removeItem, showSnackbar, updateCartItemQuantity, setModifyingItemName, setPendingModifyAction, setShowModifyInProgressConfirmation],
  );



  const canRegisterPayments = useMemo(() => {
    return checkCanRegisterPayments(user);
  }, [user]);



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



  useEffect(() => {
    if (!visible && isEditMode) {
      clearEditingState();
    }
  }, [visible, isEditMode, clearEditingState]);

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

  const handleConfirm = async () => {
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
        message: error instanceof Error ? error.message : 'Error al procesar la orden',
        type: 'error',
      });
    }
  };


  const handleTimeConfirm = (date: Date) => {
    const now = new Date();
    now.setSeconds(0, 0);

    if (date < now) {
      hideTimePicker();
      setTimeAlertVisible(true);
    } else {
      setScheduledTime(date);
      hideTimePicker();
    }
  };


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
        pizzaExtraCost
      );

      clearEditingState();
    },
    [isEditMode, updateCartItem, clearEditingState],
  );

  const renderFields = () => {
    switch (orderType) {
      case OrderTypeEnum.DINE_IN:
        return (
          <DineInForm
            ref={dineInFormRef}
            onScheduleTimePress={showTimePicker}
          />
        );
      case OrderTypeEnum.TAKE_AWAY:
        return (
          <TakeAwayForm
            ref={takeAwayFormRef}
            onScheduleTimePress={showTimePicker}
          />
        );
      case OrderTypeEnum.DELIVERY:
        return (
          <DeliveryForm
            ref={deliveryFormRef}
            onScheduleTimePress={showTimePicker}
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
                            backgroundColor: getOrderStatusColor(
                              orderData.orderStatus,
                              theme,
                            ),
                          },
                        ]}
                      >
                        <Text style={styles.orderStatusText}>
                          {formatOrderStatus(orderData.orderStatus)}
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
                        existingOrderItemsCount: items
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

                          newProductsWithStatus.forEach((item) => {
                            addItem(
                              { id: item.productId, name: item.productName, price: item.unitPrice } as any,
                              item.quantity,
                              item.variantId,
                              item.modifiers,
                              item.preparationNotes,
                              item.selectedPizzaCustomizations,
                              item.pizzaExtraCost
                            );
                          });

                          showSnackbar({
                            message: `${newProducts.length} producto${newProducts.length > 1 ? 's' : ''} añadido${newProducts.length > 1 ? 's' : ''}`,
                            type: 'success',
                          });
                        },
                      });
                    } catch (error) {
                    }
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
                onAddAdjustment={() => setShowAdjustmentModal(true)}
                onEditAdjustment={(adjustment) => {
                  setAdjustmentToEdit(adjustment);
                  setShowAdjustmentModal(true);
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
              onShowPrepaymentModal={() => setShowPrepaymentModal(true)}
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
                  setShowPaymentModal(true);
                }
              }}
              visible={true}
            />
          )}

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
