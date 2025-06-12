import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pizzaIngredientsService } from '../services/pizzaIngredientsService';
import { useSnackbarStore } from '@/app/store/snackbarStore';
import type {
  CreatePizzaIngredientDto,
  UpdatePizzaIngredientDto,
} from '../types/pizzaIngredient.types';

const QUERY_KEY = 'pizzaIngredients';

export const usePizzaIngredients = (params?: any) => {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => pizzaIngredientsService.getAll(params),
  });
};

export const usePizzaIngredient = (id: string, enabled = true) => {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => pizzaIngredientsService.getById(id),
    enabled: enabled && !!id,
  });
};

export const useCreatePizzaIngredient = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  return useMutation({
    mutationFn: (data: CreatePizzaIngredientDto) =>
      pizzaIngredientsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      showSnackbar({
        message: 'Ingrediente de pizza creado exitosamente',
        type: 'success',
      });
    },
    onError: (error: any) => {
      showSnackbar({
        message: error.message || 'Error al crear el ingrediente de pizza',
        type: 'error',
      });
    },
  });
};

export const useUpdatePizzaIngredient = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdatePizzaIngredientDto;
    }) => pizzaIngredientsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      showSnackbar({
        message: 'Ingrediente de pizza actualizado exitosamente',
        type: 'success',
      });
    },
    onError: (error: any) => {
      showSnackbar({
        message: error.message || 'Error al actualizar el ingrediente de pizza',
        type: 'error',
      });
    },
  });
};

export const useDeletePizzaIngredient = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  return useMutation({
    mutationFn: (id: string) => pizzaIngredientsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      showSnackbar({
        message: 'Ingrediente de pizza eliminado exitosamente',
        type: 'success',
      });
    },
    onError: (error: any) => {
      showSnackbar({
        message: error.message || 'Error al eliminar el ingrediente de pizza',
        type: 'error',
      });
    },
  });
};

export const useTogglePizzaIngredientActive = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      pizzaIngredientsService.toggleActive(id, isActive),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      showSnackbar({
        message: `Ingrediente de pizza ${
          variables.isActive ? 'activado' : 'desactivado'
        } exitosamente`,
        type: 'success',
      });
    },
    onError: (error: any) => {
      showSnackbar({
        message: error.message || 'Error al cambiar el estado del ingrediente',
        type: 'error',
      });
    },
  });
};
