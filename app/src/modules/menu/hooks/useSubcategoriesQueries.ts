import {
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import { subcategoriesService } from '../services/subcategoriesService';
import type { SubCategory } from '@/app/schemas/domain/subcategory.schema';
import {
  UpdateSubCategoryDto,
  FindAllSubcategoriesDto,
} from '../schema/subcategory-form.schema';
import { PaginatedResponse } from '../../../app/types/api.types';
import { ApiError } from '../../../app/lib/errors';
import { useSnackbarStore } from '../../../app/stores/snackbarStore';
import { useApiMutation } from '@/app/hooks/useApiMutation';

const subcategoryKeys = {
  all: ['subcategories'] as const,
  lists: () => [...subcategoryKeys.all, 'list'] as const,
  list: (filters: FindAllSubcategoriesDto) =>
    [...subcategoryKeys.lists(), filters] as const,
  details: () => [...subcategoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...subcategoryKeys.details(), id] as const,
};

export const useFindAllSubcategories = (
  params: FindAllSubcategoriesDto = { page: 1, limit: 10 },
  enabled: boolean = true,
): UseQueryResult<PaginatedResponse<SubCategory>, ApiError> => {
  const queryKey = subcategoryKeys.list(params);
  return useQuery<PaginatedResponse<SubCategory>, ApiError>({
    queryKey: queryKey,
    queryFn: () => subcategoriesService.findAllSubcategories(params),
    enabled: enabled,
  });
};

export const useFindOneSubcategory = (
  id: string | undefined,
  enabled: boolean = true,
): UseQueryResult<SubCategory, ApiError> => {
  const queryKey = subcategoryKeys.detail(id!);
  return useQuery<SubCategory, ApiError>({
    queryKey: queryKey,
    queryFn: () => subcategoriesService.findOneSubcategory(id!),
    enabled: enabled && !!id,
  });
};

type UpdateSubcategoryContext = {
  previousDetail?: SubCategory;
};

export const useCreateSubcategory = () => {
  return useApiMutation(subcategoriesService.createSubcategory, {
    successMessage: 'Subcategoría creada con éxito',
    invalidateQueryKeys: [subcategoryKeys.lists()],
  });
};

export const useUpdateSubcategory = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  return useApiMutation<
    SubCategory,
    ApiError,
    { id: string; data: UpdateSubCategoryDto },
    UpdateSubcategoryContext
  >(({ id, data }) => subcategoriesService.updateSubcategory(id, data), {
    suppressSuccessMessage: true,
    invalidateQueryKeys: [subcategoryKeys.lists()],
    onMutate: async (variables) => {
      const { id, data } = variables;
      const detailQueryKey = subcategoryKeys.detail(id);

      await queryClient.cancelQueries({ queryKey: detailQueryKey });

      const previousDetail =
        queryClient.getQueryData<SubCategory>(detailQueryKey);

      if (previousDetail) {
        queryClient.setQueryData<SubCategory>(
          detailQueryKey,
          (old: SubCategory | undefined) =>
            old ? { ...old, ...data } : undefined,
        );
      }

      return { previousDetail };
    },
    onError: (_error, variables, context) => {
      if (context?.previousDetail) {
        queryClient.setQueryData(
          subcategoryKeys.detail(variables.id),
          context.previousDetail,
        );
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: subcategoryKeys.detail(variables.id),
      });

      if (!error && data) {
        showSnackbar({
          message: 'Subcategoría actualizada con éxito',
          type: 'success',
        });
      }
    },
  });
};

export const useRemoveSubcategory = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  type DeleteSubcategoryContext = { previousDetail?: SubCategory };

  return useApiMutation<void, ApiError, string, DeleteSubcategoryContext>(
    subcategoriesService.removeSubcategory,
    {
      suppressSuccessMessage: true,
      invalidateQueryKeys: [subcategoryKeys.lists()],
      onMutate: async (deletedId) => {
        const detailQueryKey = subcategoryKeys.detail(deletedId);

        await queryClient.cancelQueries({ queryKey: detailQueryKey });

        const previousDetail =
          queryClient.getQueryData<SubCategory>(detailQueryKey);

        queryClient.removeQueries({ queryKey: detailQueryKey });

        return { previousDetail };
      },
      onError: (_error, deletedId, context) => {
        if (context?.previousDetail) {
          queryClient.setQueryData(
            subcategoryKeys.detail(deletedId),
            context.previousDetail,
          );
        }
      },
      onSettled: (_data, error, deletedId) => {
        if (!error) {
          queryClient.removeQueries({
            queryKey: subcategoryKeys.detail(deletedId),
          });
          showSnackbar({
            message: 'Subcategoría eliminada con éxito',
            type: 'success',
          });
        }
      },
    },
  );
};
