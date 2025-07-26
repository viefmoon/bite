import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';
import { subcategoriesService } from '../services/subcategoriesService';
import {
  SubCategory,
  CreateSubCategoryDto,
  UpdateSubCategoryDto,
  FindAllSubcategoriesDto,
} from '../schema/subcategories.schema';
import { PaginatedResponse } from '../../../app/types/api.types';
import { ApiError } from '../../../app/lib/errors';
import {
  useSnackbarStore,
  type SnackbarState,
} from '../../../app/store/snackbarStore';
import { getApiErrorMessage } from '../../../app/lib/errorMapping';

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

export const useCreateSubcategory = (): UseMutationResult<
  SubCategory,
  ApiError,
  CreateSubCategoryDto
> => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore(
    (state: SnackbarState) => state.showSnackbar,
  );

  return useMutation<SubCategory, ApiError, CreateSubCategoryDto>({
    mutationFn: subcategoriesService.createSubcategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subcategoryKeys.lists() });
      showSnackbar({
        message: 'Subcategoría creada con éxito',
        type: 'success',
      });
    },
    onError: (error) => {
      const message = getApiErrorMessage(error);
      showSnackbar({ message, type: 'error' });
    },
  });
};

export const useUpdateSubcategory = (): UseMutationResult<
  SubCategory,
  ApiError,
  { id: string; data: UpdateSubCategoryDto },
  UpdateSubcategoryContext
> => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore(
    (state: SnackbarState) => state.showSnackbar,
  );

  return useMutation<
    SubCategory,
    ApiError,
    { id: string; data: UpdateSubCategoryDto },
    UpdateSubcategoryContext
  >({
    mutationFn: ({ id, data }) =>
      subcategoriesService.updateSubcategory(id, data),

    onMutate: async (variables) => {
      const { id, data } = variables;
      const detailQueryKey = subcategoryKeys.detail(id);

      await queryClient.cancelQueries({ queryKey: detailQueryKey });

      const previousDetail =
        queryClient.getQueryData<SubCategory>(detailQueryKey);

      if (previousDetail) {
        queryClient.setQueryData<SubCategory>(
          detailQueryKey,
          (
            old: SubCategory | undefined, // Añadido tipo explícito
          ) => (old ? { ...old, ...data } : undefined),
        );
      }

      return { previousDetail };
    },

    onError: (error, variables, context) => {
      const message = getApiErrorMessage(error);
      showSnackbar({ message, type: 'error' });

      if (context?.previousDetail) {
        queryClient.setQueryData(
          subcategoryKeys.detail(variables.id),
          context.previousDetail,
        );
      }
    },

    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: subcategoryKeys.lists() });
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

export const useRemoveSubcategory = (): UseMutationResult<
  void,
  ApiError,
  string,
  { previousDetail?: SubCategory }
> => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore(
    (state: SnackbarState) => state.showSnackbar,
  );

  type DeleteSubcategoryContext = { previousDetail?: SubCategory };

  return useMutation<void, ApiError, string, DeleteSubcategoryContext>({
    mutationFn: subcategoriesService.removeSubcategory,

    onMutate: async (deletedId) => {
      const detailQueryKey = subcategoryKeys.detail(deletedId);

      await queryClient.cancelQueries({ queryKey: detailQueryKey });

      const previousDetail =
        queryClient.getQueryData<SubCategory>(detailQueryKey);

      queryClient.removeQueries({ queryKey: detailQueryKey });

      return { previousDetail };
    },

    onError: (error, deletedId, context) => {
      const message = getApiErrorMessage(error);
      showSnackbar({ message, type: 'error' });

      if (context?.previousDetail) {
        queryClient.setQueryData(
          subcategoryKeys.detail(deletedId),
          context.previousDetail,
        );
      }
    },

    onSettled: (_data, error, deletedId) => {
      queryClient.invalidateQueries({ queryKey: subcategoryKeys.lists() });

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
  });
};
