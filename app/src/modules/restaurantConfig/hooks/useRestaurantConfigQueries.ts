import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { restaurantConfigService } from '../services/restaurantConfigService';
import { UpdateRestaurantConfigDto } from '../types/restaurantConfig.types';
import { useSnackbarStore } from '@/app/store/snackbarStore';

const QUERY_KEYS = {
  config: ['restaurantConfig'],
};

export const useRestaurantConfigQueries = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  const useGetConfig = () => {
    return useQuery({
      queryKey: QUERY_KEYS.config,
      queryFn: restaurantConfigService.getConfig,
    });
  };

  const useUpdateConfig = () => {
    return useMutation({
      mutationFn: (data: UpdateRestaurantConfigDto) =>
        restaurantConfigService.updateConfig(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.config });
        showSnackbar({
          message: 'Configuración actualizada exitosamente',
          type: 'success',
        });
      },
      onError: (error: any) => {
        showSnackbar({
          message:
            error.response?.data?.message ||
            'Error al actualizar la configuración',
          type: 'error',
        });
      },
    });
  };

  return {
    useGetConfig,
    useUpdateConfig,
  };
};
