import {
  useQuery,
  useQueryClient,
  UseQueryResult,
} from '@tanstack/react-query';
import { productsService } from '../services/productsService';
import type { Product } from '@/app/schemas/domain/product.schema';
import {
  ProductFormInputs,
  FindAllProductsQuery,
  AssignModifierGroupsInput,
} from '../schema/products.schema';
import { PaginatedResponse } from '@/app/types/api.types';
import { ApiError } from '@/app/lib/errors';
import { useSnackbarStore } from '@/app/store/snackbarStore';
import { useApiMutation } from '@/app/hooks/useApiMutation';

const productKeys = {
  all: ['products'] as const,
  lists: (filters: FindAllProductsQuery) =>
    [...productKeys.all, 'list', filters] as const,
  details: (id: string) => [...productKeys.all, 'detail', id] as const,
  detailModifierGroups: (id: string) =>
    [...productKeys.details(id), 'modifier-groups'] as const,
};

export function useProductsQuery(
  filters: FindAllProductsQuery,
  options?: { enabled?: boolean },
): UseQueryResult<PaginatedResponse<Product>, ApiError> {
  return useQuery<PaginatedResponse<Product>, ApiError>({
    queryKey: productKeys.lists(filters),
    queryFn: () => productsService.findAll(filters),
    enabled: options?.enabled ?? true,
  });
}

export function useProductQuery(
  productId: string,
  options?: { enabled?: boolean },
): UseQueryResult<Product, ApiError> {
  return useQuery<Product, ApiError>({
    queryKey: productKeys.details(productId),
    queryFn: () => productsService.findOne(productId),
    enabled: !!productId && (options?.enabled ?? true),
  });
}

export function useCreateProductMutation() {
  return useApiMutation(
    (newProduct: ProductFormInputs) => productsService.create(newProduct),
    {
      successMessage: 'Producto creado con éxito',
      invalidateQueryKeys: [productKeys.all],
    },
  );
}

export function useUpdateProductMutation() {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  type UpdateProductContext = { previousDetail?: Product };

  return useApiMutation<
    Product,
    ApiError,
    { id: string; data: Partial<ProductFormInputs> },
    UpdateProductContext
  >(({ id, data }) => productsService.update(id, data), {
    suppressSuccessMessage: true,
    invalidateQueryKeys: [productKeys.all],
    onMutate: async (variables) => {
      const { id, data } = variables;
      const detailQueryKey = productKeys.details(id);

      await queryClient.cancelQueries({ queryKey: detailQueryKey });

      const previousDetail = queryClient.getQueryData<Product>(detailQueryKey);

      if (previousDetail) {
        queryClient.setQueryData<Product>(
          detailQueryKey,
          (old: Product | undefined) => {
            if (!old) return undefined;
            const { variants, modifierGroupIds, ...restOfData } = data;
            return { ...old, ...restOfData };
          },
        );
      }

      return { previousDetail };
    },
    onError: (_error, variables, context) => {
      if (context?.previousDetail) {
        queryClient.setQueryData(
          productKeys.details(variables.id),
          context.previousDetail,
        );
      }
    },
    onSettled: (data, error, _variables) => {
      if (!error && data) {
        showSnackbar({
          message: 'Producto actualizado con éxito',
          type: 'success',
        });
      }
    },
  });
}

export function useDeleteProductMutation() {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  type DeleteProductContext = { previousDetail?: Product };

  return useApiMutation<void, ApiError, string, DeleteProductContext>(
    (productId) => productsService.remove(productId),
    {
      suppressSuccessMessage: true,
      invalidateQueryKeys: [productKeys.all],
      onMutate: async (deletedId) => {
        const detailQueryKey = productKeys.details(deletedId);

        await queryClient.cancelQueries({ queryKey: detailQueryKey });

        const previousDetail =
          queryClient.getQueryData<Product>(detailQueryKey);

        queryClient.removeQueries({ queryKey: detailQueryKey });

        return { previousDetail };
      },
      onError: (_error, deletedId, context) => {
        if (context?.previousDetail) {
          queryClient.setQueryData(
            productKeys.details(deletedId),
            context.previousDetail,
          );
        }
      },
      onSettled: (_data, error, deletedId) => {
        if (!error) {
          queryClient.removeQueries({
            queryKey: productKeys.details(deletedId),
          });
          showSnackbar({
            message: 'Producto eliminado con éxito',
            type: 'success',
          });
        }
      },
    },
  );
}

export function useAssignModifierGroupsMutation() {
  const queryClient = useQueryClient();

  return useApiMutation(
    ({
      productId,
      data,
    }: {
      productId: string;
      data: AssignModifierGroupsInput;
    }) => productsService.assignModifierGroups(productId, data),
    {
      successMessage: 'Grupos de modificadores asignados con éxito',
      onSuccess: (updatedProduct) => {
        queryClient.invalidateQueries({
          queryKey: productKeys.details(updatedProduct.id),
        });
        queryClient.invalidateQueries({
          queryKey: productKeys.detailModifierGroups(updatedProduct.id),
        });
      },
    },
  );
}

export function useProductModifierGroupsQuery(
  productId: string,
  options?: { enabled?: boolean },
): UseQueryResult<Product, ApiError> {
  return useQuery<Product, ApiError>({
    queryKey: productKeys.detailModifierGroups(productId),
    queryFn: () => productsService.getModifierGroups(productId),
    enabled: !!productId && (options?.enabled ?? true),
  });
}

export function useRemoveModifierGroupsMutation() {
  const queryClient = useQueryClient();

  return useApiMutation(
    ({
      productId,
      data,
    }: {
      productId: string;
      data: AssignModifierGroupsInput;
    }) => productsService.removeModifierGroups(productId, data),
    {
      successMessage: 'Grupos de modificadores removidos con éxito',
      onSuccess: (updatedProduct) => {
        queryClient.invalidateQueries({
          queryKey: productKeys.details(updatedProduct.id),
        });
        queryClient.invalidateQueries({
          queryKey: productKeys.detailModifierGroups(updatedProduct.id),
        });
      },
    },
  );
}
