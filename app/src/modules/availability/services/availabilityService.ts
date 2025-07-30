import apiClient from '@/app/services/apiClient';
import { API_PATHS } from '@/app/constants/apiPaths';
import type {
  AvailabilityUpdatePayload,
  CategoryAvailability,
  ModifierGroupAvailability,
} from '../schema/availability.schema';

export const availabilityService = {
  getMenuAvailability: async (): Promise<CategoryAvailability[]> => {
    const response = await apiClient.get<CategoryAvailability[]>(
      API_PATHS.AVAILABILITY_MENU,
    );
    return response.data;
  },

  getModifierGroupsAvailability: async (): Promise<
    ModifierGroupAvailability[]
  > => {
    const response = await apiClient.get<ModifierGroupAvailability[]>(
      API_PATHS.AVAILABILITY_MODIFIER_GROUPS,
    );
    return response.data;
  },

  updateAvailability: async (
    payload: AvailabilityUpdatePayload,
  ): Promise<void> => {
    await apiClient.patch(API_PATHS.AVAILABILITY_UPDATE, payload);
  },
};
