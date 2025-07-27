import { useQuery, useQueryClient } from '@tanstack/react-query';
import { areaService } from '../services/areaService';
import type { Area } from '@/app/schemas/domain/area.schema';
import { UpdateAreaDto, FindAllAreasDto } from '../schema/area-form.schema';
import { BaseListQuery } from '../../../app/types/query.types';
import { useApiMutation } from '@/app/hooks/useApiMutation';
import { useSnackbarStore } from '@/app/store/snackbarStore';

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
  return useApiMutation(areaService.createArea, {
    successMessage: 'Área creada con éxito',
    invalidateQueryKeys: [areasQueryKeys.lists()],
  });
};

export const useUpdateArea = () => {
  const queryClient = useQueryClient();

  type UpdateAreaContext = { previousAreas?: Area[]; previousDetail?: Area };

  return useApiMutation<
    Area,
    Error,
    { id: string; data: UpdateAreaDto },
    UpdateAreaContext
  >(({ id, data }) => areaService.updateArea(id, data), {
    suppressSuccessMessage: true, // Manejamos el éxito en onSettled
    invalidateQueryKeys: [areasQueryKeys.lists()],
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
          (old: Area | undefined) => (old ? { ...old, ...data } : undefined),
        );
      }

      return { previousAreas, previousDetail };
    },
    onError: (_error, variables, context) => {
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
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: areasQueryKeys.detail(variables.id),
      });

      if (!error && data) {
        const showSnackbar = useSnackbarStore.getState().showSnackbar;
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

  type DeleteAreaContext = { previousDetail?: Area };

  return useApiMutation<void, Error, string, DeleteAreaContext>(
    areaService.deleteArea,
    {
      successMessage: 'Área eliminada con éxito',
      invalidateQueryKeys: [areasQueryKeys.lists()],
      onMutate: async (deletedId) => {
        const detailQueryKey = areasQueryKeys.detail(deletedId);
        await queryClient.cancelQueries({ queryKey: detailQueryKey });
        const previousDetail = queryClient.getQueryData<Area>(detailQueryKey);
        queryClient.removeQueries({ queryKey: detailQueryKey });
        return { previousDetail };
      },
      onError: (_error, deletedId, context) => {
        if (context?.previousDetail) {
          queryClient.setQueryData(
            areasQueryKeys.detail(deletedId),
            context.previousDetail,
          );
        }
      },
      onSettled: (_data, error, deletedId) => {
        if (!error) {
          queryClient.removeQueries({
            queryKey: areasQueryKeys.detail(deletedId),
          });
        }
      },
    },
  );
};
