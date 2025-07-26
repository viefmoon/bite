import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { areaService } from '../services/areaService';
import {
  Area,
  CreateAreaDto,
  UpdateAreaDto,
  FindAllAreasDto,
} from '../schema/area.schema';
import { BaseListQuery } from '../../../app/types/query.types';
import { useSnackbarStore } from '../../../app/store/snackbarStore';
import { getApiErrorMessage } from '../../../app/lib/errorMapping';

const areasQueryKeys = {
  all: ['areas'] as const,
  lists: () => [...areasQueryKeys.all, 'list'] as const,
  list: (filters: FindAllAreasDto & BaseListQuery) =>
    [...areasQueryKeys.lists(), filters] as const,
  details: () => [...areasQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...areasQueryKeys.details(), id] as const,
};

export const useGetAreas = (
  filters: FindAllAreasDto = {},
  pagination: BaseListQuery = { page: 1, limit: 10 },
) => {
  const queryKey = areasQueryKeys.list({ ...filters, ...pagination });
  return useQuery<Area[], Error>({
    queryKey,
    queryFn: () => areaService.getAreas(filters, pagination),
  });
};

export const useGetAreaById = (
  id: string | null,
  options?: { enabled?: boolean },
) => {
  const queryKey = areasQueryKeys.detail(id!); // Use non-null assertion as it's enabled conditionally
  return useQuery<Area, Error>({
    queryKey,
    queryFn: () => areaService.getAreaById(id!),
    enabled: !!id && (options?.enabled ?? true),
  });
};

export const useCreateArea = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  return useMutation<Area, Error, CreateAreaDto>({
    mutationFn: areaService.createArea,
    onSuccess: (_newArea) => {
      // Prefijado parámetro no usado
      queryClient.invalidateQueries({ queryKey: areasQueryKeys.lists() });
      showSnackbar({ message: 'Área creada con éxito', type: 'success' });
    },
    onError: (error) => {
      const errorMessage = getApiErrorMessage(error);
      showSnackbar({ message: errorMessage, type: 'error' });
      // Error al crear área
    },
  });
};

export const useUpdateArea = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  type UpdateAreaContext = { previousAreas?: Area[]; previousDetail?: Area };

  return useMutation<
    Area,
    Error,
    { id: string; data: UpdateAreaDto },
    UpdateAreaContext
  >({
    mutationFn: ({ id, data }) => areaService.updateArea(id, data),

    onMutate: async (variables) => {
      const { id, data } = variables;
      const listQueryKey = areasQueryKeys.lists();
      const detailQueryKey = areasQueryKeys.detail(id);

      await queryClient.cancelQueries({ queryKey: listQueryKey });
      await queryClient.cancelQueries({ queryKey: detailQueryKey });

      const previousAreas = queryClient.getQueryData<Area[]>(listQueryKey);
      const previousDetail = queryClient.getQueryData<Area>(detailQueryKey);

      if (previousAreas) {
        queryClient.setQueryData<Area[]>(
          listQueryKey,
          (old) =>
            old?.map((area) =>
              area.id === id ? { ...area, ...data } : area,
            ) ?? [],
        );
      }

      if (previousDetail) {
        queryClient.setQueryData<Area>(
          detailQueryKey,
          (
            old: Area | undefined, // Añadido tipo explícito
          ) => (old ? { ...old, ...data } : undefined),
        );
      }

      return { previousAreas, previousDetail };
    },

    onError: (error, variables, context) => {
      const errorMessage = getApiErrorMessage(error);
      showSnackbar({ message: errorMessage, type: 'error' });
      // Error al actualizar área

      if (context?.previousAreas) {
        queryClient.setQueryData(areasQueryKeys.lists(), context.previousAreas);
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(
          areasQueryKeys.detail(variables.id),
          context.previousDetail,
        );
      }
    },

    onSettled: (data, error, variables, _context) => {
      // Prefijado parámetro no usado
      queryClient.invalidateQueries({ queryKey: areasQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: areasQueryKeys.detail(variables.id),
      });

      if (!error && data) {
        showSnackbar({
          message: 'Área actualizada con éxito',
          type: 'success',
        });
      }
    },
  });
};

export const useDeleteArea = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  type DeleteAreaContext = { previousDetail?: Area };

  return useMutation<void, Error, string, DeleteAreaContext>({
    mutationFn: areaService.deleteArea,

    onMutate: async (deletedId) => {
      const detailQueryKey = areasQueryKeys.detail(deletedId);

      await queryClient.cancelQueries({ queryKey: detailQueryKey });

      const previousDetail = queryClient.getQueryData<Area>(detailQueryKey);

      queryClient.removeQueries({ queryKey: detailQueryKey });

      return { previousDetail };
    },

    onError: (error, deletedId, context) => {
      const errorMessage = getApiErrorMessage(error);
      showSnackbar({ message: errorMessage, type: 'error' });
      // Error al eliminar área

      if (context?.previousDetail) {
        queryClient.setQueryData(
          areasQueryKeys.detail(deletedId),
          context.previousDetail,
        );
      }
    },

    onSettled: (_data, error, deletedId) => {
      // Prefijado parámetro no usado
      queryClient.invalidateQueries({ queryKey: areasQueryKeys.lists() });
      if (!error) {
        queryClient.removeQueries({
          queryKey: areasQueryKeys.detail(deletedId),
        });
        showSnackbar({ message: 'Área eliminada con éxito', type: 'success' });
      }
    },
  });
};
