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

export interface SyncLog {
  id: string;
  syncType: SyncType;
  status: SyncStatus;
  itemsSynced: number;
  itemsFailed: number;
  errors: Record<string, any> | null;
  startedAt: Date;
  completedAt: Date | null;
  duration: number | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncStatusInfo {
  isCurrentlySyncing: boolean;
  isConfigured?: boolean;
  remoteUrl?: string;
  lastSync: {
    type: SyncType;
    status: SyncStatus;
    completedAt: Date | null;
    itemsSynced: number;
    itemsFailed: number;
    duration: number | null;
  } | null;
  syncHistory: SyncLog[];
  errors: any[] | null;
}

export interface TriggerSyncResponse {
  message: string;
  status: 'started' | 'in_progress';
}
