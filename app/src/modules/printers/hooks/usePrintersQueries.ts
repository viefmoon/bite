import {
  useQuery,
  UseQueryResult,
  useQueryClient,
} from '@tanstack/react-query';
import { printerService } from '../services/printerService';
import {
  DiscoveredPrinter,
  ThermalPrinter,
  UpdateThermalPrinterDto,
  FindAllThermalPrintersDto,
} from '../types/printer.types';
import { ApiError } from '../../../app/lib/errors';
import { PaginatedResponse } from '../../../app/types/api.types';
import { useApiMutation } from '@/app/hooks/useApiMutation';
import { useSnackbarStore } from '../../../app/store/snackbarStore';

const printerKeys = {
  all: ['thermalPrinters'] as const,
  lists: () => [...printerKeys.all, 'list'] as const,
  list: (filters: FindAllThermalPrintersDto) =>
    [...printerKeys.lists(), filters] as const,
  details: () => [...printerKeys.all, 'detail'] as const,
  detail: (id: string) => [...printerKeys.details(), id] as const,
  discover: ['discoverPrinters'] as const,
};

export const useDiscoverPrinters = () => {
  return useApiMutation(
    () => printerService.discoverPrinters(),
    {
      suppressSuccessMessage: true,
    },
  );
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

export const useCreatePrinterMutation = () => {
  return useApiMutation(printerService.createPrinter, {
    invalidateQueryKeys: [printerKeys.lists()],
    suppressSuccessMessage: true,
    onSuccess: (newPrinter) => {
      const { showSnackbar } = useSnackbarStore.getState();
      showSnackbar({
        message: `Impresora "${newPrinter.name}" creada con éxito`,
        type: 'success',
      });
    },
  });
};

export const useUpdatePrinterMutation = () => {
  const queryClient = useQueryClient();

  return useApiMutation(
    ({ id, data }: { id: string; data: UpdateThermalPrinterDto }) =>
      printerService.updatePrinter(id, data),
    {
      suppressSuccessMessage: true,
      onSuccess: (updatedPrinter, _variables) => {
        const { showSnackbar } = useSnackbarStore.getState();
        showSnackbar({
          message: `Impresora "${updatedPrinter.name}" actualizada`,
          type: 'success',
        });
      },
      invalidateQueryKeys: [printerKeys.lists()],
      onSettled: (_, __, variables) => {
        // Invalidar también el detalle específico
        queryClient.invalidateQueries({
          queryKey: printerKeys.detail(variables.id),
        });
      },
    },
  );
};

export const useDeletePrinterMutation = () => {
  const queryClient = useQueryClient();

  return useApiMutation(printerService.deletePrinter, {
    successMessage: 'Impresora eliminada',
    onSuccess: (_, deletedId) => {
      // Invalidar todas las listas de impresoras
      queryClient.invalidateQueries({ queryKey: printerKeys.all });
      // Remover el detalle específico
      queryClient.removeQueries({ queryKey: printerKeys.detail(deletedId) });
    },
  });
};

export const usePingPrinterMutation = () => {
  return useApiMutation(
    (printerId: string) => printerService.pingPrinter(printerId),
    {
      suppressSuccessMessage: true,
      onSuccess: (data) => {
        const { showSnackbar } = useSnackbarStore.getState();
        const message =
          data.status === 'online'
            ? `Impresora conectada (ping exitoso).`
            : `Impresora desconectada (ping fallido).`;
        const type = data.status === 'online' ? 'success' : 'warning';
        showSnackbar({ message, type });
      },
    },
  );
};

export const useTestPrintDiscoveredPrinter = () => {
  return useApiMutation(
    (printer: DiscoveredPrinter) =>
      printerService.testPrintDiscoveredPrinter(printer),
    {
      suppressSuccessMessage: true,
      onSuccess: (data) => {
        const { showSnackbar } = useSnackbarStore.getState();
        showSnackbar({
          message: data.message || 'Ticket de prueba impreso correctamente',
          type: 'success',
        });
      },
    },
  );
};

export const useTestPrintPrinter = () => {
  return useApiMutation(
    (printerId: string) => printerService.testPrintPrinter(printerId),
    {
      suppressSuccessMessage: true,
      onSuccess: (data) => {
        const { showSnackbar } = useSnackbarStore.getState();
        showSnackbar({
          message: data.message || 'Ticket de prueba impreso correctamente',
          type: 'success',
        });
      },
    },
  );
};
