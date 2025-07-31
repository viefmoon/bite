import React from 'react';
import { Portal } from 'react-native-paper';
import DateTimePickerSafe from '@/app/components/DateTimePickerSafe';
import ConfirmationModal from '@/app/components/common/ConfirmationModal';
import ProductCustomizationModal from '../ProductCustomizationModal';
import PaymentModal from '../PaymentModal';
import { AdjustmentFormModal } from '../AdjustmentFormModal';
import { OrderTypeEnum } from '../../schema/orders.schema';
import type { OrderAdjustment } from '../../schema/adjustments.schema';
import { useModalStore, modalHelpers } from '../../stores/useModalStore';
import type {
  TimePickerModalProps,
  ExitConfirmationModalProps,
  CancelConfirmationModalProps,
  ModifyInProgressConfirmationModalProps,
  DeletePrepaymentConfirmModalProps,
  ProductCustomizationModalProps,
  PaymentModalProps,
  AdjustmentModalProps,
  PrepaymentModalProps,
} from '../../types/modal.types';

export const ModalsContainer: React.FC<Record<string, never>> = () => {
  const { modalType, modalProps, isVisible } = useModalStore();
  if (!isVisible || !modalType) {
    return null;
  }

  const renderModal = () => {
    switch (modalType) {
      case 'timePicker': {
        const props = modalProps as TimePickerModalProps;
        return (
          <Portal>
            <DateTimePickerSafe
              visible={true}
              mode="time"
              value={props.scheduledTime}
              onConfirm={props.onTimeConfirm}
              onCancel={() => {
                props.hideTimePicker?.();
                modalHelpers.hideModal();
              }}
              minimumDate={new Date()}
              minuteInterval={5}
              title={
                props.orderType === OrderTypeEnum.DELIVERY
                  ? 'Seleccionar Hora de Entrega'
                  : props.orderType === OrderTypeEnum.TAKE_AWAY
                    ? 'Seleccionar Hora de Recolección'
                    : 'Seleccionar Hora'
              }
              allowManualInput={true}
            />
          </Portal>
        );
      }

      case 'timeAlert': {
        return (
          <ConfirmationModal
            visible={true}
            title="Hora Inválida"
            message="No puedes seleccionar una hora que ya ha pasado. Por favor, elige una hora futura."
            confirmText="Entendido"
            onConfirm={modalHelpers.hideModal}
          />
        );
      }

      case 'exitConfirmation': {
        const props = modalProps as ExitConfirmationModalProps;
        return (
          <ConfirmationModal
            visible={true}
            title="¿Descartar cambios?"
            message="Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?"
            confirmText="Descartar"
            cancelText="Cancelar"
            onConfirm={() => {
              modalHelpers.hideModal();
              props.onClose?.();
            }}
            onCancel={modalHelpers.hideModal}
          />
        );
      }

      case 'cancelConfirmation': {
        const props = modalProps as CancelConfirmationModalProps;
        return (
          <ConfirmationModal
            visible={true}
            title="¿Cancelar orden?"
            message={`¿Estás seguro de que quieres cancelar la orden #${props.orderNumber}? Esta acción no se puede deshacer.`}
            confirmText="Descartar"
            cancelText="Cancelar"
            onConfirm={() => {
              modalHelpers.hideModal();
              props.onCancelOrder?.();
            }}
            onCancel={modalHelpers.hideModal}
          />
        );
      }

      case 'modifyInProgressConfirmation': {
        const props = modalProps as ModifyInProgressConfirmationModalProps;
        return (
          <ConfirmationModal
            visible={true}
            title="¿Modificar producto en preparación?"
            message={`El producto "${props.modifyingItemName}" está actualmente en preparación. ¿Estás seguro de que quieres modificarlo?`}
            confirmText="Descartar"
            cancelText="Cancelar"
            onConfirm={() => {
              modalHelpers.hideModal();
              if (props.pendingModifyAction) {
                props.pendingModifyAction();
                props.setPendingModifyAction(null);
              }
              props.setModifyingItemName('');
            }}
            onCancel={() => {
              modalHelpers.hideModal();
              props.setPendingModifyAction(null);
              props.setModifyingItemName('');
            }}
          />
        );
      }

      case 'deletePrepaymentConfirm': {
        const props = modalProps as DeletePrepaymentConfirmModalProps;
        return (
          <ConfirmationModal
            visible={true}
            title="¿Eliminar prepago?"
            message="¿Estás seguro de que deseas eliminar este prepago? Esta acción no se puede deshacer."
            confirmText="Eliminar"
            cancelText="Cancelar"
            onConfirm={async () => {
              await props.confirmDeletePrepayment();
              modalHelpers.hideModal();
            }}
            onCancel={modalHelpers.hideModal}
          />
        );
      }

      case 'productCustomization': {
        const props = modalProps as ProductCustomizationModalProps;
        return (
          <ProductCustomizationModal
            visible={true}
            product={props.editingProduct}
            editingItem={props.editingItemFromList}
            onDismiss={() => {
              props.clearEditingState();
              modalHelpers.hideModal();
            }}
            onAddItem={() => {}}
            onUpdateItem={props.handleUpdateEditedItem}
          />
        );
      }

      case 'payment': {
        const props = modalProps as PaymentModalProps;
        return (
          <PaymentModal
            visible={true}
            onDismiss={modalHelpers.hideModal}
            orderId={props.orderId}
            orderTotal={props.orderTotal}
            orderNumber={props.orderNumber}
            orderStatus={props.orderStatus}
            onOrderCompleted={() => {
              modalHelpers.hideModal();
              props.onOrderCompleted?.();
            }}
            onPaymentRegistered={() => {
              props.onPaymentRegistered?.();
            }}
          />
        );
      }

      case 'adjustment': {
        const props = modalProps as AdjustmentModalProps;
        return (
          <AdjustmentFormModal
            visible={true}
            onDismiss={() => {
              modalHelpers.hideModal();
              props.setAdjustmentToEdit(null);
            }}
            onSave={(adjustment: OrderAdjustment) => {
              if (props.adjustmentToEdit) {
                props.handleUpdateAdjustment(
                  props.adjustmentToEdit.id!,
                  adjustment,
                );
              } else {
                props.handleAddAdjustment(adjustment);
              }
              modalHelpers.hideModal();
              props.setAdjustmentToEdit(null);
            }}
            adjustment={props.adjustmentToEdit}
            orderSubtotal={props.subtotal}
          />
        );
      }

      case 'prepayment': {
        const props = modalProps as PrepaymentModalProps;
        return (
          <PaymentModal
            visible={true}
            onDismiss={modalHelpers.hideModal}
            orderTotal={props.orderTotal}
            mode="prepayment"
            onPrepaymentCreated={props.handlePrepaymentCreated}
            existingPrepaymentId={props.prepaymentId || undefined}
            onPrepaymentDeleted={props.handlePrepaymentDeleted}
          />
        );
      }

      default:
        return null;
    }
  };

  return <>{renderModal()}</>;
};
