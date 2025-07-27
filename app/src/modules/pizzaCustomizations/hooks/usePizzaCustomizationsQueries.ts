import { useQuery, useQueryClient } from '@tanstack/react-query';
import { pizzaCustomizationsService } from '../services/pizzaCustomizationsService';
import { useApiMutation } from '@/app/hooks/useApiMutation';
import type { FindAllPizzaCustomizationsQuery } from '../schema/pizzaCustomization.schema';

const PIZZA_CUSTOMIZATIONS_QUERY_KEYS = {
  all: ['pizzaCustomizations'] as const,
  lists: () => [...PIZZA_CUSTOMIZATIONS_QUERY_KEYS.all, 'list'] as const,
  list: (params?: FindAllPizzaCustomizationsQuery) =>
    [...PIZZA_CUSTOMIZATIONS_QUERY_KEYS.lists(), params] as const,
  details: () => [...PIZZA_CUSTOMIZATIONS_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) =>
    [...PIZZA_CUSTOMIZATIONS_QUERY_KEYS.details(), id] as const,
};

export function usePizzaCustomizationsList(
  params?: FindAllPizzaCustomizationsQuery,
) {
  return useQuery({
    queryKey: PIZZA_CUSTOMIZATIONS_QUERY_KEYS.list(params),
    queryFn: () => pizzaCustomizationsService.findAll(params),
  });
}

export function usePizzaCustomization(id: string) {
  return useQuery({
    queryKey: PIZZA_CUSTOMIZATIONS_QUERY_KEYS.detail(id),
    queryFn: () => pizzaCustomizationsService.findOne(id),
    enabled: !!id,
  });
}

export function useCreatePizzaCustomization() {
  return useApiMutation(pizzaCustomizationsService.create, {
    successMessage: 'Personalización creada exitosamente',
    invalidateQueryKeys: [PIZZA_CUSTOMIZATIONS_QUERY_KEYS.lists()],
  });
}

export function useUpdatePizzaCustomization() {
  const queryClient = useQueryClient();

  return useApiMutation(
    ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof pizzaCustomizationsService.update>[1];
    }) => pizzaCustomizationsService.update(id, data),
    {
      successMessage: 'Personalización actualizada exitosamente',
      invalidateQueryKeys: [PIZZA_CUSTOMIZATIONS_QUERY_KEYS.lists()],
      onSuccess: (data, variables) => {
        // Invalidación específica del detalle
        queryClient.invalidateQueries({
          queryKey: PIZZA_CUSTOMIZATIONS_QUERY_KEYS.detail(variables.id),
        });
      },
    },
  );
}

export function useDeletePizzaCustomization() {
  return useApiMutation(pizzaCustomizationsService.remove, {
    successMessage: 'Personalización eliminada exitosamente',
    invalidateQueryKeys: [PIZZA_CUSTOMIZATIONS_QUERY_KEYS.lists()],
  });
}
