import { useQuery } from '@tanstack/react-query';
import { availabilityService } from '../services/availabilityService';
import { useApiMutation } from '@/app/hooks/useApiMutation';

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
  return useApiMutation(availabilityService.updateAvailability, {
    successMessage: 'Disponibilidad actualizada',
    invalidateQueryKeys: [['availability']],
  });
};
