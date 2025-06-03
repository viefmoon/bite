import apiClient from "@/app/services/apiClient";
import { ApiError } from "@/app/lib/errors";
import { API_PATHS } from "@/app/constants/apiPaths";
import {
  ModifierGroup,
  CreateModifierGroupInput,
  UpdateModifierGroupInput,
  modifierGroupApiSchema,
} from "../schema/modifierGroup.schema";
import { z } from "zod";

const modifierGroupsListSchema = z.array(modifierGroupApiSchema);

interface FindAllParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
}

export const modifierGroupService = {
  /**
   * Obtiene todos los grupos de modificadores (con posible paginación/filtros).
   */
  async findAll(params: FindAllParams = {}): Promise<ModifierGroup[]> {
    const queryParams = {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      ...(params.isActive !== undefined && { isActive: params.isActive }),
      ...(params.search && { search: params.search }),
    };
    const response = await apiClient.get<unknown>(
      API_PATHS.MODIFIER_GROUPS,
      queryParams
    );

    if (!response.ok || !response.data) {
      console.error(
        "Error fetching modifier groups:",
        response.problem,
        response.data
      );
      throw ApiError.fromApiResponse(response.data, response.status ?? 500);
    }

    const validationResult = modifierGroupsListSchema.safeParse(response.data);
    if (!validationResult.success) {
      console.error(
        "Invalid data received for modifier groups:",
        validationResult.error.flatten()
      );
      throw new Error("Received invalid data format for modifier groups.");
    }

    return validationResult.data;
  },

  /**
   * Obtiene un grupo de modificadores por su ID.
   */
  async findOne(id: string): Promise<ModifierGroup> {
    const response = await apiClient.get<unknown>(
      `${API_PATHS.MODIFIER_GROUPS}/${id}`
    );

    if (!response.ok || !response.data) {
      console.error(
        `Error fetching modifier group ${id}:`,
        response.problem,
        response.data
      );
      throw ApiError.fromApiResponse(response.data, response.status ?? 500);
    }

    const validationResult = modifierGroupApiSchema.safeParse(response.data);
    if (!validationResult.success) {
      console.error(
        `Invalid data received for modifier group ${id}:`,
        validationResult.error.flatten()
      );
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
      data
    );

    if (!response.ok || !response.data) {
      console.error(
        "Error creating modifier group:",
        response.problem,
        response.data
      );
      throw ApiError.fromApiResponse(response.data, response.status ?? 500);
    }

    const validationResult = modifierGroupApiSchema.safeParse(response.data);
    if (!validationResult.success) {
      console.error(
        "Invalid data received after creating modifier group:",
        validationResult.error.flatten()
      );
      throw new Error(
        "Received invalid data format after creating modifier group."
      );
    }
    return validationResult.data;
  },

  /**
   * Actualiza un grupo de modificadores existente.
   */
  async update(
    id: string,
    data: UpdateModifierGroupInput
  ): Promise<ModifierGroup> {
    const response = await apiClient.patch<unknown>(
      `${API_PATHS.MODIFIER_GROUPS}/${id}`,
      data
    );

    if (!response.ok || !response.data) {
      console.error(
        `Error updating modifier group ${id}:`,
        response.problem,
        response.data
      );
      throw ApiError.fromApiResponse(response.data, response.status ?? 500);
    }

    const validationResult = modifierGroupApiSchema.safeParse(response.data);
    if (!validationResult.success) {
      console.error(
        `Invalid data received after updating modifier group ${id}:`,
        validationResult.error.flatten()
      );
      throw new Error(
        `Received invalid data format after updating modifier group ${id}.`
      );
    }
    return validationResult.data;
  },

  /**
   * Elimina un grupo de modificadores.
   */
  async remove(id: string): Promise<void> {
    const response = await apiClient.delete(
      `${API_PATHS.MODIFIER_GROUPS}/${id}`
    );

    if (!response.ok) {
      console.error(
        `Error deleting modifier group ${id}:`,
        response.problem,
        response.data
      );
      throw ApiError.fromApiResponse(response.data, response.status ?? 500);
    }
  },
};
