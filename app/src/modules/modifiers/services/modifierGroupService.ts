import apiClient from '@/app/services/apiClient';
import { API_PATHS } from '@/app/constants/apiPaths';
import {
  ModifierGroup,
  CreateModifierGroupInput,
  UpdateModifierGroupInput,
  modifierGroupApiSchema,
} from '../schema/modifierGroup.schema';
import { z } from 'zod';
import { PaginatedResponse } from '@/app/types/api.types';

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
  async findAll(
    params: FindAllParams = {},
  ): Promise<PaginatedResponse<ModifierGroup>> {
    const queryParams = {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      ...(params.isActive !== undefined && { isActive: params.isActive }),
      ...(params.search && { search: params.search }),
    };
    const response = await apiClient.get<unknown>(API_PATHS.MODIFIER_GROUPS, {
      params: queryParams,
    });

    const paginatedResult = paginatedModifierGroupsSchema.safeParse(
      response.data,
    );
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

    throw new Error('Received invalid data format for modifier groups.');
  },

  async findOne(id: string): Promise<ModifierGroup> {
    const response = await apiClient.get<unknown>(
      API_PATHS.MODIFIER_GROUPS_BY_ID.replace(':id', id),
    );

    const validationResult = modifierGroupApiSchema.safeParse(response.data);
    if (!validationResult.success) {
      throw new Error(`Received invalid data format for modifier group ${id}.`);
    }
    return validationResult.data;
  },

  async create(data: CreateModifierGroupInput): Promise<ModifierGroup> {
    const response = await apiClient.post<unknown>(
      API_PATHS.MODIFIER_GROUPS,
      data,
    );

    const validationResult = modifierGroupApiSchema.safeParse(response.data);
    if (!validationResult.success) {
      throw new Error(
        'Received invalid data format after creating modifier group.',
      );
    }
    return validationResult.data;
  },

  async update(
    id: string,
    data: UpdateModifierGroupInput,
  ): Promise<ModifierGroup> {
    const response = await apiClient.patch<unknown>(
      API_PATHS.MODIFIER_GROUPS_BY_ID.replace(':id', id),
      data,
    );

    const validationResult = modifierGroupApiSchema.safeParse(response.data);
    if (!validationResult.success) {
      throw new Error(
        `Received invalid data format after updating modifier group ${id}.`,
      );
    }
    return validationResult.data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(API_PATHS.MODIFIER_GROUPS_BY_ID.replace(':id', id));
  },
};
