import apiClient from '@/app/services/apiClient';
import { RestaurantConfig, UpdateRestaurantConfigDto } from '../types/restaurantConfig.types';

export const restaurantConfigService = {
  getConfig: async (): Promise<RestaurantConfig> => {
    const response = await apiClient.get<RestaurantConfig>('/api/v1/restaurant-config');
    return response.data;
  },

  updateConfig: async (data: UpdateRestaurantConfigDto): Promise<RestaurantConfig> => {
    const response = await apiClient.put<RestaurantConfig>('/api/v1/restaurant-config', data);
    return response.data;
  },
};