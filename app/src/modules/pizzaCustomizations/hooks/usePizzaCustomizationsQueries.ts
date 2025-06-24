import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pizzaCustomizationsService } from '../services/pizzaCustomizationsService';
import { useSnackbarStore } from '@/app/store/snackbarStore';
import type { FindAllPizzaCustomizationsQuery } from '../schema/pizzaCustomization.schema';

export const PIZZA_CUSTOMIZATIONS_QUERY_KEYS = {
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
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  return useMutation({
    mutationFn: pizzaCustomizationsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: PIZZA_CUSTOMIZATIONS_QUERY_KEYS.lists(),
      });
      showSnackbar({
        message: 'Personalización creada exitosamente',
        type: 'success',
      });
    },
    onError: (error) => {
      showSnackbar({
        message:
          error instanceof Error
            ? error.message
            : 'Error al crear personalización',
        type: 'error',
      });
    },
  });
}

export function useUpdatePizzaCustomization() {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof pizzaCustomizationsService.update>[1];
    }) => pizzaCustomizationsService.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: PIZZA_CUSTOMIZATIONS_QUERY_KEYS.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: PIZZA_CUSTOMIZATIONS_QUERY_KEYS.detail(variables.id),
      });
      showSnackbar({
        message: 'Personalización actualizada exitosamente',
        type: 'success',
      });
    },
    onError: (error) => {
      showSnackbar({
        message:
          error instanceof Error
            ? error.message
            : 'Error al actualizar personalización',
        type: 'error',
      });
    },
  });
}

export function useDeletePizzaCustomization() {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  return useMutation({
    mutationFn: pizzaCustomizationsService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: PIZZA_CUSTOMIZATIONS_QUERY_KEYS.lists(),
      });
      showSnackbar({
        message: 'Personalización eliminada exitosamente',
        type: 'success',
      });
    },
    onError: (error) => {
      showSnackbar({
        message:
          error instanceof Error
            ? error.message
            : 'Error al eliminar personalización',
        type: 'error',
      });
    },
  });
}

export function useUpdatePizzaCustomizationsSortOrder() {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  return useMutation({
    mutationFn: pizzaCustomizationsService.updateSortOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: PIZZA_CUSTOMIZATIONS_QUERY_KEYS.lists(),
      });
    },
    onError: (error) => {
      showSnackbar({
        message:
          error instanceof Error ? error.message : 'Error al actualizar orden',
        type: 'error',
      });
    },
  });
}
