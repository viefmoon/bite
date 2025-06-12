import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { availabilityService } from '../services/availabilityService';
import { useSnackbarStore } from '@/app/store/snackbarStore';

export const useMenuAvailability = () => {
  return useQuery({
    queryKey: ['availability', 'menu'],
    queryFn: availabilityService.getMenuAvailability,
  });
};

export const useModifierGroupsAvailability = () => {
  return useQuery({
    queryKey: ['availability', 'modifierGroups'],
    queryFn: availabilityService.getModifierGroupsAvailability,
  });
};

export const useUpdateAvailability = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  return useMutation({
    mutationFn: availabilityService.updateAvailability,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      showSnackbar({ message: 'Disponibilidad actualizada', type: 'success' });
    },
    onError: () => {
      showSnackbar({ message: 'Error al actualizar disponibilidad', type: 'error' });
    },
  });
};

export const useBulkUpdateAvailability = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  return useMutation({
    mutationFn: availabilityService.bulkUpdateAvailability,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      showSnackbar({ message: 'Disponibilidad actualizada', type: 'success' });
    },
    onError: () => {
      showSnackbar({ message: 'Error al actualizar disponibilidad', type: 'error' });
    },
  });
};
