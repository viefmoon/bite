import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';
import { modifierGroupService } from '../services/modifierGroupService';
import {
  ModifierGroup,
  CreateModifierGroupInput,
  UpdateModifierGroupInput,
} from '../schema/modifierGroup.schema';
import { ApiError } from '@/app/lib/errors';
import {
  useSnackbarStore,
  type SnackbarState,
} from '@/app/store/snackbarStore';
import { getApiErrorMessage } from '@/app/lib/errorMapping';
import { PaginatedResponse } from '@/app/types/api.types';

const modifierGroupKeys = {
  all: ['modifierGroups'] as const,
  lists: () => [...modifierGroupKeys.all, 'list'] as const,
  list: (filters: FindAllModifierGroupsQuery) =>
    [...modifierGroupKeys.lists(), filters] as const,
  details: () => [...modifierGroupKeys.all, 'detail'] as const,
  detail: (id: string) => [...modifierGroupKeys.details(), id] as const,
};

interface FindAllModifierGroupsQuery {
  page?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
}

export const useModifierGroupsQuery = (
  filters: FindAllModifierGroupsQuery = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<ModifierGroup>, ApiError>,
    'queryKey' | 'queryFn'
  >,
): UseQueryResult<PaginatedResponse<ModifierGroup>, ApiError> => {
  const queryKey = modifierGroupKeys.list(filters);
  return useQuery<PaginatedResponse<ModifierGroup>, ApiError>({
    queryKey: queryKey,
    queryFn: () => modifierGroupService.findAll(filters),
    ...options,
  });
};

export const useModifierGroupQuery = (
  id: string | undefined,
  options?: Omit<
    UseQueryOptions<ModifierGroup, ApiError>,
    'queryKey' | 'queryFn'
  >,
): UseQueryResult<ModifierGroup, ApiError> => {
  const queryKey = modifierGroupKeys.detail(id!);
  return useQuery<ModifierGroup, ApiError>({
    queryKey: queryKey,
    queryFn: () => modifierGroupService.findOne(id!),
    enabled: !!id && (options?.enabled ?? true),
    ...options,
  });
};

type UpdateModifierGroupContext = {
  previousDetail?: ModifierGroup;
};

export const useCreateModifierGroupMutation = (): UseMutationResult<
  ModifierGroup,
  ApiError,
  CreateModifierGroupInput
> => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore(
    (state: SnackbarState) => state.showSnackbar,
  );

  return useMutation<ModifierGroup, ApiError, CreateModifierGroupInput>({
    mutationFn: modifierGroupService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: modifierGroupKeys.lists() });
      showSnackbar({
        message: 'Grupo de modificadores creado con éxito',
        type: 'success',
      });
    },
    onError: (error) => {
      const message = getApiErrorMessage(error);
      showSnackbar({ message, type: 'error' });
      console.error('Error creating modifier group:', error);
    },
  });
};

export const useUpdateModifierGroupMutation = (): UseMutationResult<
  ModifierGroup,
  ApiError,
  { id: string; data: UpdateModifierGroupInput },
  UpdateModifierGroupContext
> => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore(
    (state: SnackbarState) => state.showSnackbar,
  );

  return useMutation<
    ModifierGroup,
    ApiError,
    { id: string; data: UpdateModifierGroupInput },
    UpdateModifierGroupContext
  >({
    mutationFn: ({ id, data }) => modifierGroupService.update(id, data),

    onMutate: async (variables) => {
      const { id, data } = variables;
      const detailQueryKey = modifierGroupKeys.detail(id);

      await queryClient.cancelQueries({ queryKey: detailQueryKey });
      const previousDetail =
        queryClient.getQueryData<ModifierGroup>(detailQueryKey);

      if (previousDetail) {
        queryClient.setQueryData<ModifierGroup>(
          detailQueryKey,
          (old: ModifierGroup | undefined) =>
            old ? { ...old, ...data } : undefined,
        );
      }
      return { previousDetail };
    },

    onError: (error, variables, context) => {
      const message = getApiErrorMessage(error);
      showSnackbar({ message, type: 'error' });
      console.error(`Error updating modifier group ${variables.id}:`, error);
      if (context?.previousDetail) {
        queryClient.setQueryData(
          modifierGroupKeys.detail(variables.id),
          context.previousDetail,
        );
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: modifierGroupKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: modifierGroupKeys.detail(variables.id),
      });
      if (!error && data) {
        showSnackbar({
          message: 'Grupo de modificadores actualizado con éxito',
          type: 'success',
        });
      }
    },
  });
};

export const useDeleteModifierGroupMutation = (): UseMutationResult<
  void,
  ApiError,
  string, // ID
  { previousDetail?: ModifierGroup } // Añadir contexto
> => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore(
    (state: SnackbarState) => state.showSnackbar,
  );

  type DeleteModifierGroupContext = { previousDetail?: ModifierGroup };

  return useMutation<void, ApiError, string, DeleteModifierGroupContext>({
    mutationFn: modifierGroupService.remove,

    onMutate: async (deletedId) => {
      const detailQueryKey = modifierGroupKeys.detail(deletedId);

      await queryClient.cancelQueries({ queryKey: detailQueryKey });

      const previousDetail =
        queryClient.getQueryData<ModifierGroup>(detailQueryKey);

      queryClient.removeQueries({ queryKey: detailQueryKey });

      return { previousDetail };
    },

    onError: (error, deletedId, context) => {
      const message = getApiErrorMessage(error);
      showSnackbar({ message, type: 'error' });
      console.error(`Error deleting modifier group ${deletedId}:`, error);

      if (context?.previousDetail) {
        queryClient.setQueryData(
          modifierGroupKeys.detail(deletedId),
          context.previousDetail,
        );
      }
    },

    onSettled: (_data, error, deletedId) => {
      queryClient.invalidateQueries({ queryKey: modifierGroupKeys.lists() });

      if (!error) {
        queryClient.removeQueries({
          queryKey: modifierGroupKeys.detail(deletedId),
        });
        showSnackbar({
          message: 'Grupo de modificadores eliminado con éxito',
          type: 'success',
        });
      }
    },
  });
};
