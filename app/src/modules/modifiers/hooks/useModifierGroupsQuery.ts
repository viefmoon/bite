import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import { modifierGroupService } from '../services/modifierGroupService';
import { ModifierGroup } from '@/app/schemas/domain/modifier-group.schema';
import { ApiError } from '@/app/lib/errors';
import { PaginatedResponse } from '@/app/types/api.types';

const modifierGroupKeys = {
  all: ['modifierGroups'] as const,
  lists: () => [...modifierGroupKeys.all, 'list'] as const,
  list: (filters: FindAllModifierGroupsQuery) =>
    [...modifierGroupKeys.lists(), filters] as const,
};

interface FindAllModifierGroupsQuery {
  page?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
}

export const useModifierGroupsQuery = (
  filters: FindAllModifierGroupsQuery = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<ModifierGroup>, ApiError>,
    'queryKey' | 'queryFn'
  >,
): UseQueryResult<PaginatedResponse<ModifierGroup>, ApiError> => {
  const queryKey = modifierGroupKeys.list(filters);
  return useQuery<PaginatedResponse<ModifierGroup>, ApiError>({
    queryKey: queryKey,
    queryFn: () => modifierGroupService.findAll(filters),
    ...options,
  });
};
