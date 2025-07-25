import { useQuery } from '@tanstack/react-query';
import apiClient from '@/app/services/apiClient';
import { API_PATHS } from '@/app/constants/apiPaths';
import { PizzaCustomizationGroupAvailability } from '../types/availability.types';

export function usePizzaCustomizationsAvailability(search?: string) {
  return useQuery({
    queryKey: ['availability', 'pizzaCustomizations', search],
    queryFn: async () => {
      const response = await apiClient.get<
        PizzaCustomizationGroupAvailability[]
      >(API_PATHS.AVAILABILITY_PIZZA_CUSTOMIZATIONS);

      let data = response.data;

      if (search) {
        const searchLower = search.toLowerCase();
        data = data
          .map((group) => ({
            ...group,
            items: group.items.filter((item) =>
              item.name.toLowerCase().includes(searchLower),
            ),
          }))
          .filter((group) => group.items.length > 0);
      }

      return data;
    },
  });
}
