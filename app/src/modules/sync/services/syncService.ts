import apiClient from '@/app/services/apiClient';
import { API_PATHS } from '@/app/constants/apiPaths';
import { SyncStatus, SyncActivity } from '../types/sync.types';

class SyncService {
  /**
   * Obtiene el estado actual del servicio de sincronización
   */
  async getSyncStatus(): Promise<SyncStatus> {
    const response = await apiClient.get<SyncStatus>(API_PATHS.SYNC_STATUS);
    if (!response.data) {
      throw new Error('No se pudo obtener el estado de sincronización');
    }
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
    if (!response.data) {
      throw new Error('No se pudo obtener la actividad de sincronización');
    }
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
