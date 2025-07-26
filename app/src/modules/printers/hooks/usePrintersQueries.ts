import {
  useMutation,
  UseMutationResult,
  useQuery,
  UseQueryResult,
  useQueryClient,
} from '@tanstack/react-query';
import { printerService } from '../services/printerService';
import {
  DiscoveredPrinter,
  ThermalPrinter,
  CreateThermalPrinterDto,
  UpdateThermalPrinterDto,
  FindAllThermalPrintersDto,
} from '../types/printer.types';
import { ApiError } from '../../../app/lib/errors';
import { PaginatedResponse } from '../../../app/types/api.types';
import { useSnackbarStore } from '../../../app/store/snackbarStore';
import { getApiErrorMessage } from '../../../app/lib/errorMapping';

const printerKeys = {
  all: ['thermalPrinters'] as const,
  lists: () => [...printerKeys.all, 'list'] as const,
  list: (filters: FindAllThermalPrintersDto) =>
    [...printerKeys.lists(), filters] as const,
  details: () => [...printerKeys.all, 'detail'] as const,
  detail: (id: string) => [...printerKeys.details(), id] as const,
  discover: ['discoverPrinters'] as const,
};

export const useDiscoverPrinters = (): UseMutationResult<
  DiscoveredPrinter[],
  ApiError,
  number | undefined
> => {
  return useMutation<DiscoveredPrinter[], ApiError, number | undefined>({
    mutationFn: (duration: number | undefined) =>
      printerService.discoverPrinters(duration),
  });
};

export const usePrintersQuery = (
  params: FindAllThermalPrintersDto = { page: 1, limit: 10 },
  options?: { enabled?: boolean },
): UseQueryResult<PaginatedResponse<ThermalPrinter>, ApiError> => {
  const queryKey = printerKeys.list(params);
  return useQuery<PaginatedResponse<ThermalPrinter>, ApiError>({
    queryKey: queryKey,
    queryFn: () => printerService.findAllPrinters(params),
    enabled: options?.enabled ?? true,
  });
};

export const usePrinterQuery = (
  id: string | undefined,
  options?: { enabled?: boolean },
): UseQueryResult<ThermalPrinter, ApiError> => {
  const queryKey = printerKeys.detail(id!);
  return useQuery<ThermalPrinter, ApiError>({
    queryKey: queryKey,
    queryFn: () => printerService.findOnePrinter(id!),
    enabled: !!id && (options?.enabled ?? true),
  });
};

export const useCreatePrinterMutation = (): UseMutationResult<
  ThermalPrinter,
  ApiError,
  CreateThermalPrinterDto
> => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  return useMutation<ThermalPrinter, ApiError, CreateThermalPrinterDto>({
    mutationFn: printerService.createPrinter,
    onSuccess: (newPrinter) => {
      queryClient.invalidateQueries({ queryKey: printerKeys.lists() });
      showSnackbar({
        message: `Impresora "${newPrinter.name}" creada con éxito`,
        type: 'success',
      });
    },
    onError: (error) => {
      showSnackbar({
        message: getApiErrorMessage(error),
        type: 'error',
      });
    },
  });
};

export const useUpdatePrinterMutation = (): UseMutationResult<
  ThermalPrinter,
  ApiError,
  { id: string; data: UpdateThermalPrinterDto }
> => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  return useMutation<
    ThermalPrinter,
    ApiError,
    { id: string; data: UpdateThermalPrinterDto }
  >({
    mutationFn: ({ id, data }) => printerService.updatePrinter(id, data),
    onSuccess: (updatedPrinter, variables) => {
      queryClient.invalidateQueries({ queryKey: printerKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: printerKeys.detail(variables.id),
      });
      showSnackbar({
        message: `Impresora "${updatedPrinter.name}" actualizada`,
        type: 'success',
      });
    },
    onError: (error, _variables) => {
      showSnackbar({
        message: getApiErrorMessage(error),
        type: 'error',
      });
    },
  });
};

export const useDeletePrinterMutation = (): UseMutationResult<
  void,
  ApiError,
  string
> => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  return useMutation<void, ApiError, string>({
    mutationFn: printerService.deletePrinter,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: printerKeys.lists() });
      queryClient.removeQueries({ queryKey: printerKeys.detail(deletedId) });
      showSnackbar({ message: 'Impresora eliminada', type: 'success' });
    },
    onError: (error) => {
      showSnackbar({
        message: `Error al eliminar impresora: ${getApiErrorMessage(error)}`,
        type: 'error',
      });
    },
  });
};

export const usePingPrinterMutation = (): UseMutationResult<
  { status: string },
  ApiError,
  string
> => {
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  return useMutation<{ status: string }, ApiError, string>({
    mutationFn: (printerId: string) => printerService.pingPrinter(printerId),
    onSuccess: (data, _printerId) => {
      const message =
        data.status === 'online'
          ? `Impresora conectada (ping exitoso).`
          : `Impresora desconectada (ping fallido).`;
      const type = data.status === 'online' ? 'success' : 'warning';
      showSnackbar({ message, type });
    },
    onError: (error, _printerId) => {
      showSnackbar({
        message: `Error al hacer ping a la impresora: ${getApiErrorMessage(error)}`,
        type: 'error',
      });
    },
  });
};

export const useTestPrintDiscoveredPrinter = (): UseMutationResult<
  { success: boolean; message?: string },
  ApiError,
  DiscoveredPrinter
> => {
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  return useMutation<
    { success: boolean; message?: string },
    ApiError,
    DiscoveredPrinter
  >({
    mutationFn: (printer: DiscoveredPrinter) =>
      printerService.testPrintDiscoveredPrinter(printer),
    onSuccess: (data) => {
      showSnackbar({
        message: data.message || 'Ticket de prueba impreso correctamente',
        type: 'success',
      });
    },
    onError: (error) => {
      showSnackbar({
        message: `Error al imprimir ticket de prueba: ${getApiErrorMessage(error)}`,
        type: 'error',
      });
    },
  });
};

export const useTestPrintPrinter = (): UseMutationResult<
  { success: boolean; message?: string },
  ApiError,
  string
> => {
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  return useMutation<{ success: boolean; message?: string }, ApiError, string>({
    mutationFn: (printerId: string) =>
      printerService.testPrintPrinter(printerId),
    onSuccess: (data) => {
      showSnackbar({
        message: data.message || 'Ticket de prueba impreso correctamente',
        type: 'success',
      });
    },
    onError: (error) => {
      showSnackbar({
        message: `Error al imprimir ticket de prueba: ${getApiErrorMessage(error)}`,
        type: 'error',
      });
    },
  });
};
