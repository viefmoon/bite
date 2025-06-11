// Import base types if needed
import type { BaseListQueryDto } from '../../../app/types/api.types';

export type FindAllSubcategoriesDto = BaseListQueryDto & {
  categoryId?: string;
  isActive?: boolean;
};
