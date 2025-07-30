import apiClient from '@/app/services/apiClient';
import { API_PATHS } from '@/app/constants/apiPaths';
import { Modifier } from '@/app/schemas/domain/modifier.schema';
import {
  CreateModifierInput,
  UpdateModifierInput,
  modifierApiSchema,
} from '../schema/modifier-form.schema';
import { z } from 'zod';

const modifiersListSchema = z.array(modifierApiSchema);

export const modifierService = {
  async findByGroupId(
    modifierGroupId: string,
    params: { isActive?: boolean; search?: string } = {},
  ): Promise<Modifier[]> {
    const queryParams = {
      ...(params.isActive !== undefined && { isActive: params.isActive }),
      ...(params.search && { name: params.search }),
    };
    const response = await apiClient.get<unknown>(
      API_PATHS.MODIFIERS_BY_GROUP.replace(':modifierGroupId', modifierGroupId),
      { params: queryParams },
    );

    const validationResult = modifiersListSchema.safeParse(response.data);
    if (!validationResult.success) {
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
