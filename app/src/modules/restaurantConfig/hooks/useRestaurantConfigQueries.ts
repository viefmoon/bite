import { useQuery } from '@tanstack/react-query';
import { restaurantConfigService } from '../services/restaurantConfigService';
import { UpdateRestaurantConfigDto } from '../schema/restaurantConfig.schema';
import { useApiMutation } from '@/app/hooks/useApiMutation';

const QUERY_KEYS = {
  config: ['restaurantConfig'],
};

export const useRestaurantConfigQueries = () => {
  const useGetConfig = () => {
    return useQuery({
      queryKey: QUERY_KEYS.config,
      queryFn: restaurantConfigService.getConfig,
    });
  };

  const useUpdateConfig = (options?: { successMessage?: string }) => {
    return useApiMutation(
      (data: UpdateRestaurantConfigDto) =>
        restaurantConfigService.updateConfig(data),
      {
        successMessage:
          options?.successMessage || 'Configuración actualizada exitosamente',
        invalidateQueryKeys: [QUERY_KEYS.config],
      },
    );
  };

  return {
    useGetConfig,
    useUpdateConfig,
  };
};
