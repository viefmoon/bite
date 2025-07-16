import apiClient from '@/app/services/apiClient';
import { ApiError } from '@/app/lib/errors';
import { API_PATHS } from '@/app/constants/apiPaths';
import {
  ModifierGroup,
  CreateModifierGroupInput,
  UpdateModifierGroupInput,
  modifierGroupApiSchema,
} from '../schema/modifierGroup.schema';
import { z } from 'zod';
import { PaginatedResponse } from '@/app/types/api.types';

const _modifierGroupsListSchema = z.array(modifierGroupApiSchema);

// Schema para respuesta paginada
const paginatedModifierGroupsSchema = z.object({
  items: z.array(modifierGroupApiSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  hasNextPage: z.boolean(),
  hasPrevPage: z.boolean(),
});

interface FindAllParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
}

export const modifierGroupService = {
  /**
   * Obtiene todos los grupos de modificadores con paginación.
   */
  async findAll(
    params: FindAllParams = {},
  ): Promise<PaginatedResponse<ModifierGroup>> {
    const queryParams = {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      ...(params.isActive !== undefined && { isActive: params.isActive }),
      ...(params.search && { search: params.search }),
    };
    const response = await apiClient.get<unknown>(
      API_PATHS.MODIFIER_GROUPS,
      queryParams,
    );

    if (!response.ok || !response.data) {
      // Error al obtener grupos de modificadores
      throw ApiError.fromApiResponse(response.data, response.status ?? 500);
    }

    // Parsear como respuesta paginada
    const paginatedResult = paginatedModifierGroupsSchema.safeParse(
      response.data,
    );
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

    // Datos inválidos recibidos para grupos de modificadores
    throw new Error('Received invalid data format for modifier groups.');
  },

  /**
   * Obtiene un grupo de modificadores por su ID.
   */
  async findOne(id: string): Promise<ModifierGroup> {
    const response = await apiClient.get<unknown>(
      `${API_PATHS.MODIFIER_GROUPS}/${id}`,
    );

    if (!response.ok || !response.data) {
      // Error al obtener grupo de modificador
      throw ApiError.fromApiResponse(response.data, response.status ?? 500);
    }

    const validationResult = modifierGroupApiSchema.safeParse(response.data);
    if (!validationResult.success) {
      // Datos inválidos recibidos para grupo de modificador
      throw new Error(`Received invalid data format for modifier group ${id}.`);
    }
    return validationResult.data;
  },

  /**
   * Crea un nuevo grupo de modificadores.
   */
  async create(data: CreateModifierGroupInput): Promise<ModifierGroup> {
    const response = await apiClient.post<unknown>(
      API_PATHS.MODIFIER_GROUPS,
      data,
    );

    if (!response.ok || !response.data) {
      // Error al crear grupo de modificador
      throw ApiError.fromApiResponse(response.data, response.status ?? 500);
    }

    const validationResult = modifierGroupApiSchema.safeParse(response.data);
    if (!validationResult.success) {
      // Datos inválidos recibidos después de crear grupo de modificador
      throw new Error(
        'Received invalid data format after creating modifier group.',
      );
    }
    return validationResult.data;
  },

  /**
   * Actualiza un grupo de modificadores existente.
   */
  async update(
    id: string,
    data: UpdateModifierGroupInput,
  ): Promise<ModifierGroup> {
    const response = await apiClient.patch<unknown>(
      `${API_PATHS.MODIFIER_GROUPS}/${id}`,
      data,
    );

    if (!response.ok || !response.data) {
      // Error al actualizar grupo de modificador
      throw ApiError.fromApiResponse(response.data, response.status ?? 500);
    }

    const validationResult = modifierGroupApiSchema.safeParse(response.data);
    if (!validationResult.success) {
      // Datos inválidos recibidos después de actualizar grupo de modificador
      throw new Error(
        `Received invalid data format after updating modifier group ${id}.`,
      );
    }
    return validationResult.data;
  },

  /**
   * Elimina un grupo de modificadores.
   */
  async remove(id: string): Promise<void> {
    const response = await apiClient.delete(
      `${API_PATHS.MODIFIER_GROUPS}/${id}`,
    );

    if (!response.ok) {
      // Error al eliminar grupo de modificador
      throw ApiError.fromApiResponse(response.data, response.status ?? 500);
    }
  },
};
