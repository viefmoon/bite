import apiClient from '@/app/services/apiClient';
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
  async findAll(
    params?: FindAllModifiersParams,
  ): Promise<PaginatedResponse<Modifier>> {
    const queryParams = {
      page: params?.page ?? 1,
      limit: params?.limit ?? 10,
      ...params,
    };
    const response = await apiClient.get<unknown>(API_PATHS.MODIFIERS, {
      params: queryParams,
    });

    const paginatedResult = paginatedModifiersSchema.safeParse(response.data);
    if (paginatedResult.success) {
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

    throw new Error('Received invalid data format for modifiers.');
  },

  async findOne(id: string): Promise<Modifier> {
    const response = await apiClient.get<unknown>(
      API_PATHS.MODIFIERS_BY_ID.replace(':id', id),
    );

    const validationResult = modifierApiSchema.safeParse(response.data);
    if (!validationResult.success) {
      throw new Error(`Received invalid data format for modifier ${id}.`);
    }
    return validationResult.data;
  },

  async findByGroupId(
    modifierGroupId: string,
    params: { isActive?: boolean; search?: string } = {},
  ): Promise<Modifier[]> {
    const queryParams = {
      ...(params.isActive !== undefined && { isActive: params.isActive }),
      ...(params.search && { search: params.search }),
    };
    const response = await apiClient.get<unknown>(
      API_PATHS.MODIFIERS_BY_GROUP.replace(':modifierGroupId', modifierGroupId),
      { params: queryParams },
    );

    const validationResult = modifiersListSchema.safeParse(response.data);
    if (!validationResult.success) {
      // Datos inválidos recibidos para modificadores del grupo
      throw new Error(
        `Received invalid data format for modifiers of group ${modifierGroupId}.`,
      );
    }
    return validationResult.data;
  },

  async create(data: CreateModifierInput): Promise<Modifier> {
    const response = await apiClient.post<unknown>(API_PATHS.MODIFIERS, data);

    const validationResult = modifierApiSchema.safeParse(response.data);
    if (!validationResult.success) {
      // Datos inválidos recibidos después de crear modificador
      throw new Error('Received invalid data format after creating modifier.');
    }
    return validationResult.data;
  },

  async update(id: string, data: UpdateModifierInput): Promise<Modifier> {
    const response = await apiClient.patch<unknown>(
      API_PATHS.MODIFIERS_BY_ID.replace(':id', id),
      data,
    );

    const validationResult = modifierApiSchema.safeParse(response.data);
    if (!validationResult.success) {
      // Datos inválidos recibidos después de actualizar modificador
      throw new Error(
        `Received invalid data format after updating modifier ${id}.`,
      );
    }
    return validationResult.data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(API_PATHS.MODIFIERS_BY_ID.replace(':id', id));
  },
};
