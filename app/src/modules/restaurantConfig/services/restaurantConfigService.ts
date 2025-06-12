import apiClient from '@/app/services/apiClient';
import { API_PATHS } from '@/app/constants/apiPaths';
import { RestaurantConfig, UpdateRestaurantConfigDto } from '../types/restaurantConfig.types';

export const restaurantConfigService = {
  getConfig: async (): Promise<RestaurantConfig> => {
    const response = await apiClient.get<RestaurantConfig>(API_PATHS.RESTAURANT_CONFIG);
    return response.data;
  },

  updateConfig: async (data: UpdateRestaurantConfigDto): Promise<RestaurantConfig> => {
    const response = await apiClient.put<RestaurantConfig>(API_PATHS.RESTAURANT_CONFIG, data);
    return response.data;
  },
};