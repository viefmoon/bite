import apiClient from '@/app/services/apiClient';
import { API_PATHS } from '@/app/constants/apiPaths';
import { ModifierGroup } from '@/app/schemas/domain/modifier-group.schema';
import {
  CreateModifierGroupInput,
  UpdateModifierGroupInput,
  modifierGroupApiSchema,
} from '../schema/modifier-group-form.schema';
import { z } from 'zod';

const modifierGroupsArraySchema = z.array(modifierGroupApiSchema);

interface FindAllParams {
  isActive?: boolean;
  search?: string;
}

export const modifierGroupService = {
  async findAll(
    params: FindAllParams = {},
  ): Promise<ModifierGroup[]> {
    const queryParams = {
      ...(params.isActive !== undefined && { isActive: params.isActive }),
      ...(params.search && { name: params.search }),
    };
    const response = await apiClient.get<unknown>(API_PATHS.MODIFIER_GROUPS, {
      params: queryParams,
    });

    const result = modifierGroupsArraySchema.safeParse(response.data);
    if (result.success) {
      return result.data;
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
