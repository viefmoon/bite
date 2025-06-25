import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';
import { modifierService } from '../services/modifierService';
import {
  Modifier,
  CreateModifierInput,
  UpdateModifierInput,
} from '../schema/modifier.schema';
import { ApiError } from '@/app/lib/errors';
import {
  useSnackbarStore,
  type SnackbarState,
} from '@/app/store/snackbarStore';
import { getApiErrorMessage } from '@/app/lib/errorMapping';
import { PaginatedResponse } from '@/app/types/api.types';

const modifierKeys = {
  all: ['modifiers'] as const,
  lists: () => [...modifierKeys.all, 'list'] as const,
  list: (filters: FindAllModifiersParams = {}) =>
    [...modifierKeys.lists(), filters] as const,
  listsByGroup: (groupId: string) =>
    [...modifierKeys.lists(), { groupId }] as const,
  details: () => [...modifierKeys.all, 'detail'] as const,
  detail: (id: string) => [...modifierKeys.details(), id] as const,
};

// Definir localmente ya que no se exporta desde types
interface FindAllModifiersParams {
  page?: number;
  limit?: number;
  groupId?: string; // Corregido: debe ser groupId
  // Añadir otros filtros si existen en el servicio (e.g., isActive, search)
}

export const useModifiersQuery = (
  filters: FindAllModifiersParams = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Modifier>, ApiError>,
    'queryKey' | 'queryFn'
  >,
): UseQueryResult<PaginatedResponse<Modifier>, ApiError> => {
  const queryKey = modifierKeys.list(filters);
  return useQuery<PaginatedResponse<Modifier>, ApiError>({
    queryKey: queryKey,
    queryFn: () => modifierService.findAll(filters),
    ...options,
  });
};

export const useModifiersByGroupQuery = (
  groupId: string | undefined,
  options?: Omit<UseQueryOptions<Modifier[], ApiError>, 'queryKey' | 'queryFn'>,
): UseQueryResult<Modifier[], ApiError> => {
  const queryKey = modifierKeys.listsByGroup(groupId!);
  return useQuery<Modifier[], ApiError>({
    queryKey: queryKey,
    queryFn: () => modifierService.findByGroupId(groupId!),
    enabled: !!groupId && (options?.enabled ?? true),
    ...options,
  });
};

export const useModifierQuery = (
  id: string | undefined,
  options?: Omit<UseQueryOptions<Modifier, ApiError>, 'queryKey' | 'queryFn'>,
): UseQueryResult<Modifier, ApiError> => {
  const queryKey = modifierKeys.detail(id!);
  return useQuery<Modifier, ApiError>({
    queryKey: queryKey,
    queryFn: () => modifierService.findOne(id!),
    enabled: !!id && (options?.enabled ?? true),
    ...options,
  });
};

// Contexto para actualización optimista
type UpdateModifierContext = {
  previousDetail?: Modifier;
};

export const useCreateModifierMutation = (): UseMutationResult<
  Modifier,
  ApiError,
  CreateModifierInput
> => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore(
    (state: SnackbarState) => state.showSnackbar,
  );

  return useMutation<Modifier, ApiError, CreateModifierInput>({
    mutationFn: modifierService.create,
    onSuccess: (newModifier) => {
      // Invalidar listas generales y listas por grupo
      queryClient.invalidateQueries({ queryKey: modifierKeys.lists() });
      // Usar groupId que sí existe en el tipo Modifier
      queryClient.invalidateQueries({
        queryKey: modifierKeys.listsByGroup(newModifier.modifierGroupId),
      });
      showSnackbar({
        message: 'Modificador creado con éxito',
        type: 'success',
      });
    },
    onError: (error) => {
      const message = getApiErrorMessage(error);
      showSnackbar({ message, type: 'error' });
      console.error('Error creating modifier:', error);
    },
  });
};

export const useUpdateModifierMutation = (): UseMutationResult<
  Modifier,
  ApiError,
  { id: string; data: UpdateModifierInput },
  UpdateModifierContext
> => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore(
    (state: SnackbarState) => state.showSnackbar,
  );

  return useMutation<
    Modifier,
    ApiError,
    { id: string; data: UpdateModifierInput },
    UpdateModifierContext
  >({
    mutationFn: ({ id, data }) => modifierService.update(id, data),

    // --- Inicio Actualización Optimista ---
    onMutate: async (variables) => {
      const { id, data } = variables;
      const detailQueryKey = modifierKeys.detail(id);

      await queryClient.cancelQueries({ queryKey: detailQueryKey });
      const previousDetail = queryClient.getQueryData<Modifier>(detailQueryKey);

      if (previousDetail) {
        queryClient.setQueryData<Modifier>(
          detailQueryKey,
          (old: Modifier | undefined) =>
            old ? { ...old, ...data } : undefined,
        );
      }
      return { previousDetail };
    },
    // --- Fin Actualización Optimista ---

    onError: (error, variables, context) => {
      const message = getApiErrorMessage(error);
      showSnackbar({ message, type: 'error' });
      console.error(`Error updating modifier ${variables.id}:`, error);
      if (context?.previousDetail) {
        queryClient.setQueryData(
          modifierKeys.detail(variables.id),
          context.previousDetail,
        );
      }
    },
    onSettled: (data, error, variables) => {
      // Invalidar listas generales y detalle siempre
      queryClient.invalidateQueries({ queryKey: modifierKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: modifierKeys.detail(variables.id),
      });

      // Invalidar la lista específica del grupo SOLO si la mutación fue exitosa (data existe)
      // y por lo tanto tenemos el groupId correcto.
      if (data?.modifierGroupId) {
        queryClient.invalidateQueries({
          queryKey: modifierKeys.listsByGroup(data.modifierGroupId),
        });
      }

      if (!error && data) {
        showSnackbar({
          message: 'Modificador actualizado con éxito',
          type: 'success',
        });
      }
    },
  });
};

export const useDeleteModifierMutation = (): UseMutationResult<
  void,
  ApiError,
  string, // ID
  { previousDetail?: Modifier } // Añadir contexto
> => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore(
    (state: SnackbarState) => state.showSnackbar,
  );

  // Contexto para guardar el detalle eliminado
  type DeleteModifierContext = { previousDetail?: Modifier };

  return useMutation<void, ApiError, string, DeleteModifierContext>({
    mutationFn: modifierService.remove,

    // --- Inicio Actualización Optimista ---
    onMutate: async (deletedId) => {
      const detailQueryKey = modifierKeys.detail(deletedId);

      // 1. Cancelar query de detalle
      await queryClient.cancelQueries({ queryKey: detailQueryKey });

      // 2. Guardar estado anterior del detalle
      const previousDetail = queryClient.getQueryData<Modifier>(detailQueryKey);

      // 3. Eliminar optimistamente de la caché de detalle
      queryClient.removeQueries({ queryKey: detailQueryKey });

      // 4. Retornar contexto
      return { previousDetail };
    },
    // --- Fin Actualización Optimista ---

    onError: (error, deletedId, context) => {
      const message = getApiErrorMessage(error);
      showSnackbar({ message, type: 'error' });
      console.error(`Error deleting modifier ${deletedId}:`, error);

      // Revertir caché de detalle si hubo error
      if (context?.previousDetail) {
        queryClient.setQueryData(
          modifierKeys.detail(deletedId),
          context.previousDetail,
        );
      }
    },

    onSettled: (_data, error, deletedId, context) => {
      queryClient.invalidateQueries({ queryKey: modifierKeys.lists() });
      // Invalidar lista por grupo si se conoce el groupId (desde el contexto)
      if (context?.previousDetail?.modifierGroupId) {
        queryClient.invalidateQueries({
          queryKey: modifierKeys.listsByGroup(
            context.previousDetail.modifierGroupId,
          ),
        });
      }

      // Asegurar remoción en éxito y mostrar snackbar
      if (!error) {
        queryClient.removeQueries({ queryKey: modifierKeys.detail(deletedId) });
        showSnackbar({
          message: 'Modificador eliminado con éxito',
          type: 'success',
        });
      }
    },
    // onSuccess eliminado
  });
};
