import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tableService } from '../services/tableService';
import {
  Table,
  CreateTableDto,
  UpdateTableDto,
  FindAllTablesDto,
} from '../schema/table.schema'; // Corregida ruta de importación
import { BaseListQuery } from '../../../app/types/query.types';
import { useSnackbarStore } from '../../../app/store/snackbarStore';
import { getApiErrorMessage } from '../../../app/lib/errorMapping';

const tablesQueryKeys = {
  all: ['tables'] as const,
  lists: () => [...tablesQueryKeys.all, 'list'] as const,
  list: (filters: FindAllTablesDto & BaseListQuery) =>
    [...tablesQueryKeys.lists(), filters] as const,
  listsByArea: (areaId: string) =>
    [...tablesQueryKeys.lists(), { areaId }] as const,
  details: () => [...tablesQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...tablesQueryKeys.details(), id] as const,
};

export const useGetTables = (
  filters: FindAllTablesDto = {},
  pagination: BaseListQuery = { page: 1, limit: 10 },
) => {
  const queryKey = tablesQueryKeys.list({ ...filters, ...pagination });
  return useQuery<Table[], Error>({
    queryKey,
    queryFn: () => tableService.getTables(filters, pagination),
  });
};

export const useGetTablesByAreaId = (
  areaId: string | null,
  options?: { enabled?: boolean },
) => {
  const queryKey = tablesQueryKeys.listsByArea(areaId!);
  return useQuery<Table[], Error>({
    queryKey,
    queryFn: () => tableService.getTablesByAreaId(areaId!),
    enabled: !!areaId && (options?.enabled ?? true),
  });
};

export const useGetTableById = (
  id: string | null,
  options?: { enabled?: boolean },
) => {
  const queryKey = tablesQueryKeys.detail(id!);
  return useQuery<Table, Error>({
    queryKey,
    queryFn: () => tableService.getTableById(id!),
    enabled: !!id && (options?.enabled ?? true),
  });
};

export const useCreateTable = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  return useMutation<Table, Error, CreateTableDto>({
    mutationFn: tableService.createTable,
    onSuccess: (_newTable) => {
      // Prefijado parámetro no usado
      queryClient.invalidateQueries({ queryKey: tablesQueryKeys.lists() });
      showSnackbar({ message: 'Mesa creada con éxito', type: 'success' });
    },
    onError: (error) => {
      const errorMessage = getApiErrorMessage(error);
      showSnackbar({ message: errorMessage, type: 'error' });
      // Error al crear mesa
    },
  });
};

export const useUpdateTable = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  type UpdateTableContext = { previousDetail?: Table };

  return useMutation<
    Table,
    Error,
    { id: string; data: UpdateTableDto },
    UpdateTableContext
  >({
    mutationFn: ({ id, data }) => tableService.updateTable(id, data),

    onMutate: async (variables) => {
      const { id, data } = variables;
      const detailQueryKey = tablesQueryKeys.detail(id);

      await queryClient.cancelQueries({ queryKey: detailQueryKey });

      const previousDetail = queryClient.getQueryData<Table>(detailQueryKey);

      if (previousDetail) {
        queryClient.setQueryData<Table>(
          detailQueryKey,
          (
            old: Table | undefined, // Añadido tipo explícito
          ) => (old ? { ...old, ...data } : undefined),
        );
      }

      return { previousDetail };
    },

    onError: (error, variables, context) => {
      const errorMessage = getApiErrorMessage(error);
      showSnackbar({ message: errorMessage, type: 'error' });
      // Error al actualizar mesa

      if (context?.previousDetail) {
        queryClient.setQueryData(
          tablesQueryKeys.detail(variables.id),
          context.previousDetail,
        );
      }
    },

    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: tablesQueryKeys.lists() });
      // Considerar invalidar listsByArea si areaId cambia
      queryClient.invalidateQueries({
        queryKey: tablesQueryKeys.detail(variables.id),
      });

      if (!error && data) {
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
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  type DeleteTableContext = { previousDetail?: Table };

  return useMutation<void, Error, string, DeleteTableContext>({
    mutationFn: tableService.deleteTable,

    onMutate: async (deletedId) => {
      const detailQueryKey = tablesQueryKeys.detail(deletedId);

      await queryClient.cancelQueries({ queryKey: detailQueryKey });

      const previousDetail = queryClient.getQueryData<Table>(detailQueryKey);

      queryClient.removeQueries({ queryKey: detailQueryKey });

      return { previousDetail };
    },

    onError: (error, deletedId, context) => {
      const errorMessage = getApiErrorMessage(error);
      showSnackbar({ message: errorMessage, type: 'error' });
      // Error al eliminar mesa

      if (context?.previousDetail) {
        queryClient.setQueryData(
          tablesQueryKeys.detail(deletedId),
          context.previousDetail,
        );
      }
    },

    onSettled: (_data, error, deletedId, context) => {
      // Prefijado parámetro no usado
      queryClient.invalidateQueries({ queryKey: tablesQueryKeys.lists() });
      if (context?.previousDetail?.areaId) {
        queryClient.invalidateQueries({
          queryKey: tablesQueryKeys.listsByArea(context.previousDetail.areaId),
        });
      }

      if (!error) {
        queryClient.removeQueries({
          queryKey: tablesQueryKeys.detail(deletedId),
        });
        showSnackbar({ message: 'Mesa eliminada con éxito', type: 'success' });
      }
    },
  });
};
