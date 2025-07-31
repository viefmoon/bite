import type { OrderAdjustment } from '../schema/adjustments.schema';
import type { CartItem } from '../utils/cartUtils';

// Props para cada tipo de modal
export interface TimePickerModalProps {
  scheduledTime: Date | null;
  orderType: string;
  onTimeConfirm: (date: Date) => void;
  hideTimePicker: () => void;
}

export interface ExitConfirmationModalProps {
  onClose?: () => void;
}

export interface CancelConfirmationModalProps {
  orderNumber?: number;
  onCancelOrder?: () => void;
}

export interface ModifyInProgressConfirmationModalProps {
  modifyingItemName: string;
  pendingModifyAction: (() => void) | null;
  setPendingModifyAction: (action: (() => void) | null) => void;
  setModifyingItemName: (name: string) => void;
}

export interface DeletePrepaymentConfirmModalProps {
  confirmDeletePrepayment: () => Promise<void>;
}

export interface ProductCustomizationModalProps {
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

export interface OrderHistoryModalProps {
  orderId: string | null;
  orderNumber?: number;
}

export interface PaymentModalProps {
  orderId?: string | undefined;
  orderTotal: number;
  orderNumber?: number | undefined;
  orderStatus?: string | undefined;
  onOrderCompleted?: () => void;
  onPaymentRegistered?: () => void;
  mode?: 'payment' | 'prepayment';
  onPrepaymentCreated?: (
    prepaymentId: string,
    amount: number,
    method: 'CASH' | 'CARD' | 'TRANSFER',
  ) => void;
  existingPrepaymentId?: string | undefined;
  onPrepaymentDeleted?: () => void;
}

export interface AdjustmentModalProps {
  adjustmentToEdit: OrderAdjustment | null;
  setAdjustmentToEdit: (adjustment: OrderAdjustment | null) => void;
  handleAddAdjustment: (adjustment: OrderAdjustment) => void;
  handleUpdateAdjustment: (id: string, adjustment: OrderAdjustment) => void;
  subtotal: number;
}

export interface PrepaymentModalProps {
  orderTotal: number;
  prepaymentId: string | null;
  handlePrepaymentCreated: (
    prepaymentIdCreated: string,
    amount: number,
    method: 'CASH' | 'CARD' | 'TRANSFER',
  ) => void;
  handlePrepaymentDeleted: () => void;
}

// Unión discriminada de todos los tipos de modales
export type ModalConfig =
  | { type: 'timePicker'; props: TimePickerModalProps }
  | { type: 'timeAlert'; props: Record<string, never> }
  | { type: 'exitConfirmation'; props: ExitConfirmationModalProps }
  | { type: 'cancelConfirmation'; props: CancelConfirmationModalProps }
  | {
      type: 'modifyInProgressConfirmation';
      props: ModifyInProgressConfirmationModalProps;
    }
  | {
      type: 'deletePrepaymentConfirm';
      props: DeletePrepaymentConfirmModalProps;
    }
  | { type: 'productCustomization'; props: ProductCustomizationModalProps }
  | { type: 'payment'; props: PaymentModalProps }
  | { type: 'adjustment'; props: AdjustmentModalProps }
  | { type: 'prepayment'; props: PrepaymentModalProps }
  | { type: null; props: Record<string, never> };

// Tipo helper para extraer las props de un tipo específico de modal
export type ModalPropsForType<T extends ModalConfig['type']> = T extends null
  ? Record<string, never>
  : Extract<ModalConfig, { type: T }>['props'];

// Tipo de modal disponibles
export type ModalType = ModalConfig['type'];
