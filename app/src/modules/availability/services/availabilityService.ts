import apiClient from '@/app/services/apiClient';
import { API_PATHS } from '@/app/constants/apiPaths';
import {
  AvailabilityUpdatePayload,
  CategoryAvailability,
  ModifierGroupAvailability,
} from '../schema/availability.schema';

export const availabilityService = {
  async getMenuAvailability(): Promise<CategoryAvailability[]> {
    const response = await apiClient.get<CategoryAvailability[]>(
      API_PATHS.AVAILABILITY_MENU,
    );
    return response.data;
  },

  async getModifierGroupsAvailability(): Promise<ModifierGroupAvailability[]> {
    const response = await apiClient.get<ModifierGroupAvailability[]>(
      API_PATHS.AVAILABILITY_MODIFIER_GROUPS,
    );
    return response.data;
  },

  async updateAvailability(payload: AvailabilityUpdatePayload): Promise<void> {
    await apiClient.patch(API_PATHS.AVAILABILITY_UPDATE, payload);
  },

  async bulkUpdateAvailability(
    updates: AvailabilityUpdatePayload[],
  ): Promise<void> {
    await apiClient.patch(API_PATHS.AVAILABILITY_BULK_UPDATE, { updates });
  },
};
