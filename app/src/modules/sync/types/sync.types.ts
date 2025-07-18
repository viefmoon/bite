// Tipos simplificados para el nuevo sistema de sincronización

export enum SyncActivityType {
  PULL_CHANGES = 'PULL_CHANGES',
  RESTAURANT_DATA = 'RESTAURANT_DATA',
  ORDER_STATUS = 'ORDER_STATUS',
}

export type SyncDirection = 'IN' | 'OUT';

export interface SyncActivity {
  id: string;
  type: SyncActivityType;
  direction: SyncDirection;
  success: boolean;
  timestamp: string;
}

export interface SyncStatus {
  enabled: boolean;
  webSocketEnabled: boolean;
  webSocketConnected?: boolean;
  webSocketFailed?: boolean;
  remoteUrl: string | null;
  mode: string;
}

// Mapeo de tipos para mostrar en la UI
export const SYNC_TYPE_LABELS: Record<SyncActivityType, string> = {
  [SyncActivityType.PULL_CHANGES]: 'Órdenes y Clientes',
  [SyncActivityType.RESTAURANT_DATA]: 'Menú y Configuración',
  [SyncActivityType.ORDER_STATUS]: 'Estado de Orden',
};

export const SYNC_DIRECTION_LABELS: Record<SyncDirection, string> = {
  IN: 'Desde la nube',
  OUT: 'Hacia la nube',
};