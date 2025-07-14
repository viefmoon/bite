import ApiClientWrapper from '../../../app/services/apiClientWrapper';
import { handleApiError } from '../../../app/lib/apiResponseHelper';
import { API_PATHS } from '../../../app/constants/apiPaths';
import {
  DiscoveredPrinter,
  ThermalPrinter,
  CreateThermalPrinterDto,
  UpdateThermalPrinterDto,
  FindAllThermalPrintersDto,
} from '../types/printer.types';
import {
  PaginatedResponse,
  BaseListQueryDto,
} from '../../../app/types/api.types';

type PrinterFilterParams = Omit<
  FindAllThermalPrintersDto,
  keyof BaseListQueryDto
>;

const discoverPrinters = async (
  duration: number = 10000,
): Promise<DiscoveredPrinter[]> => {
  const response = await ApiClientWrapper.get<DiscoveredPrinter[]>(
    `${API_PATHS.THERMAL_PRINTERS}/discover`,
    { duration },
  );

  if (!response.ok || !response.data) {
    handleApiError(response);
  }

  return response.data;
};

const findAllPrinters = async (
  filters: PrinterFilterParams = {},
  pagination: BaseListQueryDto = { page: 1, limit: 10 },
): Promise<PaginatedResponse<ThermalPrinter>> => {
  const queryParams = Object.entries({ ...filters, ...pagination }).reduce(
    (acc, [key, value]) => {
      if (value !== undefined) {
        if (key === 'isActive' && typeof value === 'boolean') {
          acc[key] = String(value);
        } else {
          acc[key] = value;
        }
      }
      return acc;
    },
    {} as Record<string, any>,
  );

  type FindAllPrintersApiResponse = {
    items: ThermalPrinter[];
    total: number;
    page: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };

  const response = await ApiClientWrapper.get<FindAllPrintersApiResponse>(
    API_PATHS.THERMAL_PRINTERS,
    queryParams,
  );

  if (
    !response.ok ||
    !response.data ||
    typeof response.data !== 'object' ||
    !Array.isArray(response.data.items)
  ) {
    handleApiError(response);
  }

  return {
    data: response.data.items,
    total: response.data.total,
    page: response.data.page,
    limit: response.data.limit,
    totalPages: Math.ceil(response.data.total / response.data.limit),
  };
};

const findOnePrinter = async (id: string): Promise<ThermalPrinter> => {
  const response = await ApiClientWrapper.get<ThermalPrinter>(
    `${API_PATHS.THERMAL_PRINTERS}/${id}`,
  );
  if (!response.ok || !response.data) {
    handleApiError(response);
  }
  return response.data;
};

const createPrinter = async (
  data: CreateThermalPrinterDto,
): Promise<ThermalPrinter> => {
  const response = await ApiClientWrapper.post<ThermalPrinter>(
    API_PATHS.THERMAL_PRINTERS,
    data,
  );
  if (!response.ok || !response.data) {
    handleApiError(response);
  }
  return response.data;
};

const updatePrinter = async (
  id: string,
  data: UpdateThermalPrinterDto,
): Promise<ThermalPrinter> => {
  const response = await ApiClientWrapper.patch<ThermalPrinter>(
    `${API_PATHS.THERMAL_PRINTERS}/${id}`,
    data,
  );
  if (!response.ok || !response.data) {
    handleApiError(response);
  }
  return response.data;
};

const deletePrinter = async (id: string): Promise<void> => {
  const response = await ApiClientWrapper.delete(
    `${API_PATHS.THERMAL_PRINTERS}/${id}`,
  );
  if (!response.ok) {
    handleApiError(response);
  }
};

const pingPrinter = async (id: string): Promise<{ status: string }> => {
  const response = await ApiClientWrapper.get<{ status: string }>(
    `${API_PATHS.THERMAL_PRINTERS}/${id}/ping`,
  );

  if (
    !response.ok ||
    !response.data ||
    typeof response.data.status !== 'string'
  ) {
    handleApiError(response);
  }
  return response.data;
};

const testPrintDiscoveredPrinter = async (
  printer: DiscoveredPrinter,
): Promise<{ success: boolean; message?: string }> => {
  const response = await ApiClientWrapper.post<{
    success: boolean;
    message?: string;
  }>(`${API_PATHS.THERMAL_PRINTERS}/test-print`, {
    ip: printer.ip,
    port: printer.port,
    connectionType: 'NETWORK',
  });

  if (!response.ok || !response.data) {
    handleApiError(response);
  }
  return response.data;
};

const testPrintPrinter = async (
  id: string,
): Promise<{ success: boolean; message?: string }> => {
  // Primero obtener la información de la impresora
  const printer = await findOnePrinter(id);

  // Preparar los datos según el tipo de conexión
  const printerInfo: any = {
    connectionType: printer.connectionType,
  };

  if (printer.connectionType === 'NETWORK') {
    printerInfo.ip = printer.ipAddress;
    printerInfo.port = printer.port;
  } else {
    // Para otros tipos de conexión, usar la ruta
    printerInfo.path = printer.path;
  }

  const response = await ApiClientWrapper.post<{
    success: boolean;
    message?: string;
  }>(`${API_PATHS.THERMAL_PRINTERS}/test-print`, printerInfo);

  if (!response.ok || !response.data) {
    handleApiError(response);
  }
  return response.data;
};

export const printerService = {
  discoverPrinters,
  findAllPrinters,
  findOnePrinter,
  createPrinter,
  updatePrinter,
  deletePrinter,
  pingPrinter,
  testPrintDiscoveredPrinter,
  testPrintPrinter,
};
