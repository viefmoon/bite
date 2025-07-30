import { useQuery } from '@tanstack/react-query';
import { availabilityService } from '../services/availabilityService';

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
