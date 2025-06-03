
import apiClient from "../../../app/services/apiClient";
import { ApiError } from "../../../app/lib/errors";
import { API_PATHS } from "../../../app/constants/apiPaths";
import {
  DiscoveredPrinter,
  ThermalPrinter,
  CreateThermalPrinterDto,
  UpdateThermalPrinterDto,
  FindAllThermalPrintersDto,
} from "../types/printer.types";
import { BackendErrorResponse, PaginatedResponse, BaseListQueryDto } from "../../../app/types/api.types";

type PrinterFilterParams = Omit<FindAllThermalPrintersDto, keyof BaseListQueryDto>;


const discoverPrinters = async (duration: number = 10000): Promise<DiscoveredPrinter[]> => {
  const response = await apiClient.get<DiscoveredPrinter[]>(
    `${API_PATHS.THERMAL_PRINTERS}/discover`,
    { duration }
  );

  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(
      response.data as BackendErrorResponse | undefined,
      response.status
    );
  }

  return response.data;
};


const findAllPrinters = async (
  filters: PrinterFilterParams = {},
  pagination: BaseListQueryDto = { page: 1, limit: 10 }
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
    {} as Record<string, any>
  );

  type FindAllPrintersApiResponse = {
    data: ThermalPrinter[];
    hasNextPage: boolean;
  };

  const response = await apiClient.get<FindAllPrintersApiResponse>(
    API_PATHS.THERMAL_PRINTERS,
    queryParams
  );

  if (
    !response.ok ||
    !response.data ||
    typeof response.data !== 'object' ||
    !Array.isArray(response.data.data) ||
    typeof response.data.hasNextPage !== 'boolean'
  ) {
    throw ApiError.fromApiResponse(
      response.data as BackendErrorResponse | undefined,
      response.status ?? 500
    );
  }

  const { data, hasNextPage } = response.data;
  const page = pagination.page ?? 1;
  const limit = pagination.limit ?? 10;

  let total: number;
  let totalPages: number;

  if (limit <= 0) {
      total = data.length;
      totalPages = total > 0 ? 1 : 0;
  } else {
      if (hasNextPage) {
          total = page * limit + 1;
          totalPages = page + 1;
      } else {
          total = (page - 1) * limit + data.length;
          totalPages = page;
      }
  }


  return {
    data,
    total,
    page,
    limit,
    totalPages,
  };
};

const findOnePrinter = async (id: string): Promise<ThermalPrinter> => {
  const response = await apiClient.get<ThermalPrinter>(
    `${API_PATHS.THERMAL_PRINTERS}/${id}`
  );
  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(
      response.data as BackendErrorResponse | undefined,
      response.status
    );
  }
  return response.data;
};

const createPrinter = async (
  data: CreateThermalPrinterDto
): Promise<ThermalPrinter> => {
  const response = await apiClient.post<ThermalPrinter>(
    API_PATHS.THERMAL_PRINTERS,
    data
  );
  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(
      response.data as BackendErrorResponse | undefined,
      response.status
    );
  }
  return response.data;
};

const updatePrinter = async (
  id: string,
  data: UpdateThermalPrinterDto
): Promise<ThermalPrinter> => {
  const response = await apiClient.patch<ThermalPrinter>(
    `${API_PATHS.THERMAL_PRINTERS}/${id}`,
    data
  );
  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(
      response.data as BackendErrorResponse | undefined,
      response.status
    );
  }
  return response.data;
};

const deletePrinter = async (id: string): Promise<void> => {
  const response = await apiClient.delete(
    `${API_PATHS.THERMAL_PRINTERS}/${id}`
  );
  if (!response.ok) {
    throw ApiError.fromApiResponse(
      response.data as BackendErrorResponse | undefined,
      response.status
    );
  }
};


const pingPrinter = async (id: string): Promise<{ status: string }> => {
  const response = await apiClient.get<{ status: string }>(
    `${API_PATHS.THERMAL_PRINTERS}/${id}/ping`
  );

  if (!response.ok || !response.data || typeof response.data.status !== 'string') {
    console.error(`[printerService.pingPrinter] Failed to ping printer ${id}:`, response);
    throw ApiError.fromApiResponse(
      response.data as BackendErrorResponse | undefined,
      response.status
    );
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

};