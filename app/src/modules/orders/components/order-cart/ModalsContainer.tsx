import React from 'react';
import { Portal } from 'react-native-paper';
import DateTimePickerSafe from '@/app/components/DateTimePickerSafe';
import ConfirmationModal from '@/app/components/common/ConfirmationModal';
import ProductCustomizationModal from '../ProductCustomizationModal';
import { OrderDetailModal } from '../OrderDetailModal';
import OrderHistoryModal from '@/modules/shared/components/OrderHistoryModal';
import PaymentModal from '../PaymentModal';
import { AdjustmentFormModal } from '../AdjustmentFormModal';
import { OrderTypeEnum } from '../../schema/orders.schema';
import type { OrderAdjustment } from '../../schema/adjustments.schema';
import { useModalStore, modalHelpers } from '../../stores/useModalStore';

export const ModalsContainer: React.FC<Record<string, never>> = () => {
  const { modalType, modalProps, isVisible } = useModalStore();
  if (!isVisible || !modalType) {
    return null;
  }

  const renderModal = () => {
    switch (modalType) {
      case 'timePicker':
        return (
          <Portal>
            <DateTimePickerSafe
              visible={true}
              mode="time"
              value={modalProps.scheduledTime}
              onConfirm={modalProps.onTimeConfirm}
              onCancel={() => {
                modalProps.hideTimePicker?.();
                modalHelpers.hideModal();
              }}
              minimumDate={new Date()}
              minuteInterval={5}
              title={
                modalProps.orderType === OrderTypeEnum.DELIVERY
                  ? 'Seleccionar Hora de Entrega'
                  : modalProps.orderType === OrderTypeEnum.TAKE_AWAY
                    ? 'Seleccionar Hora de Recolección'
                    : 'Seleccionar Hora'
              }
              allowManualInput={true}
            />
          </Portal>
        );

      case 'timeAlert':
        return (
          <ConfirmationModal
            visible={true}
            title="Hora Inválida"
            message="No puedes seleccionar una hora que ya ha pasado. Por favor, elige una hora futura."
            confirmText="Entendido"
            onConfirm={modalHelpers.hideModal}
          />
        );

      case 'exitConfirmation':
        return (
          <ConfirmationModal
            visible={true}
            title="¿Descartar cambios?"
            message="Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?"
            confirmText="Descartar"
            cancelText="Cancelar"
            onConfirm={() => {
              modalHelpers.hideModal();
              modalProps.onClose?.();
            }}
            onCancel={modalHelpers.hideModal}
          />
        );

      case 'cancelConfirmation':
        return (
          <ConfirmationModal
            visible={true}
            title="¿Cancelar orden?"
            message={`¿Estás seguro de que quieres cancelar la orden #${modalProps.orderNumber}? Esta acción no se puede deshacer.`}
            confirmText="Cancelar Orden"
            cancelText="No, mantener"
            onConfirm={() => {
              modalHelpers.hideModal();
              modalProps.onCancelOrder?.();
            }}
            onCancel={modalHelpers.hideModal}
          />
        );

      case 'modifyInProgressConfirmation':
        return (
          <ConfirmationModal
            visible={true}
            title="¿Modificar producto en preparación?"
            message={`El producto "${modalProps.modifyingItemName}" está actualmente en preparación. ¿Estás seguro de que quieres modificarlo?`}
            confirmText="Sí, modificar"
            cancelText="No, cancelar"
            onConfirm={() => {
              modalHelpers.hideModal();
              if (modalProps.pendingModifyAction) {
                modalProps.pendingModifyAction();
                modalProps.setPendingModifyAction(null);
              }
              modalProps.setModifyingItemName('');
            }}
            onCancel={() => {
              modalHelpers.hideModal();
              modalProps.setPendingModifyAction(null);
              modalProps.setModifyingItemName('');
            }}
          />
        );

      case 'deletePrepaymentConfirm':
        return (
          <ConfirmationModal
            visible={true}
            title="¿Eliminar prepago?"
            message="¿Estás seguro de que deseas eliminar este prepago? Esta acción no se puede deshacer."
            confirmText="Eliminar"
            cancelText="Cancelar"
            onConfirm={async () => {
              await modalProps.confirmDeletePrepayment();
              modalHelpers.hideModal();
            }}
            onCancel={modalHelpers.hideModal}
          />
        );

      case 'productCustomization':
        return (
          <ProductCustomizationModal
            visible={true}
            product={modalProps.editingProduct}
            editingItem={modalProps.editingItemFromList}
            onDismiss={() => {
              modalProps.clearEditingState();
              modalHelpers.hideModal();
            }}
            onAddToCart={() => {}}
            onUpdateItem={modalProps.handleUpdateEditedItem}
          />
        );

      case 'orderDetail':
        return (
          <OrderDetailModal
            visible={true}
            onDismiss={modalHelpers.hideModal}
            orderId={modalProps.orderId}
            orderNumber={modalProps.orderNumber}
            orderData={modalProps.orderData}
          />
        );

      case 'orderHistory':
        return (
          <OrderHistoryModal
            visible={true}
            onDismiss={modalHelpers.hideModal}
            orderId={modalProps.orderId}
            orderNumber={modalProps.orderNumber}
          />
        );

      case 'payment':
        console.log('ModalsContainer - payment modal props:', modalProps);
        return (
          <PaymentModal
            visible={true}
            onDismiss={modalHelpers.hideModal}
            orderId={modalProps.orderId}
            orderTotal={modalProps.orderTotal}
            orderNumber={modalProps.orderNumber}
            orderStatus={modalProps.orderStatus}
            existingPayments={modalProps.existingPayments}
            onOrderCompleted={() => {
              modalHelpers.hideModal();
              modalProps.onOrderCompleted?.();
            }}
            onPaymentRegistered={() => {
              modalProps.onPaymentRegistered?.();
            }}
          />
        );

      case 'adjustment':
        return (
          <AdjustmentFormModal
            visible={true}
            onDismiss={() => {
              modalHelpers.hideModal();
              modalProps.setAdjustmentToEdit(null);
            }}
            onSave={(adjustment: OrderAdjustment) => {
              if (modalProps.adjustmentToEdit) {
                modalProps.handleUpdateAdjustment(
                  modalProps.adjustmentToEdit.id!,
                  adjustment,
                );
              } else {
                modalProps.handleAddAdjustment(adjustment);
              }
              modalHelpers.hideModal();
              modalProps.setAdjustmentToEdit(null);
            }}
            adjustment={modalProps.adjustmentToEdit}
            orderSubtotal={modalProps.subtotal}
          />
        );

      case 'prepayment':
        return (
          <PaymentModal
            visible={true}
            onDismiss={modalHelpers.hideModal}
            orderTotal={modalProps.orderTotal}
            mode="prepayment"
            onPrepaymentCreated={modalProps.handlePrepaymentCreated}
            existingPrepaymentId={modalProps.prepaymentId || undefined}
            onPrepaymentDeleted={modalProps.handlePrepaymentDeleted}
          />
        );

      default:
        return null;
    }
  };

  return <>{renderModal()}</>;
};
