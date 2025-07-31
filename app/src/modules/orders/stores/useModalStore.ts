import { create } from 'zustand';
import type {
  ModalType,
  ModalConfig,
  ModalPropsForType,
  TimePickerModalProps,
  ExitConfirmationModalProps,
  CancelConfirmationModalProps,
  ModifyInProgressConfirmationModalProps,
  DeletePrepaymentConfirmModalProps,
  ProductCustomizationModalProps,
  PaymentModalProps,
  AdjustmentModalProps,
  PrepaymentModalProps,
} from '../types/modal.types';

interface ModalState {
  modalType: ModalType;
  modalProps: ModalConfig['props'];
  isVisible: boolean;
}

interface ModalActions {
  showModal: <T extends Exclude<ModalType, null>>(
    type: T,
    props: ModalPropsForType<T>,
  ) => void;
  hideModal: () => void;
  updateModalProps: (props: any) => void;
}

export interface ModalStore extends ModalState, ModalActions {}

export const useModalStore = create<ModalStore>((set) => ({
  modalType: null,
  modalProps: {},
  isVisible: false,

  showModal: <T extends Exclude<ModalType, null>>(
    type: T,
    props: ModalPropsForType<T>,
  ) => {
    set({
      modalType: type,
      modalProps: props,
      isVisible: true,
    });
  },

  hideModal: () => {
    set({
      modalType: null,
      modalProps: {},
      isVisible: false,
    });
  },

  updateModalProps: (props: any) => {
    set((state) => ({
      modalProps: { ...state.modalProps, ...props },
    }));
  },
}));

export const modalHelpers = {
  showTimePicker: (props: TimePickerModalProps) => {
    useModalStore.getState().showModal('timePicker', props);
  },

  showTimeAlert: () => {
    useModalStore.getState().showModal('timeAlert', {});
  },

  showExitConfirmation: (props: ExitConfirmationModalProps) => {
    useModalStore.getState().showModal('exitConfirmation', props);
  },

  showCancelConfirmation: (props: CancelConfirmationModalProps) => {
    useModalStore.getState().showModal('cancelConfirmation', props);
  },

  showModifyInProgressConfirmation: (
    props: ModifyInProgressConfirmationModalProps,
  ) => {
    useModalStore.getState().showModal('modifyInProgressConfirmation', props);
  },

  showDeletePrepaymentConfirm: (props: DeletePrepaymentConfirmModalProps) => {
    useModalStore.getState().showModal('deletePrepaymentConfirm', props);
  },

  showProductCustomization: (props: ProductCustomizationModalProps) => {
    useModalStore.getState().showModal('productCustomization', props);
  },

  showPayment: (props: PaymentModalProps) => {
    useModalStore.getState().showModal('payment', props);
  },

  showAdjustment: (props: AdjustmentModalProps) => {
    useModalStore.getState().showModal('adjustment', props);
  },

  showPrepayment: (props: PrepaymentModalProps) => {
    useModalStore.getState().showModal('prepayment', props);
  },

  hideModal: () => {
    useModalStore.getState().hideModal();
  },
};
