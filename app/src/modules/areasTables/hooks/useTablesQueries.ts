import { useQuery, useQueryClient } from '@tanstack/react-query';
import { tableService } from '../services/tableService';
import type { Table } from '@/app/schemas/domain/table.schema';
import { UpdateTableDto, FindAllTablesDto } from '../schema/table-form.schema';
import { BaseListQuery } from '../../../app/types/query.types';
import { useApiMutation } from '@/app/hooks/useApiMutation';
import { useSnackbarStore } from '@/app/stores/snackbarStore';

const tablesQueryKeys = {
  all: ['tables'] as const,
  lists: () => [...tablesQueryKeys.all, 'list'] as const,
  list: (filters: FindAllTablesDto & BaseListQuery) =>
    [...tablesQueryKeys.lists(), filters] as const,
  listsByArea: (areaId: string, filters?: Omit<FindAllTablesDto, 'areaId'>) =>
    [...tablesQueryKeys.lists(), { areaId, ...filters }] as const,
  details: () => [...tablesQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...tablesQueryKeys.details(), id] as const,
};

export const useGetTablesByAreaId = (
  areaId: string | null,
  filters: Omit<FindAllTablesDto, 'areaId'> = {},
  options?: { enabled?: boolean },
) => {
  const queryKey = tablesQueryKeys.listsByArea(areaId!, filters);
  return useQuery<Table[], Error>({
    queryKey,
    queryFn: () => tableService.getTablesByAreaId(areaId!, filters),
    enabled: !!areaId && (options?.enabled ?? true),
  });
};

export const useCreateTable = () => {
  return useApiMutation(tableService.createTable, {
    successMessage: 'Mesa creada con éxito',
    invalidateQueryKeys: [tablesQueryKeys.lists()],
  });
};

export const useUpdateTable = () => {
  const queryClient = useQueryClient();

  type UpdateTableContext = { previousDetail?: Table };

  return useApiMutation<
    Table,
    Error,
    { id: string; data: UpdateTableDto },
    UpdateTableContext
  >(({ id, data }) => tableService.updateTable(id, data), {
    suppressSuccessMessage: true,
    invalidateQueryKeys: [tablesQueryKeys.lists()],
    onMutate: async (variables) => {
      const { id, data } = variables;
      const detailQueryKey = tablesQueryKeys.detail(id);

      await queryClient.cancelQueries({ queryKey: detailQueryKey });
      const previousDetail = queryClient.getQueryData<Table>(detailQueryKey);

      if (previousDetail) {
        queryClient.setQueryData<Table>(
          detailQueryKey,
          (old: Table | undefined) => (old ? { ...old, ...data } : undefined),
        );
      }

      return { previousDetail };
    },
    onError: (_error, variables, context) => {
      if (context?.previousDetail) {
        queryClient.setQueryData(
          tablesQueryKeys.detail(variables.id),
          context.previousDetail,
        );
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: tablesQueryKeys.detail(variables.id),
      });

      if (!error && data) {
        const showSnackbar = useSnackbarStore.getState().showSnackbar;
        showSnackbar({
          message: 'Mesa actualizada con éxito',
          type: 'success',
        });
      }
    },
  });
};

export const useDeleteTable = () => {
  const queryClient = useQueryClient();

  type DeleteTableContext = { previousDetail?: Table };

  return useApiMutation<void, Error, string, DeleteTableContext>(
    tableService.deleteTable,
    {
      suppressSuccessMessage: true,
      invalidateQueryKeys: [tablesQueryKeys.lists()],
      onMutate: async (deletedId) => {
        const detailQueryKey = tablesQueryKeys.detail(deletedId);
        await queryClient.cancelQueries({ queryKey: detailQueryKey });
        const previousDetail = queryClient.getQueryData<Table>(detailQueryKey);
        queryClient.removeQueries({ queryKey: detailQueryKey });
        return { previousDetail };
      },
      onError: (_error, deletedId, context) => {
        if (context?.previousDetail) {
          queryClient.setQueryData(
            tablesQueryKeys.detail(deletedId),
            context.previousDetail,
          );
        }
      },
      onSettled: (_data, error, deletedId, context) => {
        if (context?.previousDetail?.areaId) {
          queryClient.invalidateQueries({
            queryKey: tablesQueryKeys.listsByArea(
              context.previousDetail.areaId,
            ),
          });
        }

        if (!error) {
          queryClient.removeQueries({
            queryKey: tablesQueryKeys.detail(deletedId),
          });
          const showSnackbar = useSnackbarStore.getState().showSnackbar;
          showSnackbar({
            message: 'Mesa eliminada con éxito',
            type: 'success',
          });
        }
      },
    },
  );
};
