import apiClient from '@/app/services/apiClient';
import { API_PATHS } from '@/app/constants/apiPaths';
import {
  SyncStatusInfo,
  TriggerSyncResponse,
  SyncLog,
} from '../types/sync.types';

class SyncService {

  async getSyncStatus(): Promise<SyncStatusInfo> {
    const response = await apiClient.get<SyncStatusInfo>(
      API_PATHS.SYNC_STATUS,
    );
    if (!response.data) {
      throw new Error('No se pudo obtener el estado de sincronización');
    }
    return response.data;
  }

  async triggerSync(): Promise<TriggerSyncResponse> {
    const response = await apiClient.post<TriggerSyncResponse>(
      API_PATHS.SYNC_TRIGGER,
    );
    if (!response.data) {
      throw new Error('No se pudo ejecutar la sincronización');
    }
    return response.data;
  }

  async getSyncHistory(
    limit: number = 20,
  ): Promise<{ data: SyncLog[]; count: number }> {
    const response = await apiClient.get<{ data: SyncLog[]; count: number }>(
      API_PATHS.SYNC_HISTORY,
      { params: { limit } },
    );
    if (!response.data) {
      throw new Error('No se pudo obtener el historial de sincronización');
    }
    return response.data;
  }

  async acceptWhatsAppOrders(orderIds: string[]): Promise<{
    accepted: number;
    failed: number;
    message: string;
  }> {
    const response = await apiClient.post<{
      accepted: number;
      failed: number;
      message: string;
    }>(API_PATHS.SYNC_ORDERS_ACCEPT, { orderIds });
    return response.data!;
  }

  // Método para verificar la conexión con el backend remoto
  async checkRemoteConnection(): Promise<boolean> {
    try {
      await this.getSyncStatus();
      // Si podemos obtener el estado, significa que el backend local está funcionando
      // El backend local nos dirá si está conectado al remoto
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const syncService = new SyncService();
