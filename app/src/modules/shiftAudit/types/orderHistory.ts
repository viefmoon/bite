export interface ChangeDetail {
  anterior: unknown;
  nuevo: unknown;
}

export interface BatchOperation {
  operation: string;
  itemDescription?: string;
  snapshot?: { itemDescription?: string };
  formattedChanges?: Record<string, ChangeDetail>;
}

export interface DiffOrderFields {
  orderType?: [unknown, unknown];
  tableId?: [unknown, unknown];
  notes?: [unknown, unknown];
  [key: string]: [unknown, unknown] | undefined;
}

export interface DiffDeliveryInfo {
  recipientName?: [unknown, unknown];
  recipientPhone?: [unknown, unknown];
  fullAddress?: [unknown, unknown];
  [key: string]: [unknown, unknown] | undefined;
}

export interface DiffOrder {
  fields?: DiffOrderFields;
  deliveryInfo?: DiffDeliveryInfo;
}

export interface DiffItems {
  added?: Array<Record<string, unknown>>;
  removed?: Array<Record<string, unknown>>;
  modified?: Array<Record<string, unknown>>;
}

export interface OrderDiff {
  summary?: string;
  order?: DiffOrder;
  items?: DiffItems;
}

export interface HistoryItem {
  id: string | number;
  orderId: string;
  orderItemId?: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'BATCH';
  changedBy: string;
  changedAt: string;
  diff?: OrderDiff | null;
  snapshot?: Record<string, unknown>;
  productId?: string;
  preparationStatus?: string;
  changedByUser?: {
    id?: string;
    firstName: string;
    lastName: string;
  };
  user?: {
    firstName: string;
    lastName: string;
  };
  itemDescription?: string;
  formattedChanges?: Record<string, ChangeDetail>;
  batchOperations?: BatchOperation[];
  type: 'order' | 'item';
}
