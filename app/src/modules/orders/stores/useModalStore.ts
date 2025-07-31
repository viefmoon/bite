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

export interface TimePickerProps {
  scheduledTime: Date | null;
  orderType: string;
  onTimeConfirm: (date: Date) => void;
  hideTimePicker: () => void;
}

export interface ExitConfirmationProps {
  onClose?: () => void;
}

export interface CancelConfirmationProps {
  orderNumber?: number;
  onCancelOrder?: () => void;
}

export interface ModifyInProgressConfirmationProps {
  modifyingItemName: string;
  pendingModifyAction: (() => void) | null;
  setPendingModifyAction: (action: (() => void) | null) => void;
  setModifyingItemName: (name: string) => void;
}

export interface DeletePrepaymentConfirmProps {
  confirmDeletePrepayment: () => Promise<void>;
}

export interface ProductCustomizationProps {
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
}

export interface OrderDetailProps {
  orderId?: string | null;
  orderNumber?: number;
  orderData?: any;
}

export interface OrderHistoryProps {
  orderId?: string | null;
  orderNumber?: number;
}

export interface PaymentProps {
  orderId?: string;
  orderTotal: number;
  orderNumber?: number;
  orderStatus?: string;
  existingPayments?: any[];
  onOrderCompleted?: () => void;
  onPaymentRegistered?: () => void;
  onClose?: () => void;
}

export interface AdjustmentProps {
  adjustmentToEdit: OrderAdjustment | null;
  setAdjustmentToEdit: (adjustment: OrderAdjustment | null) => void;
  handleAddAdjustment: (adjustment: OrderAdjustment) => void;
  handleUpdateAdjustment: (id: string, adjustment: OrderAdjustment) => void;
  subtotal: number;
}

export interface PrepaymentProps {
  orderTotal: number;
  prepaymentId: string | null;
  handlePrepaymentCreated: (
    prepaymentIdCreated: string,
    amount: number,
    method: 'CASH' | 'CARD' | 'TRANSFER',
  ) => void;
  handlePrepaymentDeleted: () => void;
}

export type ModalProps =
  | TimePickerProps
  | ExitConfirmationProps
  | CancelConfirmationProps
  | ModifyInProgressConfirmationProps
  | DeletePrepaymentConfirmProps
  | ProductCustomizationProps
  | OrderDetailProps
  | OrderHistoryProps
  | PaymentProps
  | AdjustmentProps
  | PrepaymentProps
  | Record<string, never>;

interface ModalState {
  modalType: ModalType;
  modalProps: ModalProps;
  isVisible: boolean;
}

interface ModalActions {
  showModal: (type: ModalType, props?: ModalProps) => void;
  hideModal: () => void;
  updateModalProps: (props: Partial<ModalProps>) => void;
  showTimePicker: (props: TimePickerProps) => void;
  showTimeAlert: () => void;
  showExitConfirmation: (props: ExitConfirmationProps) => void;
  showCancelConfirmation: (props: CancelConfirmationProps) => void;
  showModifyInProgressConfirmation: (
    props: ModifyInProgressConfirmationProps,
  ) => void;
  showDeletePrepaymentConfirm: (props: DeletePrepaymentConfirmProps) => void;
  showProductCustomization: (props: ProductCustomizationProps) => void;
  showOrderDetail: (props: OrderDetailProps) => void;
  showOrderHistory: (props: OrderHistoryProps) => void;
  showPayment: (props: PaymentProps) => void;
  showAdjustment: (props: AdjustmentProps) => void;
  showPrepayment: (props: PrepaymentProps) => void;
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

  updateModalProps: (props: Partial<ModalProps>) => {
    set((state) => ({
      modalProps: { ...state.modalProps, ...props } as ModalProps,
    }));
  },

  showTimePicker: (props: TimePickerProps) => {
    set({
      modalType: 'timePicker',
      modalProps: props,
      isVisible: true,
    });
  },

  showTimeAlert: () => {
    set({
      modalType: 'timeAlert',
      modalProps: {},
      isVisible: true,
    });
  },

  showExitConfirmation: (props: ExitConfirmationProps) => {
    set({
      modalType: 'exitConfirmation',
      modalProps: props,
      isVisible: true,
    });
  },

  showCancelConfirmation: (props: CancelConfirmationProps) => {
    set({
      modalType: 'cancelConfirmation',
      modalProps: props,
      isVisible: true,
    });
  },

  showModifyInProgressConfirmation: (
    props: ModifyInProgressConfirmationProps,
  ) => {
    set({
      modalType: 'modifyInProgressConfirmation',
      modalProps: props,
      isVisible: true,
    });
  },

  showDeletePrepaymentConfirm: (props: DeletePrepaymentConfirmProps) => {
    set({
      modalType: 'deletePrepaymentConfirm',
      modalProps: props,
      isVisible: true,
    });
  },

  showProductCustomization: (props: ProductCustomizationProps) => {
    set({
      modalType: 'productCustomization',
      modalProps: props,
      isVisible: true,
    });
  },

  showOrderDetail: (props: OrderDetailProps) => {
    set({
      modalType: 'orderDetail',
      modalProps: props,
      isVisible: true,
    });
  },

  showOrderHistory: (props: OrderHistoryProps) => {
    set({
      modalType: 'orderHistory',
      modalProps: props,
      isVisible: true,
    });
  },

  showPayment: (props: PaymentProps) => {
    set({
      modalType: 'payment',
      modalProps: props,
      isVisible: true,
    });
  },

  showAdjustment: (props: AdjustmentProps) => {
    set({
      modalType: 'adjustment',
      modalProps: props,
      isVisible: true,
    });
  },

  showPrepayment: (props: PrepaymentProps) => {
    set({
      modalType: 'prepayment',
      modalProps: props,
      isVisible: true,
    });
  },
}));
