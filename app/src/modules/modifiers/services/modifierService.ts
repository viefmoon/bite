import apiClient from '@/app/services/apiClient';
import { ApiError } from '@/app/lib/errors';
import { API_PATHS } from '@/app/constants/apiPaths';
import {
  Modifier,
  CreateModifierInput,
  UpdateModifierInput,
  modifierApiSchema,
} from '../schema/modifier.schema';
import { z } from 'zod';
import { PaginatedResponse } from '@/app/types/api.types';

const modifiersListSchema = z.array(modifierApiSchema);

// Schema para respuesta paginada
const paginatedModifiersSchema = z.object({
  items: z.array(modifierApiSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  hasNextPage: z.boolean(),
  hasPrevPage: z.boolean(),
});

interface FindAllModifiersParams {
  page?: number;
  limit?: number;
  groupId?: string;
}

export const modifierService = {
  /**
   * Obtiene todos los modificadores con paginación.
   */
  async findAll(
    params?: FindAllModifiersParams,
  ): Promise<PaginatedResponse<Modifier>> {
    const queryParams = {
      page: params?.page ?? 1,
      limit: params?.limit ?? 10,
      ...params,
    };
    const response = await apiClient.get<unknown>(
      API_PATHS.MODIFIERS,
      queryParams,
    );

    if (!response.ok || !response.data) {
      console.error(
        'Error fetching modifiers:',
        response.problem,
        response.data,
      );
      throw ApiError.fromApiResponse(response.data, response.status ?? 500);
    }

    // Parsear como respuesta paginada
    const paginatedResult = paginatedModifiersSchema.safeParse(response.data);
    if (paginatedResult.success) {
      // Transformar la respuesta del backend a PaginatedResponse
      return {
        data: paginatedResult.data.items,
        total: paginatedResult.data.total,
        page: paginatedResult.data.page,
        limit: paginatedResult.data.limit,
        totalPages: Math.ceil(
          paginatedResult.data.total / paginatedResult.data.limit,
        ),
      };
    }

    console.error('Invalid data received for modifiers:', response.data);
    throw new Error('Received invalid data format for modifiers.');
  },

  /**
   * Obtiene un modificador por su ID.
   */
  async findOne(id: string): Promise<Modifier> {
    const response = await apiClient.get<unknown>(
      `${API_PATHS.MODIFIERS}/${id}`,
    );

    if (!response.ok || !response.data) {
      console.error(
        `Error fetching modifier ${id}:`,
        response.problem,
        response.data,
      );
      throw ApiError.fromApiResponse(response.data, response.status ?? 500);
    }

    const validationResult = modifierApiSchema.safeParse(response.data);
    if (!validationResult.success) {
      console.error(
        `Invalid data received for modifier ${id}:`,
        validationResult.error.flatten(),
      );
      throw new Error(`Received invalid data format for modifier ${id}.`);
    }
    return validationResult.data;
  },

  /**
   * Obtiene todos los modificadores asociados a un grupo específico, con filtros opcionales.
   */
  async findByGroupId(
    groupId: string,
    params: { isActive?: boolean; search?: string } = {},
  ): Promise<Modifier[]> {
    const queryParams = {
      ...(params.isActive !== undefined && { isActive: params.isActive }),
      ...(params.search && { search: params.search }),
    };
    const response = await apiClient.get<unknown>(
      `${API_PATHS.MODIFIERS}/by-group/${groupId}`,
      queryParams,
    );

    if (!response.ok || !response.data) {
      console.error(
        `Error fetching modifiers for group ${groupId}:`,
        response.problem,
        response.data,
      );
      throw ApiError.fromApiResponse(response.data, response.status ?? 500);
    }

    const validationResult = modifiersListSchema.safeParse(response.data);
    if (!validationResult.success) {
      console.error(
        `Invalid data received for modifiers of group ${groupId}:`,
        validationResult.error.flatten(),
      );
      throw new Error(
        `Received invalid data format for modifiers of group ${groupId}.`,
      );
    }
    return validationResult.data;
  },

  /**
   * Crea un nuevo modificador.
   */
  async create(data: CreateModifierInput): Promise<Modifier> {
    const response = await apiClient.post<unknown>(API_PATHS.MODIFIERS, data);

    if (!response.ok || !response.data) {
      console.error(
        'Error creating modifier:',
        response.problem,
        response.data,
      );
      throw ApiError.fromApiResponse(response.data, response.status ?? 500);
    }

    const validationResult = modifierApiSchema.safeParse(response.data);
    if (!validationResult.success) {
      console.error(
        'Invalid data received after creating modifier:',
        validationResult.error.flatten(),
      );
      throw new Error('Received invalid data format after creating modifier.');
    }
    return validationResult.data;
  },

  /**
   * Actualiza un modificador existente.
   */
  async update(id: string, data: UpdateModifierInput): Promise<Modifier> {
    const response = await apiClient.patch<unknown>(
      `${API_PATHS.MODIFIERS}/${id}`,
      data,
    );

    if (!response.ok || !response.data) {
      console.error(
        `Error updating modifier ${id}:`,
        response.problem,
        response.data,
      );
      throw ApiError.fromApiResponse(response.data, response.status ?? 500);
    }

    const validationResult = modifierApiSchema.safeParse(response.data);
    if (!validationResult.success) {
      console.error(
        `Invalid data received after updating modifier ${id}:`,
        validationResult.error.flatten(),
      );
      throw new Error(
        `Received invalid data format after updating modifier ${id}.`,
      );
    }
    return validationResult.data;
  },

  /**
   * Elimina un modificador.
   */
  async remove(id: string): Promise<void> {
    const response = await apiClient.delete(`${API_PATHS.MODIFIERS}/${id}`);

    if (!response.ok) {
      console.error(
        `Error deleting modifier ${id}:`,
        response.problem,
        response.data,
      );
      throw ApiError.fromApiResponse(response.data, response.status ?? 500);
    }
  },
};
