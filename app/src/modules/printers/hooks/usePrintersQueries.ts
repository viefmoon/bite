import {
  useMutation,
  UseMutationResult,
  useQuery,
  UseQueryResult,
  useQueryClient,
  QueryKey,
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

// --- Query Keys ---
const printerKeys = {
  all: ['thermalPrinters'] as const,
  lists: () => [...printerKeys.all, 'list'] as const,
  list: (filters: FindAllThermalPrintersDto) =>
    [...printerKeys.lists(), filters] as const,
  details: () => [...printerKeys.all, 'detail'] as const,
  detail: (id: string) => [...printerKeys.details(), id] as const,
  discover: ['discoverPrinters'] as const, // Clave para descubrimiento
};

/**
 * Hook para disparar el descubrimiento de impresoras.
 * Utiliza useMutation ya que es una acción iniciada por el usuario.
 */
export const useDiscoverPrinters = (): UseMutationResult<
  DiscoveredPrinter[], // Tipo de dato que devuelve la mutación en caso de éxito
  ApiError, // Tipo de error esperado
  number | undefined // Tipo del argumento que recibe la función mutate (duration o undefined)
> => {
  // No necesita invalidar caché, es una acción puntual
  return useMutation<DiscoveredPrinter[], ApiError, number | undefined>({
    mutationFn: (duration: number | undefined) =>
      printerService.discoverPrinters(duration),
    // Opcional: manejo de errores/éxito específico para descubrimiento si es necesario
  });
};

/**
 * Hook para obtener la lista paginada de impresoras registradas.
 */
export const usePrintersQuery = (
  // Proporcionar valores por defecto para page y limit si params está vacío
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

/**
 * Hook para obtener los detalles de una impresora registrada por ID.
 */
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

/**
 * Hook para crear una nueva impresora registrada.
 */
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

/**
 * Hook para actualizar una impresora registrada existente.
 */
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
      // Invalidar lista y detalle específico
      queryClient.invalidateQueries({ queryKey: printerKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: printerKeys.detail(variables.id),
      });
      // Opcional: Actualizar caché directamente si se desea optimización
      // queryClient.setQueryData(printerKeys.detail(variables.id), updatedPrinter);
      showSnackbar({
        message: `Impresora "${updatedPrinter.name}" actualizada`,
        type: 'success',
      });
    },
    onError: (error, variables) => {
      showSnackbar({
        message: getApiErrorMessage(error),
        type: 'error',
      });
    },
  });
};

/**
 * Hook para eliminar (soft delete) una impresora registrada.
 */
export const useDeletePrinterMutation = (): UseMutationResult<
  void,
  ApiError,
  string // ID de la impresora a eliminar
> => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  return useMutation<void, ApiError, string>({
    mutationFn: printerService.deletePrinter,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: printerKeys.lists() });
      // Opcional: Remover de la caché de detalle
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

/**
 * Hook para realizar un ping a una impresora.
 */
export const usePingPrinterMutation = (): UseMutationResult<
  { status: string }, // Tipo de dato que devuelve la mutación en caso de éxito
  ApiError, // Tipo de error esperado
  string // Tipo del argumento que recibe la función mutate (printer ID)
> => {
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  return useMutation<{ status: string }, ApiError, string>({
    mutationFn: (printerId: string) => printerService.pingPrinter(printerId),
    onSuccess: (data, printerId) => {
      const message =
        data.status === 'online'
          ? `Impresora conectada (ping exitoso).`
          : `Impresora desconectada (ping fallido).`;
      const type = data.status === 'online' ? 'success' : 'warning';
      showSnackbar({ message, type });
    },
    onError: (error, printerId) => {
      showSnackbar({
        message: `Error al hacer ping a la impresora: ${getApiErrorMessage(error)}`,
        type: 'error',
      });
      console.error(`Error pinging printer ${printerId}:`, error);
    },
  });
};

/**
 * Hook para imprimir un ticket de prueba en una impresora descubierta.
 */
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
      console.error('Error printing test ticket:', error);
    },
  });
};

/**
 * Hook para imprimir un ticket de prueba en una impresora configurada.
 */
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
      console.error('Error printing test ticket:', error);
    },
  });
};
