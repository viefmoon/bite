import apiClient from '@/app/services/apiClient';
import { API_PATHS } from '@/app/constants/apiPaths';
import { SyncStatus, SyncActivity } from '../schema/sync.schema';

class SyncService {
  /**
   * Obtiene el estado actual del servicio de sincronización
   */
  async getSyncStatus(): Promise<SyncStatus> {
    const response = await apiClient.get<SyncStatus>(API_PATHS.SYNC_STATUS);
    return response.data;
  }

  /**
   * Obtiene el historial de actividad reciente de sincronización
   * @param limit Número máximo de registros (por defecto 20)
   */
  async getSyncActivity(limit: number = 20): Promise<SyncActivity[]> {
    const response = await apiClient.get<SyncActivity[]>(
      API_PATHS.SYNC_ACTIVITY,
      { params: { limit } },
    );
    return response.data;
  }

  /**
   * Verifica si el servicio de sincronización está disponible
   */
  async checkSyncAvailability(): Promise<boolean> {
    try {
      const status = await this.getSyncStatus();
      return status.enabled;
    } catch (error) {
      console.error(
        'Error verificando disponibilidad de sincronización:',
        error,
      );
      return false;
    }
  }
}

export const syncService = new SyncService();
