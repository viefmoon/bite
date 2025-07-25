import apiClient from '@/app/services/apiClient';
import { API_PATHS } from '@/app/constants/apiPaths';
import {
  AvailabilityUpdatePayload,
  CategoryAvailability,
  ModifierGroupAvailability,
} from '../types/availability.types';

export const availabilityService = {
  // Obtener la disponibilidad del menú completo
  async getMenuAvailability(): Promise<CategoryAvailability[]> {
    const response = await apiClient.get<CategoryAvailability[]>(
      API_PATHS.AVAILABILITY_MENU,
    );
    return response.data;
  },

  // Obtener la disponibilidad de grupos de modificadores
  async getModifierGroupsAvailability(): Promise<ModifierGroupAvailability[]> {
    const response = await apiClient.get<ModifierGroupAvailability[]>(
      API_PATHS.AVAILABILITY_MODIFIER_GROUPS,
    );
    return response.data;
  },

  // Actualizar disponibilidad (con opción de cascada)
  async updateAvailability(payload: AvailabilityUpdatePayload): Promise<void> {
    await apiClient.patch(API_PATHS.AVAILABILITY_UPDATE, payload);
  },

  // Actualización masiva de disponibilidad
  async bulkUpdateAvailability(
    updates: AvailabilityUpdatePayload[],
  ): Promise<void> {
    await apiClient.patch(API_PATHS.AVAILABILITY_BULK_UPDATE, { updates });
  },
};
