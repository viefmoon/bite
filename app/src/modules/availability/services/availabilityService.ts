import apiClient from '@/app/services/apiClient';
import {
  AvailabilityUpdatePayload,
  CategoryAvailability,
  ModifierGroupAvailability,
} from '../types/availability.types';

export const availabilityService = {
  // Obtener la disponibilidad del menú completo
  async getMenuAvailability(): Promise<CategoryAvailability[]> {
    const response = await apiClient.get('/api/v1/availability/menu');
    return response.data;
  },

  // Obtener la disponibilidad de grupos de modificadores
  async getModifierGroupsAvailability(): Promise<ModifierGroupAvailability[]> {
    const response = await apiClient.get(
      '/api/v1/availability/modifier-groups',
    );
    return response.data;
  },

  // Actualizar disponibilidad (con opción de cascada)
  async updateAvailability(payload: AvailabilityUpdatePayload): Promise<void> {
    await apiClient.patch('/api/v1/availability/update', payload);
  },

  // Actualización masiva de disponibilidad
  async bulkUpdateAvailability(
    updates: AvailabilityUpdatePayload[],
  ): Promise<void> {
    await apiClient.patch('/api/v1/availability/bulk-update', { updates });
  },
};
