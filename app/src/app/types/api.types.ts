import { z } from 'zod';

export interface BackendErrorResponse {
  statusCode: number;
  code: string;
  message: string;
  details?: any;
  timestamp?: string;
  path?: string;
}

export const baseListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
});

export type BaseListQueryDto = {
  page?: number;
  limit?: number;
};

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}