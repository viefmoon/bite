import { create } from 'zustand';
import { OrderTypeEnum, type OrderType } from '../schema/orders.schema';
import type { DeliveryInfo } from '../../../app/schemas/domain/delivery-info.schema';
import type { OrderAdjustment } from '../schema/adjustments.schema';

interface OrderFormState {
  id: string | null;
  isEditMode: boolean;
  orderType: OrderType;
  selectedAreaId: string | null;
  selectedTableId: string | null;
  isTemporaryTable: boolean;
  temporaryTableName: string;
  scheduledTime: Date | null;
  deliveryInfo: DeliveryInfo;
  orderNotes: string;
  adjustments: OrderAdjustment[];
  prepaymentId: string | null;
  prepaymentAmount: string;
  prepaymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | null;
  hasUnsavedChanges: boolean;
  orderDataLoaded: boolean;
  originalState: {
    orderType: OrderType;
    tableId: string | null;
    isTemporaryTable: boolean;
    temporaryTableName: string;
    deliveryInfo: DeliveryInfo;
    notes: string;
    scheduledAt: Date | null;
    adjustments: OrderAdjustment[];
  } | null;
  setOrderType: (type: OrderType) => void;
  setSelectedAreaId: (id: string | null) => void;
  setSelectedTableId: (id: string | null) => void;
  setIsTemporaryTable: (isTemp: boolean) => void;
  setTemporaryTableName: (name: string) => void;
  setScheduledTime: (time: Date | null) => void;
  setDeliveryInfo: (info: DeliveryInfo) => void;
  setOrderNotes: (notes: string) => void;
  setAdjustments: (adjustments: OrderAdjustment[]) => void;
  addAdjustment: (adjustment: OrderAdjustment) => void;
  updateAdjustment: (id: string, adjustment: Partial<OrderAdjustment>) => void;
  removeAdjustment: (id: string) => void;
  setPrepaymentId: (id: string | null) => void;
  setPrepaymentAmount: (amount: string) => void;
  setPrepaymentMethod: (method: 'CASH' | 'CARD' | 'TRANSFER' | null) => void;
  setEditMode: (isEdit: boolean, orderId?: string | null) => void;
  checkForUnsavedChanges: () => void;
  resetForm: () => void;
  resetToOriginalState: () => void;
  setOriginalState: (state: any) => void;
}

export const useOrderFormStore = create<OrderFormState>((set, get) => ({
  id: null,
  isEditMode: false,
  orderType: OrderTypeEnum.DINE_IN,
  selectedAreaId: null,
  selectedTableId: null,
  isTemporaryTable: false,
  temporaryTableName: '',
  scheduledTime: null,
  deliveryInfo: {},
  orderNotes: '',
  adjustments: [],
  prepaymentId: null,
  prepaymentAmount: '',
  prepaymentMethod: null,
  hasUnsavedChanges: false,
  orderDataLoaded: false,
  originalState: null,

  setOrderType: (type: OrderType) => {
    set((state) => {
      const newState: Partial<OrderFormState> = { orderType: type };

      if (type !== OrderTypeEnum.DINE_IN) {
        newState.selectedAreaId = null;
        newState.selectedTableId = null;
        newState.isTemporaryTable = false;
        newState.temporaryTableName = '';
      }

      if (type === OrderTypeEnum.DINE_IN) {
        newState.deliveryInfo = {};
      }

      if (type === OrderTypeEnum.TAKE_AWAY) {
        newState.deliveryInfo = {
          recipientName: state.deliveryInfo.recipientName || '',
          recipientPhone: state.deliveryInfo.recipientPhone || '',
        };
      }

      return newState;
    });
    get().checkForUnsavedChanges();
  },

  setSelectedAreaId: (id: string | null) => {
    set({ selectedAreaId: id });
    get().checkForUnsavedChanges();
  },

  setSelectedTableId: (id: string | null) => {
    set((_state) => {
      const newState: Partial<OrderFormState> = { selectedTableId: id };

      // Si se selecciona una mesa existente, desmarcar mesa temporal
      if (id) {
        newState.isTemporaryTable = false;
        newState.temporaryTableName = '';
      }

      return newState;
    });
    get().checkForUnsavedChanges();
  },

  setIsTemporaryTable: (isTemp: boolean) => {
    set((_state) => {
      const newState: Partial<OrderFormState> = { isTemporaryTable: isTemp };

      // Si se desmarca mesa temporal, limpiar el nombre
      if (!isTemp) {
        newState.temporaryTableName = '';
      }

      // Si se marca mesa temporal, limpiar selección de mesa existente
      if (isTemp) {
        newState.selectedTableId = null;
      }

      return newState;
    });
    get().checkForUnsavedChanges();
  },

  setTemporaryTableName: (name: string) => {
    set({ temporaryTableName: name });
    get().checkForUnsavedChanges();
  },

  setScheduledTime: (time: Date | null) => {
    set({ scheduledTime: time });
    get().checkForUnsavedChanges();
  },

  setDeliveryInfo: (info: DeliveryInfo) => {
    set({ deliveryInfo: info });
    get().checkForUnsavedChanges();
  },

  setOrderNotes: (notes: string) => {
    set({ orderNotes: notes });
    get().checkForUnsavedChanges();
  },

  setAdjustments: (adjustments: OrderAdjustment[]) => {
    set({ adjustments });
    get().checkForUnsavedChanges();
  },

  addAdjustment: (adjustment: OrderAdjustment) => {
    const { adjustments } = get();
    const newAdjustment = {
      ...adjustment,
      id:
        adjustment.id ||
        `new-adjustment-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      isNew: true,
    };
    set({ adjustments: [...adjustments, newAdjustment] });
    get().checkForUnsavedChanges();
  },

  updateAdjustment: (
    id: string,
    updatedAdjustment: Partial<OrderAdjustment>,
  ) => {
    const { adjustments } = get();
    set({
      adjustments: adjustments.map((adj) =>
        adj.id === id ? { ...adj, ...updatedAdjustment } : adj,
      ),
    });
    get().checkForUnsavedChanges();
  },

  removeAdjustment: (id: string) => {
    const { adjustments } = get();
    set({ adjustments: adjustments.filter((adj) => adj.id !== id) });
    get().checkForUnsavedChanges();
  },

  setPrepaymentId: (id: string | null) => {
    set({ prepaymentId: id });
  },

  setPrepaymentAmount: (amount: string) => {
    set({ prepaymentAmount: amount });
  },

  setPrepaymentMethod: (method: 'CASH' | 'CARD' | 'TRANSFER' | null) => {
    set({ prepaymentMethod: method });
  },

  setEditMode: (isEdit: boolean, orderId?: string | null) => {
    set({ isEditMode: isEdit, id: orderId || null });
  },

  checkForUnsavedChanges: () => {
    const state = get();
    if (!state.isEditMode || !state.originalState) {
      set({ hasUnsavedChanges: false });
      return;
    }

    const hasChanges =
      state.orderType !== state.originalState.orderType ||
      state.selectedTableId !== state.originalState.tableId ||
      state.isTemporaryTable !== state.originalState.isTemporaryTable ||
      state.temporaryTableName !== state.originalState.temporaryTableName ||
      JSON.stringify(state.deliveryInfo) !==
        JSON.stringify(state.originalState.deliveryInfo) ||
      state.orderNotes !== state.originalState.notes ||
      (state.scheduledTime?.getTime() ?? null) !==
        (state.originalState.scheduledAt?.getTime() ?? null) ||
      JSON.stringify(state.adjustments) !==
        JSON.stringify(state.originalState.adjustments);

    set({ hasUnsavedChanges: hasChanges });
  },

  resetForm: () => {
    set({
      id: null,
      isEditMode: false,
      orderType: OrderTypeEnum.DINE_IN,
      selectedAreaId: null,
      selectedTableId: null,
      isTemporaryTable: false,
      temporaryTableName: '',
      scheduledTime: null,
      deliveryInfo: {},
      orderNotes: '',
      adjustments: [],
      prepaymentId: null,
      prepaymentAmount: '',
      prepaymentMethod: null,
      hasUnsavedChanges: false,
      orderDataLoaded: false,
      originalState: null,
    });
  },

  resetToOriginalState: () => {
    const { originalState } = get();
    if (!originalState) return;

    set({
      orderType: originalState.orderType,
      selectedTableId: originalState.tableId,
      isTemporaryTable: originalState.isTemporaryTable,
      temporaryTableName: originalState.temporaryTableName,
      deliveryInfo: { ...originalState.deliveryInfo },
      orderNotes: originalState.notes,
      scheduledTime: originalState.scheduledAt,
      adjustments: [...originalState.adjustments],
      hasUnsavedChanges: false,
    });
  },

  setOriginalState: (orderData: any) => {
    const originalState = {
      orderType: orderData.orderType,
      tableId: orderData.tableId ?? null,
      isTemporaryTable: orderData.table?.isTemporary || false,
      temporaryTableName: orderData.table?.isTemporary
        ? orderData.table.name
        : '',
      deliveryInfo: orderData.deliveryInfo || {},
      notes: orderData.notes ?? '',
      scheduledAt: orderData.scheduledAt
        ? new Date(orderData.scheduledAt)
        : null,
      adjustments: orderData.adjustments || [],
    };

    set({
      originalState,
      hasUnsavedChanges: false,
      orderDataLoaded: true,
    });
  },
}));
