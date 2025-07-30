import {
  useMutation,
  useQueryClient,
  UseMutationOptions,
} from '@tanstack/react-query';
import { useSnackbarStore } from '@/app/stores/snackbarStore';
import { getApiErrorMessage } from '@/app/lib/errorMapping';

export interface UseApiMutationOptions<TData, TError, TVariables, TContext>
  extends Omit<
    UseMutationOptions<TData, TError, TVariables, TContext>,
    'mutationFn'
  > {
  successMessage?: string;
  invalidateQueryKeys?: ReadonlyArray<readonly unknown[]>;
  suppressSuccessMessage?: boolean;
  suppressErrorMessage?: boolean;
}

export const useApiMutation = <TData, TError, TVariables, TContext = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseApiMutationOptions<TData, TError, TVariables, TContext> = {},
) => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((s) => s.showSnackbar);

  const {
    successMessage,
    invalidateQueryKeys,
    suppressSuccessMessage = false,
    suppressErrorMessage = false,
    ...restOptions
  } = options;

  return useMutation<TData, TError, TVariables, TContext>({
    mutationFn,
    onSuccess: (data, variables, context) => {
      // Invalidar queries especificadas
      if (invalidateQueryKeys && invalidateQueryKeys.length > 0) {
        invalidateQueryKeys.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
      }

      // Mostrar mensaje de éxito si está configurado y no está suprimido
      if (successMessage && !suppressSuccessMessage) {
        showSnackbar({ message: successMessage, type: 'success' });
      }

      // Ejecutar lógica onSuccess adicional del usuario
      restOptions.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      // Mostrar mensaje de error si no está suprimido
      if (!suppressErrorMessage) {
        const message = getApiErrorMessage(error);
        showSnackbar({ message, type: 'error' });
      }

      // Ejecutar lógica onError adicional del usuario
      restOptions.onError?.(error, variables, context);
    },
    ...restOptions,
  });
};
