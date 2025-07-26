import apiClient from '@/app/services/apiClient';
import { API_PATHS } from '@/app/constants/apiPaths';
import { SyncStatus, SyncActivity } from '../schema/sync.schema';

class SyncService {
  async getSyncStatus(): Promise<SyncStatus> {
    const response = await apiClient.get<SyncStatus>(API_PATHS.SYNC_STATUS);
    return response.data;
  }

  async getSyncActivity(limit: number = 20): Promise<SyncActivity[]> {
    const response = await apiClient.get<SyncActivity[]>(
      API_PATHS.SYNC_ACTIVITY,
      { params: { limit } },
    );
    return response.data;
  }

  async checkSyncAvailability(): Promise<boolean> {
    try {
      const status = await this.getSyncStatus();
      return status.enabled;
    } catch (error) {
      // Log silencioso para no mostrar errores en producción
      if (__DEV__) {
        console.error(
          'Error verificando disponibilidad de sincronización:',
          error,
        );
      }
      return false;
    }
  }
}

export const syncService = new SyncService();
