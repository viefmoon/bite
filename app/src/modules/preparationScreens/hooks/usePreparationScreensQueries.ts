import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryKey,
} from '@tanstack/react-query';
import * as preparationScreenService from '../services/preparationScreenService';
import {
  PreparationScreen,
  CreatePreparationScreenDto,
  UpdatePreparationScreenDto,
  FindAllPreparationScreensDto,
} from '../types/preparationScreen.types';
import { BaseListQuery } from '../../../app/types/query.types';
import { useSnackbarStore } from '../../../app/store/snackbarStore';
import { getApiErrorMessage } from '../../../app/lib/errorMapping';

// --- Query Keys ---
const preparationScreensQueryKeys = {
  all: ['preparationScreens'] as const,
  lists: () => [...preparationScreensQueryKeys.all, 'list'] as const,
  list: (filters: FindAllPreparationScreensDto & BaseListQuery) =>
    [...preparationScreensQueryKeys.lists(), filters] as const,
  details: () => [...preparationScreensQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...preparationScreensQueryKeys.details(), id] as const,
};

// --- Hooks ---

/**
 * Hook to fetch a paginated list of preparation screens with filters.
 */
export const useGetPreparationScreens = (
  filters: FindAllPreparationScreensDto = {},
  pagination: BaseListQuery = { page: 1, limit: 15 } // Default limit 15
) => {
  const queryKey = preparationScreensQueryKeys.list({ ...filters, ...pagination });
  // El servicio getPreparationScreens ya maneja la estructura [data, count] y devuelve data[]
  return useQuery<PreparationScreen[], Error>({
    queryKey,
    queryFn: () => preparationScreenService.getPreparationScreens(filters, pagination),
    // Considerar placeholderData o initialData si es necesario para UX
  });
};

/**
 * Hook to fetch a single preparation screen by its ID.
 */
export const useGetPreparationScreenById = (id: string | null, options?: { enabled?: boolean }) => {
  const queryKey = preparationScreensQueryKeys.detail(id!); // Use non-null assertion as it's enabled conditionally
  return useQuery<PreparationScreen, Error>({
    queryKey,
    queryFn: () => preparationScreenService.getPreparationScreenById(id!),
    enabled: !!id && (options?.enabled ?? true), // Only run query if id is provided and enabled
  });
};

/**
 * Hook for creating a new preparation screen.
 */
export const useCreatePreparationScreen = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  return useMutation<PreparationScreen, Error, CreatePreparationScreenDto>({
    mutationFn: preparationScreenService.createPreparationScreen,
    onSuccess: (newScreen) => {
      // Invalidate list queries to refetch
      queryClient.invalidateQueries({ queryKey: preparationScreensQueryKeys.lists() });
      showSnackbar({ message: 'Pantalla de preparación creada con éxito', type: 'success' });
    },
    onError: (error) => {
      const errorMessage = getApiErrorMessage(error);
      showSnackbar({ message: errorMessage, type: 'error' });
      console.error('Error creating preparation screen:', error);
    },
  });
};

/**
 * Hook for updating an existing preparation screen.
 */
export const useUpdatePreparationScreen = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  // Contexto para actualización optimista
  type UpdatePreparationScreenContext = { previousDetail?: PreparationScreen };

  return useMutation<PreparationScreen, Error, { id: string; data: UpdatePreparationScreenDto }, UpdatePreparationScreenContext>({
    mutationFn: ({ id, data }) => preparationScreenService.updatePreparationScreen(id, data),

    // --- Inicio Actualización Optimista ---
    onMutate: async (variables) => {
        const { id, data } = variables;
        const detailQueryKey = preparationScreensQueryKeys.detail(id);

        // 1. Cancelar query de detalle
        await queryClient.cancelQueries({ queryKey: detailQueryKey });

        // 2. Guardar estado anterior del detalle
        const previousDetail = queryClient.getQueryData<PreparationScreen>(detailQueryKey);

        // 3. Actualizar caché de detalle optimistamente
        if (previousDetail) {
            // Fusionar datos antiguos y nuevos. Asumiendo que UpdatePreparationScreenDto no tiene estructuras anidadas problemáticas.
            queryClient.setQueryData<PreparationScreen>(detailQueryKey, (old) =>
                old ? { ...old, ...data } : undefined
            );
        }

        // 4. Retornar contexto
        return { previousDetail };
    },
    // --- Fin Actualización Optimista ---

    onError: (error, variables, context) => {
      const errorMessage = getApiErrorMessage(error);
      showSnackbar({ message: errorMessage, type: 'error' });
      console.error(`Error updating preparation screen ${variables.id}:`, error);

      // Revertir caché de detalle
      if (context?.previousDetail) {
        queryClient.setQueryData(preparationScreensQueryKeys.detail(variables.id), context.previousDetail);
      }
    },

    onSettled: (data, error, variables) => {
      // Invalidar listas y detalle para consistencia final
      queryClient.invalidateQueries({ queryKey: preparationScreensQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: preparationScreensQueryKeys.detail(variables.id) });

      // Mostrar snackbar de éxito solo si no hubo error
      if (!error && data) {
        showSnackbar({ message: 'Pantalla de preparación actualizada con éxito', type: 'success' });
      }
    },
     // onSuccess eliminado
  });
};

/**
 * Hook for deleting a preparation screen.
 */
export const useDeletePreparationScreen = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  // Contexto para guardar el detalle eliminado
  type DeletePreparationScreenContext = { previousDetail?: PreparationScreen };

  return useMutation<void, Error, string, DeletePreparationScreenContext>({
    mutationFn: preparationScreenService.deletePreparationScreen,

    // --- Inicio Actualización Optimista ---
    onMutate: async (deletedId) => {
        const detailQueryKey = preparationScreensQueryKeys.detail(deletedId);

        // 1. Cancelar query de detalle
        await queryClient.cancelQueries({ queryKey: detailQueryKey });

        // 2. Guardar estado anterior del detalle
        const previousDetail = queryClient.getQueryData<PreparationScreen>(detailQueryKey);

        // 3. Eliminar optimistamente de la caché de detalle
        queryClient.removeQueries({ queryKey: detailQueryKey });

        // 4. Retornar contexto
        return { previousDetail };
    },
    // --- Fin Actualización Optimista ---

    onError: (error, deletedId, context) => {
      const errorMessage = getApiErrorMessage(error);
      showSnackbar({ message: errorMessage, type: 'error' });
      console.error(`Error deleting preparation screen ${deletedId}:`, error);

      // Revertir caché de detalle si hubo error
      if (context?.previousDetail) {
        queryClient.setQueryData(preparationScreensQueryKeys.detail(deletedId), context.previousDetail);
      }
    },

    onSettled: (data, error, deletedId) => {
      // Invalidar listas para asegurar consistencia final
      queryClient.invalidateQueries({ queryKey: preparationScreensQueryKeys.lists() });

      // Asegurar remoción en éxito y mostrar snackbar
      if (!error) {
          queryClient.removeQueries({ queryKey: preparationScreensQueryKeys.detail(deletedId) });
          showSnackbar({ message: 'Pantalla de preparación eliminada con éxito', type: 'success' });
      }
    },
     // onSuccess eliminado
  });
};