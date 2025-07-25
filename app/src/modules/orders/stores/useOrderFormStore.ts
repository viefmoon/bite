import { create } from 'zustand';
import { OrderTypeEnum, type OrderType } from '../types/orders.types';
import type { DeliveryInfo } from '../../../app/schemas/domain/delivery-info.schema';

interface OrderFormStore {
  // Estado del formulario de la orden
  orderType: OrderType;
  selectedAreaId: string | null;
  selectedTableId: string | null;
  isTemporaryTable: boolean;
  temporaryTableName: string;
  scheduledTime: Date | null;
  deliveryInfo: DeliveryInfo;
  orderNotes: string;

  // Estado del prepago
  prepaymentId: string | null;
  prepaymentAmount: string;
  prepaymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | null;

  // Actions
  setOrderType: (type: OrderType) => void;
  setSelectedAreaId: (id: string | null) => void;
  setSelectedTableId: (id: string | null) => void;
  setIsTemporaryTable: (isTemp: boolean) => void;
  setTemporaryTableName: (name: string) => void;
  setScheduledTime: (time: Date | null) => void;
  setDeliveryInfo: (info: DeliveryInfo) => void;
  setOrderNotes: (notes: string) => void;
  setPrepaymentId: (id: string | null) => void;
  setPrepaymentAmount: (amount: string) => void;
  setPrepaymentMethod: (method: 'CASH' | 'CARD' | 'TRANSFER' | null) => void;
  clearForm: () => void;
}

export const useOrderFormStore = create<OrderFormStore>((set) => ({
  // Estado inicial del formulario
  orderType: OrderTypeEnum.DINE_IN,
  selectedAreaId: null,
  selectedTableId: null,
  isTemporaryTable: false,
  temporaryTableName: '',
  scheduledTime: null,
  deliveryInfo: {},
  orderNotes: '',

  // Estado inicial del prepago
  prepaymentId: null,
  prepaymentAmount: '',
  prepaymentMethod: null,

  // Actions
  setOrderType: (type: OrderType) => {
    set({ orderType: type });
  },

  setSelectedAreaId: (id: string | null) => {
    set({ selectedAreaId: id });
  },

  setSelectedTableId: (id: string | null) => {
    set({ selectedTableId: id });
  },

  setIsTemporaryTable: (isTemp: boolean) => {
    set({ isTemporaryTable: isTemp });
  },

  setTemporaryTableName: (name: string) => {
    set({ temporaryTableName: name });
  },

  setScheduledTime: (time: Date | null) => {
    set({ scheduledTime: time });
  },

  setDeliveryInfo: (info: DeliveryInfo) => {
    set({ deliveryInfo: info });
  },

  setOrderNotes: (notes: string) => {
    set({ orderNotes: notes });
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

  clearForm: () => {
    set({
      orderType: OrderTypeEnum.DINE_IN,
      selectedAreaId: null,
      selectedTableId: null,
      isTemporaryTable: false,
      temporaryTableName: '',
      scheduledTime: null,
      deliveryInfo: {},
      orderNotes: '',
      prepaymentId: null,
      prepaymentAmount: '',
      prepaymentMethod: null,
    });
  },
}));
