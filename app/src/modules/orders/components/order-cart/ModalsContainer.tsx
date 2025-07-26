import React from 'react';
import { Portal } from 'react-native-paper';
import DateTimePickerSafe from '@/app/components/DateTimePickerSafe';
import ConfirmationModal from '@/app/components/common/ConfirmationModal';
import ProductCustomizationModal from '../ProductCustomizationModal';
import { OrderDetailModal } from '../OrderDetailModal';
import OrderHistoryModal from '@/modules/shared/components/OrderHistoryModal';
import PaymentModal from '../PaymentModal';
import { AdjustmentFormModal } from '../AdjustmentFormModal';
import { OrderTypeEnum } from '../../types/orders.types';
import type { OrderAdjustment } from '../../types/adjustments.types';
import type { CartItem } from '../../stores/useOrderStore';

interface ModalsContainerProps {
  // DateTimePicker props
  isTimePickerVisible: boolean;
  scheduledTime: Date | null;
  orderType: string;
  onTimeConfirm: (date: Date) => void;
  hideTimePicker: () => void;
  
  // Alert modals props
  isTimeAlertVisible: boolean;
  setTimeAlertVisible: (visible: boolean) => void;
  showExitConfirmation: boolean;
  setShowExitConfirmation: (visible: boolean) => void;
  showCancelConfirmation: boolean;
  setShowCancelConfirmation: (visible: boolean) => void;
  showModifyInProgressConfirmation: boolean;
  setShowModifyInProgressConfirmation: (visible: boolean) => void;
  showDeletePrepaymentConfirm: boolean;
  setShowDeletePrepaymentConfirm: (visible: boolean) => void;
  
  // Modal data props
  orderNumber?: number;
  modifyingItemName: string;
  pendingModifyAction: (() => void) | null;
  setPendingModifyAction: (action: (() => void) | null) => void;
  setModifyingItemName: (name: string) => void;
  
  // Callbacks
  onClose?: () => void;
  onCancelOrder?: () => void;
  confirmDeletePrepayment: () => Promise<void>;
  
  // Edit mode specific modals
  isEditMode: boolean;
  editingProduct: any;
  editingItemFromList: CartItem | null;
  clearEditingState: () => void;
  handleUpdateEditedItem: (
    itemId: string,
    quantity: number,
    modifiers: any[],
    preparationNotes?: string,
    variantId?: string,
    variantName?: string,
    unitPrice?: number,
    selectedPizzaCustomizations?: any[],
    pizzaExtraCost?: number,
  ) => void;
  
  // Order detail modal
  showDetailModal: boolean;
  setShowDetailModal: (visible: boolean) => void;
  orderId?: string | null;
  orderData?: any;
  
  // Order history modal
  showHistoryModal: boolean;
  setShowHistoryModal: (visible: boolean) => void;
  
  // Payment modal
  showPaymentModal: boolean;
  setShowPaymentModal: (visible: boolean) => void;
  orderTotal: number;
  orderStatus?: string;
  
  // Adjustment modal
  showAdjustmentModal: boolean;
  setShowAdjustmentModal: (visible: boolean) => void;
  adjustmentToEdit: OrderAdjustment | null;
  setAdjustmentToEdit: (adjustment: OrderAdjustment | null) => void;
  handleAddAdjustment: (adjustment: OrderAdjustment) => void;
  handleUpdateAdjustment: (id: string, adjustment: OrderAdjustment) => void;
  subtotal: number;
  
  // Prepayment modal
  showPrepaymentModal: boolean;
  setShowPrepaymentModal: (visible: boolean) => void;
  prepaymentId: string | null;
  handlePrepaymentCreated: (
    prepaymentIdCreated: string,
    amount: number,
    method: 'CASH' | 'CARD' | 'TRANSFER',
  ) => void;
  handlePrepaymentDeleted: () => void;
}

export const ModalsContainer: React.FC<ModalsContainerProps> = ({
  // DateTimePicker
  isTimePickerVisible,
  scheduledTime,
  orderType,
  onTimeConfirm,
  hideTimePicker,
  
  // Alert modals
  isTimeAlertVisible,
  setTimeAlertVisible,
  showExitConfirmation,
  setShowExitConfirmation,
  showCancelConfirmation,
  setShowCancelConfirmation,
  showModifyInProgressConfirmation,
  setShowModifyInProgressConfirmation,
  showDeletePrepaymentConfirm,
  setShowDeletePrepaymentConfirm,
  
  // Modal data
  orderNumber,
  modifyingItemName,
  pendingModifyAction,
  setPendingModifyAction,
  setModifyingItemName,
  
  // Callbacks
  onClose,
  onCancelOrder,
  confirmDeletePrepayment,
  
  // Edit mode specific
  isEditMode,
  editingProduct,
  editingItemFromList,
  clearEditingState,
  handleUpdateEditedItem,
  
  // Order detail
  showDetailModal,
  setShowDetailModal,
  orderId,
  orderData,
  
  // Order history
  showHistoryModal,
  setShowHistoryModal,
  
  // Payment
  showPaymentModal,
  setShowPaymentModal,
  orderTotal,
  orderStatus,
  
  // Adjustment
  showAdjustmentModal,
  setShowAdjustmentModal,
  adjustmentToEdit,
  setAdjustmentToEdit,
  handleAddAdjustment,
  handleUpdateAdjustment,
  subtotal,
  
  // Prepayment
  showPrepaymentModal,
  setShowPrepaymentModal,
  prepaymentId,
  handlePrepaymentCreated,
  handlePrepaymentDeleted,
}) => {
  return (
    <>
      <Portal>
        <DateTimePickerSafe
          visible={isTimePickerVisible}
          mode="time"
          value={scheduledTime}
          onConfirm={onTimeConfirm}
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
          allowManualInput={true}
        />
      </Portal>

      <ConfirmationModal
        visible={isTimeAlertVisible}
        title="Hora Inválida"
        message="No puedes seleccionar una hora que ya ha pasado. Por favor, elige una hora futura."
        confirmText="Entendido"
        onConfirm={() => setTimeAlertVisible(false)}
      />

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

      {isEditMode && editingProduct && editingItemFromList && (
        <ProductCustomizationModal
          visible={true}
          product={editingProduct}
          editingItem={editingItemFromList}
          onDismiss={() => {
            clearEditingState();
          }}
          onAddToCart={() => {}}
          onUpdateItem={handleUpdateEditedItem}
        />
      )}

      {isEditMode && (
        <OrderDetailModal
          visible={showDetailModal}
          onDismiss={() => setShowDetailModal(false)}
          orderId={orderId}
          orderNumber={orderNumber}
          orderData={orderData}
        />
      )}

      {isEditMode && (
        <OrderHistoryModal
          visible={showHistoryModal}
          onDismiss={() => setShowHistoryModal(false)}
          orderId={orderId}
          orderNumber={orderNumber}
        />
      )}

      {showPaymentModal && isEditMode && orderId && (
        <PaymentModal
          visible={showPaymentModal}
          onDismiss={() => setShowPaymentModal(false)}
          orderId={orderId}
          orderTotal={orderTotal}
          orderNumber={orderNumber}
          orderStatus={orderStatus}
          onOrderCompleted={() => {
            setShowPaymentModal(false);
            onClose?.();
          }}
        />
      )}

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

      <PaymentModal
        visible={showPrepaymentModal}
        onDismiss={() => setShowPrepaymentModal(false)}
        orderTotal={orderTotal}
        mode="prepayment"
        onPrepaymentCreated={handlePrepaymentCreated}
        existingPrepaymentId={prepaymentId || undefined}
        onPrepaymentDeleted={handlePrepaymentDeleted}
      />

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
    </>
  );
};