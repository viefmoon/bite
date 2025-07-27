import { create } from 'zustand';
import type { OrderAdjustment } from '../schema/adjustments.schema';
import type { CartItem } from '../utils/cartUtils';

export type ModalType =
  | 'timePicker'
  | 'timeAlert'
  | 'exitConfirmation'
  | 'cancelConfirmation'
  | 'modifyInProgressConfirmation'
  | 'deletePrepaymentConfirm'
  | 'productCustomization'
  | 'orderDetail'
  | 'orderHistory'
  | 'payment'
  | 'adjustment'
  | 'prepayment'
  | null;

interface ModalState {
  modalType: ModalType;
  modalProps: any;
  isVisible: boolean;
}

interface ModalActions {
  showModal: (type: ModalType, props?: any) => void;
  hideModal: () => void;
  updateModalProps: (props: any) => void;
}

export interface ModalStore extends ModalState, ModalActions {}

export const useModalStore = create<ModalStore>((set) => ({
  modalType: null,
  modalProps: {},
  isVisible: false,

  showModal: (type: ModalType, props = {}) => {
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
  showTimePicker: (props: {
    scheduledTime: Date | null;
    orderType: string;
    onTimeConfirm: (date: Date) => void;
    hideTimePicker: () => void;
  }) => {
    useModalStore.getState().showModal('timePicker', props);
  },

  showTimeAlert: () => {
    useModalStore.getState().showModal('timeAlert');
  },

  showExitConfirmation: (props: { onClose?: () => void }) => {
    useModalStore.getState().showModal('exitConfirmation', props);
  },

  showCancelConfirmation: (props: {
    orderNumber?: number;
    onCancelOrder?: () => void;
  }) => {
    useModalStore.getState().showModal('cancelConfirmation', props);
  },

  showModifyInProgressConfirmation: (props: {
    modifyingItemName: string;
    pendingModifyAction: (() => void) | null;
    setPendingModifyAction: (action: (() => void) | null) => void;
    setModifyingItemName: (name: string) => void;
  }) => {
    useModalStore.getState().showModal('modifyInProgressConfirmation', props);
  },

  showDeletePrepaymentConfirm: (props: {
    confirmDeletePrepayment: () => Promise<void>;
  }) => {
    useModalStore.getState().showModal('deletePrepaymentConfirm', props);
  },

  showProductCustomization: (props: {
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
  }) => {
    useModalStore.getState().showModal('productCustomization', props);
  },

  showOrderDetail: (props: {
    orderId?: string | null;
    orderNumber?: number;
    orderData?: any;
  }) => {
    useModalStore.getState().showModal('orderDetail', props);
  },

  showOrderHistory: (props: {
    orderId?: string | null;
    orderNumber?: number;
  }) => {
    useModalStore.getState().showModal('orderHistory', props);
  },

  showPayment: (props: {
    orderId?: string;
    orderTotal: number;
    orderNumber?: number;
    orderStatus?: string;
    onOrderCompleted?: () => void;
    onClose?: () => void;
  }) => {
    useModalStore.getState().showModal('payment', props);
  },

  showAdjustment: (props: {
    adjustmentToEdit: OrderAdjustment | null;
    setAdjustmentToEdit: (adjustment: OrderAdjustment | null) => void;
    handleAddAdjustment: (adjustment: OrderAdjustment) => void;
    handleUpdateAdjustment: (id: string, adjustment: OrderAdjustment) => void;
    subtotal: number;
  }) => {
    useModalStore.getState().showModal('adjustment', props);
  },

  showPrepayment: (props: {
    orderTotal: number;
    prepaymentId: string | null;
    handlePrepaymentCreated: (
      prepaymentIdCreated: string,
      amount: number,
      method: 'CASH' | 'CARD' | 'TRANSFER',
    ) => void;
    handlePrepaymentDeleted: () => void;
  }) => {
    useModalStore.getState().showModal('prepayment', props);
  },

  hideModal: () => {
    useModalStore.getState().hideModal();
  },
};
