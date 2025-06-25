export enum SyncType {
  MENU = 'MENU',
  CONFIG = 'CONFIG',
  ORDERS = 'ORDERS',
  CUSTOMERS = 'CUSTOMERS',
  FULL = 'FULL',
}

export enum SyncStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PARTIAL = 'PARTIAL',
}

export class SyncLog {
  id: string;
  syncType: SyncType;
  status: SyncStatus;
  itemsSynced: number;
  itemsFailed: number;
  errors: Record<string, any> | null;
  startedAt: Date;
  completedAt: Date | null;
  duration: number | null; // in seconds
  metadata: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}
