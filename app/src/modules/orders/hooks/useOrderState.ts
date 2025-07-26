import { useState, useCallback } from 'react';
import { OrderTypeEnum, type OrderType } from '../schema/orders.schema';
import type { DeliveryInfo } from '@/app/schemas/domain/delivery-info.schema';
import type { CartItem } from '../stores/useOrderStore';
import type { OrderAdjustment } from '../schema/adjustments.schema';

interface OrderState {
  // Edit mode states
  editItems: CartItem[];
  editOrderType: OrderType;
  editSelectedAreaId: string | null;
  editSelectedTableId: string | null;
  editScheduledTime: Date | null;
  editDeliveryInfo: DeliveryInfo;
  editOrderNotes: string;
  editAdjustments: OrderAdjustment[];
  editIsTemporaryTable: boolean;
  editTemporaryTableName: string;

  // Processing states
  processedPendingProductsIds: string[];
  orderDataLoaded: boolean;

  // UI states
  isTimePickerVisible: boolean;
  isTimeAlertVisible: boolean;
  isConfirming: boolean;
  showExitConfirmation: boolean;
  isModalReady: boolean;
  showOptionsMenu: boolean;
  showCancelConfirmation: boolean;
  showModifyInProgressConfirmation: boolean;
  pendingModifyAction: (() => void) | null;
  modifyingItemName: string;
  showHistoryModal: boolean;
  showDetailModal: boolean;
  showPaymentModal: boolean;
  showAdjustmentModal: boolean;
  adjustmentToEdit: OrderAdjustment | null;
  hasUnsavedChanges: boolean;

  // Original order state for comparison
  originalOrderState: {
    items: CartItem[];
    orderType: OrderType;
    tableId: string | null;
    isTemporaryTable: boolean;
    temporaryTableName: string;
    deliveryInfo: DeliveryInfo;
    notes: string;
    scheduledAt: Date | null;
    adjustments: OrderAdjustment[];
  } | null;

  // Tracking states
  lastNotifiedCount: number | null;
}

interface UseOrderStateReturn extends OrderState {
  // Setters for edit mode states
  setEditItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
  setEditOrderType: React.Dispatch<React.SetStateAction<OrderType>>;
  setEditSelectedAreaId: React.Dispatch<React.SetStateAction<string | null>>;
  setEditSelectedTableId: React.Dispatch<React.SetStateAction<string | null>>;
  setEditScheduledTime: React.Dispatch<React.SetStateAction<Date | null>>;
  setEditDeliveryInfo: React.Dispatch<React.SetStateAction<DeliveryInfo>>;
  setEditOrderNotes: React.Dispatch<React.SetStateAction<string>>;
  setEditAdjustments: React.Dispatch<React.SetStateAction<OrderAdjustment[]>>;
  setEditIsTemporaryTable: React.Dispatch<React.SetStateAction<boolean>>;
  setEditTemporaryTableName: React.Dispatch<React.SetStateAction<string>>;

  // Setters for processing states
  setProcessedPendingProductsIds: React.Dispatch<
    React.SetStateAction<string[]>
  >;
  setOrderDataLoaded: React.Dispatch<React.SetStateAction<boolean>>;

  // Setters for UI states
  setTimePickerVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setTimeAlertVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setIsConfirming: React.Dispatch<React.SetStateAction<boolean>>;
  setShowExitConfirmation: React.Dispatch<React.SetStateAction<boolean>>;
  setIsModalReady: React.Dispatch<React.SetStateAction<boolean>>;
  setShowOptionsMenu: React.Dispatch<React.SetStateAction<boolean>>;
  setShowCancelConfirmation: React.Dispatch<React.SetStateAction<boolean>>;
  setShowModifyInProgressConfirmation: React.Dispatch<
    React.SetStateAction<boolean>
  >;
  setPendingModifyAction: React.Dispatch<
    React.SetStateAction<(() => void) | null>
  >;
  setModifyingItemName: React.Dispatch<React.SetStateAction<string>>;
  setShowHistoryModal: React.Dispatch<React.SetStateAction<boolean>>;
  setShowDetailModal: React.Dispatch<React.SetStateAction<boolean>>;
  setShowPaymentModal: React.Dispatch<React.SetStateAction<boolean>>;
  setShowAdjustmentModal: React.Dispatch<React.SetStateAction<boolean>>;
  setAdjustmentToEdit: React.Dispatch<
    React.SetStateAction<OrderAdjustment | null>
  >;
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;

  // Setters for tracking states
  setOriginalOrderState: React.Dispatch<
    React.SetStateAction<OrderState['originalOrderState']>
  >;
  setLastNotifiedCount: React.Dispatch<React.SetStateAction<number | null>>;

  // Helper functions
  resetEditModeStates: () => void;
  showTimePicker: () => void;
  hideTimePicker: () => void;
}

export const useOrderState = (): UseOrderStateReturn => {
  // Edit mode states
  const [editItems, setEditItems] = useState<CartItem[]>([]);
  const [editOrderType, setEditOrderType] = useState<OrderType>(
    OrderTypeEnum.DINE_IN,
  );
  const [editSelectedAreaId, setEditSelectedAreaId] = useState<string | null>(
    null,
  );
  const [editSelectedTableId, setEditSelectedTableId] = useState<string | null>(
    null,
  );
  const [editScheduledTime, setEditScheduledTime] = useState<Date | null>(null);
  const [editDeliveryInfo, setEditDeliveryInfo] = useState<DeliveryInfo>({});
  const [editOrderNotes, setEditOrderNotes] = useState<string>('');
  const [editAdjustments, setEditAdjustments] = useState<OrderAdjustment[]>([]);
  const [editIsTemporaryTable, setEditIsTemporaryTable] =
    useState<boolean>(false);
  const [editTemporaryTableName, setEditTemporaryTableName] =
    useState<string>('');

  // Processing states
  const [processedPendingProductsIds, setProcessedPendingProductsIds] =
    useState<string[]>([]);
  const [orderDataLoaded, setOrderDataLoaded] = useState(false);

  // UI states
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);
  const [isTimeAlertVisible, setTimeAlertVisible] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [isModalReady, setIsModalReady] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [
    showModifyInProgressConfirmation,
    setShowModifyInProgressConfirmation,
  ] = useState(false);
  const [pendingModifyAction, setPendingModifyAction] = useState<
    (() => void) | null
  >(null);
  const [modifyingItemName, setModifyingItemName] = useState<string>('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentToEdit, setAdjustmentToEdit] =
    useState<OrderAdjustment | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Original order state
  const [originalOrderState, setOriginalOrderState] =
    useState<OrderState['originalOrderState']>(null);

  // Tracking states
  const [lastNotifiedCount, setLastNotifiedCount] = useState<number | null>(
    null,
  );

  // Helper functions
  const resetEditModeStates = useCallback(() => {
    setEditOrderType(OrderTypeEnum.DINE_IN);
    setEditSelectedAreaId(null);
    setEditSelectedTableId(null);
    setEditScheduledTime(null);
    setEditDeliveryInfo({});
    setEditOrderNotes('');
    setEditItems([]);
    setEditAdjustments([]);
    setEditIsTemporaryTable(false);
    setEditTemporaryTableName('');
    setShowExitConfirmation(false);
    setIsModalReady(false);
    setOrderDataLoaded(false);
    setProcessedPendingProductsIds([]);
    setLastNotifiedCount(null);
    setOriginalOrderState(null);
    setHasUnsavedChanges(false);
  }, []);

  const showTimePicker = useCallback(() => {
    setTimePickerVisible(true);
  }, []);

  const hideTimePicker = useCallback(() => {
    setTimePickerVisible(false);
  }, []);

  return {
    // States
    editItems,
    editOrderType,
    editSelectedAreaId,
    editSelectedTableId,
    editScheduledTime,
    editDeliveryInfo,
    editOrderNotes,
    editAdjustments,
    editIsTemporaryTable,
    editTemporaryTableName,
    processedPendingProductsIds,
    orderDataLoaded,
    isTimePickerVisible,
    isTimeAlertVisible,
    isConfirming,
    showExitConfirmation,
    isModalReady,
    showOptionsMenu,
    showCancelConfirmation,
    showModifyInProgressConfirmation,
    pendingModifyAction,
    modifyingItemName,
    showHistoryModal,
    showDetailModal,
    showPaymentModal,
    showAdjustmentModal,
    adjustmentToEdit,
    hasUnsavedChanges,
    originalOrderState,
    lastNotifiedCount,

    // Setters
    setEditItems,
    setEditOrderType,
    setEditSelectedAreaId,
    setEditSelectedTableId,
    setEditScheduledTime,
    setEditDeliveryInfo,
    setEditOrderNotes,
    setEditAdjustments,
    setEditIsTemporaryTable,
    setEditTemporaryTableName,
    setProcessedPendingProductsIds,
    setOrderDataLoaded,
    setTimePickerVisible,
    setTimeAlertVisible,
    setIsConfirming,
    setShowExitConfirmation,
    setIsModalReady,
    setShowOptionsMenu,
    setShowCancelConfirmation,
    setShowModifyInProgressConfirmation,
    setPendingModifyAction,
    setModifyingItemName,
    setShowHistoryModal,
    setShowDetailModal,
    setShowPaymentModal,
    setShowAdjustmentModal,
    setAdjustmentToEdit,
    setHasUnsavedChanges,
    setOriginalOrderState,
    setLastNotifiedCount,

    // Helper functions
    resetEditModeStates,
    showTimePicker,
    hideTimePicker,
  };
};
